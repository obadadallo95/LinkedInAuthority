/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from '../../src/components/SettingsPanel';

const { authUser } = vi.hoisted(() => ({
  authUser: { uid: 'user-1', getIdToken: vi.fn().mockResolvedValue('id-token') },
}));

vi.mock('../../src/infrastructure/firebase/config', () => ({
  auth: { currentUser: authUser },
  githubProvider: {},
}));

vi.mock('firebase/auth', () => ({
  linkWithPopup: vi.fn(),
  GithubAuthProvider: { credentialFromResult: vi.fn() },
}));

vi.mock('../../src/infrastructure/firebase/firestoreClient', () => ({
  loadFirestoreClient: vi.fn(),
}));

vi.mock('../../src/services/githubService', () => ({
  addConnectionLog: vi.fn(),
  getConnectionLogs: vi.fn(() => []),
  subscribeToLogs: vi.fn(() => () => undefined),
}));

describe('SettingsPanel account export', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('confirms a successful data export in the selected locale', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['{}'], { type: 'application/json' })),
    }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:account-export');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(
      <SettingsPanel
        lang="de"
        settings={{}}
        handleDisconnect={vi.fn()}
        handleOpenLegal={vi.fn()}
        handleDeleteAccount={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Meine Daten exportieren' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Datenexport wurde zum Download vorbereitet'));
    expect(fetch).toHaveBeenCalledWith('/api/account/export', { headers: { Authorization: 'Bearer id-token' } });
  });
});
