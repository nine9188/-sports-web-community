/**
 * Supabase 클라이언트 Public API (클라이언트 컴포넌트용)
 *
 * @description
 * 이 파일은 클라이언트 컴포넌트에서 안전하게 import할 수 있는 함수만 export합니다.
 * 서버 컴포넌트/Server Actions에서는 '@/shared/lib/supabase/server'를 사용하세요.
 *
 * @example
 * ```tsx
 * // 클라이언트 컴포넌트
 * import { getSupabaseBrowser } from '@/shared/lib/supabase'
 * const supabase = getSupabaseBrowser()
 *
 * // 서버 컴포넌트/Server Actions
 * import { getSupabaseServer } from '@/shared/lib/supabase/server'
 * const supabase = await getSupabaseServer()
 * ```
 *
 * @module @/shared/lib/supabase
 */

// 브라우저용 (클라이언트 컴포넌트)
export { getSupabaseBrowser } from './client.browser'

// 타입
export type { Database } from './types'
