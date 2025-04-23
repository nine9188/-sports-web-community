import { redirect } from 'next/navigation';

export default async function StatsRedirectPage({ params }: { params: { id: string } }) {
  // 파라미터 비동기적으로 가져오기
  const { id } = await params;
  
  // 메인 경로로 리다이렉트 (Parallel Route가 탭을 처리)
  redirect(`/livescore/football/team/${id}`);
} 