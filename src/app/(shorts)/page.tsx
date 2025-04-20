import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

// 서버 컴포넌트에서 직접 리다이렉션 처리
export default async function ShortsIndexPage() {
  // 리다이렉션 처리 개선
  return redirect('/shorts');
} 