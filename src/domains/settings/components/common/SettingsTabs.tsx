'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Tabs, { TabItem } from '@/shared/ui/tabs';

/**
 * 설정 페이지 탭 네비게이션 컴포넌트
 * 현재 경로에 따라 활성화된 탭을 표시합니다.
 */
export default function SettingsTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const [isChangingTab, setIsChangingTab] = useState(false);
  
  // 탭 목록 정의
  const tabs: TabItem[] = [
    { id: '/settings/profile', label: '기본 정보' },
    { id: '/settings/password', label: '비밀번호 변경' },
    { id: '/settings/icons', label: '프로필 아이콘' },
    { id: '/settings/points', label: '포인트 내역' },
    { id: '/settings/exp', label: '경험치 내역' },
    { id: '/settings/my-posts', label: '내가 쓴 글' },
    { id: '/settings/my-comments', label: '내가 쓴 댓글' },
    { id: '/settings/account-delete', label: '회원 탈퇴' },
  ];
  
  // 탭 변경 처리 - useCallback으로 최적화
  const handleTabChange = useCallback((href: string) => {
    // 같은 탭이면 이동하지 않음
    if (pathname === href || isChangingTab) return;
    
    setIsChangingTab(true);
    router.push(href, { scroll: false }); // scroll: false로 불필요한 스크롤 방지
    
    // 페이지 이동 후 상태 초기화 (항상 실행되지 않을 수 있어 타임아웃 추가)
    setTimeout(() => {
      setIsChangingTab(false);
    }, 500);
  }, [pathname, router, isChangingTab]);
  
  return (
    <Tabs
      tabs={tabs}
      activeTab={pathname}
      onTabChange={handleTabChange}
      isChangingTab={isChangingTab}
      className="mt-4 md:mt-0"
    />
  );
} 