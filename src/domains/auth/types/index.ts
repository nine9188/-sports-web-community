import type { User } from '@supabase/supabase-js'

/**
 * 로그인 응답
 */
export interface SignInResponse {
  success: boolean
  data?: {
    user: User
    session: {
      access_token: string
      refresh_token: string
      expires_at?: number
    }
  }
  error?: string
  needsEmailConfirmation?: boolean
}

/**
 * 회원가입 응답
 */
export interface SignUpResponse {
  success: boolean
  data?: {
    user: User
  }
  error?: string
}

/**
 * 사용자 프로필 데이터
 */
export interface UserProfile {
  id: string
  email?: string
  username?: string
  full_name?: string
  nickname?: string
  icon_url?: string
  is_admin?: boolean
  is_suspended?: boolean
  suspended_until?: string | null
  suspended_reason?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 비밀번호 재설정 응답
 */
export interface PasswordResetResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * 아이디 찾기 응답
 */
export interface UsernameRecoveryResponse {
  success: boolean
  username?: string
  maskedUsername?: string
  error?: string
}

/**
 * 중복 확인 응답
 */
export interface AvailabilityCheckResponse {
  available: boolean
  message?: string
}
