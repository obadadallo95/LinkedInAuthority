import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// The config values are available in the generated firebase-applet-config.json
// But in a Vite app we could load it from a JSON import or hardcode since it's client safe.
import configData from "../../../firebase-applet-config.json";

const firebaseConfig = {
  projectId: configData.projectId,
  appId: configData.appId,
  apiKey: configData.apiKey,
  authDomain: configData.authDomain,
  // Omit firestoreDatabaseId if using default database, otherwise it could cause issues.
  storageBucket: configData.storageBucket,
  messagingSenderId: configData.messagingSenderId,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, configData.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
// Public repository analysis does not require GitHub's broad full-repository
// scope. Private-repository support remains a documented beta limitation.

export { app, auth, db, googleProvider, githubProvider };
