import { app, firestoreDatabaseId } from './config';

/** Load Firestore only when an authenticated persistence surface needs it. */
export async function loadFirestoreClient() {
  const firestore = await import('firebase/firestore');
  return {
    ...firestore,
    db: firestore.getFirestore(app, firestoreDatabaseId),
  };
}
