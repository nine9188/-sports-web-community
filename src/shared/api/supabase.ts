// src/shared/api/supabase.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'

// 임시 Database 타입 (실제 프로젝트 타입으로 교체 필요)
type Database = Record<string, unknown>

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
