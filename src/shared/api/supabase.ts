// src/shared/api/supabase.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/shared/types/supabase'

/**
 * 클라이언트 사이드 Supabase 클라이언트 생성
 * 클라이언트 컴포넌트에서만 사용
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
