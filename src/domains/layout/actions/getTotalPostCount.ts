'use server';

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

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
      // unstable_cache 안에서는 cookies()가 비어있어 익명 클라이언트가 되어
      // RLS에 따라 count가 0으로 나올 수 있음.
      // 전체글 개수는 공개 정보이므로 서비스 롤로 RLS를 우회해 집계.
      const supabase = getSupabaseAdmin();
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
      console.error('getTotalPostCount exception:', error);
      return 0;
    }
  },
  ['total-post-count'],
  { revalidate: 60, tags: ['posts-count'] }
);

export async function getTotalPostCount(): Promise<number> {
  return _getTotalPostCountImpl();
}
