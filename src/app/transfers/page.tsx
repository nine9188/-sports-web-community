import { Suspense } from 'react';
import { Metadata } from 'next';
import { TransfersPageContent } from '@/domains/livescore/components/football/transfers';

export const metadata: Metadata = {
  title: '이적시장 | 축구 이적 소식',
  description: '최신 축구 이적 소식, 영입 정보, 방출 소식을 실시간으로 확인하세요.',
  keywords: ['이적시장', '축구 이적', '영입', '방출', '선수 이적', '프리미어리그', '라리가'],
};

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
    <div className="min-h-screen bg-white">
      {/* 헤더 섹션 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-4 md:mt-0">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">이적시장</h1>
              <p className="mt-1 text-gray-600 text-sm">
                최신 축구 이적 소식과 선수 영입 정보를 확인하세요
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">실시간 업데이트</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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