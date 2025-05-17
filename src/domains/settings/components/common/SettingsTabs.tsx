'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface SettingsTab {
  href: string;
  label: string;
}

/**
 * 설정 페이지 탭 네비게이션 컴포넌트
 * 현재 경로에 따라 활성화된 탭을 표시합니다.
 */
export default function SettingsTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const [isChangingTab, setIsChangingTab] = useState(false);
  
  // 탭 목록 정의
  const tabs: SettingsTab[] = [
    { href: '/settings/profile', label: '기본 정보' },
    { href: '/settings/password', label: '비밀번호 변경' },
    { href: '/settings/icons', label: '프로필 아이콘' },
    { href: '/settings/points', label: '포인트 내역' },
    { href: '/settings/exp', label: '경험치 내역' },
    { href: '/settings/my-posts', label: '내가 쓴 글' },
    { href: '/settings/my-comments', label: '내가 쓴 댓글' },
    { href: '/settings/account-delete', label: '회원 탈퇴' },
  ];
  
  // 현재 탭이 활성화되어 있는지 확인하는 함수
  const isTabActive = (href: string) => pathname === href;
  
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
    <div className="mb-4">
      <div className="bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab.href);
          
          return (
            <button
              key={tab.href}
              onClick={() => handleTabChange(tab.href)}
              className={`px-4 py-3 text-sm font-medium flex-1 whitespace-nowrap ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-current={isActive ? 'page' : undefined}
              disabled={isChangingTab}
            >
              {tab.label}
              {isChangingTab && isActive && (
                <span className="ml-1 inline-block h-3 w-3 animate-pulse rounded-full bg-blue-200"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 