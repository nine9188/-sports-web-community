import { checkHotPosts } from '@/domains/notifications/actions/checkHotPosts';
import { NextRequest, NextResponse } from 'next/server';

/**
 * HOT 게시글 체크 Cron Job API Route
 *
 * Vercel Cron에서 호출:
 * - URL: /api/cron/check-hot-posts
 * - Schedule: 0 * * * * (매 시간)
 *
 * 또는 수동 호출:
 * curl -X GET https://your-domain.com/api/cron/check-hot-posts \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron 인증 검증 (Vercel Cron은 자동으로 인증됨)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Vercel Cron에서 오는 요청은 자동으로 허용
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');

    if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
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
