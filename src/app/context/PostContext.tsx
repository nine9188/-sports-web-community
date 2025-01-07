import { createContext, useContext, useState } from 'react';

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  views: number;
  createdAt: string;
  user: {
    username: string;
    nickname: string;
  };
}

export const PostContext = createContext<{
  posts: Post[];
  setPosts: (posts: Post[]) => void;
}>({
  posts: [],
  setPosts: () => {},
});

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);

  return (
    <PostContext.Provider value={{ posts, setPosts }}>
      {children}
    </PostContext.Provider>
  );
}

export function usePost() {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
} 