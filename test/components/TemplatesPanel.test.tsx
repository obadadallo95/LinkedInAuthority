/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TemplatesPanel } from '../../src/components/TemplatesPanel';

function renderTemplates(overrides: Partial<React.ComponentProps<typeof TemplatesPanel>> = {}) {
  return render(
    <TemplatesPanel
      lang="en"
      posts={[]}
      handleUseTemplate={vi.fn().mockResolvedValue(undefined)}
      handleDeletePost={vi.fn().mockResolvedValue(undefined)}
      setActiveTab={vi.fn()}
      showToast={vi.fn()}
      {...overrides}
    />,
  );
}

describe('TemplatesPanel page contract', () => {
  it('allows keyboard users to select a template and keeps the action accessible', () => {
    renderTemplates();

    const template = screen.getByRole('button', { name: 'Technical Deep Dive 🛠️' });
    fireEvent.keyDown(template, { key: 'Enter' });

    expect(template).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Use Template & Create Draft' })).toBeInTheDocument();
  });

  it('shows a recoverable inline error when creating a draft from a template fails', async () => {
    const handleUseTemplate = vi.fn().mockRejectedValue(new Error('fixture failure'));
    renderTemplates({ handleUseTemplate });

    fireEvent.click(screen.getByRole('button', { name: 'Use Template & Create Draft' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The template action could not be completed. Try again.');
    expect(handleUseTemplate).toHaveBeenCalledTimes(1);
  });
});
