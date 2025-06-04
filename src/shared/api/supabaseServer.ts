import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/shared/types/supabase'

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
export const createClient = async () => {
  try {
    // 타임아웃을 설정하여 무한 대기 방지
    const cookieStore = await Promise.race([
      cookies(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cookie access timeout')), 5000)
      )
    ]) as Awaited<ReturnType<typeof cookies>>;
    
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            try {
              return cookieStore.getAll()
            } catch (error) {
              console.warn('쿠키 읽기 실패:', error);
              return [];
            }
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // 서버 컴포넌트에서는 쿠키 설정이 제한될 수 있음
              console.warn('쿠키 설정 실패:', error);
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('Supabase 클라이언트 생성 실패:', error);
    // 쿠키 없이 기본 클라이언트 생성
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() { /* no-op */ },
        },
      }
    );
  }
}

// 서버 액션용 Supabase 클라이언트 생성 (쿠키 수정 가능)
export const createServerActionClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// 미들웨어용 Supabase 클라이언트 생성
export const createMiddlewareClient = (request: Request) => {
  const response = new Response()
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.headers.get('cookie')
          if (!cookies) return []
          
          return cookies.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=')
            return { name, value }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.headers.append(
              'Set-Cookie',
              `${name}=${value}; ${Object.entries(options || {})
                .map(([key, val]) => `${key}=${val}`)
                .join('; ')}`
            )
          })
        },
      },
    }
  )
  
  return { supabase, response }
}

// 초기 세션 데이터 가져오기 (서버 컴포넌트용)
export const getInitialSession = async () => {
  // 보안 경고를 방지하기 위해 서버에서는 세션을 전달하지 않음
  // 클라이언트에서 AuthContext가 직접 인증 상태를 확인하도록 함
  return null
}

// 서버에서 사용자 정보 가져오기
export const getServerUser = async () => {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('서버에서 사용자 정보 가져오기 실패:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('서버 사용자 정보 로드 오류:', error)
    return null
  }
}
