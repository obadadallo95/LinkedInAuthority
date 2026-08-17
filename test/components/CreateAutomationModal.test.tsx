/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateAutomationModal } from '../../src/components/CreateAutomationModal';

const sampleRepos = [
  {
    name: 'linkedin-auth-engine',
    full_name: 'acme-corp/linkedin-auth-engine',
    owner: { login: 'acme-corp' },
    description: 'An AI engine for LinkedIn'
  },
  {
    name: 'keyfixer-tool',
    full_name: 'developer123/keyfixer-tool',
    owner: { login: 'developer123' },
    description: 'Keyboard layout fixer'
  }
];

describe('CreateAutomationModal Repository Identity Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders repo list and preserves explicit owner, repo, and fullName on save', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <CreateAutomationModal
        isOpen={true}
        onClose={handleClose}
        lang="en"
        repos={sampleRepos}
        onSave={handleSave}
      />
    );

    // Verify repo item is displayed with full_name
    expect(screen.getByText('acme-corp/linkedin-auth-engine')).toBeInTheDocument();

    // Select the repository
    fireEvent.click(screen.getByText('acme-corp/linkedin-auth-engine'));

    // Click Save Automation button
    const saveButton = screen.getByRole('button', { name: /save automation/i });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
    });

    const savedPayload = handleSave.mock.calls[0][0];
    expect(savedPayload.owner).toBe('acme-corp');
    expect(savedPayload.repo).toBe('linkedin-auth-engine');
    expect(savedPayload.fullName).toBe('acme-corp/linkedin-auth-engine');
    expect(savedPayload.active).toBe(true);
    expect(savedPayload.owner).not.toBe('');
  });

  it('filters repositories by full name or name and maintains accurate owner selection', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <CreateAutomationModal
        isOpen={true}
        onClose={handleClose}
        lang="en"
        repos={sampleRepos}
        onSave={handleSave}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search repositories/i);
    fireEvent.change(searchInput, { target: { value: 'keyfixer' } });

    expect(screen.getByText('developer123/keyfixer-tool')).toBeInTheDocument();
    expect(screen.queryByText('acme-corp/linkedin-auth-engine')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('developer123/keyfixer-tool'));

    const saveButton = screen.getByRole('button', { name: /save automation/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
    });

    const savedPayload = handleSave.mock.calls[0][0];
    expect(savedPayload.owner).toBe('developer123');
    expect(savedPayload.repo).toBe('keyfixer-tool');
    expect(savedPayload.fullName).toBe('developer123/keyfixer-tool');
  });
});
