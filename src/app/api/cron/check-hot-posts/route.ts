import { checkHotPosts } from '@/domains/notifications/actions/checkHotPosts';
import { NextRequest, NextResponse } from 'next/server';

/**
 * ⚠️ DEPRECATED: 이 API Route는 더 이상 사용되지 않습니다.
 *
 * HOT 게시글 알림은 현재 Supabase Edge Functions + pg_cron으로 실행됩니다.
 *
 * 이유: Vercel Hobby 플랜은 크론을 일 1회만 실행 가능하지만,
 *       HOT 알림은 시간당 실행이 필요합니다.
 *
 * 새로운 구현:
 * - Edge Function: supabase/functions/check-hot-posts/index.ts
 * - 배포 가이드: DEPLOY_EDGE_FUNCTION.md
 * - 문서: 123/1234/docs/hot-system/supabase-edge-migration.md
 *
 * 이 파일은 수동 테스트용으로만 유지됩니다.
 *
 * ---
 *
 * [이전 방식 - 참고용]
 *
 * Vercel Cron에서 호출:
 * - URL: /api/cron/check-hot-posts
 * - Schedule: 0 0 * * * (매일 자정) [Hobby 플랜 제한]
 *
 * 수동 호출:
 * curl -X GET https://your-domain.com/api/cron/check-hot-posts \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  try {
    // Cron Secret 검증 (보안)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // HOT 게시글 체크 실행
    const result = await checkHotPosts();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('Error in check-hot-posts cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
