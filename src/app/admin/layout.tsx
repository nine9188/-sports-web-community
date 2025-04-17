'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-browser';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { UserCog, Coins, TrendingUp, Users, Home, LayoutDashboard, ChevronDown, ShoppingBag, Rss } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const isAdminConfirmed = useRef(false);

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

  // 관리자 권한 확인 및 초기 라우팅
  useEffect(() => {
    const checkAdminAccess = async () => {
      // 이미 관리자 권한 확인이 완료되었으면 다시 검사하지 않음
      if (isAdminConfirmed.current) {
        setIsAdminChecked(true);
        return;
      }
      
      if (!user) {
        toast.error('로그인이 필요합니다.');
        router.push('/signin');
        return;
      }

      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('관리자 권한 확인 오류:', error);
          toast.error('권한을 확인하는 중 오류가 발생했습니다.');
          router.push('/');
          return;
        }

        if (!profiles || !profiles.is_admin) {
          toast.error('관리자 권한이 필요합니다.');
          router.push('/');
          return;
        }

        // 관리자 권한 확인됨
        isAdminConfirmed.current = true;
        setIsAdminChecked(true);
      } catch (error) {
        console.error('권한 확인 오류:', error);
        toast.error('권한을 확인하는 중 오류가 발생했습니다.');
        router.push('/');
      }
    };

    if (mounted && user) {
      checkAdminAccess();
    } else if (mounted && !user) {
      // 사용자가 로그인하지 않은 경우
      toast.error('로그인이 필요합니다.');
      router.push('/signin');
    }
  }, [user, router, supabase, mounted]);

  if (!mounted || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>로그인 정보를 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 관리자 확인이 아직 안됐고, 이미 확인 중이 아닌 경우
  if (!isAdminChecked && !isAdminConfirmed.current) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>관리자 권한을 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 관리자 메뉴 항목
  const menuItems = [
    { path: '/admin', label: '대시보드', icon: <LayoutDashboard className="w-5 h-5 mr-2" /> },
    { path: '/admin/users', label: '사용자 관리', icon: <Users className="w-5 h-5 mr-2" /> },
    { path: '/admin/boards', label: '게시판 관리', icon: <Home className="w-5 h-5 mr-2" /> },
    { path: '/admin/points', label: '포인트 관리', icon: <Coins className="w-5 h-5 mr-2" /> },
    { path: '/admin/exp', label: '경험치/레벨 관리', icon: <TrendingUp className="w-5 h-5 mr-2" /> },
    { path: '/admin/shop', label: '아이콘 상점', icon: <ShoppingBag className="w-5 h-5 mr-2" /> },
    { path: '/admin/rss', label: 'RSS 관리', icon: <Rss className="w-5 h-5 mr-2" /> },
    { path: '/', label: '사이트로 돌아가기', icon: <Home className="w-5 h-5 mr-2" /> },
  ];

  // 메뉴 토글
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 모바일 메뉴 */}
      {isMobile && (
        <div className="w-full p-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-md shadow mb-3">
            <div className="flex items-center">
              <UserCog className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold">관리자</h1>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="p-1.5 rounded-md hover:bg-gray-100"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'transform rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* 모바일 메뉴 드롭다운 */}
          {mobileMenuOpen && (
            <div className="bg-white rounded-md shadow mb-3 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link 
                      href={item.path}
                      className={`flex items-center px-4 py-2.5 ${
                        pathname === item.path 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
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
          
          {/* 모바일 콘텐츠 */}
          <div className="bg-white rounded-md shadow p-4">
            {children}
          </div>
        </div>
      )}
      
      {/* 데스크탑 레이아웃 */}
      <div className={`${isMobile ? 'hidden' : 'flex'} flex-col md:flex-row`}>
        {/* 데스크탑 좌측 메뉴 */}
        <div className="w-full md:w-[230px] shrink-0 hidden md:block pr-3">
          <div className="bg-white rounded-md shadow p-3">
            {/* 관리자 타이틀 */}
            <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-200">
              <UserCog className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-bold">관리자</h1>
            </div>
            
            {/* 메뉴 항목들 */}
            <ul>
              {menuItems.map((item, index) => (
                <li key={item.path} className={`${index === menuItems.length - 1 ? 'mt-2 pt-2 border-t border-gray-200' : 'mb-1'}`}>
                  <Link 
                    href={item.path} 
                    className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      pathname === item.path
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
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
        
        {/* 메인 콘텐츠 */}
        <div className="flex-1">
          <div className="bg-white rounded-md shadow p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 