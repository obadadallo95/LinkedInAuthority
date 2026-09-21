import { Router } from 'express';
import { getAdminFirestore } from '../services/firestoreAdmin';
import { getAutomationProjectLimit, getUserTier } from '../services/entitlements';

const router = Router();

const VALID_LANGUAGES = new Set(['ar', 'en', 'de']);
const VALID_INTENTS = new Set(['weekly_progress', 'technical_deep_dive']);
const VALID_AUDIENCES = new Set(['tech_community', 'recruiters', 'beginners']);

function validText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
}

function validateAutomationConfig(body: any) {
  const owner = typeof body?.owner === 'string' ? body.owner.trim() : '';
  const repo = typeof body?.repo === 'string' ? body.repo.trim() : '';
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(owner) || !/^[A-Za-z0-9_.-]{1,180}$/.test(repo)) return null;
  const contentLanguage = body?.contentLanguage || 'en';
  const intent = body?.intent || 'weekly_progress';
  const targetAudience = body?.targetAudience || 'tech_community';
  if (!VALID_LANGUAGES.has(contentLanguage) || !VALID_INTENTS.has(intent) || !VALID_AUDIENCES.has(targetAudience)) return null;
  const timezone = body?.timezone || 'UTC';
  if (!validText(timezone, 80) || !/^[A-Za-z0-9_+./-]+$/.test(timezone)) return null;
  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
    description: typeof body?.description === 'string' ? body.description.trim().slice(0, 1000) : '',
    language: typeof body?.language === 'string' ? body.language.trim().slice(0, 120) : '',
    monitoringEnabled: true,
    monitoringConfig: {
      intent,
      targetAudience,
      contentLanguage,
      timezone,
      monitorCommits: body?.monitorCommits !== false,
      monitorIssues: body?.monitorIssues === true,
      monitorPullRequests: body?.monitorPullRequests === true,
      scheduleDay: validText(body?.scheduleDay, 20) ? body.scheduleDay.trim() : 'Fri',
      scheduleTime: validText(body?.scheduleTime, 10) ? body.scheduleTime.trim() : '09:00',
    },
  };
}

router.post('/projects', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const config = validateAutomationConfig(req.body);
  if (!config) return res.status(400).json({ error: 'Invalid automation configuration.' });

  try {
    const db = getAdminFirestore();
    const projectId = `${config.owner}_${config.repo}`;
    const projectsRef = db.collection('users').doc(uid).collection('projects');
    const projectRef = projectsRef.doc(projectId);
    const tier = await getUserTier(uid);
    const limit = getAutomationProjectLimit(tier);

    await db.runTransaction(async transaction => {
      const existing = await transaction.get(projectRef);
      if (!existing.exists || existing.data()?.monitoringEnabled !== true) {
        const active = await transaction.get(projectsRef.where('monitoringEnabled', '==', true));
        if (active.size >= limit) {
          const error: any = new Error('Automation project limit reached.');
          error.code = 'AUTOMATION_LIMIT_REACHED';
          throw error;
        }
      }
      transaction.set(projectRef, {
        ...config,
        createdAt: existing.exists ? (existing.data()?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      }, { merge: true });
    });

    return res.status(200).json({ saved: true, projectId, limit });
  } catch (error: any) {
    if (error?.code === 'AUTOMATION_LIMIT_REACHED') {
      return res.status(403).json({ error: 'Automation project limit reached for this account.' });
    }
    console.error('Automation project save failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'Automation project is temporarily unavailable.' });
  }
});

router.patch('/projects/:projectId', async (req: any, res) => {
  const uid = req.user?.uid;
  const projectId = typeof req.params.projectId === 'string' ? req.params.projectId.trim() : '';
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!/^[A-Za-z0-9_.-]{1,100}_[A-Za-z0-9_.-]{1,180}$/.test(projectId)) {
    return res.status(400).json({ error: 'Invalid project identifier.' });
  }
  if (typeof req.body?.monitoringEnabled !== 'boolean') {
    return res.status(400).json({ error: 'monitoringEnabled must be a boolean.' });
  }

  try {
    const db = getAdminFirestore();
    const projectsRef = db.collection('users').doc(uid).collection('projects');
    const projectRef = projectsRef.doc(projectId);
    const enabled = req.body.monitoringEnabled === true;
    const tier = await getUserTier(uid);
    const limit = getAutomationProjectLimit(tier);
    await db.runTransaction(async transaction => {
      const existing = await transaction.get(projectRef);
      if (!existing.exists) {
        const error: any = new Error('Project not found.');
        error.code = 'PROJECT_NOT_FOUND';
        throw error;
      }
      if (enabled && existing.data()?.monitoringEnabled !== true) {
        const active = await transaction.get(projectsRef.where('monitoringEnabled', '==', true));
        if (active.size >= limit) {
          const error: any = new Error('Automation project limit reached.');
          error.code = 'AUTOMATION_LIMIT_REACHED';
          throw error;
        }
      }
      transaction.update(projectRef, { monitoringEnabled: enabled });
    });
    return res.json({ updated: true, projectId, monitoringEnabled: enabled, limit });
  } catch (error: any) {
    if (error?.code === 'PROJECT_NOT_FOUND') return res.status(404).json({ error: 'Automation project not found.' });
    if (error?.code === 'AUTOMATION_LIMIT_REACHED') return res.status(403).json({ error: 'Automation project limit reached for this account.' });
    console.error('Automation project toggle failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'Automation project is temporarily unavailable.' });
  }
});

router.get('/runs', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId.trim() : '';
  const requestedLimit = Number(req.query.limit || 20);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(50, Math.floor(requestedLimit))) : 20;

  try {
    const db = getAdminFirestore();
    const projectsRef = db.collection('users').doc(uid).collection('projects');
    const projectSnapshots = projectId
      ? [await projectsRef.doc(projectId).get()]
      : (await projectsRef.get()).docs;
    const runs: Array<Record<string, unknown>> = [];

    for (const projectSnapshot of projectSnapshots) {
      if (!projectSnapshot.exists) continue;
      const runSnapshot = await projectSnapshot.ref.collection('automationRuns').get();
      for (const runDoc of runSnapshot.docs) {
        runs.push({
          id: runDoc.id,
          projectId: projectSnapshot.id,
          ...runDoc.data(),
        });
      }
    }

    runs.sort((a, b) => String(b.updatedAt || b.startedAt || '').localeCompare(String(a.updatedAt || a.startedAt || '')));
    return res.json({ runs: runs.slice(0, limit) });
  } catch (error) {
    console.error('Automation run history lookup failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'Automation history is temporarily unavailable.' });
  }
});

router.delete('/projects/:projectId', async (req: any, res) => {
  const uid = req.user?.uid;
  const projectId = typeof req.params.projectId === 'string' ? req.params.projectId.trim() : '';
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!/^[A-Za-z0-9_.-]{1,180}_[A-Za-z0-9_.-]{1,180}$/.test(projectId)) {
    return res.status(400).json({ error: 'Invalid project identifier.' });
  }

  try {
    const db = getAdminFirestore();
    const projectRef = db.collection('users').doc(uid).collection('projects').doc(projectId);
    await db.recursiveDelete(projectRef);
    return res.json({ deleted: true, projectId });
  } catch (error) {
    console.error('Project deletion failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'Project deletion is temporarily unavailable.' });
  }
});

export default router;
