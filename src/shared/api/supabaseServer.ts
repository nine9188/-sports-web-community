import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Database 타입을 가져오려 했지만 로컬에서 먼저 정의되어 있음
// 로컬 정의 사용 (추후 실제 타입으로 변경 필요)
type Database = Record<string, unknown>

/**
 * 서버 컴포넌트 및 서버 액션에서 사용하는 Supabase 클라이언트를 생성합니다.
 */
export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; secure?: boolean }) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: { path?: string }) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 })
        }
      }
    }
  )
}

/**
 * 서버 컴포넌트용 클라이언트 생성 (createClient와 동일 동작)
 * 기존 코드와의 호환성을 위해 별도 함수로 유지
 */
export async function createServerComponentClient() {
  return createClient()
}
