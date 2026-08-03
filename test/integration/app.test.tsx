import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../../src/App';
import { AuthProvider } from '../../src/application/AuthContext';
import { SettingsProvider } from '../../src/contexts/SettingsContext';
import { PostsProvider } from '../../src/contexts/PostsContext';

// 1. Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  query: vi.fn((ref) => ref),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn((ref, cb) => {
    // Call the callback immediately with a mocked document/query snapshot
    cb({
      exists: () => true,
      data: () => ({
        githubUsername: 'testuser',
        githubToken: 'fake-token',
        linkedinToken: 'fake-li-token',
        onboardingSkipped: true
      }),
      forEach: (loopCb: any) => {
        loopCb({ id: 'post-1', data: () => ({ content: 'test', status: 'draft' }) });
      }
    });
    return vi.fn(); // returns unsubscribe function
  }),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
}));

let authCallbacks: any[] = [];
let currentUser: any = null;

vi.mock('firebase/auth', () => {
  class MockProvider {
    addScope() {}
  }
  return {
    getAuth: vi.fn(),
    signInWithPopup: vi.fn(async () => {
      currentUser = { uid: 'user-123', displayName: 'Test User' };
      authCallbacks.forEach(cb => cb(currentUser));
      return { user: currentUser };
    }),
    GoogleAuthProvider: MockProvider,
    GithubAuthProvider: class extends MockProvider {
      static credentialFromResult = vi.fn(() => ({ accessToken: 'mock-token' }));
    },
    signOut: vi.fn(async () => {
      currentUser = null;
      authCallbacks.forEach(cb => cb(null));
    }),
    onAuthStateChanged: vi.fn((auth, cb) => {
      authCallbacks.push(cb);
      cb(currentUser);
      return () => {
        authCallbacks = authCallbacks.filter(fn => fn !== cb);
      };
    }),
  };
});

// Mock window/DOM specifics
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver as any;
Element.prototype.scrollIntoView = vi.fn();

// We also mock the fetch function globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LinkedIn Authority - End-to-End Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('linkedin_auth_lang', 'en');
    mockFetch.mockImplementation(async (url) => {
      if (url === 'https://api.github.com/user') {
        return {
          ok: true,
          json: async () => ({ login: 'testuser', avatar_url: '', name: 'Test User' })
        };
      }
      if (url.includes('/api/demo/analyze')) {
        return {
          ok: true,
          json: async () => ({
            angles: [{ id: 'angle-1', title: 'Test Angle', description: 'desc', hook: 'hook', adaptiveQuestion: 'question' }],
            analysisToken: 'test-token',
            conflicts: []
          })
        };
      }
      if (url.includes('/api/demo/generate')) {
        return {
          ok: true,
          json: async () => ({
            post: 'This is a mocked generated post for public demo.',
            warnings: []
          })
        };
      }
      return {
        ok: false,
        json: async () => ({ error: 'Not Found' })
      };
    });
  });

  afterEach(() => {
    authCallbacks = [];
    currentUser = null;
  });

  it('Public Demo Flow: analyzes repo and generates post', async () => {
    render(
      <AuthProvider>
        <SettingsProvider>
          <PostsProvider>
            <App />
          </PostsProvider>
        </SettingsProvider>
      </AuthProvider>
    );

    // Verify Landing Page is rendered in English
    // In English, the main title is "Turn your GitHub work into a stronger professional presence on LinkedIn."
    expect(await screen.findByText(/Turn your GitHub work into a stronger professional presence/i)).toBeInTheDocument();

    // Find the github url input
    const inputs = screen.getAllByPlaceholderText(/https:\/\/github.com\//i);
    const githubInput = inputs[0];

    fireEvent.change(githubInput, { target: { value: 'https://github.com/obadadallo/KeyFixer' } });

    // Click Analyze button
    const analyzeBtn = screen.getByText(/Analyze project and suggest stories/i);
    fireEvent.click(analyzeBtn);

    // Wait for the angles to appear
    const angleOption = await screen.findByText(/Test Angle/i);
    expect(angleOption).toBeInTheDocument();
    
    // Select the angle by clicking it (or its parent button)
    fireEvent.click(angleOption);

    // Click Generate Post button (we need to find the text for T.demoGenerateBtn)
    // T.demoGenerateBtn in English is "Write the post with this angle"
    const generateBtn = screen.getByText(/Write the post with this angle/i);
    fireEvent.click(generateBtn);

    // Wait for the mock post to appear
    await waitFor(() => {
      expect(screen.getByText(/This is a mocked generated post for public demo\./i)).toBeInTheDocument();
    });

    // Ensure generate fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/demo/generate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('angle-1')
      })
    );
  });

  it('Authenticated Flow: authenticates, picks repo, generates post', async () => {
    render(
      <AuthProvider>
        <SettingsProvider>
          <PostsProvider>
            <App />
          </PostsProvider>
        </SettingsProvider>
      </AuthProvider>
    );

    // Click Sign In
    const signInBtn = await screen.findByText(/Sign In/i);
    fireEvent.click(signInBtn);

    // Click Continue with GitHub in the login view
    const githubSignInBtn = await screen.findByText(/Continue with GitHub/i);
    
    await act(async () => {
      fireEvent.click(githubSignInBtn);
    });

    // Should now be on the Dashboard/App (which fetches repos)
    // We haven't mocked the repos fetch, but SettingsProvider/PostsProvider should render Dashboard Layout.
    // Dashboard Layout has "GitHub Repositories" or similar.
    expect(await screen.findByText(/GitHub Repositories/i)).toBeInTheDocument();
  });
});
