import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, GithubAuthProvider, OAuthProvider, getAdditionalUserInfo, UserCredential } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../infrastructure/firebase/config";
import { loadFirestoreClient } from "../infrastructure/firebase/firestoreClient";
import { isBrowserE2E } from "../utils/e2e";
import { recordAuthenticatedProductEvent } from "../utils/productTelemetry";
import { getSafeAuthErrorMessage, getSafeGithubConnectionMessage } from "../utils/authError";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authError: null,
  clearAuthError: () => {},
  signInWithGoogle: async () => {},
  signInWithGithub: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isBrowserE2E) {
      setUser({
        uid: 'e2e-user',
        email: 'e2e@example.test',
        displayName: 'E2E Reviewer',
        getIdToken: async () => 'e2e-id-token',
      } as unknown as User);
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      recordSignupIfNeeded(result, 'google');
    } catch (error: any) {
      console.error("Google Login Error", error);
      const message = getSafeAuthErrorMessage(error, 'Google');
      if (message) setAuthError(message);
    }
  };

  const signInWithGithub = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      recordSignupIfNeeded(result, 'github');
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token && result.user) {
        try {
          const idToken = await result.user.getIdToken();
          const connection = await fetch('/api/integrations/github/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ token }),
          });
          if (!connection.ok) throw new Error('GitHub connection could not be secured');
          const userData = (await connection.json()).profile;
          
          const { doc, setDoc, db } = await loadFirestoreClient();
          
          const settingsRef = doc(db, "users", result.user.uid, "settings", "current");
          await setDoc(settingsRef, {
              githubUsername: userData.login,
              githubProfile: {
                  login: userData.login,
                  avatar_url: userData.avatar_url,
                  name: userData.name
              }
          }, { merge: true });
        } catch (e) {
          console.error("Failed to secure GitHub connection during login", e);
          setAuthError(getSafeGithubConnectionMessage());
        }
      }
    } catch (error: any) {
      console.error("GitHub Login Error", error);
      const message = getSafeAuthErrorMessage(error, 'GitHub');
      if (message) setAuthError(message);
    }
  };

  const recordSignupIfNeeded = (result: UserCredential, source: 'google' | 'github') => {
    if (getAdditionalUserInfo(result)?.isNewUser) {
      void recordAuthenticatedProductEvent(result.user, 'signup_completed', { source });
    }
  };



  const signOut = async () => {
    if (isBrowserE2E) {
      setUser(null);
      return;
    }
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error("Sign Out Error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, clearAuthError: () => setAuthError(null), signInWithGoogle, signInWithGithub, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
