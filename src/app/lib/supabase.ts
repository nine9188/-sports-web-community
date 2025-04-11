import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    storageKey: 'supabase.auth.token',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') {
          return null;
        }
        return JSON.parse(window.localStorage.getItem(key) || 'null');
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    },
  },
});

export default supabase;
