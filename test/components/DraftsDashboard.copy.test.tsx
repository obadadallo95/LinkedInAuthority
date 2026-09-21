/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DraftsDashboard } from '../../src/components/DraftsDashboard';
import { firestoreService } from '../../src/services/firestoreService';

vi.mock('../../src/application/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1', getIdToken: vi.fn() } }),
}));

vi.mock('../../src/services/firestoreService', () => ({
  DraftConflictError: class DraftConflictError extends Error {},
  firestoreService: { getUserDrafts: vi.fn(), updateDraft: vi.fn() },
}));

vi.mock('../../src/utils/productTelemetry', () => ({ recordAuthenticatedProductEvent: vi.fn() }));
vi.mock('../../src/utils/e2e', () => ({ isBrowserE2E: false }));

describe('DraftsDashboard copy recovery', () => {
  it('does not claim success when the clipboard rejects', async () => {
    vi.mocked(firestoreService.getUserDrafts).mockReset();
    vi.mocked(firestoreService.getUserDrafts).mockResolvedValue([{
      id: 'draft-1', title: 'Release update', projectId: 'owner_repo', type: 'repo_analysis',
      content: JSON.stringify({ post: 'A grounded draft.' }), createdAt: { toMillis: () => 10 },
    }] as any);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('clipboard unavailable')) },
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<DraftsDashboard lang="en" />);
    await waitFor(() => expect(screen.getByText('Release update')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Copy failed. Please copy the text manually from the preview.'));
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
