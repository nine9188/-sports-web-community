'use server';

import { getSupabaseAction, getSupabaseServer } from '@/shared/lib/supabase/client.server';
import { revalidatePath } from 'next/cache';

/**
 * 게시글 스크랩 상태를 확인합니다.
 */
export async function checkIsScrapped(postId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from('post_scraps' as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle();

    if (error) {
      console.error('[scrap-action] checkIsScrapped error:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[scrap-action] checkIsScrapped catch error:', error);
    return false;
  }
}

/**
 * 게시글 스크랩을 등록하거나 해제합니다 (토글).
 */
export async function togglePostScrap(postId: string): Promise<{ success: boolean; scrapped?: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseAction();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 이미 스크랩했는지 체크
    const { data: existing, error: checkError } = await supabase
      .from('post_scraps' as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle();

    if (checkError) {
      console.error('[scrap-action] toggle check error:', checkError);
      return { success: false, error: '스크랩 상태 조회 중 오류가 발생했습니다.' };
    }

    if (existing) {
      // 존재하면 해제 (delete)
      const { error: deleteError } = await supabase
        .from('post_scraps' as any)
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (deleteError) {
        console.error('[scrap-action] delete error:', deleteError);
        return { success: false, error: '스크랩 취소에 실패했습니다.' };
      }

      revalidatePath(`/boards/all`);
      return { success: true, scrapped: false };
    } else {
      // 없으면 등록 (insert)
      const { error: insertError } = await supabase
        .from('post_scraps' as any)
        .insert({
          user_id: user.id,
          post_id: postId,
        });

      if (insertError) {
        console.error('[scrap-action] insert error:', insertError);
        return { success: false, error: '스크랩 등록에 실패했습니다.' };
      }

      revalidatePath(`/boards/all`);
      return { success: true, scrapped: true };
    }
  } catch (error: any) {
    console.error('[scrap-action] toggle catch error:', error);
    return { success: false, error: error.message || '서버 오류가 발생했습니다.' };
  }
}

/**
 * 유저가 스크랩한 게시글 목록을 가져옵니다.
 */
export async function getScrappedPosts(page: number = 1, limit: number = 10): Promise<{
  success: boolean;
  posts: any[];
  totalCount: number;
  totalPages: number;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, posts: [], totalCount: 0, totalPages: 0, error: '로그인이 필요합니다.' };
    }

    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;

    // 1. 전체 개수 쿼리
    const { count, error: countError } = await supabase
      .from('post_scraps' as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('[scrap-action] count error:', countError);
      return { success: false, posts: [], totalCount: 0, totalPages: 0, error: '목록 개수 조회 실패' };
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    if (totalCount === 0) {
      return { success: true, posts: [], totalCount: 0, totalPages: 0 };
    }

    // 2. 조인해서 실제 포스트 가져오기
    const { data, error: selectError } = await supabase
      .from('post_scraps' as any)
      .select(`
        created_at,
        post:post_id (
          id,
          title,
          post_number,
          views,
          likes,
          dislikes,
          category,
          created_at,
          profiles:user_id (nickname),
          board:board_id (name, slug)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    if (selectError) {
      console.error('[scrap-action] select error:', selectError);
      return { success: false, posts: [], totalCount: 0, totalPages: 0, error: '스크랩 목록 조회 실패' };
    }

    // 데이터 포맷 정제
    const posts = (data || [])
      .map((item: any) => {
        if (!item.post) return null;
        return {
          ...item.post,
          scrapped_at: item.created_at,
          author_nickname: item.post.profiles?.nickname || '알 수 없음',
          board_name: item.post.board?.name || '게시판',
          board_slug: item.post.board?.slug || '',
        };
      })
      .filter(Boolean);

    return {
      success: true,
      posts,
      totalCount,
      totalPages,
    };
  } catch (error: any) {
    console.error('[scrap-action] getScrappedPosts error:', error);
    return { success: false, posts: [], totalCount: 0, totalPages: 0, error: error.message };
  }
}
