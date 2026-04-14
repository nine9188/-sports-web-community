'use server';

import { unstable_cache } from 'next/cache';
import { getSupabaseServer } from '@/shared/lib/supabase/server';

/**
 * 전체 게시글 개수 조회 (Suspense 스트리밍 전용)
 *
 * 레이아웃의 blocking await 경로에서 분리됨 → 셸 먼저 흘려보내고
 * count는 스트리밍으로 뒤따라옴.
 *
 * 60초 TTL로 "거의 실시간" 유지 — DB count 쿼리는 비싸므로
 * 매 요청 DB를 때리지는 않되, 1분 이상 stale은 허용하지 않음.
 * 정확한 즉시 반영이 필요하면 posts 작성/삭제 로직에서
 * revalidateTag('posts-count') 호출하면 즉시 갱신됨.
 */
const _getTotalPostCountImpl = unstable_cache(
  async (): Promise<number> => {
    try {
      const supabase = await getSupabaseServer();
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false)
        .eq('is_hidden', false);

      if (error) {
        console.error('getTotalPostCount error:', error);
        return 0;
      }

      return count ?? 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) {
        console.error('getTotalPostCount exception:', error);
      }
      return 0;
    }
  },
  ['total-post-count'],
  { revalidate: 60, tags: ['posts-count'] }
);

export async function getTotalPostCount(): Promise<number> {
  return _getTotalPostCountImpl();
}
