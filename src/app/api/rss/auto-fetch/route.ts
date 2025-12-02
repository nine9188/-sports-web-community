import { NextResponse } from 'next/server'
import { fetchAllRSSFeeds } from '@/domains/rss/actions'

export async function GET() {
  try {
    console.log('🤖 GitHub Actions RSS 자동 수집 시작')
    
    console.log(`🌍 환경: ${process.env.NODE_ENV}`)
    
    // RSS 피드 수집 실행 (GitHub Actions 트리거)
    const result = await fetchAllRSSFeeds('github_actions')
    
    console.log('✅ RSS 자동 수집 완료:', result)
    
    return NextResponse.json({
      success: true,
      message: 'RSS 자동 수집 완료',
      timestamp: new Date().toISOString(),
      result: result
    })
    
  } catch (error) {
    console.error('❌ RSS 자동 수집 오류:', error)
    
    return NextResponse.json({
      success: false,
      message: 'RSS 자동 수집 실패',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST 메서드도 지원 (보안 토큰 사용 가능)
export async function POST(request: Request) {
  try {
    // 보안 토큰 확인 (선택사항)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.RSS_AUTO_TOKEN
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({
        success: false,
        message: '인증 실패'
      }, { status: 401 })
    }
    
    console.log('🔐 인증된 RSS 자동 수집 요청')
    
    const result = await fetchAllRSSFeeds('github_actions')
    
    return NextResponse.json({
      success: true,
      message: 'RSS 자동 수집 완료 (인증됨)',
      timestamp: new Date().toISOString(),
      result: result
    })
    
  } catch (error) {
    console.error('❌ 인증된 RSS 자동 수집 오류:', error)
    
    return NextResponse.json({
      success: false,
      message: 'RSS 자동 수집 실패',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 