/// <reference types="@testing-library/jest-dom" />
import React, { useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostsProvider, usePosts } from '../../src/contexts/PostsContext';
import { useAuth } from '../../src/application/AuthContext';
import * as firestore from 'firebase/firestore';

// Mock useAuth
vi.mock('../../src/application/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock('../../src/infrastructure/firebase/config', () => ({
  db: {},
}));

const TestComponent = () => {
  const { posts, loadingPosts, updatePostText, deletePost } = usePosts();
  return (
    <div>
      <div data-testid="loading">{loadingPosts ? 'Loading' : 'Loaded'}</div>
      <div data-testid="posts-count">{posts.length}</div>
      <button onClick={() => updatePostText('post-1', 'New Text')}>Update Post</button>
      <button onClick={() => deletePost('post-1')}>Delete Post</button>
    </div>
  );
};

describe('PostsContext', () => {
  let mockUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe = vi.fn();
    (firestore.onSnapshot as any).mockImplementation((ref: any, callback: any) => {
      // Don't call immediately, let tests control it
      return mockUnsubscribe;
    });
  });

  it('provides empty posts and stops loading if no user', () => {
    (useAuth as any).mockReturnValue({ user: null });

    render(
      <PostsProvider>
        <TestComponent />
      </PostsProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    expect(screen.getByTestId('posts-count')).toHaveTextContent('0');
  });

  it('subscribes to posts when user is present', () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-123' } });

    render(
      <PostsProvider>
        <TestComponent />
      </PostsProvider>
    );

    expect(firestore.collection).toHaveBeenCalledWith(expect.anything(), 'users', 'user-123', 'posts');
    expect(firestore.onSnapshot).toHaveBeenCalled();
  });

  it('updates state when onSnapshot triggers', () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-123' } });

    let snapshotCallback: any;
    (firestore.onSnapshot as any).mockImplementation((ref: any, cb: any) => {
      snapshotCallback = cb;
      return mockUnsubscribe;
    });

    render(
      <PostsProvider>
        <TestComponent />
      </PostsProvider>
    );

    // Initial state before snapshot resolves might be loading=true
    
    // Trigger snapshot
    act(() => {
      const mockQuerySnap = {
        forEach: (cb: any) => {
          cb({ id: 'post-1', data: () => ({ text: 'Test Post', createdAt: '2023-01-01' }) });
        }
      };
      snapshotCallback(mockQuerySnap);
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    expect(screen.getByTestId('posts-count')).toHaveTextContent('1');
  });

  it('calls updateDoc when updatePostText is called', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-123' } });
    (firestore.doc as any).mockReturnValue('mock-doc-ref');

    render(
      <PostsProvider>
        <TestComponent />
      </PostsProvider>
    );

    const btn = screen.getByText('Update Post');
    await act(async () => {
      btn.click();
    });

    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-123', 'posts', 'post-1');
    expect(firestore.updateDoc).toHaveBeenCalledWith('mock-doc-ref', expect.objectContaining({
      text: 'New Text',
      updatedAt: expect.any(String),
    }));
  });

  it('calls deleteDoc when deletePost is called', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'user-123' } });
    (firestore.doc as any).mockReturnValue('mock-doc-ref');

    render(
      <PostsProvider>
        <TestComponent />
      </PostsProvider>
    );

    const btn = screen.getByText('Delete Post');
    await act(async () => {
      btn.click();
    });

    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-123', 'posts', 'post-1');
    expect(firestore.deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
  });
});
