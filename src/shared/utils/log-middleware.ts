import { NextRequest, NextResponse } from 'next/server'
import { logApiCall, logSecurityEvent, LogMetadata } from '@/shared/actions/log-actions'

/**
 * 로그 미들웨어 - API 요청/응답 자동 로깅
 */
export async function logMiddleware(
  request: NextRequest,
  response: NextResponse,
  startTime: number,
  userId?: string
) {
  try {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    // 요청 정보 수집
    const endpoint = request.nextUrl.pathname
    const method = request.method
    const statusCode = response.status
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer')
    
    // 메타데이터 구성
    const metadata: LogMetadata = {
      requestBody: null,
      responseBody: null,
      userAgent,
      referer
    }
    
    // 보안 이벤트 감지
    await detectSecurityEvents(request, response, userId)
    
    // API 호출 로그 기록
    await logApiCall(
      endpoint,
      method,
      statusCode,
      responseTime,
      userId,
      metadata
    )
  } catch (error) {
    console.error('로그 미들웨어 에러:', error)
    // 로그 기록 실패가 애플리케이션에 영향을 주지 않도록 함
  }
}

/**
 * 보안 이벤트 감지 및 로깅
 */
async function detectSecurityEvents(
  request: NextRequest,
  response: NextResponse,
  userId?: string
) {
  try {
    const userAgent = request.headers.get('user-agent') || ''
    const path = request.nextUrl.pathname
    const method = request.method
    
    // SQL Injection 시도 감지
    if (path.includes('SELECT') || path.includes('UNION') || path.includes('DROP')) {
      await logSecurityEvent(
        'sql_injection_attempt',
        `의심스러운 SQL 패턴 감지: ${path}`,
        'HIGH',
        userId,
        { path, method, userAgent } as LogMetadata
      )
    }
    
    // 의심스러운 User-Agent 감지
    const suspiciousAgents = ['sqlmap', 'nmap', 'nikto', 'dirb', 'gobuster']
    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      await logSecurityEvent(
        'suspicious_user_agent',
        `의심스러운 User-Agent 감지: ${userAgent}`,
        'MEDIUM',
        userId,
        { userAgent, path, method } as LogMetadata
      )
    }
    
    // 비정상적인 요청 크기 감지
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB 이상
      await logSecurityEvent(
        'large_request',
        `비정상적으로 큰 요청: ${contentLength} bytes`,
        'LOW',
        userId,
        { contentLength, path, method } as LogMetadata
      )
    }
    
    // 높은 에러율 감지 (5xx 에러)
    if (response.status >= 500) {
      await logSecurityEvent(
        'server_error',
        `서버 에러 발생: ${response.status}`,
        'MEDIUM',
        userId,
        { statusCode: response.status, path, method } as LogMetadata
      )
    }
    
    // 무차별 대입 공격 감지 (로그인 엔드포인트)
    if (path.includes('/auth/') && response.status === 401) {
      await logSecurityEvent(
        'failed_login_attempt',
        `로그인 실패: ${path}`,
        'LOW',
        userId,
        { path, method, statusCode: response.status } as LogMetadata
      )
    }
  } catch (error) {
    console.error('보안 이벤트 감지 중 에러:', error)
  }
}

/**
 * 사용자 ID 추출 헬퍼
 */
export function extractUserId(request: NextRequest): string | undefined {
  try {
    // JWT 토큰에서 사용자 ID 추출 (구현 예시)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return undefined
    
         // 실제 JWT 파싱 로직 구현 필요
     // 여기서는 간단한 예시만 제공
     return undefined
   } catch {
     return undefined
   }
}

/**
 * 요청 본문 안전하게 파싱
 */
export async function safeParseRequestBody(request: NextRequest): Promise<LogMetadata | undefined> {
  try {
    const contentType = request.headers.get('content-type')
    if (!contentType) return undefined
    
    if (contentType.includes('application/json')) {
      const body = await request.json()
      return body as LogMetadata
    }
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      const result: Record<string, string> = {}
      formData.forEach((value, key) => {
        result[key] = value.toString()
      })
      return result as LogMetadata
    }
         
     return undefined
   } catch {
     return undefined
   }
 }
 
 /**
  * 응답 본문 안전하게 파싱
  */
export async function safeParseResponseBody(response: NextResponse): Promise<LogMetadata | undefined> {
  try {
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return undefined
    }
    
         // 응답 본문을 복사하여 파싱
     const responseClone = response.clone()
     const body = await responseClone.json()
     return body as LogMetadata
   } catch {
     return undefined
   }
}

/**
 * 비동기 로그 기록 헬퍼
 */
export async function asyncLogUserAction(
  action: string,
  message: string,
  userId?: string,
  metadata?: LogMetadata
) {
  // 비동기로 로그 기록 (애플리케이션 성능에 영향 없음)
  setImmediate(async () => {
    try {
      const { logUserAction } = await import('@/shared/actions/log-actions')
      await logUserAction(action, message, userId, metadata)
    } catch (error) {
      console.error('비동기 로그 기록 실패:', error)
    }
  })
}

/**
 * 비동기 에러 로그 기록 헬퍼
 */
export async function asyncLogError(
  action: string,
  error: Error,
  userId?: string,
  metadata?: LogMetadata
) {
  // 비동기로 에러 로그 기록
  setImmediate(async () => {
    try {
      const { logError } = await import('@/shared/actions/log-actions')
      await logError(action, error, userId, metadata)
    } catch (logError) {
      console.error('비동기 에러 로그 기록 실패:', logError)
    }
  })
}

/**
 * 비동기 관리자 액션 로그 기록 헬퍼
 */
export async function asyncLogAdminAction(
  action: string,
  message: string,
  adminUserId: string,
  targetId?: string,
  metadata?: LogMetadata
) {
  // 비동기로 관리자 액션 로그 기록
  setImmediate(async () => {
    try {
      const { logAdminAction } = await import('@/shared/actions/log-actions')
      await logAdminAction(action, message, adminUserId, targetId, metadata)
    } catch (error) {
      console.error('비동기 관리자 액션 로그 기록 실패:', error)
    }
  })
} 