import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/app/lib/supabase.server';
import SettingsTabs from './components/SettingsTabs';
import { redirect } from 'next/navigation';

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
  // Supabase 클라이언트 생성
  const supabase = await createClient();
  
  // 사용자 정보 확인 (getUser 사용 - 보안 강화)
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // 로그인되지 않은 경우 로그인 페이지로 리디렉션
  if (!user || error) {
    redirect('/signin?returnUrl=/settings/profile');
  }
  
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