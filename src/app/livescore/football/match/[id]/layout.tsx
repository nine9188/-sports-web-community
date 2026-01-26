import { Metadata } from 'next';

// 메타데이터 정의
export const metadata: Metadata = {
  title: '경기 정보 - 라이브스코어',
  description: '축구 경기의 상세 정보, 이벤트, 라인업, 통계 및 순위를 확인하세요.',
};

// 매치 전용 레이아웃 컴포넌트
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