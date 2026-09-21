import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { TermsOfService } from '../../src/components/TermsOfService';

describe('Terms of Service product boundary', () => {
  it.each([
    ['ar', 'للمسودات التقنية'],
    ['en', 'evidence-backed drafting workspace'],
    ['de', 'evidenzbasierte technische Entwürfe'],
  ] as const)('describes the review-first boundary in %s', (lang, expectedText) => {
    const { container } = render(<TermsOfService lang={lang} />);
    const text = container.textContent || '';
    expect(text).toContain(expectedText);
    expect(text).toMatch(/manual|يدوياً|manuellen/i);
  });

  it('does not describe LinkedIn scheduling or publishing as an implemented capability', () => {
    const { container } = render(<TermsOfService lang="en" />);
    const text = container.textContent || '';
    expect(text).toContain('not a LinkedIn publisher, scheduler');
    expect(text).not.toContain('Generate, schedule, or publish');
    expect(text).not.toContain('before authorizing its publication');
  });
});
