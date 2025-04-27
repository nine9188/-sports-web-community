// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';
export const revalidate = 0;

interface TeamLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function TeamLayout({
  children
}: TeamLayoutProps) {
  try {
    return (
      <div className="bg-white min-h-screen w-full">
        <div>
          {children}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Team layout error:', error);
    // 에러 상태는 TeamPage의 error.tsx에서 처리됨
    throw error;
  }
} 