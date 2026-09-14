import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../application/AuthContext';
import { db } from '../infrastructure/firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export interface UserSettings {
  githubUsername: string;
  githubToken: string;
  linkedinToken: string;
  githubProfile: any | null;
  linkedinProfile: any | null;
  githubPermissions?: 'all' | 'public';
  linkedinPublish?: boolean;
  linkedinComment?: boolean;
  linkedinFollow?: boolean;
  onboardingSkipped?: boolean;
  isPaidSubscription?: boolean;
  plan?: 'free' | 'pro';
  isFounder?: boolean;
  role?: string;
}

export interface SettingsContextType {
  settings: UserSettings;
  isPro: boolean;
  loadingSettings: boolean;
  isOnboardingComplete: boolean;
  saveSettings: (ghUsernameInput: string, ghTokenInput: string, liTokenInput: string) => Promise<void>;
  disconnectChannel: (platform: 'github' | 'linkedin') => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    githubUsername: "",
    githubToken: "",
    linkedinToken: "",
    githubProfile: null,
    linkedinProfile: null,
    githubPermissions: 'public',
    linkedinPublish: true,
    linkedinComment: false,
    linkedinFollow: false,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setSettings({
        githubUsername: "",
        githubToken: "",
        linkedinToken: "",
        githubProfile: null,
        linkedinProfile: null,
        githubPermissions: 'public',
        linkedinPublish: true,
        linkedinComment: false,
        linkedinFollow: false,
      });
      setLoadingSettings(false);
      return;
    }

    setLoadingSettings(true);
    const settingsRef = doc(db, "users", user.uid, "settings", "current");
    
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as UserSettings);
      } else {
        setSettings({
          githubUsername: "",
          githubToken: "",
          linkedinToken: "",
          githubProfile: null,
          linkedinProfile: null,
          githubPermissions: 'public',
          linkedinPublish: true,
          linkedinComment: false,
          linkedinFollow: false,
        });
      }
      setLoadingSettings(false);
    }, (error) => {
      console.error("Settings listener error:", error);
      setLoadingSettings(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const saveSettings = async (ghUsernameInput: string, ghTokenInput: string, liTokenInput: string) => {
    if (!user?.uid) throw new Error("No authenticated user");

    let githubProfile = null;
    if (ghUsernameInput) {
      try {
        const res = await fetch(`https://api.github.com/users/${ghUsernameInput}`);
        if (res.ok) {
          githubProfile = await res.json();
        }
      } catch (err) {
        console.error("Failed to fetch Github profile:", err);
      }
    }

    const settingsRef = doc(db, "users", user.uid, "settings", "current");
    await setDoc(settingsRef, {
      githubUsername: ghUsernameInput,
      githubToken: ghTokenInput,
      // LinkedIn publishing is not implemented in this beta. Do not persist
      // a token for an unused integration flow.
      linkedinToken: "",
      githubProfile,
      linkedinProfile: null,
    }, { merge: true });
  };

  const disconnectChannel = async (platform: 'github' | 'linkedin') => {
    if (!user?.uid) throw new Error("No authenticated user");
    
    const settingsRef = doc(db, "users", user.uid, "settings", "current");
    if (platform === 'github') {
      await setDoc(settingsRef, {
        githubUsername: "",
        githubToken: "",
        githubProfile: null,
      }, { merge: true });
    } else {
      await setDoc(settingsRef, {
        linkedinToken: "",
        linkedinProfile: null,
      }, { merge: true });
    }
  };

  const isOnboardingComplete = settings.onboardingSkipped === true
    || !!(settings.githubUsername || settings.githubProfile);

  const isPro = Boolean(
    settings.isFounder === true ||
    settings.plan === 'pro' ||
    settings.isPaidSubscription === true ||
    settings.role === 'admin' ||
    settings.role === 'founder'
  );

  return (
    <SettingsContext.Provider value={{ settings, isPro, loadingSettings, isOnboardingComplete, saveSettings, disconnectChannel }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
