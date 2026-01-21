'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/shared/context/AuthContext';
import { Coins, TrendingUp, Users, Home, LayoutDashboard, ShoppingBag, AlertTriangle, Target, FileText, Settings, Grid3x3, Bell, Pin } from 'lucide-react';

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // 관리자 메뉴 항목
  const menuItems = [
    { path: '/admin', label: '대시보드', icon: <LayoutDashboard className="w-5 h-5 mr-2" /> },
    { path: '/admin/site-management', label: '사이트 관리', icon: <Settings className="w-5 h-5 mr-2" /> },
    { path: '/admin/users', label: '사용자 관리', icon: <Users className="w-5 h-5 mr-2" /> },
    { path: '/admin/boards', label: '게시판 관리', icon: <Home className="w-5 h-5 mr-2" /> },
    { path: '/admin/notices', label: '공지사항 관리', icon: <Pin className="w-5 h-5 mr-2" /> },
    { path: '/admin/widgets/board-collection', label: '게시판 모음 위젯', icon: <Grid3x3 className="w-5 h-5 mr-2" /> },
    { path: '/admin/notifications', label: '공지 발송', icon: <Bell className="w-5 h-5 mr-2" /> },
    { path: '/admin/reports', label: '신고 관리', icon: <AlertTriangle className="w-5 h-5 mr-2" /> },
    { path: '/admin/logs', label: '로그 관리', icon: <FileText className="w-5 h-5 mr-2" /> },
    { path: '/admin/points', label: '포인트 관리', icon: <Coins className="w-5 h-5 mr-2" /> },
    { path: '/admin/exp', label: '경험치/레벨 관리', icon: <TrendingUp className="w-5 h-5 mr-2" /> },
    { path: '/admin/shop', label: '아이콘 상점', icon: <ShoppingBag className="w-5 h-5 mr-2" /> },
    { path: '/admin/prediction', label: '예측 분석', icon: <Target className="w-5 h-5 mr-2" /> },
    { path: '/', label: '사이트로 돌아가기', icon: <Home className="w-5 h-5 mr-2" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#121212]">
      {/* 관리자 헤더 */}
      <header className="bg-white dark:bg-[#1D1D1D] border-b border-black/7 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">관리자 페이지</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">시스템 관리 및 설정을 위한 관리자 전용 페이지입니다.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 border border-black/7 dark:border-white/10 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#262626] hover:bg-[#F5F5F5] dark:hover:bg-[#2D2D2D] transition-colors"
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
            <nav className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
              <div className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {menuItems.slice(0, -1).map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === item.path
                          ? 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:bg-[#F5F5F5] dark:hover:bg-[#262626]'
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
          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
