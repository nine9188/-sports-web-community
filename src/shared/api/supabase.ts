// src/shared/api/supabase.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/shared/types/supabase'

/**
 * 클라이언트 컴포넌트용 Supabase 클라이언트 생성 함수
 * 브라우저에서 실행되는 컴포넌트에서 사용
 * 
 * 사용 예시:
 * ```tsx
 * 'use client'
 * import { createClient } from '@/shared/api/supabase'
 * 
 * export default function ClientComponent() {
 *   const supabase = createClient()
 *   // ... 클라이언트 로직
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
