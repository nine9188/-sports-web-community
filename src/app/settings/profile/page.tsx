import { Metadata } from 'next';
import { checkUserAuth } from '@/domains/settings/actions/auth';
import { getUserProfile } from '@/domains/settings/actions/profile';
import { ProfileForm } from '@/domains/settings/components';

export const metadata: Metadata = {
  title: '프로필 설정',
  description: '계정 및 프로필 정보를 관리합니다.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfileSettingsPage() {
  // 사용자 인증 확인 (자동으로 리다이렉트됨)
  const user = await checkUserAuth('/auth/signin');
  
  // 사용자 프로필 정보 가져오기
  const userProfile = await getUserProfile(user.id);
  
  // 프로필 정보가 없거나 오류가 발생한 경우 기본값 사용
  const profileData = userProfile || {
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
        id: profileData.id,
        nickname: profileData.nickname,
        email: profileData.email || user.email || null,
        full_name: profileData.full_name,
        created_at: user?.created_at,
        last_sign_in_at: user?.last_sign_in_at,
      }} />
    </div>
  );
} 