import React from 'react';
import { Metadata } from 'next';
import { checkUserAuth } from '@/domains/settings';
import SettingsTabs from '@/domains/settings/components/common/SettingsTabs';

export const metadata: Metadata = {
  title: '계정 설정 - SPORTS 커뮤니티',
  description: '계정 및 프로필 설정 관리',
};

export const dynamic = 'force-dynamic';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 사용자 인증 확인 (서버 액션 사용)
  // 로그인하지 않은 경우 자동으로 로그인 페이지로 리다이렉트됨
  await checkUserAuth('/auth/signin');
  
  return (
    <div className="container mx-auto">
      {/* 탭 네비게이션 */}
      <SettingsTabs />
      
      {/* 컨텐츠 영역 */}
      <div>
        {children}
      </div>
    </div>
  );
} 