/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FloatingHelpWidget } from '../../src/components/FloatingHelpWidget';

describe('FloatingHelpWidget locale and accessibility contract', () => {
  it('renders German help controls and exposes expanded FAQ state', () => {
    render(<FloatingHelpWidget lang="de" />);

    const openButton = screen.getByRole('button', { name: 'Hilfe- und FAQ-Zentrum öffnen' });
    expect(openButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(openButton);

    expect(screen.getByText('Support-Assistent')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Antworten suchen …')).toBeInTheDocument();
    const faqButton = screen.getAllByRole('button').find((button) => button.hasAttribute('aria-controls'));
    expect(faqButton).toBeDefined();
    expect(faqButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(faqButton!);
    expect(faqButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Hilfezentrum schließen' })).toBeInTheDocument();
  });
});
