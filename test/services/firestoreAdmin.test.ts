import { describe, it, expect } from 'vitest';
import { getFirestoreDatabaseId, getAdminFirestore } from '../../server/services/firestoreAdmin';
import configData from '../../firebase-applet-config.json';
import { initializeApp, getApps } from 'firebase-admin/app';

describe('firestoreAdmin', () => {
  it('should load the exact firestoreDatabaseId configured in firebase-applet-config.json', () => {
    const databaseId = getFirestoreDatabaseId();
    expect(databaseId).toBe(configData.firestoreDatabaseId);
    expect(databaseId).toBe('ai-studio-linkedincontentg-ccdbb9f2-7653-4a9f-bb1d-558a296caa4e');
  });

  it('should return a Firestore instance configured with the app and databaseId', () => {
    if (getApps().length === 0) {
      initializeApp({ projectId: configData.projectId });
    }
    const db = getAdminFirestore();
    expect(db).toBeDefined();
    expect((db as any).databaseId).toBe(configData.firestoreDatabaseId);
  });
});
