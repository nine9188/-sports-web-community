import { NextResponse } from 'next/server'
import { syncAllFootballTeamsFromApi } from '@/domains/livescore/actions/footballTeamsSync'

export async function POST() {
  try {
    console.log('🚀 팀 데이터 동기화 시작...')

    const result = await syncAllFootballTeamsFromApi()

    console.log('✅ 동기화 완료:', result)

    return NextResponse.json({
      success: result.success,
      data: result,
      message: result.summary
    })
  } catch (error) {
    console.error('❌ 동기화 실패:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      message: '팀 데이터 동기화에 실패했습니다'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST 요청으로 팀 데이터 동기화를 실행하세요',
    endpoint: '/api/sync-teams',
    method: 'POST'
  })
}
