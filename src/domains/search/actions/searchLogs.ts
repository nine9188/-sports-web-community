'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'
import { headers } from 'next/headers'

// 검색 로그 저장 (사용자 정보 포함)
export async function createSearchLog(params: {
  search_query: string
  search_type: 'all' | 'posts' | 'comments' | 'teams'
  results_count: number
  search_duration_ms?: number
}) {
  try {
    const supabase = await getSupabaseServer()
    
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
      return false
    }

    return true
  } catch {
    return false
  }
}

// 인기 검색어 조회 (간단한 버전)
export async function getPopularSearches(
  searchType?: 'all' | 'posts' | 'comments' | 'teams',
  limit: number = 10
) {
  try {
    const supabase = await getSupabaseServer()
    
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

  } catch {
    return []
  }
}

// 검색 결과 클릭 추적
export async function trackSearchResultClick(params: {
  search_query: string
  clicked_result_id: string
  clicked_result_type: 'post' | 'comment' | 'team'
}) {
  try {
    const supabase = await getSupabaseServer()
    
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
    
    // 세션 ID 생성
    const sessionId = user?.id ? `user_${user.id}_${Date.now()}` : `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 최근 검색 로그 찾기 (같은 검색어, 같은 사용자/IP)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let searchLogQuery = (supabase as any)
      .from('search_logs')
      .select('id')
      .eq('search_query', params.search_query.trim())
      .is('clicked_result_id', null) // 아직 클릭되지 않은 로그만
      .order('created_at', { ascending: false })
      .limit(1)

    // 로그인 사용자면 user_id로, 비로그인이면 IP로 필터링
    if (user?.id) {
      searchLogQuery = searchLogQuery.eq('user_id', user.id)
    } else if (ipAddress) {
      searchLogQuery = searchLogQuery.eq('ip_address', ipAddress)
    }

    const { data: searchLogs, error: searchError } = await searchLogQuery

    if (searchError) {
      return false
    }

    if (searchLogs && searchLogs.length > 0) {
      // 기존 검색 로그 업데이트
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('search_logs')
        .update({
          clicked_result_id: params.clicked_result_id,
          clicked_result_type: params.clicked_result_type
        })
        .eq('id', searchLogs[0].id)

      if (updateError) {
        return false
      }

    } else {
      // 기존 검색 로그가 없으면 새로 생성 (클릭 정보 포함)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('search_logs')
        .insert({
          search_query: params.search_query.trim(),
          search_type: 'all', // 클릭만 추적하는 경우 기본값
          results_count: 1, // 클릭했다는 것은 최소 1개 결과가 있었다는 의미
          user_id: user?.id || null,
          session_id: sessionId,
          ip_address: ipAddress,
          user_agent: userAgent,
          clicked_result_id: params.clicked_result_id,
          clicked_result_type: params.clicked_result_type
        })

      if (insertError) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}