import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// 서버 컴포넌트에서 직접 리다이렉션 처리
export default function ShortsIndexPage() {
  // 서버에서 실행될 때는 바로 리다이렉션
  redirect('/shorts');
  
  // 아래 코드는 실행되지 않지만 반환값이 필요함
  return null;
} 