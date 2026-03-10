/**
 * 외부 이미지 프록시 API
 *
 * 외부 URL의 이미지를 프록시해서 제공
 * - Next.js Image 최적화 가능
 * - CORS 우회
 * - 캐싱 적용
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Edge Runtime 사용 (더 빠름)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // URL 검증 (https만 허용)
    const url = new URL(imageUrl);
    if (url.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Only HTTPS URLs are allowed' },
        { status: 400 }
      );
    }

    // 외부 이미지 fetch
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextJS-Image-Proxy/1.0)',
      },
      // 캐시 설정
      next: {
        revalidate: 86400, // 24시간 캐시
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }

    // Content-Type 확인 (이미지만 허용)
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'URL is not an image' },
        { status: 400 }
      );
    }

    // 이미지 데이터 스트리밍
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // 24시간 캐시, 7일 stale
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
