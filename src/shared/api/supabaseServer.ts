import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from '@/shared/types/supabase'

/**
 * 서버 컴포넌트, 서버 액션, 라우트 핸들러용 Supabase 클라이언트 생성 함수
 * 서버에서만 실행되며 쿠키를 통해 인증 상태를 관리합니다.
 * 
 * 사용 예시:
 * ```tsx
 * // 서버 컴포넌트에서
 * export default async function ServerComponent() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('table').select()
 *   return <div>{JSON.stringify(data)}</div>
 * }
 * 
 * // 서버 액션에서
 * 'use server'
 * export async function serverAction() {
 *   const supabase = await createClient()
 *   await supabase.from('table').insert({ data: 'value' })
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // 서버 컴포넌트에서 쿠키 설정 시도 시 무시
            // 미들웨어에서 처리됨
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // 서버 컴포넌트에서 쿠키 삭제 시도 시 무시
            // 미들웨어에서 처리됨
          }
        }
      }
    }
  )
}
