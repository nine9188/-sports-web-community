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