import { Metadata } from 'next';
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
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
