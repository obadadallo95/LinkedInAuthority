import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, GithubAuthProvider, OAuthProvider } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../infrastructure/firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithGithub: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google Login Error", error);
      alert(`خطأ في تسجيل الدخول (Google): ${error.message}`);
    }
  };

  const signInWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token && result.user) {
        try {
          const userRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `token ${token}` }
          });
          const userData = await userRes.json();
          
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('../infrastructure/firebase/config');
          
          const settingsRef = doc(db, "users", result.user.uid, "settings", "current");
          await setDoc(settingsRef, {
              githubUsername: userData.login,
              githubToken: token,
              githubProfile: {
                  login: userData.login,
                  avatar_url: userData.avatar_url,
                  name: userData.name
              }
          }, { merge: true });
        } catch (e) {
          console.error("Failed to save github token during login", e);
        }
      }
    } catch (error: any) {
      console.error("GitHub Login Error", error);
      if (error.code === 'auth/account-exists-with-different-credential') {
        alert(`خطأ: يوجد حساب مسجل مسبقاً بنفس عنوان البريد الإلكتروني. يرجى تسجيل الدخول باستخدام حساب Google الخاص بك أولاً، ثم ربط حساب GitHub من صفحة الإعدادات.\n\nError: An account already exists with the same email. Please sign in with Google first, then connect your GitHub account from Settings.`);
      } else {
        alert(`خطأ في تسجيل الدخول (GitHub): ${error.message}`);
      }
    }
  };



  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error("Sign Out Error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithGithub, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
