/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostsHub } from '../../src/components/PostsHub';

// Mock child components if they are too complex
vi.mock('../../src/components/Drafts/PostEditor', () => ({
  PostEditor: () => <div data-testid="post-editor-mock">Post Editor</div>
}));
vi.mock('../../src/components/Drafts/LivePreviewPane', () => ({
  LivePreviewPane: () => <div data-testid="live-preview-mock">Live Preview</div>
}));
vi.mock('../../src/components/Drafts/SocialShareCard', () => ({
  SocialShareCard: () => <div data-testid="social-share-card-mock">Social Share Card</div>
}));

const mockProps = {
  lang: 'en' as const,
  posts: [
    { 
      id: 'post-1', 
      text: 'Hello LinkedIn', 
      status: 'draft', 
      createdAt: '2023-01-01', 
      aiModel: 'gemini-1.5-flash', 
      generatedFrom: 'repo',
      cardConfig: { colorTheme: 'indigo', cardStyle: 'modern' }
    }
  ],
  activePostId: null,
  setActivePostId: vi.fn(),
  handleUpdatePostText: vi.fn(),
  handleUpdateCardConfig: vi.fn(),
  settings: {},
  showToast: vi.fn(),
  handleApplyPresetTime: vi.fn(),
  scheduleDate: '',
  setScheduleDate: vi.fn(),
  scheduleTime: '',
  setScheduleTime: vi.fn(),
  handleSchedulePost: vi.fn(),
  handleCancelSchedule: vi.fn(),
  handlePublishNow: vi.fn(),
  handleDeletePost: vi.fn()
};

describe('PostsHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no posts exist', () => {
    render(<PostsHub {...mockProps} posts={[]} />);
    expect(screen.getByText(/No drafts available/i)).toBeInTheDocument();
  });

  it('renders post list when posts exist', () => {
    render(<PostsHub {...mockProps} />);
    expect(screen.getAllByText('Hello LinkedIn')[0]).toBeInTheDocument();
  });

  it('calls setActivePostId when a post is clicked', () => {
    render(<PostsHub {...mockProps} />);
    const postItem = screen.getAllByText('Hello LinkedIn')[0].closest('button');
    if (postItem) {
      fireEvent.click(postItem);
    }
    expect(mockProps.setActivePostId).toHaveBeenCalledWith('post-1');
  });

  it('renders editor and preview panes when a post is active', () => {
    const props = { ...mockProps, activePostId: 'post-1' };
    render(<PostsHub {...props} />);
    
    // Check if the mocked components rendered
    expect(screen.getByTestId('post-editor-mock')).toBeInTheDocument();
    expect(screen.getByTestId('social-share-card-mock')).toBeInTheDocument();
  });

  it('shows confirmation modal before publishing', () => {
    const props = { 
      ...mockProps, 
      activePostId: 'post-1', 
      settings: { linkedinToken: 'fake-token' } 
    };
    render(<PostsHub {...props} />);
    
    // Click Publish Now
    const publishBtn = screen.getByText('Publish Live to LinkedIn 🚀');
    fireEvent.click(publishBtn);
    
    // Modal should appear
    expect(screen.getByText('Publish Content Now?')).toBeInTheDocument();
    
    // Click Confirm Publish (it uses the same text as the main button, so we get the second one)
    const confirmBtns = screen.getAllByText('Publish Live to LinkedIn 🚀');
    fireEvent.click(confirmBtns[1]);
    
    expect(mockProps.handlePublishNow).toHaveBeenCalled();
  });
});
