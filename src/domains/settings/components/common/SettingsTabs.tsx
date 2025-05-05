'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  
  return (
    <div className="mb-6 bg-white rounded-lg border overflow-x-auto">
      <div className="flex border-b min-w-max">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab.href);
          
          return (
            <Link 
              key={tab.href} 
              href={tab.href}
              className={`
                px-4 py-2 text-sm font-medium transition-colors
                ${isActive 
                  ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
} 