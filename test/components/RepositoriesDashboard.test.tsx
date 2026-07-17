/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    render(<RepositoriesDashboard {...mockProps} />);
    expect(screen.getByText('repo-one')).toBeInTheDocument();
    expect(screen.getByText('repo-two')).toBeInTheDocument();
  });

  it('filters repositories by search input', () => {
    const props = { ...mockProps, repoSearch: 'one' };
    render(<RepositoriesDashboard {...props} />);
    expect(screen.getByText('repo-one')).toBeInTheDocument();
    expect(screen.queryByText('repo-two')).not.toBeInTheDocument();
  });

  it('toggles repository expansion', () => {
    const { container } = render(<RepositoriesDashboard {...mockProps} />);
    
    const repoCard = container.querySelector('#repo-card-repo-one');
    expect(repoCard).toBeInTheDocument();
    
    const cardHeader = repoCard?.querySelector('.cursor-pointer');
    fireEvent.click(cardHeader as Element);
    
    expect(mockProps.setSelectedRepo).toHaveBeenCalledWith('repo-one');
  });

  it('can check multiple repositories for batch actions', () => {
    const { container } = render(<RepositoriesDashboard {...mockProps} />);
    
    const checkbox1 = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox1);
    
    expect(screen.getByText(/selected/i)).toBeInTheDocument();
    expect(screen.getByText(/Batch Analyze/i)).toBeInTheDocument();
  });

  it('shows please connect message if no githubUsername is provided and not demo mode', () => {
    const props = { ...mockProps, settings: {} };
    render(<RepositoriesDashboard {...props} />);
    expect(screen.getByText(/Please connect your GitHub account/i)).toBeInTheDocument();
  });

  it('handles smart generate click when expanded', () => {
    const props = { ...mockProps, selectedRepo: 'repo-one' };
    const { getByText } = render(<RepositoriesDashboard {...props} />);
    
    const smartGenerateBtn = getByText('Smart Generate');
    fireEvent.click(smartGenerateBtn);
    
    expect(mockProps.handleAnalyzeRepo).toHaveBeenCalledWith(
      ['repo-one'], 
      'main', 
      'Technical',
      undefined, 
      expect.any(Object)
    );
  });
});
