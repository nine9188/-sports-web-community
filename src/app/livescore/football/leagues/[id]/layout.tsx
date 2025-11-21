// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';
export const revalidate = 0;

interface LeagueLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function LeagueLayout({
  children
}: LeagueLayoutProps) {
  try {
    return (
      <div className="min-h-screen w-full">
        <div>
          {children}
        </div>
      </div>
    );
  } catch (error) {
    console.error('League layout error:', error);
    // 에러 상태는 LeaguePage의 error.tsx에서 처리됨
    throw error;
  }
} 