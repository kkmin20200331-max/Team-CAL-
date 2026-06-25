import { format } from 'date-fns';
import React, { createContext, ReactNode, useContext, useState, useCallback } from 'react';
import {
  createBoardAPI,
  createBoardPostAPI,
  getBoardPostListAPI,
  getBoardPostsAPI,
  updateBoardPostAPI,
} from '../../api/auth';
import { Post } from '../types/Post';

type BoardSummary = {
  id: string;
  store_id: string;
  name: string;
  created_by?: string;
};

type AddPostOptions = {
  storeId: string;
  writerId: string;
};

interface BoardContextType {
  posts: Post[];
  boards: BoardSummary[];
  loading: boolean;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  loadPosts: (storeId: string) => Promise<void>;
  addPost: (newPost: Omit<Post, 'id' | 'date' | 'authorId'>, options: AddPostOptions) => Promise<void>;
  updatePost: (updatedPost: Post) => Promise<void>;
  updatePinStatus: (postId: string, isPinned: boolean) => Promise<void>;
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

const normalizeCategory = (name?: string): string => {
  return name || 'NOTICE';
};

const mapPost = (post: any, board?: BoardSummary): Post => ({
  id: post.id,
  category: normalizeCategory(board?.name),
  title: post.title || '',
  content: post.content || '',
  date: post.created_at ? format(new Date(post.created_at), 'yyyy.MM.dd HH:mm') : format(new Date(), 'yyyy.MM.dd HH:mm'),
  authorId: post.writer_id,
  author: post.writer_name || post.writer_id,
  isPinned: post.is_pinned === 'Y' || post.is_pinned === true,
  badge: null,
});

export const BoardProvider = ({ children }: BoardProviderProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPosts = useCallback(async (storeId: string) => {
    if (!storeId) {
      setBoards([]);
      setPosts([]);
      return;
    }

    setLoading(true);
    try {
      const boardResponse = await getBoardPostsAPI(storeId);
      const nextBoards: BoardSummary[] = Array.isArray(boardResponse.data) ? boardResponse.data : [];
      setBoards(nextBoards);

      const postGroups = await Promise.all(
        nextBoards.map(async (board) => {
          const response = await getBoardPostListAPI(board.id);
          const items = Array.isArray(response.data) ? response.data : [];
          return items.map((post: any) => mapPost(post, board));
        }),
      );

      setPosts(postGroups.flat());
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureBoard = useCallback(async (category: string, storeId: string, writerId: string) => {
    const existing = boards.find((board) => board.name.toUpperCase() === category.toUpperCase());
    if (existing) return existing;

    const board = {
      id: `B_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      store_id: storeId,
      name: category,
      created_by: writerId,
    };

    await createBoardAPI(board);
    setBoards((prev) => [...prev, board]);
    return board;
  }, [boards]);

  const addPost = useCallback(async (
    newPostData: Omit<Post, 'id' | 'date' | 'authorId'>,
    options: AddPostOptions,
  ) => {
    const board = await ensureBoard(newPostData.category, options.storeId, options.writerId);
    const id = `BP_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

    await createBoardPostAPI({
      id,
      board_id: board.id,
      store_id: options.storeId,
      writer_id: options.writerId,
      title: newPostData.title,
      content: newPostData.content,
    });

    await loadPosts(options.storeId);
  }, [ensureBoard, loadPosts]);

  const updatePost = useCallback(async (updatedPost: Post) => {
    await updateBoardPostAPI({
      id: updatedPost.id,
      title: updatedPost.title,
      content: updatedPost.content,
      status: 'PUBLISHED',
      is_pinned: updatedPost.isPinned ? 'Y' : 'N',
    });

    setPosts((prevPosts) => prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
  }, []);

  const updatePinStatus = useCallback(async (postId: string, isPinned: boolean) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    await updatePost({ ...post, isPinned });
  }, [posts, updatePost]);

  const value = {
    posts,
    boards,
    loading,
    setPosts,
    loadPosts,
    addPost,
    updatePost,
    updatePinStatus,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};
