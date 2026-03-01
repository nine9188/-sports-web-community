interface TeamLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function TeamLayout({
  children
}: TeamLayoutProps) {
  try {
    return (
      <div className="min-h-screen w-full">
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