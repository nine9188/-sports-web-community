import type { Metadata } from 'next';
import SettingsTabs from '@/domains/settings/components/common/SettingsTabs';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/domains/auth/actions';
import SettingsAuthGuardClient from '@/domains/settings/components/common/SettingsAuthGuardClient';

export const metadata: Metadata = {
  title: {
    template: '%s - 4590 Football',
    default: '설정 - 4590 Football',
  },
  description: '계정 설정 및 개인 정보 관리',
  robots: {
    index: false,
    follow: false,
  },
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
    <div>
      <div className="max-w-4xl mx-auto">
        <div>
          {/* 탭 네비게이션 */}
          <SettingsTabs />
          
          {/* 컨텐츠 영역 */}
          <div>
            {/* 클라이언트 가드: 세션 만료/로그아웃 시 즉시 이탈 */}
            <SettingsAuthGuardClient />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 