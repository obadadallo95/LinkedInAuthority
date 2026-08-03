/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RepositoriesDashboard } from '../../src/components/RepositoriesDashboard';

// Mock IntersectionObserver and scrollIntoView
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver as any;
Element.prototype.scrollIntoView = vi.fn();

const mockProps = {
  lang: 'en' as const,
  repos: [
    { id: 1, name: 'repo-one', description: 'First repo', updated_at: '2023-01-01', stargazers_count: 10, size: 1024, language: 'TypeScript' },
    { id: 2, name: 'repo-two', description: 'Second repo', updated_at: '2023-02-01', stargazers_count: 20, size: 2048, language: 'Python' }
  ],
  loadingRepos: false,
  repoSearch: '',
  setRepoSearch: vi.fn(),
  sortBy: 'date' as const,
  setSortBy: vi.fn(),
  fetchRepos: vi.fn(),
  selectedRepo: null,
  setSelectedRepo: vi.fn(),
  handleAnalyzeRepo: vi.fn(),
  analyzingRepo: false,
  progressStages: ['Analyzing'],
  analysisStage: 0,
  settings: { githubUsername: 'testuser', githubToken: 'token' },
  setActiveTab: vi.fn(),
  branches: { 'repo-one': [{ name: 'main' }] },
  loadingBranchesFor: null,
  selectedBranches: { 'repo-one': 'main' },
  setSelectedBranches: vi.fn(),
  commits: {},
  loadingCommitsFor: null,
  readmePreviews: {},
  loadingReadmePreview: {},
  posts: []
};

describe('RepositoriesDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a list of repositories', () => {
    render(<MemoryRouter><RepositoriesDashboard {...mockProps} /></MemoryRouter>);
    expect(screen.getByText('repo-one')).toBeInTheDocument();
    expect(screen.getByText('repo-two')).toBeInTheDocument();
  });

  it('filters repositories by search input', () => {
    const props = { ...mockProps, repoSearch: 'one' };
    render(<MemoryRouter><RepositoriesDashboard {...props} /></MemoryRouter>);
    expect(screen.getByText('repo-one')).toBeInTheDocument();
    expect(screen.queryByText('repo-two')).not.toBeInTheDocument();
  });

  it('shows please connect message if no githubUsername is provided and not demo mode', () => {
    const props = { ...mockProps, settings: {} };
    render(<MemoryRouter><RepositoriesDashboard {...props} /></MemoryRouter>);
    expect(screen.getByText(/Connect your account to browse real repositories/i)).toBeInTheDocument();
  });
});
