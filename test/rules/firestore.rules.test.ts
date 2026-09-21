import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-linkedin-authority',
    firestore: { host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

async function seedData() {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'users/u1/projects/p1'), { monitoringEnabled: true, monitoringConfig: { scheduleDay: 'Monday' } });
    await setDoc(doc(db, 'users/u1/auditLogs/a1'), { event: 'server-authored' });
    await setDoc(doc(db, 'users/u1/privateCredentials/github'), { credential: 'encrypted' });
    await setDoc(doc(db, 'users/u1/productMetrics/2026-09-21'), { events: { post_generated: 1 } });
    await setDoc(doc(db, 'users/u1/usageLedger/2026-09-21'), { totalReservedCostUsd: 0.25 });
    await setDoc(doc(db, 'users/u1/drafts/d1'), {
      projectId: 'owner_repo',
      type: 'repo_analysis',
      title: 'Grounded draft',
      content: '{"post":"evidence"}',
      status: 'draft',
      revision: 1,
    });
  });
}

describe('Firestore ownership and server-managed rules', () => {
  beforeAll(seedData);

  it('allows a user to read their project but not another user project', async () => {
    const user = testEnv.authenticatedContext('u1').firestore();
    await expect(getDoc(doc(user, 'users/u1/projects/p1'))).resolves.toBeTruthy();
    const other = testEnv.authenticatedContext('u2').firestore();
    await expect(getDoc(doc(other, 'users/u1/projects/p1'))).rejects.toThrow();
  });

  it('blocks client writes to audit history and private credentials', async () => {
    const user = testEnv.authenticatedContext('u1').firestore();
    await expect(getDoc(doc(user, 'users/u1/privateCredentials/github'))).rejects.toThrow();
    await expect(setDoc(doc(user, 'users/u1/auditLogs/a2'), { event: 'forged' })).rejects.toThrow();
    await expect(setDoc(doc(user, 'users/u1/privateCredentials/github'), { credential: 'forged' })).rejects.toThrow();
    await expect(getDoc(doc(user, 'users/u1/productMetrics/2026-09-21'))).rejects.toThrow();
    await expect(getDoc(doc(user, 'users/u1/usageLedger/2026-09-21'))).rejects.toThrow();
  });

  it('blocks client mutation of automation leases and checkpoints', async () => {
    const user = testEnv.authenticatedContext('u1').firestore();
    await expect(updateDoc(doc(user, 'users/u1/projects/p1'), { processingLease: { runId: 'attacker' } })).rejects.toThrow();
    await expect(updateDoc(doc(user, 'users/u1/projects/p1'), { lastProcessedCommit: 'attacker' })).rejects.toThrow();
    await expect(updateDoc(doc(user, 'users/u1/projects/p1'), { lastObservedActivity: { commitSha: 'attacker' } })).rejects.toThrow();
    await expect(updateDoc(doc(user, 'users/u1/projects/p1'), { lastContentGeneratedFrom: { commitSha: 'attacker' } })).rejects.toThrow();
  });

  it('allows safe user-owned project configuration updates', async () => {
    const user = testEnv.authenticatedContext('u1').firestore();
    await expect(updateDoc(doc(user, 'users/u1/projects/p1'), { monitoringEnabled: false })).resolves.toBeUndefined();
    await expect(updateDoc(doc(user, 'users/u1/projects/p1'), { monitoringEnabled: true })).rejects.toThrow();
    await expect(setDoc(doc(user, 'users/u1/projects/p2'), { owner: 'owner', repo: 'repo', monitoringEnabled: true })).rejects.toThrow();
  });

  it('rejects legacy LinkedIn tokens from client-writable settings', async () => {
    const user = testEnv.authenticatedContext('u1').firestore();
    await expect(setDoc(doc(user, 'users/u1/settings/current'), { linkedinToken: 'legacy-token' })).rejects.toThrow();
  });

  it('keeps the client inside the draft-only product boundary', async () => {
    const user = testEnv.authenticatedContext('u1').firestore();
    await expect(setDoc(doc(user, 'users/u1/drafts/valid'), {
      projectId: 'template-library',
      type: 'repo_analysis',
      title: 'Template draft',
      content: '{"post":"review me"}',
      status: 'draft',
      revision: 1,
    })).resolves.toBeUndefined();
    await expect(setDoc(doc(user, 'users/u1/posts/template'), {
      repoName: 'Template', text: 'review me', status: 'template',
    })).resolves.toBeUndefined();
    await expect(setDoc(doc(user, 'users/u1/posts/published'), {
      repoName: 'repo', text: 'draft', status: 'published',
    })).rejects.toThrow();
    await expect(setDoc(doc(user, 'users/u1/posts/scheduled'), {
      repoName: 'repo', text: 'draft', status: 'scheduled',
    })).rejects.toThrow();
    await expect(setDoc(doc(user, 'users/u1/drafts/forged'), {
      projectId: 'owner_repo', type: 'repo_analysis', title: 'Forged',
      content: 'x', status: 'published',
    })).rejects.toThrow();
    await expect(updateDoc(doc(user, 'users/u1/drafts/d1'), { status: 'published' })).rejects.toThrow();
  });

  it('allows a manual draft revision but prevents version overwrite or deletion', async () => {
    const user = testEnv.authenticatedContext('u1').firestore();
    await expect(updateDoc(doc(user, 'users/u1/drafts/d1'), {
      content: '{"post":"edited"}', revision: 2,
    })).resolves.toBeUndefined();
    await expect(setDoc(doc(user, 'users/u1/drafts/d1/versions/2'), {
      content: '{"post":"edited"}', revision: 2, source: 'manual',
    })).resolves.toBeUndefined();
    await expect(updateDoc(doc(user, 'users/u1/drafts/d1/versions/2'), {
      content: '{"post":"rewritten"}',
    })).rejects.toThrow();
    await expect(deleteDoc(doc(user, 'users/u1/drafts/d1/versions/2'))).rejects.toThrow();
    await expect(deleteDoc(doc(user, 'users/u1/drafts/d1'))).rejects.toThrow();
  });

  it('allows an immutable original AI version at revision zero but not a manual revision zero', async () => {
    const user = testEnv.authenticatedContext('u1').firestore();
    await expect(setDoc(doc(user, 'users/u1/drafts/d1/versions/0'), {
      content: '{"post":"original"}', revision: 0, source: 'original',
    })).resolves.toBeUndefined();
    await expect(setDoc(doc(user, 'users/u1/drafts/d1/versions/zero-manual'), {
      content: '{"post":"forged"}', revision: 0, source: 'manual',
    })).rejects.toThrow();
    await expect(updateDoc(doc(user, 'users/u1/drafts/d1/versions/0'), {
      content: '{"post":"rewritten"}',
    })).rejects.toThrow();
  });
});
