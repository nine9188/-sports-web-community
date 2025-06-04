import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/domains/auth/actions';
import AdminLayoutClient from './components/AdminLayoutClient';
import { Suspense } from 'react';

// 로딩 컴포넌트
function AdminLoadingComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">관리자 권한을 확인하는 중입니다...</p>
      </div>
    </div>
  );
}

// 실제 권한 확인 컴포넌트
async function AdminAuthChecker({ children }: { children: React.ReactNode }) {
  try {
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
  } catch (error) {
    console.error('관리자 권한 확인 중 오류:', error);
    redirect('/?message=권한 확인 중 오류가 발생했습니다');
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminLoadingComponent />}>
      <AdminAuthChecker>
        {children}
      </AdminAuthChecker>
    </Suspense>
  );
} 