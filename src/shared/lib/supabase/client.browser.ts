/**
 * 브라우저용 Supabase 클라이언트
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

let browserClient:
  | ReturnType<typeof createBrowserClient<Database, 'public', any>>
  | undefined;

export function getSupabaseBrowser() {
  if (typeof window === 'undefined') {
    return null as any;
  }

  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 환경변수가 없습니다.');
  }

  browserClient = createBrowserClient<Database, 'public', any>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',

        lock: async <T>(
          _name: string,
          _acquireTimeout: number,
          fn: () => Promise<T>
        ): Promise<T> => {
          return await fn();
        },
      },
    }
  );

  return browserClient;
}

export function _resetBrowserClient() {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️ _resetBrowserClient()는 테스트 환경에서만 사용해야 합니다.');
  }

  browserClient = undefined;
}