import { loadFirestoreClient } from '../infrastructure/firebase/firestoreClient';
import { isBrowserE2E } from '../utils/e2e';

function readE2ECollection<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[]; } catch { return []; }
}

function writeE2ECollection<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export interface ProjectData {
  owner: string;
  repo: string;
  fullName: string;
  description: string;
  language: string;
  createdAt?: any;
  lastAnalyzedAt?: any;
  monitoringEnabled?: boolean;
  monitoringConfig?: {
    intent?: 'weekly_progress' | 'technical_deep_dive' | string;
    targetAudience?: 'tech_community' | 'recruiters' | 'beginners' | string;
    contentLanguage?: 'ar' | 'en' | 'de';
    timezone?: string;
    monitorCommits?: boolean;
    monitorIssues?: boolean;
    monitorPullRequests?: boolean;
    scheduleDay?: string;
    scheduleTime?: string;
    postType?: string;
  };
  lastProcessedCommit?: string;
  lastProcessedAt?: string;
  lastProcessed?: {
    commitSha?: string;
    pullRequestUpdatedAt?: string;
    issueUpdatedAt?: string;
    processedAt?: string;
  };
  lastObservedActivity?: {
    commitSha?: string;
    pullRequestUpdatedAt?: string;
    issueUpdatedAt?: string;
    processedAt?: string;
  };
  lastContentGeneratedFrom?: {
    commitSha?: string;
    pullRequestUpdatedAt?: string;
    issueUpdatedAt?: string;
    processedAt?: string;
  };
  processingLease?: {
    lockedAt: string;
    expiresAt: string;
  };
}

export interface DraftData {
  projectId: string;
  type: 'repo_analysis' | 'commit_update';
  title: string;
  content: string; // The JSON stringified content or text
  // The live product is review-first. A draft is never marked published by
  // this client because LinkedIn publishing is intentionally out of scope.
  status: 'draft';
  isAutomated?: boolean;
  sourceData?: any;
  metadata?: {
    intent?: string;
    targetAudience?: string;
    contentLanguage?: string;
    monitoredSources?: {
      commits?: boolean;
      pullRequests?: boolean;
      issues?: boolean;
    };
    activitySummary?: string;
  };
  createdAt?: any;
  updatedAt?: any;
  revision?: number;
}

export class DraftConflictError extends Error {
  constructor(public readonly currentRevision: number) {
    super('This draft changed elsewhere. Reload it before saving your edit.');
    this.name = 'DraftConflictError';
  }
}

