import React, { createContext, useState, ReactNode, useContext } from 'react';
import { Post } from '../types/Post';
import { format, subDays } from 'date-fns';
import { useApp } from './AppContext';

interface BoardContextType {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  addPost: (newPost: Omit<Post, 'id' | 'date' | 'authorId'>, authorId: string) => void; // 1. authorId 파라미터 추가
  updatePost: (updatedPost: Post) => void;
  updatePinStatus: (postId: string, isPinned: boolean) => void;
  deletePost: (postId: string) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};

interface BoardProviderProps {
  children: ReactNode;
}

const initialPosts: Post[] = [
    { id: '1', authorId: 'mjkim', category: 'NOTICE', title: 'boardDummy3Title', date: format(subDays(new Date(), 1), 'yyyy.MM.dd'), content: 'boardDummy3Content', badge: 'badgeImportant', isPinned: true },
    { id: '2', authorId: 'mjkim', category: 'MENU', title: 'boardDummy1Title', date: format(subDays(new Date(), 2), 'yyyy.MM.dd'), content: 'boardDummy1Content', badge: 'badgeNew', isPinned: false },
    { id: '3', authorId: 'admin', category: 'NOTICE', title: 'boardDummy2Title', date: format(subDays(new Date(), 5), 'yyyy.MM.dd'), content: 'boardDummy2Content', badge: null, isPinned: false },
    { id: '4', authorId: 'admin', category: 'MANUAL', title: 'boardDummy4Title', date: format(subDays(new Date(), 10), 'yyyy.MM.dd'), content: 'boardDummy4Content', badge: null, isPinned: false },
    { id: '5', authorId: 'admin', category: 'EVENT', title: 'boardDummy5Title', date: format(subDays(new Date(), 12), 'yyyy.MM.dd'), content: 'boardDummy5Content', badge: null, isPinned: false },
    { id: '6', authorId: 'admin', category: 'NOTICE', title: 'boardDummy6Title', date: format(subDays(new Date(), 15), 'yyyy.MM.dd'), content: 'boardDummy6Content', badge: null, isPinned: false },
];

export const BoardProvider = ({ children }: BoardProviderProps) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const addPost = (newPostData: Omit<Post, 'id' | 'date' | 'authorId'>, authorId: string) => { // 2. authorId 받기
    const newPost: Post = {
      ...newPostData,
      id: Date.now().toString(),
      date: format(new Date(), 'yyyy.MM.dd'),
      authorId: authorId, // 3. 하드코딩된 값 대신 파라미터 사용
    };
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const updatePost = (updatedPost: Post) => {
    setPosts(prevPosts =>
      prevPosts.map(p => (p.id === updatedPost.id ? updatedPost : p))
    );
  };

  const updatePinStatus = (postId: string, isPinned: boolean) => {
    setPosts(prevPosts =>
      prevPosts.map(p => (p.id === postId ? { ...p, isPinned } : p))
    );
  };

  const deletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const value = {
    posts,
    setPosts,
    addPost,
    updatePost,
    updatePinStatus,
    deletePost,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};