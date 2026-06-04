'use client';

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

function formatKoreanDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seoulDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = seoulDate.getUTCFullYear();
  const month = seoulDate.getUTCMonth() + 1;
  const day = seoulDate.getUTCDate();
  const hour24 = seoulDate.getUTCHours();
  const minute = seoulDate.getUTCMinutes();
  const period = hour24 < 12 ? '오전' : '오후';
  const hour12 = hour24 % 12 || 12;

  return `${year}년 ${month}월 ${day}일 ${period} ${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// 승무패 예측 섹션 컴포넌트 - 클라이언트 컴포넌트로 분리
import MatchPredictionClient from './MatchPredictionClient';
import SupportCommentsSection from './SupportCommentsSection';
import HighlightBanner from '../HighlightBanner';
import type { MatchHighlight } from '@/domains/livescore/types/highlight';

// 매치 정보 섹션 컴포넌트 - export 추가
export function MatchInfoSection({
  matchId,
  initialData,
  showOnlyMatchInfo = false,
  showMatchInfo = true,
  sidebarData,
  teamLogoUrls,
  highlight,
}: {
  matchId: string;
  initialData?: MatchDataType | null;
  showOnlyMatchInfo?: boolean;
  showMatchInfo?: boolean;
  sidebarData?: SidebarData | null;
  teamLogoUrls?: Record<number, string>;
  highlight?: MatchHighlight | null;
}) {
  const [matchData, setMatchData] = useState<MatchDataType | null>(initialData || null);
  const [error, setError] = useState<string | null>(null);

  // URL에서 매치 ID 추출
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
          <div className="text-center text-[13px] text-red-500 dark:text-red-400 py-4">
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
          <div className="text-center text-[13px] text-gray-500 dark:text-gray-400 py-4">
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
      {showMatchInfo && (
      <Container className="bg-white dark:bg-[#1D1D1D] rounded-none md:rounded-lg mb-4">
        {/* 헤더 */}
        <ContainerHeader className="md:rounded-t-lg">
          <ContainerTitle>경기 상세정보</ContainerTitle>
        </ContainerHeader>

        {/* 경기 상세 정보 */}
        <div className="px-4 py-3">
          <div className="space-y-2.5 text-[13px]">
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
                  {formatKoreanDateTime(fixture.date)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Container>
      )}

      {/* showOnlyMatchInfo가 false일 때만 승무패 예측과 응원 댓글 표시 */}
      {!showOnlyMatchInfo && (
        <>
          <HighlightBanner highlight={highlight ?? null} mode="modal" />

          {/* 승무패 예측 섹션 - 클라이언트 컴포넌트 */}
          <MatchPredictionClient
            matchId={matchId}
            matchData={matchData}
            initialPrediction={sidebarData?.userPrediction}
            initialStats={sidebarData?.predictionStats}
            teamLogoUrls={teamLogoUrls}
          />
          
          {/* 응원 댓글 섹션 - 클라이언트 컴포넌트 */}
          <SupportCommentsSection
            matchId={matchId}
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
  matchId,
  initialData,
  sidebarData,
  showMatchInfo = true,
  showExtras = true,
  teamLogoUrls,
  highlight,
}: { 
  matchId: string;
  initialData?: MatchDataType | null;
  sidebarData?: SidebarData | null;
  showMatchInfo?: boolean;
  showExtras?: boolean;
  teamLogoUrls?: Record<number, string>;
  highlight?: MatchHighlight | null;
}) {
  return (
    <div>
      <div>
        {/* 경기 정보 섹션 */}
        <MatchInfoSection 
          matchId={matchId}
          initialData={initialData} 
          sidebarData={sidebarData}
          showMatchInfo={showMatchInfo}
          showOnlyMatchInfo={!showExtras}
          teamLogoUrls={teamLogoUrls}
          highlight={highlight}
        />
      </div>
    </div>
  );
} 
