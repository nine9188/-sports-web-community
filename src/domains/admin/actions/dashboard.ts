'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';

export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalBoards: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await getSupabaseServer();

  const [usersResult, postsResult, commentsResult, boardsResult] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase.from('boards').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: usersResult.count ?? 0,
    totalPosts: postsResult.count ?? 0,
    totalComments: commentsResult.count ?? 0,
    totalBoards: boardsResult.count ?? 0,
  };
}
