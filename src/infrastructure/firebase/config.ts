import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

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

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
// Request GitHub's repository scope so an explicit "public and private"
// setting can actually authorize private-repository listing and analysis.
// The server still gates use of this credential behind githubPermissions=all.
githubProvider.addScope('repo');

export const firestoreDatabaseId = configData.firestoreDatabaseId;

export { app, auth, googleProvider, githubProvider };
