import type { ReactNode } from 'react';
import '@/styles/post-content.css';

/**
 * Post Layout - 게시글 상세 전용 레이아웃
 *
 * ✅ 사이드바 없음
 * ✅ LeagueStandings, 외부 API 호출 컴포넌트 마운트 안 됨
 * ✅ 게시글이 없으면 notFound()로 API 호출 0개
 */
export default function PostLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1D1D1D]">
      {children}
    </div>
  );
}
