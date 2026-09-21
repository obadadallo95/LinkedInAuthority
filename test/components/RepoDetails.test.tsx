/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RepoDetails, getSafeRepoOperationError } from '../../src/components/RepoDetails';

vi.mock('../../src/application/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user-1', getIdToken: vi.fn().mockResolvedValue('test-token') },
  }),
}));

vi.mock('../../src/services/firestoreService', () => ({
  firestoreService: {
    saveProject: vi.fn(),
    saveDraft: vi.fn(),
  },
}));

vi.mock('../../src/utils/productTelemetry', () => ({
  recordAuthenticatedProductEvent: vi.fn(),
}));

vi.mock('../../src/utils/e2e', () => ({ isBrowserE2E: false }));

describe('RepoDetails', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fixture failure')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a recoverable error instead of an empty repository page', async () => {
    render(
      <MemoryRouter initialEntries={['/repositories/acme/authority']}>
        <Routes>
          <Route
            path="/repositories/:owner/:repo"
            element={<RepoDetails lang="en" settings={{ githubUsername: 'acme' }} demoMode={false} />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Repository details could not be loaded'));
    expect(screen.getByText('No draft was created. Check the connection or access scope, then try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('maps provider failures to safe localized operation messages', () => {
    const message = getSafeRepoOperationError('en', 'generation', 503);

    expect(message).toContain('temporarily unavailable');
    expect(message).not.toContain('firebase');
    expect(message).not.toContain('token');
  });

  it('shows generation failures inline without relying on a browser alert', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: vi.fn().mockResolvedValue({ error: 'fixture failure' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/repositories/acme/authority']}>
        <Routes>
          <Route
            path="/repositories/:owner/:repo"
            element={<RepoDetails lang="en" settings={{ githubUsername: 'acme' }} demoMode />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('button', { name: /Evidence-backed repository scan/ });
    await act(async () => {
      screen.getByRole('button', { name: /Evidence-backed repository scan/ }).click();
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('deep scan is temporarily unavailable'));
    expect(fetchMock).toHaveBeenCalledWith('/api/deep-scan', expect.objectContaining({ method: 'POST' }));
  });

  it('keeps repository draft copy failure visible instead of claiming success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        post: 'A grounded repository draft.',
        suggestedComment: 'Optional project link.',
        repository: { owner: 'acme', name: 'authority' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard unavailable'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <MemoryRouter initialEntries={['/repositories/acme/authority']}>
        <Routes>
          <Route
            path="/repositories/:owner/:repo"
            element={<RepoDetails lang="en" settings={{ githubUsername: 'acme' }} demoMode />}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /Evidence-backed repository scan/ }));
    const copyButton = await screen.findByRole('button', { name: 'Copy' });
    fireEvent.click(copyButton);

    expect(await screen.findByRole('alert')).toHaveTextContent('Copy failed.');
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('A grounded repository draft.'));
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  });

  it('keeps generated repository result labels localized in Arabic', async () => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        post: 'مسودة موثقة.',
        suggestedComment: 'تتضمن المسودة روابط المشروع للمشاركة اليدوية الاختيارية.',
        repository: { owner: 'acme', name: 'authority' },
      }),
    }));

    render(
      <MemoryRouter initialEntries={['/repositories/acme/authority']}>
        <Routes>
          <Route
            path="/repositories/:owner/:repo"
            element={<RepoDetails lang="ar" settings={{ githubUsername: 'acme' }} demoMode />}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /فحص عميق قائم على الأدلة/ }));

    expect(await screen.findByText('المهندسون البرمجيون', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('تتضمن المسودة روابط المشروع للمشاركة اليدوية الاختيارية.')).toBeInTheDocument();
    expect(screen.getByLabelText('نص المسودة')).toHaveValue('مسودة موثقة.');
    expect(screen.getByText('مسودة منشور LinkedIn')).toBeInTheDocument();
    expect(screen.queryByText('1m •')).not.toBeInTheDocument();
  });

  it('does not invent a link note for commit-only analysis', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        title: 'Rendering refactor',
        technicalUpdate: 'The rendering path was simplified.',
        changelog: 'The change is available for review in the repository history.',
      }),
    }));

    render(
      <MemoryRouter initialEntries={['/repositories/acme/authority']}>
        <Routes>
          <Route
            path="/repositories/:owner/:repo"
            element={<RepoDetails lang="en" settings={{ githubUsername: 'acme' }} demoMode />}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /Generate from Recent Commits/ }));

    await screen.findByLabelText('Draft post');
    expect(screen.queryByLabelText('Suggested comment')).not.toBeInTheDocument();
    expect(screen.queryByText(/Project links are included/)).not.toBeInTheDocument();
  });

});
