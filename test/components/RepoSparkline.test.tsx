import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepoSparkline } from '../../src/components/RepoSparkline';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver as any;

describe('RepoSparkline Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a loading pulse state initially', () => {
    const { container } = render(<RepoSparkline username="testuser" repo="testrepo" token="" />);
    const pulseDiv = container.querySelector('.animate-pulse');
    expect(pulseDiv).toBeInTheDocument();
  });
});
