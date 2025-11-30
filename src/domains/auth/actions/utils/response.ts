/**
 * 표준화된 Auth Action 응답 형식
 */
export interface AuthResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 성공 응답 생성
 */
export function successResponse<T>(data?: T): AuthResponse<T> {
  return {
    success: true,
    data
  }
}

/**
 * 에러 응답 생성
 */
export function errorResponse(message: string): AuthResponse {
  return {
    success: false,
    error: message
  }
}
