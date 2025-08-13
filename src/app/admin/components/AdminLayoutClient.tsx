'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/shared/api/supabase';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { Coins, TrendingUp, Users, Home, LayoutDashboard, ShoppingBag, Rss, Youtube, AlertTriangle, Target, Image as ImageIcon, FileText, MessageCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: User;
}

export default function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const isAdminConfirmed = useRef(false);

  useEffect(() => {
    setMounted(true);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    { path: '/admin/banners', label: '배너 관리', icon: <ImageIcon className="w-5 h-5 mr-2" /> },
    { path: '/admin/reports', label: '신고 관리', icon: <AlertTriangle className="w-5 h-5 mr-2" /> },
    { path: '/admin/logs', label: '로그 관리', icon: <FileText className="w-5 h-5 mr-2" /> },
    { path: '/admin/points', label: '포인트 관리', icon: <Coins className="w-5 h-5 mr-2" /> },
    { path: '/admin/exp', label: '경험치/레벨 관리', icon: <TrendingUp className="w-5 h-5 mr-2" /> },
    { path: '/admin/shop', label: '아이콘 상점', icon: <ShoppingBag className="w-5 h-5 mr-2" /> },
    { path: '/admin/rss', label: 'RSS 관리', icon: <Rss className="w-5 h-5 mr-2" /> },
    { path: '/admin/prediction', label: '예측 분석', icon: <Target className="w-5 h-5 mr-2" /> },
    { path: '/admin/youtube', label: '유튜브 크롤러', icon: <Youtube className="w-5 h-5 mr-2" /> },
    { path: '/admin/chatbot', label: '챗봇 칩 관리', icon: <LayoutDashboard className="w-5 h-5 mr-2" /> },
    { path: '/admin/chatbot/live-chat', label: '실시간 상담', icon: <MessageCircle className="w-5 h-5 mr-2" /> },
    { path: '/', label: '사이트로 돌아가기', icon: <Home className="w-5 h-5 mr-2" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 관리자 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
              <p className="text-sm text-gray-600">시스템 관리 및 설정을 위한 관리자 전용 페이지입니다.</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                관리자: {user.email}
              </span>
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Home className="w-4 h-4 mr-2" />
                사이트로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 관리자 네비게이션 메뉴 */}
          <div className="mb-8">
            <nav className="bg-white rounded-lg shadow-sm border">
              <div className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {menuItems.slice(0, -1).map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === item.path
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
          
          {/* 페이지 컨텐츠 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 