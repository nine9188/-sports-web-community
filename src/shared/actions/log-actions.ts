'use server'

import { createServerActionClient } from '@/shared/api/supabaseServer'
import { headers } from 'next/headers'
import { Database, Json } from '@/shared/types/supabase'

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
export type LogCategory = 'auth' | 'api' | 'database' | 'user_action' | 'system' | 'admin' | 'security'

// 메타데이터 타입 정의 (Json 타입과 호환)
export type LogMetadata = Json

export interface LogEntry {
  level: LogLevel
  category: LogCategory
  action: string
  message: string
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  requestId?: string
  endpoint?: string
  method?: string
  statusCode?: number
  responseTimeMs?: number
  metadata?: LogMetadata
  errorCode?: string
  errorDetails?: LogMetadata
  stackTrace?: string
}

// 로그 통계 타입 정의
export interface LogStatistics {
  period: 'today' | 'week' | 'month'
  totalLogs: number
  levelStats: Record<string, number>
  categoryStats: Record<string, number>
  recentErrors: LogEntry[]
  errorCount: number
}

/**
 * 애플리케이션 로그를 기록하는 서버 액션
 */
export async function writeLog(entry: LogEntry) {
  try {
    const supabase = await createServerActionClient()
    const headersList = await headers()
    
    // 요청 정보 자동 수집
    const ipAddress = entry.ipAddress || 
      headersList.get('x-forwarded-for') || 
      headersList.get('x-real-ip') || 
      headersList.get('cf-connecting-ip') || 
      'unknown'
    
    const userAgent = entry.userAgent || headersList.get('user-agent') || 'unknown'
    const requestId = entry.requestId || headersList.get('x-request-id') || crypto.randomUUID()
    
    // 타입 안전성을 위해 명시적으로 타입 단언
    const logData: Database['public']['Tables']['application_logs']['Insert'] = {
      level: entry.level,
      category: entry.category,
      action: entry.action,
      message: entry.message,
      user_id: entry.userId || null,
      session_id: entry.sessionId || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      request_id: requestId,
      endpoint: entry.endpoint || null,
      method: entry.method || null,
      status_code: entry.statusCode || null,
      response_time_ms: entry.responseTimeMs || null,
      metadata: entry.metadata || null,
      error_code: entry.errorCode || null,
      error_details: entry.errorDetails || null,
      stack_trace: entry.stackTrace || null
    }

    const { error } = await supabase
      .from('application_logs')
      .insert([logData])

    if (error) {
      console.error('로그 기록 실패:', error)
      // 로그 기록 실패 시에도 애플리케이션 로직에는 영향을 주지 않음
    }
  } catch (err) {
    console.error('로그 기록 중 예외 발생:', err)
  }
}

/**
 * 사용자 액션 로그 기록 헬퍼
 */
export async function logUserAction(
  action: string,
  message: string,
  userId?: string,
  metadata?: LogMetadata
) {
  await writeLog({
    level: 'INFO',
    category: 'user_action',
    action,
    message,
    userId,
    metadata
  })
}

/**
 * 인증 관련 로그 기록 헬퍼
 */
export async function logAuthEvent(
  action: string,
  message: string,
  userId?: string,
  isSuccess: boolean = true,
  metadata?: LogMetadata
) {
  await writeLog({
    level: isSuccess ? 'INFO' : 'WARN',
    category: 'auth',
    action,
    message,
    userId,
    metadata: metadata || { success: isSuccess }
  })
}

/**
 * API 호출 로그 기록 헬퍼
 */
export async function logApiCall(
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  userId?: string,
  metadata?: LogMetadata
) {
  const level: LogLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO'
  
  await writeLog({
    level,
    category: 'api',
    action: 'api_call',
    message: `${method} ${endpoint} - ${statusCode}`,
    userId,
    endpoint,
    method,
    statusCode,
    responseTimeMs,
    metadata
  })
}

/**
 * 에러 로그 기록 헬퍼
 */
export async function logError(
  action: string,
  error: Error,
  userId?: string,
  metadata?: LogMetadata
) {
  await writeLog({
    level: 'ERROR',
    category: 'system',
    action,
    message: error.message,
    userId,
    metadata,
    errorCode: error.name,
    errorDetails: {
      message: error.message,
      stack: error.stack || null
    },
    stackTrace: error.stack
  })
}

/**
 * 관리자 액션 로그 기록 헬퍼
 */
export async function logAdminAction(
  action: string,
  message: string,
  adminUserId: string,
  targetId?: string,
  metadata?: LogMetadata
) {
  await writeLog({
    level: 'INFO',
    category: 'admin',
    action,
    message,
    userId: adminUserId,
    metadata: metadata || { targetId: targetId || null, isAdminAction: true }
  })
}

