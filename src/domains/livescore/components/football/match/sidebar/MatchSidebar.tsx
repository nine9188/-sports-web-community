'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type SidebarData } from '@/domains/livescore/actions/match/sidebarData';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';

// 매치 데이터 타입 정의
interface MatchDataType {
  fixture?: {
    date?: string;
    timezone?: string;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
    };
    venue?: {
      id?: number;
      name?: string;
      city?: string;
    };
    referee?: string;
    periods?: {
      first?: number;
      second?: number;
    };
  };
  league?: {
    id?: number;
    name?: string;
    name_ko?: string;
    country?: string;
    season?: number;
    round?: string;
    logo?: string;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
    };
    away?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
    };
  };
}

// 승무패 예측 섹션 컴포넌트 - 클라이언트 컴포넌트로 분리
import MatchPredictionClient from './MatchPredictionClient';
import SupportCommentsSection from './SupportCommentsSection';

// 매치 정보 섹션 컴포넌트 - export 추가
export function MatchInfoSection({ 
  initialData, 
  showOnlyMatchInfo = false,
  sidebarData
}: { 
  initialData?: MatchDataType | null;
  showOnlyMatchInfo?: boolean;
  sidebarData?: SidebarData | null;
}) {
  const pathname = usePathname();
  const [matchData, setMatchData] = useState<MatchDataType | null>(initialData || null);
  const [error, setError] = useState<string | null>(null);

  // URL에서 매치 ID 추출
  const matchId = pathname?.split('/').pop();

  useEffect(() => {
    // initialData가 있으면 우선적으로 사용 - 즉시 렌더링
    if (initialData) {
      setMatchData(initialData);
      return;
    }

    // sidebarData가 있으면 그것을 사용
    if (sidebarData?.matchData) {
      setMatchData(sidebarData.matchData as MatchDataType);
      return;
    }

    // 데이터가 없으면 에러 표시
    if (!matchId) {
      setError('경기 ID를 찾을 수 없습니다.');
      return;
    }

    setError('경기 데이터를 불러올 수 없습니다.');
  }, [matchId, initialData, sidebarData]);

  // 에러 상태
  if (error) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
        <ContainerHeader>
          <ContainerTitle className="text-red-700 dark:text-red-400">오류 발생</ContainerTitle>
        </ContainerHeader>
        <div className="p-4">
          <div className="text-center text-sm text-red-500 dark:text-red-400 py-4">
            {error}
          </div>
        </div>
      </Container>
    );
  }

  // 데이터가 없는 경우
  if (!matchData) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
        <ContainerHeader>
          <ContainerTitle>경기 상세정보</ContainerTitle>
        </ContainerHeader>
        <div className="px-4 py-4">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            경기 정보를 찾을 수 없습니다.
          </div>
        </div>
      </Container>
    );
  }

  const fixture = matchData.fixture;
  const league = matchData.league;
  const venue = fixture?.venue;

  // 시즌 포맷팅
  const formatSeason = (season?: number) => {
    if (!season) return '정보 없음';
    return `${season}/${season + 1}`;
  };

  // 라운드 포맷팅
  const formatRound = (round?: string) => {
    if (!round) return '정보 없음';
    // "Regular Season - 15" -> "15라운드"
    if (round.includes('Regular Season')) {
      const roundNumber = round.split(' - ')[1];
      return roundNumber ? `${roundNumber}라운드` : round;
    }
    return round;
  };
  
  return (
    <>
      {/* 경기 상세정보 섹션 */}
      <Container className="bg-white dark:bg-[#1D1D1D] rounded-none md:rounded-lg mb-3">
        {/* 헤더 */}
        <ContainerHeader className="md:rounded-t-lg">
          <ContainerTitle>경기 상세정보</ContainerTitle>
        </ContainerHeader>

        {/* 경기 상세 정보 */}
        <div className="px-4 py-3">
          <div className="space-y-2.5 text-sm">
            {/* 리그 정보 */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">리그</span>
              <span className="font-medium text-gray-900 dark:text-[#F0F0F0] text-right">
                {league?.name_ko || league?.name || '정보 없음'}
              </span>
            </div>

            {/* 시즌 */}
            {league?.season && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">시즌</span>
                <span className="font-medium text-gray-900 dark:text-[#F0F0F0] text-right">
                  {formatSeason(league.season)}
                </span>
              </div>
            )}

            {/* 라운드 */}
            {league?.round && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">라운드</span>
                <span className="font-medium text-gray-900 dark:text-[#F0F0F0] text-right">
                  {formatRound(league.round)}
                </span>
              </div>
            )}

            {/* 경기장 */}
            {venue?.name && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">경기장</span>
                <span className="font-medium text-gray-900 dark:text-[#F0F0F0] text-right">
                  {venue.name}
                </span>
              </div>
            )}

            {/* 도시 */}
            {venue?.city && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">도시</span>
                <span className="font-medium text-gray-900 dark:text-[#F0F0F0] text-right">
                  {venue.city}
                </span>
              </div>
            )}

            {/* 심판 */}
            {fixture?.referee && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">심판</span>
                <span className="font-medium text-gray-900 dark:text-[#F0F0F0] text-right">
                  {fixture.referee}
                </span>
              </div>
            )}

            {/* 경기 시간 */}
            {fixture?.date && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">경기 시간</span>
                <span className="font-medium text-gray-900 dark:text-[#F0F0F0] text-right">
                  {new Date(fixture.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Seoul'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* showOnlyMatchInfo가 false일 때만 승무패 예측과 응원 댓글 표시 */}
      {!showOnlyMatchInfo && (
        <>
          {/* 승무패 예측 섹션 - 클라이언트 컴포넌트 */}
          <MatchPredictionClient 
            matchData={matchData} 
            initialPrediction={sidebarData?.userPrediction}
            initialStats={sidebarData?.predictionStats}
          />
          
          {/* 응원 댓글 섹션 - 클라이언트 컴포넌트 */}
          <SupportCommentsSection 
            matchData={matchData} 
            initialComments={sidebarData?.comments}
          />
        </>
      )}
    </>
  );
}

// 메인 매치 사이드바 컴포넌트
export default function MatchSidebar({ 
  initialData,
  sidebarData 
}: { 
  initialData?: MatchDataType | null;
  sidebarData?: SidebarData | null;
}) {
  return (
    <aside className="hidden xl:block w-[300px] shrink-0">
      <div className="h-full pt-4">
        {/* 경기 정보 섹션 */}
        <MatchInfoSection 
          initialData={initialData} 
          sidebarData={sidebarData}
        />
      </div>
    </aside>
  );
} 