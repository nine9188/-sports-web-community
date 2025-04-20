import { createClient } from '@/app/lib/supabase.server';
import { redirect } from 'next/navigation';
import ProfileForm from './components/ProfileForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfileSettingsPage() {
  // Supabase 클라이언트 생성
  const supabase = await createClient();
  
  // 사용자 정보 확인 (getUser 사용 - 보안 강화)
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // 로그인되지 않은 경우 로그인 페이지로 리디렉션
  if (!user || error) {
    redirect('/signin?returnUrl=/settings/profile');
  }
  
  // 사용자 프로필 정보 가져오기
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // 프로필 정보가 없거나 오류가 발생한 경우 기본값 사용
  const userProfile = profileData || {
    id: user.id,
    nickname: '',
    email: user.email,
    full_name: '',
  };
  
  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
      <h2 className="text-xl font-semibold mb-1">기본 정보</h2>
      <p className="text-gray-500 text-sm mb-6">
        계정 및 프로필 정보를 관리합니다.
      </p>
      
      <ProfileForm initialData={{
        id: userProfile.id,
        nickname: userProfile.nickname,
        email: userProfile.email || user.email,
        full_name: userProfile.full_name,
        created_at: user?.created_at,
        last_sign_in_at: user?.last_sign_in_at,
      }} />
    </div>
  );
} 