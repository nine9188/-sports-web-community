'use server'

import { createClient } from '@/shared/api/supabaseServer'
import { headers } from 'next/headers'

// 검색 로그 저장 (사용자 정보 포함)
export async function createSearchLog(params: {
  search_query: string
  search_type: 'all' | 'posts' | 'comments' | 'teams'
  results_count: number
  search_duration_ms?: number
}) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()
    
    // 요청 헤더에서 정보 추출
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || null
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const remoteAddr = headersList.get('remote-addr')
    
    // IP 주소 우선순위: x-forwarded-for > x-real-ip > remote-addr
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || remoteAddr || null
    
    // 세션 ID 생성 (간단한 방식 - 실제로는 더 정교한 세션 관리 필요)
    const sessionId = user?.id ? `user_${user.id}_${Date.now()}` : `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 타입 우회를 위해 any 사용
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('search_logs')
      .insert({
        search_query: params.search_query.trim(),
        search_type: params.search_type,
        results_count: params.results_count,
        search_duration_ms: params.search_duration_ms || null,
        user_id: user?.id || null,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent
      })

    if (error) {
      console.error('검색 로그 저장 실패:', error)
      return false
    }

    console.log('✅ 검색 로그 저장 성공:', {
      query: params.search_query,
      type: params.search_type,
      results: params.results_count,
      user: user?.id ? '로그인 사용자' : '비로그인 사용자',
      ip: ipAddress?.substring(0, 8) + '***' // IP 일부만 로깅
    })

    return true
  } catch (error) {
    console.error('검색 로그 저장 중 오류:', error)
    return false
  }
}

// 인기 검색어 조회 (간단한 버전)
export async function getPopularSearches(
  searchType?: 'all' | 'posts' | 'comments' | 'teams',
  limit: number = 10
) {
  try {
    const supabase = await createClient()
    
    // 타입 우회를 위해 any 사용
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('search_logs')
      .select('search_query, search_type')
      .order('created_at', { ascending: false })
      .limit(limit * 3) // 중복 제거를 위해 더 많이 가져옴

    if (searchType && searchType !== 'all') {
      query = query.eq('search_type', searchType)
    }

    const { data, error } = await query

    if (error) {
      console.error('인기 검색어 조회 실패:', error)
      return []
    }

    // 검색어별로 카운트하여 인기순 정렬
    const searchCounts = new Map<string, number>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.forEach((log: any) => {
      const count = searchCounts.get(log.search_query) || 0
      searchCounts.set(log.search_query, count + 1)
    })

    return Array.from(searchCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([search_query, search_count]) => ({
        search_query,
        search_type: searchType || 'all',
        search_count
      }))

  } catch (error) {
    console.error('인기 검색어 조회 중 오류:', error)
    return []
  }
} 