/**
 * 보안 관련 로그 기록 헬퍼
 */
export async function logSecurityEvent(
  action: string,
  message: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  userId?: string,
  metadata?: LogMetadata
) {
  const level: LogLevel = severity === 'CRITICAL' ? 'FATAL' : severity === 'HIGH' ? 'ERROR' : 'WARN'
  
  await writeLog({
    level,
    category: 'security',
    action,
    message,
    userId,
    metadata: metadata || { severity }
  })
}

/**
 * 로그 조회 서버 액션 (관리자용)
 */
export async function getApplicationLogs(
  page: number = 1,
  limit: number = 100,
  filters?: {
    level?: LogLevel
    category?: LogCategory
    action?: string
    userId?: string
    startDate?: string
    endDate?: string
    search?: string
  }
) {
  try {
    const supabase = await createServerActionClient()
    
    // 현재 사용자가 관리자인지 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('인증되지 않은 사용자')
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      throw new Error('관리자 권한이 필요합니다')
    }
    
    let query = supabase
      .from('application_logs')
      .select('*')
    
    // 필터 적용
    if (filters?.level) {
      query = query.eq('level', filters.level)
    }
    
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }
    
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }
    
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }
    
    if (filters?.search) {
      query = query.or(`message.ilike.%${filters.search}%,action.ilike.%${filters.search}%`)
    }
    
    // 페이지네이션
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data: logs, error } = await query
    
    if (error) {
      throw error
    }
    
    // 전체 개수 조회
    let countQuery = supabase
      .from('application_logs')
      .select('*', { count: 'exact', head: true })
    
    // 같은 필터 적용
    if (filters?.level) countQuery = countQuery.eq('level', filters.level)
    if (filters?.category) countQuery = countQuery.eq('category', filters.category)
    if (filters?.action) countQuery = countQuery.eq('action', filters.action)
    if (filters?.userId) countQuery = countQuery.eq('user_id', filters.userId)
    if (filters?.startDate) countQuery = countQuery.gte('created_at', filters.startDate)
    if (filters?.endDate) countQuery = countQuery.lte('created_at', filters.endDate)
    if (filters?.search) {
      countQuery = countQuery.or(`message.ilike.%${filters.search}%,action.ilike.%${filters.search}%`)
    }
    
    const { count } = await countQuery
    
    return {
      logs: logs || [],
      totalCount: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (error) {
    console.error('로그 조회 실패:', error)
    throw error
  }
}

/**
 * 로그 통계 조회 서버 액션 (관리자용)
 */
export async function getLogStatistics(
  period: 'today' | 'week' | 'month' = 'today'
): Promise<LogStatistics> {
  try {
    const supabase = await createServerActionClient()
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('인증되지 않은 사용자')
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      throw new Error('관리자 권한이 필요합니다')
    }
    
    // 기간 설정
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }
    
    // 직접 쿼리 실행
    const { data: rawStats } = await supabase
      .from('application_logs')
      .select('level, category, created_at')
      .gte('created_at', startDate.toISOString())
    
    // 최근 에러 로그
    const { data: recentErrorsData } = await supabase
      .from('application_logs')
      .select('*')
      .in('level', ['ERROR', 'FATAL'])
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)
    
    // 통계 집계
    const levelCounts = rawStats?.reduce((acc: Record<string, number>, log) => {
      const level = log.level
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {}) || {}
    
    const categoryCounts = rawStats?.reduce((acc: Record<string, number>, log) => {
      const category = log.category
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {}) || {}
    
    // 에러 로그를 LogEntry 형태로 변환
    const recentErrors: LogEntry[] = (recentErrorsData || []).map(log => ({
      level: log.level as LogLevel,
      category: log.category as LogCategory,
      action: log.action,
      message: log.message,
      userId: log.user_id || undefined,
      sessionId: log.session_id || undefined,
      ipAddress: log.ip_address as string || undefined,
      userAgent: log.user_agent || undefined,
      requestId: log.request_id || undefined,
      endpoint: log.endpoint || undefined,
      method: log.method || undefined,
      statusCode: log.status_code || undefined,
      responseTimeMs: log.response_time_ms || undefined,
      metadata: log.metadata as LogMetadata || undefined,
      errorCode: log.error_code || undefined,
      errorDetails: log.error_details as LogMetadata || undefined,
      stackTrace: log.stack_trace || undefined
    }))
    
    return {
      period,
      totalLogs: rawStats?.length || 0,
      levelStats: levelCounts,
      categoryStats: categoryCounts,
      recentErrors,
      errorCount: (levelCounts['ERROR'] || 0) + (levelCounts['FATAL'] || 0)
    }
  } catch (error) {
    console.error('로그 통계 조회 실패:', error)
    throw error
  }
} 