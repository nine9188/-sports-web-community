import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';
export const revalidate = 0;

// 메인 페이지는 항상 이벤트 탭으로 리다이렉트
export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/livescore/football/match/${id}/events`);
}