import { redirect } from 'next/navigation';
import { checkUserAuth } from '@/domains/settings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  // 사용자 인증 확인 (서버 액션 사용)
  // 로그인하지 않은 경우 자동으로 로그인 페이지로 리다이렉트됨
  await checkUserAuth('/auth/signin');
  
  // 설정 메인 페이지는 프로필 설정으로 리디렉션
  redirect('/settings/profile');
} 