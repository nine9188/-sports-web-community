'use client';

import { useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { TabList, type TabItem } from '@/shared/components/ui';

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

/**
 * 설정 페이지 탭 네비게이션 컴포넌트
 * 현재 경로에 따라 활성화된 탭을 표시합니다.
 */
export default function SettingsTabs() {
  const pathname = usePathname();
  const router = useRouter();

  // 모든 탭 페이지를 미리 로드
  useEffect(() => {
    tabs.forEach((tab) => {
      if (tab.id !== pathname) {
        router.prefetch(tab.id);
      }
    });
  }, [pathname, router]);

  // 탭 변경 처리
  const handleTabChange = useCallback((href: string) => {
    if (pathname === href) return;
    router.push(href, { scroll: false });
  }, [pathname, router]);

  return (
    <TabList
      tabs={tabs}
      activeTab={pathname}
      onTabChange={handleTabChange}
    />
  );
}
