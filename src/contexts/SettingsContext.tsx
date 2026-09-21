import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../application/AuthContext';
import { loadFirestoreClient } from '../infrastructure/firebase/firestoreClient';
import { isBrowserE2E } from '../utils/e2e';

export interface UserSettings {
  githubUsername: string;
  githubProfile: any | null;
  linkedinProfile: any | null;
  githubPermissions?: 'all' | 'public';
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
  settingsError: boolean;
  isOnboardingComplete: boolean;
  saveSettings: (ghUsernameInput: string) => Promise<void>;
  disconnectChannel: (platform: 'github') => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    githubUsername: "",
    githubProfile: null,
    linkedinProfile: null,
    githubPermissions: 'public',
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setSettings({
        githubUsername: "",
        githubProfile: null,
        linkedinProfile: null,
        githubPermissions: 'public',
      });
      setLoadingSettings(false);
      setSettingsError(false);
      return;
    }

    if (isBrowserE2E) {
      try {
        const stored = localStorage.getItem('linkedin-e2e-settings');
        setSettings({
          githubUsername: 'e2e-user',
          githubProfile: { login: 'e2e-user', name: 'E2E Reviewer' },
          linkedinProfile: null,
          githubPermissions: 'public',
          onboardingSkipped: true,
          ...(stored ? JSON.parse(stored) : {}),
        });
      } catch {
        setSettings({ githubUsername: 'e2e-user', githubProfile: null, linkedinProfile: null, onboardingSkipped: true });
      }
      setLoadingSettings(false);
      setSettingsError(false);
      return;
    }

    setLoadingSettings(true);
    setSettingsError(false);
    let cancelled = false;
    let unsubscribe = () => {};
    void loadFirestoreClient().then(({ db, doc, onSnapshot }) => {
      if (cancelled) return;
      const settingsRef = doc(db, "users", user.uid, "settings", "current");
      unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserSettings & { githubToken?: unknown; linkedinToken?: unknown };
          const { githubToken: _legacyToken, linkedinToken: _legacyLinkedInToken, ...safeSettings } = data;
          setSettings(safeSettings as UserSettings);
        } else {
          setSettings({
            githubUsername: "",
            githubProfile: null,
            linkedinProfile: null,
            githubPermissions: 'public',
          });
        }
        setLoadingSettings(false);
        setSettingsError(false);
      }, (error) => {
        console.error("Settings listener error:", error);
        setLoadingSettings(false);
        setSettingsError(true);
      });
    }).catch((error) => {
      if (cancelled) return;
      console.error("Settings client load error:", error);
      setLoadingSettings(false);
      setSettingsError(true);
    });

    return () => { cancelled = true; unsubscribe(); };
  }, [user?.uid]);

  const saveSettings = async (ghUsernameInput: string) => {
    if (!user?.uid) throw new Error("No authenticated user");

    if (isBrowserE2E) {
      localStorage.setItem('linkedin-e2e-settings', JSON.stringify({ githubUsername: ghUsernameInput, onboardingSkipped: true }));
      setSettings(previous => ({ ...previous, githubUsername: ghUsernameInput, onboardingSkipped: true }));
      return;
    }

    const { db, doc, setDoc } = await loadFirestoreClient();
    const settingsRef = doc(db, "users", user.uid, "settings", "current");
    await setDoc(settingsRef, {
      githubUsername: ghUsernameInput,
      // Profile metadata is optional; repository loading is server-backed and
      // should not spend a separate GitHub request just to save a username.
      githubProfile: null,
      linkedinProfile: null,
    }, { merge: true });
  };

  const disconnectChannel = async (platform: 'github') => {
    if (!user?.uid) throw new Error("No authenticated user");

    if (isBrowserE2E) {
      localStorage.removeItem('linkedin-e2e-settings');
      setSettings(previous => ({ ...previous, githubUsername: '', githubProfile: null }));
      return;
    }
    
    if (platform === 'github') {
      if (typeof user.getIdToken === 'function') {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/integrations/github', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!response.ok) throw new Error('GitHub disconnect failed');
      }
      const { db, doc, setDoc } = await loadFirestoreClient();
      const settingsRef = doc(db, "users", user.uid, "settings", "current");
      await setDoc(settingsRef, {
        githubUsername: "",
        githubProfile: null,
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
    <SettingsContext.Provider value={{ settings, isPro, loadingSettings, settingsError, isOnboardingComplete, saveSettings, disconnectChannel }}>
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
