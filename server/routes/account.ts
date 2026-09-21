import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getAdminFirestore } from '../services/firestoreAdmin';

const router = Router();

const SENSITIVE_EXPORT_KEYS = new Set([
  'githubToken',
  'linkedinToken',
  'accessToken',
  'refreshToken',
  'encryptedToken',
  'tokenCiphertext',
  'iv',
  'authTag',
]);

function sanitizeExportValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeExportValue);
  if (!value || typeof value !== 'object') return value;
  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_EXPORT_KEYS.has(key)) continue;
    sanitized[key] = sanitizeExportValue(nestedValue);
  }
  return sanitized;
}

async function exportCollectionTree(collectionRef: any): Promise<Array<Record<string, unknown>>> {
  const snapshot = await collectionRef.get();
  const documents: Array<Record<string, unknown>> = [];
  for (const document of snapshot.docs || []) {
    const exported: Record<string, unknown> = {
      id: document.id,
      ...(sanitizeExportValue(document.data?.() || {}) as Record<string, unknown>),
    };
    if (typeof document.ref?.listCollections === 'function') {
      const nested: Record<string, unknown> = {};
      for (const childCollection of await document.ref.listCollections()) {
        if (childCollection.id === 'privateCredentials') continue;
        nested[childCollection.id] = await exportCollectionTree(childCollection);
      }
      if (Object.keys(nested).length > 0) exported.subcollections = nested;
    }
    documents.push(exported);
  }
  return documents;
}

router.get('/export', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const userRef = getAdminFirestore().collection('users').doc(uid);
    const collections = await userRef.listCollections();
    const data: Record<string, unknown> = {};
    for (const collection of collections) {
      if (collection.id === 'privateCredentials') continue;
      data[collection.id] = await exportCollectionTree(collection);
    }
    return res.json({ exportedAt: new Date().toISOString(), userId: uid, data });
  } catch (error) {
    console.error('Account export failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'Account export is temporarily unavailable.' });
  }
});

router.delete('/drafts/:draftId', async (req: any, res) => {
  const uid = req.user?.uid;
  const draftId = typeof req.params.draftId === 'string' ? req.params.draftId.trim() : '';
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!/^[A-Za-z0-9_-]{1,180}$/.test(draftId)) {
    return res.status(400).json({ error: 'Invalid draft identifier.' });
  }

  try {
    const db = getAdminFirestore();
    const draftRef = db.collection('users').doc(uid).collection('drafts').doc(draftId);
    // A client deleteDoc would leave the nested versions collection orphaned.
    await db.recursiveDelete(draftRef);
    return res.json({ deleted: true, draftId });
  } catch (error) {
    console.error('Draft deletion failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'Draft deletion is temporarily unavailable.' });
  }
});

router.delete('/', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const db = getAdminFirestore();
    await db.recursiveDelete(db.collection('users').doc(uid));
    try {
      await getAuth().deleteUser(uid);
    } catch (authError: any) {
      // Account deletion is intentionally idempotent. A retry after the Auth
      // identity was removed must still report success once the data tree is
      // gone.
      if (authError?.code !== 'auth/user-not-found') throw authError;
    }
    return res.json({ deleted: true });
  } catch (error) {
    console.error('Account deletion failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'Account deletion is temporarily unavailable.' });
  }
});

export default router;
