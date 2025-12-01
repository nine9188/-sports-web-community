// src/shared/api/supabase.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '../../../src/shared/lib/supabase/types'
import { type SupabaseClient } from '@supabase/supabase-js'

// 싱글톤 인스턴스를 저장할 변수
let client: SupabaseClient<Database> | undefined

/**
 * 클라이언트 컴포넌트용 Supabase 클라이언트 생성 함수
 * 브라우저에서 실행되는 컴포넌트에서 사용
 *
 * 싱글톤 패턴을 사용하여 하나의 클라이언트만 생성하고 재사용합니다.
 * 이를 통해 refresh token 충돌을 방지합니다.
 *
 * 사용 예시:
 * ```tsx
 * 'use client'
 * import { getSupabaseBrowser } from '@/shared/lib/supabase'
 *
 * export default function ClientComponent() {
 *   const supabase = getSupabaseBrowser()
 *   // ... 클라이언트 로직
 * }
 * ```
 */
export function createClient() {
  // 이미 생성된 클라이언트가 있으면 재사용
  if (client) {
    return client
  }

  // 새 클라이언트 생성 (한 번만 실행됨)
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}
