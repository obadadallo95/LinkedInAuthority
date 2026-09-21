/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DraftsDashboard } from '../../src/components/DraftsDashboard';
import { DraftConflictError, firestoreService } from '../../src/services/firestoreService';

vi.mock('../../src/application/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1', getIdToken: vi.fn() } }),
}));

vi.mock('../../src/services/firestoreService', () => ({
  DraftConflictError: class DraftConflictError extends Error {
    currentRevision: number;
    constructor(currentRevision: number) {
      super('conflict');
      this.currentRevision = currentRevision;
    }
  },
  firestoreService: {
    getUserDrafts: vi.fn(),
    updateDraft: vi.fn(),
  },
}));

vi.mock('../../src/utils/productTelemetry', () => ({
  recordAuthenticatedProductEvent: vi.fn(),
}));

vi.mock('../../src/utils/e2e', () => ({ isBrowserE2E: false }));

describe('DraftsDashboard', () => {
  it('shows a recoverable load error instead of an empty-state lie', async () => {
    vi.mocked(firestoreService.getUserDrafts).mockReset();
    vi.mocked(firestoreService.getUserDrafts).mockRejectedValueOnce(new Error('fixture unavailable'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<DraftsDashboard lang="en" />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Drafts could not be loaded'));
    expect(screen.getByText('Your drafts were not deleted. Check the connection and try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('shows local and latest versions when an autosave detects a conflict', async () => {
    vi.mocked(firestoreService.getUserDrafts).mockReset();
    vi.mocked(firestoreService.updateDraft).mockReset();
    const draft = {
      id: 'draft-1',
      title: 'Release update',
      projectId: 'owner_repo',
      type: 'repo_analysis',
      content: JSON.stringify({ post: 'Original post' }),
      revision: 1,
      createdAt: { toMillis: () => 10 },
    } as any;
    const latestDraft = { ...draft, content: JSON.stringify({ post: 'Server post' }), revision: 2 };
    vi.mocked(firestoreService.getUserDrafts).mockResolvedValue([draft]);
    vi.mocked(firestoreService.updateDraft).mockRejectedValueOnce(new DraftConflictError(2));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<DraftsDashboard lang="en" />);
    await waitFor(() => expect(screen.getByText('Release update')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const editor = await screen.findByRole('textbox', { name: 'Draft post' });
    vi.mocked(firestoreService.getUserDrafts).mockResolvedValue([latestDraft]);
    fireEvent.change(editor, { target: { value: 'Local post' } });

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Draft version conflict'), { timeout: 2500 });
    expect(screen.getByLabelText('Your current edits')).toHaveValue('Local post');
    expect(screen.getByLabelText('Latest saved version')).toHaveValue('Server post');
    expect(screen.getByRole('button', { name: 'Keep my edits' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Use latest version' })).toBeEnabled();
    errorSpy.mockRestore();
  });
});
