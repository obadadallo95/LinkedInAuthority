import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../application/AuthContext';
import { loadFirestoreClient } from '../infrastructure/firebase/firestoreClient';
import { isBrowserE2E } from '../utils/e2e';

function readE2ECollection<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[]; } catch { return []; }
}

function writeE2ECollection<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export interface Post {
  id: string;
  repoName: string;
  text: string;
  suggestedComment?: string;
  originalText?: string;
  status: 'draft' | 'template' | 'failed';
  createdAt: string;
  publishTime?: string;
  scheduledAt?: string;
  cardConfig?: any;
}

export interface PostsContextType {
  posts: Post[];
  loadingPosts: boolean;
  postsError: boolean;
  updatePostText: (postId: string, newText: string) => Promise<void>;
  updateCardConfig: (postId: string, field: string, val: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  saveAsTemplate: (post: Post) => Promise<void>;
  useTemplate: (template: Post) => Promise<void>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setPosts([]);
      setLoadingPosts(false);
      setPostsError(false);
      return;
    }

    if (isBrowserE2E) {
      setPosts([]);
      setLoadingPosts(false);
      setPostsError(false);
      return;
    }

    setLoadingPosts(true);
    setPostsError(false);
    let cancelled = false;
    let unsubscribe = () => {};
    void loadFirestoreClient().then(({ db, collection, onSnapshot, query, orderBy, limit }) => {
      if (cancelled) return;
      const postsRef = collection(db, "users", user.uid, "posts");
      const postsQuery = query(postsRef, orderBy('createdAt', 'desc'), limit(25));
      unsubscribe = onSnapshot(postsQuery, (querySnap) => {
        const list: Post[] = [];
        querySnap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Post);
        });
        list.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setPosts(list);
        setLoadingPosts(false);
        setPostsError(false);
      }, (error) => {
        console.error("Posts listener error:", error);
        setLoadingPosts(false);
        setPostsError(true);
      });
    }).catch((error) => {
      if (cancelled) return;
      console.error("Posts client load error:", error);
      setLoadingPosts(false);
      setPostsError(true);
    });

    return () => { cancelled = true; unsubscribe(); };
  }, [user?.uid]);

  const updatePostText = async (postId: string, newText: string) => {
    if (!user?.uid) return;
    const { db, doc, updateDoc } = await loadFirestoreClient();
    const postRef = doc(db, "users", user.uid, "posts", postId);
    await updateDoc(postRef, {
      text: newText,
      updatedAt: new Date().toISOString()
    });
  };

  const updateCardConfig = async (postId: string, field: string, val: string) => {
    if (!user?.uid) return;
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;
    const { db, doc, updateDoc } = await loadFirestoreClient();
    const postRef = doc(db, "users", user.uid, "posts", postId);
    const newConfig = { ...(currentPost.cardConfig || {}), [field]: val };
    await updateDoc(postRef, {
      cardConfig: newConfig,
      updatedAt: new Date().toISOString()
    });
  };

  const deletePost = async (postId: string) => {
    if (!user?.uid) return;
    const { db, doc, deleteDoc } = await loadFirestoreClient();
    const postRef = doc(db, "users", user.uid, "posts", postId);
    await deleteDoc(postRef);
  };

  const saveAsTemplate = async (post: Post) => {
    if (!user?.uid) return;
    if (isBrowserE2E) {
      const templateId = `e2e-template-${Date.now()}`;
      const posts = readE2ECollection<any>('linkedin-e2e-posts');
      writeE2ECollection('linkedin-e2e-posts', [...posts, {
        id: templateId,
        repoName: post.repoName || 'Template',
        text: post.text,
        status: 'template',
        createdAt: new Date().toISOString(),
        cardConfig: post.cardConfig || {},
      }]);
      return;
    }
    const { db, collection, addDoc } = await loadFirestoreClient();
    const postsRef = collection(db, "users", user.uid, "posts");
    await addDoc(postsRef, {
      repoName: post.repoName || "Template",
      text: post.text,
      status: 'template',
      createdAt: new Date().toISOString(),
      cardConfig: post.cardConfig || {
        title: "New Template",
        subtitle: "Template Subtitle",
        tech: "React, TypeScript",
        theme: "dark"
      }
    });
  };

  const useTemplate = async (template: Post) => {
    if (!user?.uid) return;
    const { firestoreService } = await import('../services/firestoreService');
    await firestoreService.saveDraft(user.uid, {
      projectId: 'template-library',
      type: 'repo_analysis',
      title: template.repoName || 'Template Draft',
      content: JSON.stringify({ post: template.text, source: 'template-library' }),
      status: 'draft',
    });
  };

  return (
    <PostsContext.Provider value={{
      posts,
      loadingPosts,
      postsError,
      updatePostText,
      updateCardConfig,
      deletePost,
      saveAsTemplate,
      useTemplate
    }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error("usePosts must be used within a PostsProvider");
  }
  return context;
}
