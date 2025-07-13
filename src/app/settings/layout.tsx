import type { Metadata } from 'next';
import SettingsTabs from '@/domains/settings/components/common/SettingsTabs';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/domains/auth/actions';

export const metadata: Metadata = {
  title: '설정 - SPORTS 커뮤니티',
  description: '계정 설정 및 개인 정보 관리',
};

export const dynamic = 'force-dynamic';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버에서 인증 체크
  const { user } = await getCurrentUser();
  
  // 로그인하지 않은 사용자 처리
  if (!user) {
    redirect('/signin?redirect=/settings&message=로그인이 필요한 페이지입니다');
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div>
          {/* 탭 네비게이션 */}
          <SettingsTabs />
          
          {/* 컨텐츠 영역 */}
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 