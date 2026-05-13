'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Coins, TrendingUp, Users, Home, LayoutDashboard, ShoppingBag, AlertTriangle, Target, FileText, Settings, Grid3x3, Bell, Pin, Database, Image as ImageIcon } from 'lucide-react';

export default function AdminLayoutClient() {
  const pathname = usePathname();

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
    { path: '/admin/emoticon-submissions', label: '이모티콘 신청', icon: <ShoppingBag className="w-5 h-5 mr-2" /> },
    { path: '/admin/prediction', label: '예측 분석', icon: <Target className="w-5 h-5 mr-2" /> },
    { path: '/admin/thumbnail', label: '썸네일 저장', icon: <ImageIcon className="w-5 h-5 mr-2" /> },
    { path: '/admin/cache-management', label: '캐시 관리', icon: <Database className="w-5 h-5 mr-2" /> },
  ];

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
              pathname === item.path
                ? 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:bg-[#F5F5F5] dark:hover:bg-[#262626]'
            }`}
            prefetch={false}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
