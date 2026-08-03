import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase Admin (make sure FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS is set, 
// or it uses default credentials if running in a Google Cloud environment)
try {
  initializeApp();
} catch (error) {
  console.log("Firebase admin already initialized or missing credentials.");
}

const db = getFirestore();

async function runMigration() {
  console.log("Starting database migration...");
  
  try {
    const usersSnapshot = await db.collection('users').get();
    let updatedProjectsCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const projectsSnapshot = await userDoc.ref.collection('projects').get();
      
      for (const projectDoc of projectsSnapshot.docs) {
        const data = projectDoc.data();
        
        // If the project doesn't have monitoringEnabled explicitly defined, set it to false
        if (data.monitoringEnabled === undefined) {
          await projectDoc.ref.update({
            monitoringEnabled: false,
          });
          updatedProjectsCount++;
          console.log(`Updated project ${projectDoc.id} for user ${userDoc.id}`);
        }
      }
    }
    
    console.log(`Migration completed! Successfully updated ${updatedProjectsCount} projects.`);
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

runMigration();
