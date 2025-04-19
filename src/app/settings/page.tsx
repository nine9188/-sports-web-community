import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase.server';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  // Supabase 클라이언트 생성
  const supabase = await createClient();
  
  // 사용자 세션 확인
  const { data: { session } } = await supabase.auth.getSession();
  
  // 로그인되지 않은 경우 로그인 페이지로 리디렉션
  if (!session) {
    redirect('/signin?returnUrl=/settings/profile');
  }
  
  // 설정 메인 페이지는 프로필 설정으로 리디렉션
  redirect('/settings/profile');
} 