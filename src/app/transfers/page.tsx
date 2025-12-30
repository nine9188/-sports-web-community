import { Suspense } from 'react';
import { TransfersPageContent } from '@/domains/livescore/components/football/transfers';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { generatePageMetadataWithDefaults } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return generatePageMetadataWithDefaults('/transfers', {
    title: '이적시장 - 4590 Football',
    description: '최신 축구 이적 소식, 영입 정보, 방출 소식을 실시간으로 확인하세요.',
  });
}

interface TransfersPageProps {
  searchParams: Promise<{
    league?: string;
    team?: string;
    season?: string;
    type?: 'in' | 'out' | 'all';
    page?: string;
  }>;
}

export default async function TransfersPage({ searchParams }: TransfersPageProps) {
  const params = await searchParams;
  
  return (
    <div className="min-h-screen">
      <TrackPageVisit id="transfers" slug="transfers" name="이적시장" />
      {/* 헤더 섹션 */}
      <Container>
        <ContainerHeader>
          <div className="flex items-center justify-between w-full">
            <ContainerTitle>이적시장</ContainerTitle>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-700 dark:text-gray-300">실시간 업데이트</span>
            </div>
          </div>
        </ContainerHeader>
        
        {/* 설명 섹션 */}
        <div className="px-4 py-3 bg-white dark:bg-[#1D1D1D]">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            최신 축구 이적 소식과 선수 영입 정보를 확인하세요
          </p>
        </div>
      </Container>

      {/* 메인 콘텐츠 */}
      <div className="mt-4">
        <Suspense fallback={<div></div>}>
          <TransfersPageContent 
            league={params.league}
            team={params.team}
            season={params.season}
            type={params.type}
            page={params.page}
          />
        </Suspense>
      </div>
    </div>
  );
}