import { Metadata } from 'next';

// 메타데이터 정의
export const metadata: Metadata = {
  title: '선수 정보 - 라이브스코어',
  description: '축구 선수의 상세 정보, 통계, 경기 결과 및 역대 기록을 확인하세요.',
};

// 기본 레이아웃 컴포넌트
export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="py-0">
      {children}
    </div>
  );
} 