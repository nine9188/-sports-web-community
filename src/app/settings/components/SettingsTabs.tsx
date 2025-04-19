'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Image, DollarSign, TrendingUp, FileText, MessageSquare, UserX } from 'lucide-react';
import { cn } from '@/app/lib/utils';

// 설정 탭 정의
export type SettingsTab = 'profile' | 'password' | 'icons' | 'points' | 'exp' | 'my-posts' | 'my-comments' | 'account-delete';

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  href: string;
}

// 설정 탭 목록 정의
export const SETTINGS_TABS: TabItem[] = [
  {
    id: 'profile',
    label: '기본 정보',
    icon: <User className="h-4 w-4" />,
    description: '프로필 및 개인 정보 변경',
    href: '/settings/profile'
  },
  {
    id: 'password',
    label: '비밀번호 변경',
    icon: <Lock className="h-4 w-4" />,
    description: '계정 비밀번호 변경',
    href: '/settings/password'
  },
  {
    id: 'icons',
    label: '아이콘 관리',
    icon: <Image className="h-4 w-4" aria-label="아이콘" />,
    description: '프로필 아이콘 설정',
    href: '/settings/icons'
  },
  {
    id: 'points',
    label: '포인트 관리',
    icon: <DollarSign className="h-4 w-4" />,
    description: '포인트 내역 및 관리',
    href: '/settings/points'
  },
  {
    id: 'exp',
    label: '경험치 및 레벨',
    icon: <TrendingUp className="h-4 w-4" />,
    description: '경험치 획득 내역 및 레벨 정보',
    href: '/settings/exp'
  },
  {
    id: 'my-posts',
    label: '내가 쓴 글',
    icon: <FileText className="h-4 w-4" />,
    description: '내가 작성한 게시글 목록',
    href: '/settings/my-posts'
  },
  {
    id: 'my-comments',
    label: '내가 쓴 댓글',
    icon: <MessageSquare className="h-4 w-4" />,
    description: '내가 작성한 댓글 목록',
    href: '/settings/my-comments'
  },
  {
    id: 'account-delete',
    label: '회원 탈퇴',
    icon: <UserX className="h-4 w-4" />,
    description: '계정 삭제 및 서비스 탈퇴',
    href: '/settings/account-delete'
  }
];

const SettingsTabs = React.memo(function SettingsTabs() {
  const pathname = usePathname();
  
  // 현재 패스에서 탭 ID 추출 (useMemo로 최적화)
  const activeTab = useMemo(() => {
    const pathParts = pathname.split('/');
    const currentTab = pathParts[pathParts.length - 1];
    
    // 탭 ID가 유효한지 확인
    const validTabIds = SETTINGS_TABS.map(tab => tab.id);
    return validTabIds.includes(currentTab as SettingsTab)
      ? currentTab as SettingsTab
      : 'profile';
  }, [pathname]);

  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden">
      <div className="flex flex-wrap">
        {SETTINGS_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "px-3 py-3 flex items-center border-b-2 justify-center transition-colors sm:mt-0 mt-4",
              {
                "text-blue-600 font-medium border-blue-600": 
                  tab.id === activeTab,
                "text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-200": 
                  tab.id !== activeTab,
              }
            )}
            style={{ width: 'calc(25% - 0px)' }}
          >
            <span className="mr-1">{tab.icon}</span>
            <span className="text-xs font-medium whitespace-nowrap">{tab.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
});

export default SettingsTabs; 