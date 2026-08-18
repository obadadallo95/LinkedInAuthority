import { db } from '../infrastructure/firebase/config';
import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

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
  status: 'draft' | 'published';
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
}

export const firestoreService = {
  /**
   * Saves or updates a project in the user's subcollection
   */
  async saveProject(userId: string, project: ProjectData) {
    if (!userId) throw new Error("User ID is required to save project");
    const projectId = `${project.owner}_${project.repo}`;
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
    const projectRef = doc(db, `users/${userId}/projects`, projectId);
    await updateDoc(projectRef, updates);
  },

  /**
   * Retrieves a single project
   */
  async getProject(userId: string, owner: string, repo: string) {
    if (!userId) return null;
    const projectId = `${owner}_${repo}`;
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
    const projectsRef = collection(db, `users/${userId}/projects`);
    const snapshot = await getDocs(projectsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (ProjectData & { id: string })[];
  },

  /**
   * Saves a new draft analysis or technical update
   */
  async saveDraft(userId: string, draft: DraftData) {
    if (!userId) throw new Error("User ID is required to save draft");
    
    const draftsRef = doc(collection(db, `users/${userId}/drafts`)); // auto-generated ID
    const draftId = draftsRef.id;

    await setDoc(draftsRef, {
      ...draft,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return draftId;
  },

  /**
   * Retrieves drafts for a user, optionally filtered by project
   */
  async getUserDrafts(userId: string, projectId?: string) {
    if (!userId) return [];
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
  async updateDraft(userId: string, draftId: string, updates: Partial<DraftData>) {
    if (!userId || !draftId) return;
    const draftRef = doc(db, `users/${userId}/drafts`, draftId);
    
    await updateDoc(draftRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Deletes a draft
   */
  async deleteDraft(userId: string, draftId: string) {
    if (!userId || !draftId) return;
    const draftRef = doc(db, `users/${userId}/drafts`, draftId);
    await deleteDoc(draftRef);
  }
};
