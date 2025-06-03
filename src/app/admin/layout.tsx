import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/domains/auth/actions';
import AdminLayoutClient from './components/AdminLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버에서 인증 체크
  const { user, profile } = await getCurrentUser();
  
  // 로그인하지 않은 사용자 처리
  if (!user) {
    redirect('/signin?redirect=/admin&message=관리자 권한이 필요합니다');
  }
  
  // 관리자 권한 체크 (프로필의 is_admin 필드 포함)
  const isAdmin = profile?.is_admin === true || 
                  user.user_metadata?.role === 'admin' || 
                  user.email === process.env.ADMIN_EMAIL;
  
  if (!isAdmin) {
    redirect('/?message=관리자 권한이 없습니다');
  }

  return (
    <AdminLayoutClient user={user}>
      {children}
    </AdminLayoutClient>
  );
} 