export const firestoreService = {
  /**
   * Saves or updates a project in the user's subcollection
   */
  async saveProject(userId: string, project: ProjectData) {
    if (!userId) throw new Error("User ID is required to save project");
    const projectId = `${project.owner}_${project.repo}`;
    if (isBrowserE2E) {
      const projects = readE2ECollection<any>('linkedin-e2e-projects').filter(item => item.id !== projectId);
      writeE2ECollection('linkedin-e2e-projects', [...projects, { id: projectId, ...project }]);
      return projectId;
    }
    const { db, doc, setDoc, serverTimestamp } = await loadFirestoreClient();
    const projectRef = doc(db, `users/${userId}/projects`, projectId);
    
    await setDoc(projectRef, {
      ...project,
      lastAnalyzedAt: serverTimestamp(),
      createdAt: project.createdAt || serverTimestamp(),
    }, { merge: true });

    return projectId;
  },

  /**
   * Updates specific fields of an existing project
   */
  async updateProject(userId: string, projectId: string, updates: Partial<ProjectData>) {
    if (!userId || !projectId) return;
    if (isBrowserE2E) {
      const projects = readE2ECollection<any>('linkedin-e2e-projects').map(item => item.id === projectId ? { ...item, ...updates } : item);
      writeE2ECollection('linkedin-e2e-projects', projects);
      return;
    }
    const { db, doc, updateDoc } = await loadFirestoreClient();
    const projectRef = doc(db, `users/${userId}/projects`, projectId);
    await updateDoc(projectRef, updates);
  },

  /**
   * Retrieves a single project
   */
  async getProject(userId: string, owner: string, repo: string) {
    if (!userId) return null;
    const projectId = `${owner}_${repo}`;
    const { db, doc, getDoc } = await loadFirestoreClient();
    const projectRef = doc(db, `users/${userId}/projects`, projectId);
    const docSnap = await getDoc(projectRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ProjectData & { id: string };
    }
    return null;
  },

  /**
   * Retrieves all tracked projects for a user
   */
  async getUserProjects(userId: string): Promise<(ProjectData & { id: string })[]> {
    if (!userId) return [];
    if (isBrowserE2E) return readE2ECollection<ProjectData & { id: string }>('linkedin-e2e-projects');
    const { db, collection, getDocs } = await loadFirestoreClient();
    const projectsRef = collection(db, `users/${userId}/projects`);
    const snapshot = await getDocs(projectsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (ProjectData & { id: string })[];
  },

  /**
   * Saves a new draft analysis or technical update
   */
  async saveDraft(userId: string, draft: DraftData) {
    if (!userId) throw new Error("User ID is required to save draft");
    if (isBrowserE2E) {
      const draftId = `e2e-draft-${Date.now()}`;
      const drafts = readE2ECollection<any>('linkedin-e2e-drafts');
      writeE2ECollection('linkedin-e2e-drafts', [...drafts, { id: draftId, ...draft, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
      writeE2ECollection(`linkedin-e2e-draft-versions-${draftId}`, [{
        id: '0',
        content: draft.content,
        revision: 0,
        savedAt: new Date().toISOString(),
        source: 'original',
      }]);
      return draftId;
    }
    
    const { db, collection, doc, serverTimestamp, writeBatch } = await loadFirestoreClient();
    const draftsRef = doc(collection(db, `users/${userId}/drafts`)); // auto-generated ID
    const draftId = draftsRef.id;
    const originalVersionRef = doc(draftsRef, 'versions', '0');
    const batch = writeBatch(db);
    batch.set(draftsRef, {
      ...draft,
      revision: draft.revision || 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    batch.set(originalVersionRef, {
      content: draft.content,
      revision: 0,
      savedAt: serverTimestamp(),
      source: 'original',
    });
    await batch.commit();

    return draftId;
  },

  /**
   * Retrieves drafts for a user, optionally filtered by project
   */
  async getUserDrafts(userId: string, projectId?: string) {
    if (!userId) return [];
    if (isBrowserE2E) {
      const drafts = readE2ECollection<any>('linkedin-e2e-drafts');
      return projectId ? drafts.filter(draft => draft.projectId === projectId) : drafts;
    }
    const { db, collection, getDocs, query, where } = await loadFirestoreClient();
    const draftsRef = collection(db, `users/${userId}/drafts`);
    let q = query(draftsRef);
    
    if (projectId) {
      q = query(draftsRef, where("projectId", "==", projectId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Updates an existing draft (e.g. status change)
   */
  async updateDraft(userId: string, draftId: string, updates: Partial<DraftData>, expectedRevision?: number) {
    if (!userId || !draftId) return;
    if (isBrowserE2E) {
      const drafts = readE2ECollection<any>('linkedin-e2e-drafts');
      const current = drafts.find(draft => draft.id === draftId);
      if (!current) return;
      const currentRevision = Number(current.revision || 1);
      if (expectedRevision !== undefined && expectedRevision !== currentRevision) throw new DraftConflictError(currentRevision);
      const nextRevision = currentRevision + 1;
      const versionKey = `linkedin-e2e-draft-versions-${draftId}`;
      const versions = readE2ECollection<any>(versionKey);
      writeE2ECollection(versionKey, [...versions, {
        id: String(nextRevision),
        ...updates,
        content: updates.content ?? current.content,
        revision: nextRevision,
        savedAt: new Date().toISOString(),
        source: 'manual',
      }]);
      writeE2ECollection('linkedin-e2e-drafts', drafts.map(draft => draft.id === draftId ? {
        ...draft, ...updates, revision: nextRevision, updatedAt: new Date().toISOString(),
      } : draft));
      return { revision: nextRevision };
    }
    const { db, doc, collection, runTransaction, serverTimestamp } = await loadFirestoreClient();
    const draftRef = doc(db, `users/${userId}/drafts`, draftId);
    const versionsRef = collection(draftRef, 'versions');
    return await runTransaction(db, async transaction => {
      const currentSnapshot = await transaction.get(draftRef);
      if (!currentSnapshot.exists()) throw new Error('Draft not found');
      const current = currentSnapshot.data() as DraftData;
      const currentRevision = Number(current.revision || 1);
      if (expectedRevision !== undefined && expectedRevision !== currentRevision) throw new DraftConflictError(currentRevision);
      const nextRevision = currentRevision + 1;
      transaction.update(draftRef, { ...updates, revision: nextRevision, updatedAt: serverTimestamp() });
      transaction.set(doc(versionsRef, String(nextRevision)), {
        ...updates,
        content: updates.content ?? current.content,
        revision: nextRevision,
        savedAt: serverTimestamp(),
        source: 'manual',
      });
      return { revision: nextRevision };
    });
  },

  async getDraftVersions(userId: string, draftId: string) {
    if (!userId || !draftId) return [];
    if (isBrowserE2E) return readE2ECollection<any>(`linkedin-e2e-draft-versions-${draftId}`)
      .map((version, index) => ({ id: version.id || String(version.revision ?? index), ...version }))
      .sort((a, b) => Number(b.revision || 0) - Number(a.revision || 0));
    const { db, collection, getDocs, query, orderBy } = await loadFirestoreClient();
    const versionsRef = collection(db, `users/${userId}/drafts/${draftId}/versions`);
    const snapshot = await getDocs(query(versionsRef, orderBy('revision', 'desc')));
    return snapshot.docs.map(version => ({ id: version.id, ...version.data() }));
  },

  /**
   * Deletes a draft
   */
  async deleteDraft(userId: string, draftId: string) {
    if (!userId || !draftId) return;
    if (isBrowserE2E) {
      writeE2ECollection('linkedin-e2e-drafts', readE2ECollection<any>('linkedin-e2e-drafts').filter(draft => draft.id !== draftId));
      return;
    }
    const { db, doc, deleteDoc } = await loadFirestoreClient();
    const draftRef = doc(db, `users/${userId}/drafts`, draftId);
    await deleteDoc(draftRef);
  }
};
