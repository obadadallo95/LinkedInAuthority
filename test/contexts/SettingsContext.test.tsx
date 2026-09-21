/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsProvider, useSettings } from '../../src/contexts/SettingsContext';
import { useAuth } from '../../src/application/AuthContext';
import * as firestore from 'firebase/firestore';

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  getFirestore: vi.fn(),
}));

// Mock useAuth
vi.mock('../../src/application/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  ...firestoreMocks,
}));

vi.mock('../../src/infrastructure/firebase/config', () => ({
  app: {},
  firestoreDatabaseId: undefined,
}));

vi.mock('../../src/infrastructure/firebase/firestoreClient', () => {
  return { loadFirestoreClient: vi.fn(async () => ({ db: {}, ...firestoreMocks })) };
});

// Mock global fetch
global.fetch = vi.fn();

const TestComponent = () => {
  const { settings, isPro, loadingSettings, settingsError, saveSettings, disconnectChannel, isOnboardingComplete } = useSettings();
  return (
    <div>
      <div data-testid="loading">{loadingSettings ? 'Loading' : 'Loaded'}</div>
      <div data-testid="gh-user">{settings.githubUsername}</div>
      <div data-testid="onboarding">{isOnboardingComplete ? 'Complete' : 'Incomplete'}</div>
      <div data-testid="is-pro">{isPro ? 'Pro' : 'Free'}</div>
      <div data-testid="settings-error">{settingsError ? 'Error' : 'No Error'}</div>
      <button onClick={() => saveSettings('testuser')}>Save Settings</button>
      <button onClick={() => disconnectChannel('github')}>Disconnect GitHub</button>
    </div>
  );
};

describe('SettingsContext', () => {
  let mockUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe = vi.fn();
    (firestore.onSnapshot as any).mockImplementation((ref: any, callback: any) => {
      return mockUnsubscribe;
    });
  });

  it('provides empty settings and stops loading if no user', () => {
    (useAuth as any).mockReturnValue({ user: null });

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    expect(screen.getByTestId('gh-user')).toHaveTextContent('');
    expect(screen.getByTestId('onboarding')).toHaveTextContent('Incomplete');
  });

  it('subscribes to settings when user is present', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-123' } });
    (firestore.doc as any).mockReturnValue('mock-doc-ref');

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-123', 'settings', 'current'));
    expect(firestore.onSnapshot).toHaveBeenCalled();
  });

  it('updates state when onSnapshot triggers with existing data', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-123' } });

    let snapshotCallback: any;
    (firestore.onSnapshot as any).mockImplementation((ref: any, cb: any) => {
      snapshotCallback = cb;
      return mockUnsubscribe;
    });

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => expect(snapshotCallback).toBeTypeOf('function'));
    act(() => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ githubUsername: 'test-user', linkedinToken: 'token' })
      };
      snapshotCallback(mockDocSnap);
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    expect(screen.getByTestId('gh-user')).toHaveTextContent('test-user');
    expect(screen.getByTestId('onboarding')).toHaveTextContent('Complete');
  });

  it('exposes listener errors instead of falling back to empty account settings', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-123' } });

    let errorCallback: any;
    (firestore.onSnapshot as any).mockImplementation((ref: any, cb: any, onError: any) => {
      errorCallback = onError;
      return mockUnsubscribe;
    });

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => expect(errorCallback).toBeTypeOf('function'));
    act(() => {
      errorCallback(new Error('offline'));
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    expect(screen.getByTestId('settings-error')).toHaveTextContent('Error');
  });

  it('saves the GitHub username without an extra profile request', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-123', displayName: 'User Name', photoURL: 'url' } });
    (firestore.doc as any).mockReturnValue('mock-doc-ref');
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    const btn = screen.getByText('Save Settings');
    await act(async () => {
      btn.click();
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect((global.fetch as any).mock.calls.some((call: any[]) => String(call[0]).includes('/api/integrations/github/connect'))).toBe(false);
    expect(firestore.setDoc).toHaveBeenCalledWith('mock-doc-ref', {
      githubUsername: 'testuser',
      githubProfile: null,
      linkedinProfile: null,
    }, { merge: true });
  });

  it('disconnects GitHub channel', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-123' } });
    (firestore.doc as any).mockReturnValue('mock-doc-ref');

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    const btn = screen.getByText('Disconnect GitHub');
    await act(async () => {
      btn.click();
    });

    expect(firestore.setDoc).toHaveBeenCalledWith('mock-doc-ref', {
      githubUsername: '',
      githubProfile: null,
      githubPermissions: 'public',
    }, { merge: true });
  });

  it('evaluates normal user as Free tier (isPro === false)', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'normal-user-456' } });

    let snapshotCallback: any;
    (firestore.onSnapshot as any).mockImplementation((ref: any, cb: any) => {
      snapshotCallback = cb;
      return mockUnsubscribe;
    });

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => expect(snapshotCallback).toBeTypeOf('function'));
    act(() => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ githubUsername: 'standard_dev' })
      };
      snapshotCallback(mockDocSnap);
    });

    expect(screen.getByTestId('is-pro')).toHaveTextContent('Free');
  });

  it('evaluates user with isFounder: true as Pro tier (isPro === true)', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'founder-uid-123' } });

    let snapshotCallback: any;
    (firestore.onSnapshot as any).mockImplementation((ref: any, cb: any) => {
      snapshotCallback = cb;
      return mockUnsubscribe;
    });

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => expect(snapshotCallback).toBeTypeOf('function'));
    act(() => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          githubUsername: 'obadadallo95',
          isFounder: true,
          plan: 'pro'
        })
      };
      snapshotCallback(mockDocSnap);
    });

    expect(screen.getByTestId('is-pro')).toHaveTextContent('Pro');
  });

  it('evaluates user with plan: pro or isPaidSubscription as Pro tier', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'pro-user-789' } });

    let snapshotCallback: any;
    (firestore.onSnapshot as any).mockImplementation((ref: any, cb: any) => {
      snapshotCallback = cb;
      return mockUnsubscribe;
    });

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => expect(snapshotCallback).toBeTypeOf('function'));
    act(() => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          githubUsername: 'pro_dev',
          isPaidSubscription: true
        })
      };
      snapshotCallback(mockDocSnap);
    });

    expect(screen.getByTestId('is-pro')).toHaveTextContent('Pro');
  });
});
