import React, { createContext, useState, ReactNode, useContext } from 'react';
import { Post } from '../types/Post';
import { format, subDays } from 'date-fns';

interface BoardContextType {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  addPost: (newPost: Omit<Post, 'id' | 'date' | 'authorId'>) => void;
  updatePost: (updatedPost: Post) => void;
  updatePinStatus: (postId: string, isPinned: boolean) => void;
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

const currentUserId = 'my_test_id'; // Or get from a user context

const initialPosts: Post[] = [
    { id: '1', authorId: currentUserId, category: 'NOTICE', title: 'boardDummy3Title', date: format(subDays(new Date(), 1), 'yyyy.MM.dd'), content: 'boardDummy3Content', badge: 'badgeImportant', isPinned: true },
    { id: '2', authorId: currentUserId, category: 'MENU', title: 'boardDummy1Title', date: format(subDays(new Date(), 2), 'yyyy.MM.dd'), content: 'boardDummy1Content', badge: 'badgeNew', isPinned: false },
    { id: '3', authorId: currentUserId, category: 'NOTICE', title: 'boardDummy2Title', date: format(subDays(new Date(), 5), 'yyyy.MM.dd'), content: 'boardDummy2Content', badge: null, isPinned: false },
    { id: '4', authorId: 'admin', category: 'MANUAL', title: 'boardDummy4Title', date: format(subDays(new Date(), 10), 'yyyy.MM.dd'), content: 'boardDummy4Content', badge: null, isPinned: false },
    { id: '5', authorId: 'admin', category: 'EVENT', title: 'boardDummy5Title', date: format(subDays(new Date(), 12), 'yyyy.MM.dd'), content: 'boardDummy5Content', badge: null, isPinned: false },
    { id: '6', authorId: 'admin', category: 'NOTICE', title: 'boardDummy6Title', date: format(subDays(new Date(), 15), 'yyyy.MM.dd'), content: 'boardDummy6Content', badge: null, isPinned: false },
];

export const BoardProvider = ({ children }: BoardProviderProps) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const addPost = (newPostData: Omit<Post, 'id' | 'date' | 'authorId'>) => {
    const newPost: Post = {
      ...newPostData,
      id: Date.now().toString(),
      date: format(new Date(), 'yyyy.MM.dd'),
      authorId: currentUserId,
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

  const value = {
    posts,
    setPosts,
    addPost,
    updatePost,
    updatePinStatus,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};