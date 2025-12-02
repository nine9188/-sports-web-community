'use client'

/**
 * 클라이언트 컴포넌트에서 사용할 인증 체크 훅
 */
export function useAuthGuard(redirectTo = '/signin') {
  // 이 함수는 클라이언트 컴포넌트에서 useAuth와 함께 사용
  return { redirectTo }
} 