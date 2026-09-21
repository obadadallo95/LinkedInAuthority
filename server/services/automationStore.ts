import crypto from 'node:crypto';

type FirestoreLike = {
  runTransaction?: (callback: (transaction: any) => Promise<unknown>) => Promise<unknown>;
};

export type AutomationRunStatus = 'checked' | 'no_activity' | 'not_meaningful' | 'draft_created' | 'failed';

export function buildAutomationRunId(input: {
  userId: string;
  projectId: string;
  scheduledWindow: string;
  checkpoint: Record<string, unknown>;
}): string {
  const stable = JSON.stringify({
    userId: input.userId,
    projectId: input.projectId,
    scheduledWindow: input.scheduledWindow,
    checkpoint: input.checkpoint,
  });
  return crypto.createHash('sha256').update(stable).digest('hex').slice(0, 40);
}

export function getAutomationRunRef(projectRef: any, runId: string): any {
  return projectRef.collection('automationRuns').doc(runId);
}

/**
 * Production path uses one Firestore transaction for the lease and run record.
 * The small fallback keeps local/demo test doubles compatible; it is never used
 * by the Admin Firestore client in production.
 */
export async function acquireAutomationRun(
  db: FirestoreLike,
  projectRef: any,
  runRef: any,
  input: { runId: string; now: string; leaseExpiresAt: string; repo: string; checkpoint: Record<string, unknown> },
): Promise<'acquired' | 'duplicate' | 'leased'> {
  if (typeof db.runTransaction !== 'function') {
    await projectRef.update({
      processingLease: { runId: input.runId, lockedAt: input.now, expiresAt: input.leaseExpiresAt },
    });
    return 'acquired';
  }

  return await db.runTransaction(async transaction => {
    const [projectSnap, runSnap] = await Promise.all([
      transaction.get(projectRef),
      transaction.get(runRef),
    ]);
    if (runSnap.exists) {
      const runData = runSnap.data() || {};
      const status = runData.status;
      if (status === 'draft_created' || status === 'no_activity' || status === 'not_meaningful') return 'duplicate';
      if (status === 'failed') {
        if ((runData.retryCount || 0) >= 3) return 'duplicate';
        if (runData.nextRetryAt && new Date(runData.nextRetryAt).getTime() > Date.now()) return 'leased';
      }
    }
    const lease = projectSnap.exists ? projectSnap.data()?.processingLease : undefined;
    if (lease?.expiresAt && new Date(lease.expiresAt).getTime() > Date.now()) return 'leased';

    transaction.set(projectRef, {
      processingLease: { runId: input.runId, lockedAt: input.now, expiresAt: input.leaseExpiresAt },
    }, { merge: true });
    transaction.set(runRef, {
      runId: input.runId,
      repo: input.repo,
      status: 'checked' satisfies AutomationRunStatus,
      checkpoint: input.checkpoint,
      startedAt: input.now,
      updatedAt: input.now,
      retryCount: runSnap.exists ? (runSnap.data()?.retryCount || 0) : 0,
    }, { merge: true });
    return 'acquired';
  }) as 'acquired' | 'duplicate' | 'leased';
}

export async function finishAutomationRun(
  db: FirestoreLike,
  projectRef: any,
  runRef: any,
  input: {
    status: AutomationRunStatus;
    now: string;
    /** Legacy alias: updates both observed and generated checkpoints. */
    checkpoint?: Record<string, unknown>;
    observedCheckpoint?: Record<string, unknown>;
    generatedCheckpoint?: Record<string, unknown>;
    failureReason?: string;
  },
): Promise<void> {
  const observedCheckpoint = input.observedCheckpoint || input.checkpoint;
  const generatedCheckpoint = input.generatedCheckpoint || input.checkpoint;
  const projectPatch = {
    processingLease: null,
    ...(observedCheckpoint ? {
      lastObservedActivity: observedCheckpoint,
      // Keep legacy fields readable for older clients and migrations.
      lastProcessed: observedCheckpoint,
      lastProcessedAt: input.now,
      lastProcessedCommit: observedCheckpoint.commitSha || null,
    } : {}),
    ...(generatedCheckpoint ? { lastContentGeneratedFrom: generatedCheckpoint } : {}),
  };
  const runPatch = {
    status: input.status,
    updatedAt: input.now,
    finishedAt: input.now,
    ...(input.failureReason ? { failureReason: input.failureReason } : {}),
  };

  if (typeof db.runTransaction !== 'function') {
    await projectRef.update(projectPatch);
    return;
  }
  await db.runTransaction(async transaction => {
    const runSnap = await transaction.get(runRef);
    const currentRetryCount = runSnap.exists ? (runSnap.data()?.retryCount || 0) : 0;
    const retryCount = input.status === 'failed' ? currentRetryCount + 1 : currentRetryCount;
    const retryDelayMs = Math.min(15 * 60 * 1000, 30 * 1000 * (2 ** Math.max(0, retryCount - 1)));
    transaction.update(projectRef, projectPatch);
    transaction.set(runRef, {
      ...runPatch,
      ...(input.status === 'failed' ? {
        retryCount,
        nextRetryAt: new Date(Date.now() + retryDelayMs).toISOString(),
      } : {}),
    }, { merge: true });
  });
}

export async function persistAutomationDraftOnce(
  db: FirestoreLike,
  draftsRef: any,
  runRef: any,
  input: { draftId: string; draft: Record<string, unknown>; now: string },
): Promise<boolean> {
  if (typeof db.runTransaction !== 'function') {
    await draftsRef.add(input.draft);
    return true;
  }
  return await db.runTransaction(async transaction => {
    const runSnap = await transaction.get(runRef);
    if (runSnap.exists && runSnap.data()?.status === 'draft_created') return false;
    transaction.set(draftsRef.doc(input.draftId), input.draft, { merge: false });
    transaction.set(runRef, { status: 'draft_created', updatedAt: input.now, finishedAt: input.now }, { merge: true });
    return true;
  }) as boolean;
}
