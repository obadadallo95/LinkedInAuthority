import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../application/AuthContext';
import { db } from '../infrastructure/firebase/config';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface Post {
  id: string;
  repoName: string;
  text: string;
  status: 'draft' | 'scheduled' | 'published' | 'template' | 'failed';
  createdAt: string;
  publishTime?: string;
  scheduledAt?: string;
  cardConfig?: any;
}

export interface PostsContextType {
  posts: Post[];
  loadingPosts: boolean;
  updatePostText: (postId: string, newText: string) => Promise<void>;
  updateCardConfig: (postId: string, field: string, val: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  schedulePost: (postId: string, timeVal: string) => Promise<void>;
  cancelSchedule: (postId: string) => Promise<void>;
  saveAsTemplate: (post: Post) => Promise<void>;
  useTemplate: (template: Post) => Promise<void>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setPosts([]);
      setLoadingPosts(false);
      return;
    }

    setLoadingPosts(true);
    const postsRef = collection(db, "users", user.uid, "posts");
    const unsubscribe = onSnapshot(postsRef, (querySnap) => {
      const list: Post[] = [];
      querySnap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Post);
      });
      // Sort posts by date descending
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setPosts(list);
      setLoadingPosts(false);
    }, (error) => {
      console.error("Posts listener error:", error);
      setLoadingPosts(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const updatePostText = async (postId: string, newText: string) => {
    if (!user?.uid) return;
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
    const postRef = doc(db, "users", user.uid, "posts", postId);
    const newConfig = { ...(currentPost.cardConfig || {}), [field]: val };
    await updateDoc(postRef, {
      cardConfig: newConfig,
      updatedAt: new Date().toISOString()
    });
  };

  const deletePost = async (postId: string) => {
    if (!user?.uid) return;
    const postRef = doc(db, "users", user.uid, "posts", postId);
    await deleteDoc(postRef);
  };

  const schedulePost = async (postId: string, timeVal: string) => {
    if (!user?.uid) return;
    const postRef = doc(db, "users", user.uid, "posts", postId);
    await updateDoc(postRef, {
      status: 'scheduled',
      scheduledAt: new Date(timeVal).toISOString(),
    });
  };

  const cancelSchedule = async (postId: string) => {
    if (!user?.uid) return;
    const postRef = doc(db, "users", user.uid, "posts", postId);
    await updateDoc(postRef, {
      status: 'draft',
      scheduledAt: null,
      publishTime: null,
    });
  };

  const saveAsTemplate = async (post: Post) => {
    if (!user?.uid) return;
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
    const postsRef = collection(db, "users", user.uid, "posts");
    await addDoc(postsRef, {
      repoName: "Template Draft",
      text: template.text,
      status: 'draft',
      createdAt: new Date().toISOString(),
      cardConfig: template.cardConfig || {}
    });
  };

  return (
    <PostsContext.Provider value={{
      posts,
      loadingPosts,
      updatePostText,
      updateCardConfig,
      deletePost,
      schedulePost,
      cancelSchedule,
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
