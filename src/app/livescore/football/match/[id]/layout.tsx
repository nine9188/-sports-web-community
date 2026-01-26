// 매치 전용 레이아웃 컴포넌트 (메타데이터는 page.tsx에서 buildMetadata()로 처리)
export default function MatchLayout({ 
  children 
}: { 
  children: React.ReactNode; 
}) {
  return (
    <>
      {children}
    </>
  );
} 