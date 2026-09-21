/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutomationsDashboard } from '../../src/components/AutomationsDashboard';
import { firestoreService } from '../../src/services/firestoreService';

vi.mock('../../src/application/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user-1', getIdToken: vi.fn().mockResolvedValue('fixture-token') },
  }),
}));

vi.mock('../../src/services/firestoreService', () => ({
  firestoreService: {
    getUserProjects: vi.fn(),
    saveProject: vi.fn(),
    updateProject: vi.fn(),
  },
}));

vi.mock('../../src/utils/e2e', () => ({ isBrowserE2E: false }));

describe('AutomationsDashboard', () => {
  beforeEach(() => {
    vi.mocked(firestoreService.getUserProjects).mockReset();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ runs: [] }),
    }));
  });

  it('shows a recoverable load error and retries without hiding the failure', async () => {
    vi.mocked(firestoreService.getUserProjects).mockRejectedValue(new Error('fixture unavailable'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AutomationsDashboard lang="en" repos={[]} />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Automations could not be loaded'));
    const callsBeforeRetry = vi.mocked(firestoreService.getUserProjects).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(vi.mocked(firestoreService.getUserProjects).mock.calls.length).toBeGreaterThan(callsBeforeRetry));

    errorSpy.mockRestore();
  });

  it('gives an empty workspace a clear next action', async () => {
    vi.mocked(firestoreService.getUserProjects).mockResolvedValue([]);

    render(<AutomationsDashboard lang="en" repos={[]} />);

    await waitFor(() => expect(screen.getByText('No Active Automations')).toBeInTheDocument());
    expect(screen.getAllByRole('button', { name: 'Create New Automation' })).toHaveLength(2);
  });
});
