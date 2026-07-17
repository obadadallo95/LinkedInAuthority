/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PostEditor } from '../../src/components/Drafts/PostEditor';

// Mock fetch
global.fetch = vi.fn();

const mockProps = {
  lang: 'en' as const,
  currentPost: {
    id: 'post-1',
    text: 'Hello world! This is a test post.',
    status: 'draft',
    originalText: 'Original text before edits.',
    createdAt: '2023-01-01',
    aiModel: 'gemini-1.5-flash',
    generatedFrom: 'repo',
  },
  handleUpdatePostText: vi.fn(),
  settings: {},
  showToast: vi.fn(),
};

describe('PostEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with currentPost text', () => {
    render(<PostEditor {...mockProps} />);
    expect(screen.getByDisplayValue('Hello world! This is a test post.')).toBeInTheDocument();
  });

  it('updates localText and triggers auto-save', async () => {
    render(<PostEditor {...mockProps} />);
    const textarea = screen.getByDisplayValue('Hello world! This is a test post.');
    
    fireEvent.change(textarea, { target: { value: 'Updated text!' } });
    expect(screen.getByDisplayValue('Updated text!')).toBeInTheDocument();
    
    // Auto-save triggers after 800ms
    act(() => {
      vi.advanceTimersByTime(800);
    });
    
    expect(mockProps.handleUpdatePostText).toHaveBeenCalledWith('Updated text!');
  });

  it('shows restore original text button and handles restore', () => {
    render(<PostEditor {...mockProps} />);
    // Since currentPost.text != currentPost.originalText, the restore button should appear
    const restoreBtn = screen.getByTitle('Restore Original AI Text');
    expect(restoreBtn).toBeInTheDocument();

    // Mock confirm dialog
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    fireEvent.click(restoreBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockProps.handleUpdatePostText).toHaveBeenCalledWith('Original text before edits.');
    expect(mockProps.showToast).toHaveBeenCalled();
    
    confirmSpy.mockRestore();
  });

  it('generates smart hashtags successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hashtags: ['#test', '#linkedin'] }),
    });

    render(<PostEditor {...mockProps} />);
    
    // Find the Generate Smart Hashtags button (title or text might vary, we can search by text or test id if available, but let's look at the component)
    // Wait, the button is "Smart Hashtag Generator (Recommended)"
    const tagsBtn = screen.getByText('Smart Hashtag Generator (Recommended)');
    fireEvent.click(tagsBtn);

    expect(global.fetch).toHaveBeenCalledWith('/api/generate-hashtags', expect.any(Object));

    // Await state updates
    await act(async () => {
      // Advance timers if necessary or just let promises resolve
      await Promise.resolve();
    });

    expect(mockProps.handleUpdatePostText).toHaveBeenCalledWith('Hello world! This is a test post.\n\n#test #linkedin');
    expect(mockProps.showToast).toHaveBeenCalledWith('Smart hashtags added!');
  });

  it('handles optimization', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ optimizedText: 'This is the optimized text.' }),
    });

    render(<PostEditor {...mockProps} />);
    
    // Assuming there is an "Engaging" or similar button that calls handleOptimize('hook')
    const optimizeBtn = screen.getByText('Punchy Opening Hook'); // Needs to match actual UI text
    fireEvent.click(optimizeBtn);

    expect(global.fetch).toHaveBeenCalledWith('/api/optimize-post', expect.objectContaining({
      body: expect.stringContaining('"actionType":"hook"')
    }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockProps.handleUpdatePostText).toHaveBeenCalledWith('This is the optimized text.');
  });
});
