import { NextRequest, NextResponse } from 'next/server';
import { getCachedTopicPosts } from '@/app/lib/api/topicPosts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // URL에서 type 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'views' | 'likes' | 'comments' || 'views';
    
    // 캐싱된 인기글 데이터 가져오기
    const posts = await getCachedTopicPosts(type);
    
    // 응답 반환
    return NextResponse.json(
      posts,
      { 
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
        } 
      }
    );
  } catch (error) {
    console.error('인기글 API 오류:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic posts' },
      { status: 500 }
    );
  }
} 