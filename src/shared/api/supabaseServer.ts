import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Database 타입을 가져오려 했지만 로컬에서 먼저 정의되어 있음
// 로컬 정의 사용 (추후 실제 타입으로 변경 필요)
type Database = Record<string, unknown>

/**
 * 읽기 전용 서버 컴포넌트에서 사용하는 Supabase 클라이언트
 * - 쿠키 읽기만 가능, 수정 불가
 */
export async function createServerComponentClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value
          }))
        }
      }
    }
  )
}

/**
 * 서버 액션에서 사용하는 Supabase 클라이언트
 * - 쿠키 읽기/쓰기 모두 가능
 * - 반드시 'use server' 지시문이 있는 파일이나 함수에서 호출해야 함
 */
export async function createActionClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value
          }))
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, ...options }) => {
            cookieStore.set({ name, value, ...options })
          })
        }
      }
    }
  )
}

/**
 * @deprecated 대신 createServerComponentClient 또는 createActionClient를 사용하세요.
 */
export async function createClient() {
  return createServerComponentClient()
}
