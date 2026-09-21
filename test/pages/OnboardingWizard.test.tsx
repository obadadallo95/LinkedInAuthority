/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingWizard } from '../../src/pages/OnboardingWizard';

const { setDoc } = vi.hoisted(() => ({ setDoc: vi.fn().mockResolvedValue(undefined) }));

vi.mock('../../src/contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {},
    isOnboardingComplete: false,
  }),
}));

vi.mock('../../src/infrastructure/firebase/config', () => ({
  app: {},
  firestoreDatabaseId: undefined,
  auth: { currentUser: { uid: 'test-user' } },
  githubProvider: {},
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  setDoc,
}));

vi.mock('firebase/auth', () => ({
  linkWithPopup: vi.fn(),
  GithubAuthProvider: { credentialFromResult: vi.fn() },
}));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('OnboardingWizard', () => {
  it('keeps the welcome page actionable before asking for a GitHub choice', async () => {
    render(<OnboardingWizard lang="en" />);

    expect(await screen.findByRole('heading', { name: 'Welcome to LinkedIn Authority' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Get Started' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with public repositories' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }));

    expect(await screen.findByRole('button', { name: 'Connect Account' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Continue with public repositories' })).toBeInTheDocument();
  });

  it('offers a public-repository path without requiring a private credential', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'true'),
      setItem: vi.fn(),
    });
    render(<OnboardingWizard lang="en" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Get Started' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Continue with public repositories' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /all set/i })).toBeVisible());
  });
});
