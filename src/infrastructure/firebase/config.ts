import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, OAuthProvider } from "firebase/auth";
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
githubProvider.addScope("repo");

const linkedinProvider = new OAuthProvider("oidc.linkedin"); // Firebase standard for linkedin
linkedinProvider.addScope("openid");
linkedinProvider.addScope("profile");
linkedinProvider.addScope("email");
linkedinProvider.addScope("w_member_social");

export { app, auth, db, googleProvider, githubProvider, linkedinProvider };
