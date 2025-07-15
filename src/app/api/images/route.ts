import { NextRequest, NextResponse } from 'next/server'
import { ImageType } from '@/shared/utils/image-proxy'

// 지원하는 이미지 타입 배열
const VALID_IMAGE_TYPES = Object.values(ImageType)

// API-Sports.io 기본 URL
const API_SPORTS_BASE_URL = 'https://media.api-sports.io/football'

/**
 * Vercel CDN을 통한 API-Sports 이미지 프록시
 * URL 형식: /api/images?type=players&id=123
 * 
 * @param request - NextRequest 객체
 * @returns 프록시된 이미지 또는 에러 응답
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ImageType
    const id = searchParams.get('id')
    
    // 파라미터 유효성 검사
    if (!type || !id) {
      return new NextResponse('Missing required parameters: type and id', { status: 400 })
    }
    
    if (!VALID_IMAGE_TYPES.includes(type)) {
      return new NextResponse(`Invalid image type. Must be one of: ${VALID_IMAGE_TYPES.join(', ')}`, { status: 400 })
    }
    
    // ID 유효성 검사 (숫자여야 함)
    if (!/^\d+$/.test(id)) {
      return new NextResponse('ID must be a number', { status: 400 })
    }
    
    // API-Sports 이미지 URL 생성
    const imageUrl = `${API_SPORTS_BASE_URL}/${type}/${id}.png`
    
    // API-Sports에서 이미지 가져오기
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Vercel/1.0)',
        'Accept': 'image/*',
      }
    })
    
    // 이미지가 없거나 오류인 경우
    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, { status: response.status })
    }
    
    // 응답 헤더에서 Content-Type 가져오기
    const contentType = response.headers.get('content-type') || 'image/png'
    
    // 이미지 데이터 가져오기
    const imageData = await response.arrayBuffer()
    
    // 최적화된 캐시 헤더 설정
    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
        'Access-Control-Allow-Origin': '*',
      },
    })
    
  } catch {
    return new NextResponse('Internal server error', { status: 500 })
  }
} 