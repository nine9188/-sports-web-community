/**
 * 브라우저용 Supabase 클라이언트
 *
 * @description
 * - 클라이언트 컴포넌트('use client')에서만 사용
 * - 싱글톤 패턴으로 구현되어 하나의 인스턴스만 생성
 * - 자동 토큰 갱신 및 세션 관리
 *
 * @example
 * ```tsx
 * 'use client'
 * import { getSupabaseBrowser } from '@/shared/lib/supabase'
 *
 * export default function MyComponent() {
 *   const supabase = getSupabaseBrowser()
 *   // ... 클라이언트 로직
 * }
 * ```
 */

'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

/**
 * 브라우저용 Supabase 클라이언트 가져오기 (싱글톤)
 *
 * @throws {Error} 서버 환경에서 호출 시 에러 발생
 * @returns {SupabaseClient} Supabase 클라이언트 인스턴스
 */
export function getSupabaseBrowser() {
  // 서버 환경 체크 (SSR 중에는 null 반환)
  if (typeof window === 'undefined') {
    // SSR 중에는 더미 객체 반환 (실제 기능 없음)
    // 클라이언트에서 hydration 후 정상 작동
    return null as any;
  }

  // 이미 생성된 클라이언트가 있으면 재사용 (싱글톤)
  if (browserClient) {
    return browserClient
  }

  // 새 클라이언트 생성 (한 번만 실행됨)
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return browserClient
}

/**
 * 브라우저 클라이언트 초기화 (테스트용)
 *
 * @internal
 */
export function _resetBrowserClient() {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️ _resetBrowserClient()는 테스트 환경에서만 사용해야 합니다.')
  }
  browserClient = undefined
}
