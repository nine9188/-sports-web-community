/**
 * Supabase 서버 클라이언트 Public API
 *
 * @description
 * 서버 컴포넌트, Server Actions, Route Handlers에서만 사용할 수 있는 함수들입니다.
 * 클라이언트 컴포넌트에서는 '@/shared/lib/supabase'를 사용하세요.
 *
 * @example
 * ```tsx
 * // 서버 컴포넌트
 * import { getSupabaseServer } from '@/shared/lib/supabase/server'
 * const supabase = await getSupabaseServer()
 *
 * // Server Action
 * import { getSupabaseAction } from '@/shared/lib/supabase/server'
 * const supabase = await getSupabaseAction()
 *
 * // Route Handler
 * import { getSupabaseRouteHandler } from '@/shared/lib/supabase/server'
 * const { supabase } = await getSupabaseRouteHandler(request)
 *
 * // 관리자
 * import { getSupabaseAdmin } from '@/shared/lib/supabase/server'
 * const supabase = getSupabaseAdmin()
 * ```
 *
 * @module @/shared/lib/supabase/server
 */

// 서버용 (서버 컴포넌트, Server Actions, Route Handlers)
export {
  getSupabaseServer,
  getSupabaseAction,
  getSupabaseRouteHandler,
  getSupabaseAdmin,
} from './client.server'

// 타입
export type { Database } from './types'
