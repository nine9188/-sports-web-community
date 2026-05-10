import { Metadata } from 'next';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { authGuard } from '@/shared/guards/auth.guard';
import AdminLayoutClient from './components/AdminLayoutClient';

export const metadata: Metadata = {
  title: '관리자 - 4590 Football',
  description: '4590 Football 관리자 페이지',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 관리자 권한 체크 (비인증/비관리자 → 로그인 페이지로 리다이렉트)
  await authGuard({
    redirectTo: '/signin',
    requireAdmin: true,
    logUnauthorizedAccess: true,
  });

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#121212]">
      <header className="bg-white dark:bg-[#1D1D1D] border-b border-black/7 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">관리자 페이지</h1>
              <p className="text-[13px] text-gray-600 dark:text-gray-400">시스템 관리 및 설정을 위한 관리자 전용 페이지입니다.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 border border-black/7 dark:border-white/10 rounded-md text-[13px] font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#262626] hover:bg-[#F5F5F5] dark:hover:bg-[#2D2D2D] transition-colors"
                prefetch={false}
              >
                <Home className="w-4 h-4 mr-2" />
                사이트로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <nav className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
              <AdminLayoutClient />
            </nav>
          </div>

          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
