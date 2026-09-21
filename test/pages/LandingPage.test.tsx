/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LandingPage } from '../../src/pages/LandingPage';

const clearAuthError = vi.fn();

vi.mock('../../src/application/AuthContext', () => ({
  useAuth: () => ({
    signInWithGoogle: vi.fn(),
    signInWithGithub: vi.fn(),
    authError: 'The sign-in provider is temporarily unavailable.',
    clearAuthError,
  }),
}));

describe('LandingPage authentication recovery', () => {
  it('renders safe authentication failures inline and lets the user dismiss them', async () => {
    render(<LandingPage lang="en" onToggleLang={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The sign-in provider is temporarily unavailable.');
    fireEvent.click(screen.getByRole('button', { name: /^Dismiss$/ }));
    expect(clearAuthError).toHaveBeenCalledTimes(1);
  });

  it('keeps demo copy failure visible instead of claiming success', async () => {
    vi.mocked(clearAuthError).mockClear();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analysisToken: 'analysis-token',
          angles: [{ id: 'angle-1' }],
          repository: { name: 'authority-fixture' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          post: 'An evidence-backed draft.',
          evidence: [],
          conflicts: [],
        }),
      }));
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard unavailable'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(<LandingPage lang="en" onToggleLang={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('https://github.com/facebook/react'), {
      target: { value: 'https://github.com/demo/authority-fixture' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Generate Post' }));

    const copyButton = await screen.findByRole('button', { name: 'Copy Post' });
    fireEvent.click(copyButton);

    expect(await screen.findByRole('alert')).toHaveTextContent('Copy failed.');
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('An evidence-backed draft.'));
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
    expect(screen.getByText('LinkedIn draft')).toBeInTheDocument();
    expect(screen.queryByText('1m •')).not.toBeInTheDocument();
  });
});
