import fs from 'fs';
import path from 'path';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let cachedDatabaseId: string | null | undefined = undefined;

export function getFirestoreDatabaseId(): string | undefined {
  if (cachedDatabaseId !== undefined) {
    return cachedDatabaseId || undefined;
  }
  try {
    const configRaw = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
    const config = JSON.parse(configRaw);
    cachedDatabaseId = config.firestoreDatabaseId || null;
  } catch (e) {
    cachedDatabaseId = process.env.FIRESTORE_DATABASE_ID || null;
  }
  return cachedDatabaseId || undefined;
}

export function getAdminFirestore(): Firestore {
  const databaseId = getFirestoreDatabaseId();
  return databaseId ? getFirestore(databaseId) : getFirestore();
}
