'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { User, Key, FileText, MessageSquare, UserX, Coins, TrendingUp, Image as ImageIcon } from 'lucide-react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // 모바일 메뉴 토글
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (!mounted) {
    return (
      <div className="p-4">
        <div className=" bg-gray-200 rounded animate-pulse w-40 mb-4"></div>
        <div className="flex gap-4">
          <div className="w-64 shrink-0 hidden md:block">
            <div className="bg-gray-200 h-[400px] rounded animate-pulse"></div>
          </div>
          <div className="flex-1 bg-gray-200 rounded animate-pulse h-[600px]"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <div className="p-8 text-center">
          <p>로그인이 필요한 페이지입니다.</p>
          <Link href="/signin" className="text-blue-500 hover:underline mt-2 inline-block">
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { href: '/settings/profile', label: '기본 정보', icon: <User className="h-4 w-4 mr-2" aria-hidden="true" /> },
    { href: '/settings/icons', label: '아이콘 관리', icon: <ImageIcon className="h-4 w-4 mr-2" aria-hidden="true" /> },
    { href: '/settings/password', label: '비밀번호 변경', icon: <Key className="h-4 w-4 mr-2" aria-hidden="true" /> },
    { href: '/settings/exp', label: '경험치', icon: <TrendingUp className="h-4 w-4 mr-2" aria-hidden="true" /> },
    { href: '/settings/points', label: '포인트', icon: <Coins className="h-4 w-4 mr-2" aria-hidden="true" /> },
    { href: '/settings/posts', label: '내가 쓴 글', icon: <FileText className="h-4 w-4 mr-2" aria-hidden="true" /> },
    { href: '/settings/comments', label: '내가 쓴 댓글', icon: <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" /> },
    { href: '/settings/delete', label: '회원 탈퇴', icon: <UserX className="h-4 w-4 mr-2" aria-hidden="true" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* 모바일 메뉴 토글 버튼 */}
      {isMobile && (
        <div className="mb-3">
          <button
            onClick={toggleMobileMenu}
            className="w-full flex items-center justify-between p-2.5 bg-white rounded-md shadow border"
          >
            <span className="font-medium">
              {menuItems.find(item => item.href === pathname)?.label || '메뉴 선택'}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-label={mobileMenuOpen ? '메뉴 접기' : '메뉴 펼치기'}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          {/* 모바일 메뉴 드롭다운 */}
          {mobileMenuOpen && (
            <div className="mt-1 bg-white rounded-md shadow border overflow-hidden">
              <ul className="divide-y">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      className={`flex items-center px-3 py-2 ${
                        pathname === item.href 
                          ? 'bg-slate-100 text-slate-900 font-medium' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row">
        {/* 데스크탑 좌측 메뉴 - 왼쪽 패딩 크게 줄임 */}
        <div className="w-full md:w-[220px] shrink-0 hidden md:block pr-3">
          <div className="bg-white rounded-md shadow p-3">
            <ul>
              {menuItems.map((item) => (
                <li key={item.href} className="mb-0.5">
                  <Link 
                    href={item.href}
                    className={`flex items-center px-2 py-1 text-sm rounded-md ${
                      pathname === item.href 
                        ? 'bg-slate-100 text-slate-900 font-medium' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* 우측 내용 - 좌측 패딩 줄임 */}
        <div className="flex-1">
          <div className="bg-white rounded-md shadow p-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 