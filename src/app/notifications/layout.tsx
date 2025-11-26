import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/domains/auth/actions';

export const metadata: Metadata = {
  title: '알림',
  description: '실시간 알림 확인',
};

export const dynamic = 'force-dynamic';

// 알림 전용 레이아웃 컴포넌트
export default async function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버에서 인증 체크
  const { user } = await getCurrentUser();

  // 로그인하지 않은 사용자 처리
  if (!user) {
    redirect('/signin?redirect=/notifications&message=로그인이 필요한 페이지입니다');
  }

  return (
    <>
      {children}
    </>
  );
}
