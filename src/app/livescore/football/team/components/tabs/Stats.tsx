'use client';

import { useState } from 'react';
import Image from 'next/image';

// 상세 인터페이스 정의
interface TeamData {
  id: number;
  name: string;
}

interface GoalValue {
  total: number;
  percentage: string;
}

interface MinuteGoals {
  [key: string]: GoalValue;
}

interface GoalDetails {
  total: {
    home: number;
    away: number;
    total: number;
    minute?: MinuteGoals;
  };
  average?: {
    home: string;
    away: string;
    total: string;
  };
}

interface FixtureDetails {
  played: { home: number; away: number; total: number };
  wins: { home: number; away: number; total: number };
  draws: { home: number; away: number; total: number };
  loses: { home: number; away: number; total: number };
}

interface CleanSheetDetails {
  home: number;
  away: number;
  total: number;
}

interface LineupData {
  formation: string;
  played: number;
}

interface CardData {
  [key: string]: { total: number; percentage: string };
}

interface CardDetails {
  yellow: CardData;
  red: CardData;
}

interface BiggestStreakData {
  wins: number;
  draws: number;
  loses: number;
}

interface BiggestScoresData {
  home: string;
  away: string;
}

interface BiggestData {
  streak: BiggestStreakData;
  wins: BiggestScoresData;
  loses: BiggestScoresData;
}

interface PenaltyData {
  total: number;
  scored: { total: number; percentage: string };
  missed: { total: number; percentage: string };
}

interface FailedToScoreData {
  home: number;
  away: number;
  total: number;
}

interface LeagueData {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
}

interface StatsData {
  league: LeagueData;
  form: string;
  fixtures: FixtureDetails;
  goals: {
    for: GoalDetails;
    against: GoalDetails;
  };
  clean_sheet: CleanSheetDetails;
  lineups: LineupData[];
  cards: CardDetails;
  biggest?: BiggestData;
  penalty?: PenaltyData;
  failed_to_score?: FailedToScoreData;
}

interface OverviewProps {
  team: {
    team: TeamData;
    venue: Record<string, unknown>;
  };
  stats: StatsData;
}

export default function Overview({ stats }: Partial<OverviewProps>) {
  const [showAllFormations, setShowAllFormations] = useState(false);

  // stats 객체의 안전한 접근을 위한 기본값 제공
  const safeStats = stats || {} as StatsData;
  const safeLeague = safeStats.league || {} as LeagueData;
  const safeFixtures = safeStats.fixtures || {
    wins: { total: 0, home: 0, away: 0 },
    draws: { total: 0, home: 0, away: 0 },
    loses: { total: 0, home: 0, away: 0 },
    played: { total: 0, home: 0, away: 0 }
  };
  
  const safeGoals = safeStats.goals || {
    for: { 
      total: { total: 0, home: 0, away: 0 },
      average: { total: '0', home: '0', away: '0' }
    },
    against: { 
      total: { total: 0, home: 0, away: 0 },
      average: { total: '0', home: '0', away: '0' }
    }
  };
  
  const safeCleanSheet = safeStats.clean_sheet || { total: 0, home: 0, away: 0 };

  return (
    <div className="space-y-4">
      {/* 1. 리그 정보 + 기본 통계 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {/* 리그 정보 카드 */}
          <div className="col-span-2 md:col-span-1 border-b md:border-b-0 md:border-r border-gray-200">
            <h4 className="text-base font-semibold p-2 border-b border-gray-100">리그 정보</h4>
            <div className="flex items-center p-2">
              <div className="w-6 h-6 relative flex-shrink-0 mr-3">
              <Image
                src={safeLeague.logo || ''}
                alt={safeLeague.name || ''}
                fill
                  sizes="24px"
                className="object-contain"
              />
            </div>
            <div>
                <p className="font-medium text-sm">{safeLeague.name || ''}</p>
                <p className="text-xs text-gray-600">시즌: {safeLeague.season || ''}</p>
                <p className="text-xs text-gray-600">국가: {safeLeague.country || ''}</p>
            </div>
          </div>
        </div>

          {/* 시즌 통계 카드 */}
          <div className="border-b border-r md:border-b-0 md:border-r border-gray-200">
            <h4 className="text-base font-semibold p-2 border-b border-gray-100">시즌 통계</h4>
            <div className="grid grid-cols-3 p-2 text-center">
            <div>
                <p className="text-base font-bold">{safeFixtures.wins.total}</p>
                <p className="text-xs text-gray-500">승</p>
            </div>
            <div>
                <p className="text-base font-bold">{safeFixtures.draws.total}</p>
                <p className="text-xs text-gray-500">무</p>
            </div>
            <div>
                <p className="text-base font-bold">{safeFixtures.loses.total}</p>
                <p className="text-xs text-gray-500">패</p>
            </div>
          </div>
        </div>

          {/* 득실 통계 카드 */}
          <div className="border-b md:border-b-0 md:border-r border-gray-200">
            <h4 className="text-base font-semibold p-2 border-b border-gray-100">득실 통계</h4>
            <div className="grid grid-cols-3 p-2 text-center">
            <div>
                <p className="text-base font-bold">{safeGoals.for.total.total}</p>
                <p className="text-xs text-gray-500">득점</p>
            </div>
            <div>
                <p className="text-base font-bold">{safeGoals.against.total.total}</p>
                <p className="text-xs text-gray-500">실점</p>
            </div>
            <div>
                <p className="text-base font-bold">{safeCleanSheet.total}</p>
                <p className="text-xs text-gray-500">클린시트</p>
            </div>
          </div>
        </div>

          {/* 최근 5경기 */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-base font-semibold p-2 border-b border-gray-100">최근 5경기</h4>
            <div className="p-2 flex items-center justify-center">
              {safeStats.form
                ?.split('')
                .reverse()
                .slice(0, 5)
                .map((result, index) => (
                  <div 
                    key={index}
                    className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded mx-0.5 ${
                      result === 'W' ? 'bg-green-100 text-green-800' : 
                      result === 'D' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {result}
                  </div>
                )) || <p className="text-sm text-gray-500">데이터 없음</p>}
            </div>
          </div>
        </div>
      </div>

      {/* 홈/원정 상세 통계 */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
        {/* 홈 통계 */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <h4 className="text-base font-semibold p-2 border-b border-gray-200">홈 경기 통계</h4>
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4 mb-3">
              {/* 승무패 통계 */}
              <div className="flex-1">
                <h5 className="text-xs font-medium text-gray-500 mb-2">승무패</h5>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base font-bold">{safeFixtures.wins.home}</p>
                    <p className="text-xs text-gray-600">승</p>
                  </div>
                  <div>
                    <p className="text-base font-bold">{safeFixtures.draws.home}</p>
                    <p className="text-xs text-gray-600">무</p>
                  </div>
                  <div>
                    <p className="text-base font-bold">{safeFixtures.loses.home}</p>
                    <p className="text-xs text-gray-600">패</p>
                  </div>
                </div>
              </div>
              
              {/* 득실점 통계 */}
              <div className="flex-1">
                <h5 className="text-xs font-medium text-gray-500 mb-2">득실점</h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>득점</span>
                    <span className="font-medium">{safeGoals.for.total.home}골 {safeGoals.for.average && `(평균 ${safeGoals.for.average.home})`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>실점</span>
                    <span className="font-medium">{safeGoals.against.total.home}골 {safeGoals.against.average && `(평균 ${safeGoals.against.average.home})`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>클린시트</span>
                    <span className="font-medium">{safeCleanSheet.home}회</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 원정 통계 */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <h4 className="text-base font-semibold p-2 border-b border-gray-200">원정 경기 통계</h4>
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4 mb-3">
              {/* 승무패 통계 */}
              <div className="flex-1">
                <h5 className="text-xs font-medium text-gray-500 mb-2">승무패</h5>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base font-bold">{safeFixtures.wins.away}</p>
                    <p className="text-xs text-gray-600">승</p>
                  </div>
                  <div>
                    <p className="text-base font-bold">{safeFixtures.draws.away}</p>
                    <p className="text-xs text-gray-600">무</p>
                  </div>
                  <div>
                    <p className="text-base font-bold">{safeFixtures.loses.away}</p>
                    <p className="text-xs text-gray-600">패</p>
                  </div>
                </div>
              </div>
              
              {/* 득실점 통계 */}
              <div className="flex-1">
                <h5 className="text-xs font-medium text-gray-500 mb-2">득실점</h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>득점</span>
                    <span className="font-medium">{safeGoals.for.total.away}골 {safeGoals.for.average && `(평균 ${safeGoals.for.average.away})`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>실점</span>
                    <span className="font-medium">{safeGoals.against.total.away}골 {safeGoals.against.average && `(평균 ${safeGoals.against.average.away})`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>클린시트</span>
                    <span className="font-medium">{safeCleanSheet.away}회</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 시간대별 득실점 */}
      {safeGoals.for.total.minute && safeGoals.against.total.minute && (
        <div className="mb-4 bg-white rounded-lg border overflow-hidden">
          <h4 className="text-sm font-medium p-2 border-b border-gray-200">시간대별 득실점</h4>
          <div className="p-4">
            {/* 범례 */}
            <div className="flex items-center justify-center gap-6 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span className="text-xs font-medium">득점</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span className="text-xs font-medium">실점</span>
              </div>
            </div>
            
            {/* 시간대별 차트 */}
            <div className="space-y-2">
              {Object.entries(safeGoals.for.total.minute || {})
                .filter(([key]) => key !== '106-120' && key !== 'percentage')
                .map(([time, forData]) => {
                  const againstData = safeGoals.against.total.minute?.[time];
                  
                  // 득점과 실점 중 최대값 구하기 (최대치를 기준으로 바 길이 계산)
                  const forTotal = forData.total || 0;
                  const againstTotal = againstData?.total || 0;
                  
                  // 모든 시간대 중 최대 득점/실점 값 계산 (이 값이 100%가 됨)
                  const allForValues = Object.entries(safeGoals.for.total.minute || {})
                    .filter(([key]) => key !== '106-120' && key !== 'percentage')
                    .map(([, data]) => data.total);
                  
                  const allAgainstValues = Object.entries(safeGoals.against.total.minute || {})
                    .filter(([key]) => key !== '106-120' && key !== 'percentage')
                    .map(([, data]) => data.total);
                  
                  const maxForValue = Math.max(...allForValues, 1);
                  const maxAgainstValue = Math.max(...allAgainstValues, 1);
                  
                  // 각 시간대별 비율 계산
                  const forPercentage = (forTotal / maxForValue) * 100;
                  const againstPercentage = (againstTotal / maxAgainstValue) * 100;
                  
                  return (
                    <div key={time} className="flex flex-col gap-1">
                      <div className="flex justify-center">
                        <span className="text-xs font-medium text-gray-700">{time}분</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1">
                        {/* 득점 바 */}
                        <div className="flex items-center">
                          <div className="flex-1 h-6 bg-gray-100 rounded-sm relative overflow-hidden">
                            <div 
                              className="absolute inset-y-0 right-0 bg-green-500 flex items-center justify-start pl-1 rounded-sm"
                              style={{ width: `${forPercentage}%` }}
                            >
                              {forTotal > 0 && (
                                <span className="text-xs font-medium text-white">{forTotal}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* 실점 바 */}
                        <div className="flex items-center">
                          <div className="flex-1 h-6 bg-gray-100 rounded-sm relative overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-red-500 flex items-center justify-end pr-1 rounded-sm"
                              style={{ width: `${againstPercentage}%` }}
                            >
                              {againstTotal > 0 && (
                                <span className="text-xs font-medium text-white">{againstTotal}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 시즌 기록 */}
      {safeStats.biggest && (
        <div className="mb-4 bg-white rounded-lg border overflow-hidden">
          <h4 className="text-sm font-medium p-2 border-b border-gray-200">시즌 기록</h4>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* 연속 기록 */}
            <div className="md:border-r md:border-gray-200 md:pr-4">
              <h5 className="text-sm font-bold mb-3">연속 기록</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>최다 연승</span>
                  <span className="font-medium">{safeStats.biggest.streak.wins}경기</span>
                </div>
                <div className="flex justify-between">
                  <span>최다 연속 무</span>
                  <span className="font-medium">{safeStats.biggest.streak.draws}경기</span>
                </div>
                <div className="flex justify-between">
                  <span>최다 연패</span>
                  <span className="font-medium">{safeStats.biggest.streak.loses}경기</span>
                </div>
              </div>
            </div>

            {/* 최다 득점 */}
            <div className="md:border-r md:border-gray-200 md:pr-4">
              <h5 className="text-sm font-bold mb-3">최다 득점</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>홈</span>
                  <span className="font-medium">{safeStats.biggest.wins.home}</span>
                </div>
                <div className="flex justify-between">
                  <span>원정</span>
                  <span className="font-medium">{safeStats.biggest.wins.away}</span>
                </div>
              </div>
            </div>

            {/* 최다 실점 */}
            <div className="col-span-2 md:col-span-1 mt-4 md:mt-0">
              <h5 className="text-sm font-bold mb-3">최다 실점</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>홈</span>
                  <span className="font-medium">{safeStats.biggest.loses.home}</span>
                </div>
                <div className="flex justify-between">
                  <span>원정</span>
                  <span className="font-medium">{safeStats.biggest.loses.away}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 기타 통계 (페널티, 무득점, 카드) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* 왼쪽 열: 포메이션 */}
        <div className="md:col-span-2">
          {/* 포메이션 정보 */}
          <div className="bg-white rounded-lg border overflow-hidden h-full">
            <h4 className="text-sm font-medium p-2 border-b border-gray-200">주요 포메이션</h4>
            <div className="p-4">
              {safeStats.lineups && safeStats.lineups.length > 0 ? (
                <div>
                  <div className="space-y-2">
                    {safeStats.lineups
                      ?.sort((a, b) => b.played - a.played)
                      .slice(0, showAllFormations ? undefined : 5)
                      .map((lineup, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-sm font-medium w-20">{lineup.formation}</span>
                          <div className="flex-1 flex items-center">
                            <div className="relative w-full h-4 bg-gray-100 rounded-sm overflow-hidden">
                              <div 
                                className="absolute inset-y-0 left-0 bg-blue-500 rounded-sm"
                                style={{ 
                                  width: `${(lineup.played / Math.max(...safeStats.lineups.map(l => l.played))) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 ml-2 w-14 text-right">{lineup.played}경기</span>
                          </div>
                        </div>
                      ))}
                  </div>
                  {safeStats.lineups.length > 5 && (
                    <div className="mt-3 text-center">
                      <button 
                        onClick={() => setShowAllFormations(!showAllFormations)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {showAllFormations ? '접기' : '더보기'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-center text-gray-500">포메이션 데이터가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽 열: 카드 통계 */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-lg border overflow-hidden h-full">
            <h4 className="text-sm font-medium p-2 border-b border-gray-200">카드 통계</h4>
            <div className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
                {/* 왼쪽: 경고 카드 + 페널티 */}
                <div className="space-y-3">
                  {/* 경고 카드 */}
                  <div>
                    <h5 className="text-sm font-semibold mb-1">경고 카드</h5>
                    <div className="space-y-1">
                      {Object.entries(safeStats.cards?.yellow || {})
                        .filter(([key]) => key !== '' && key !== '106-120')
                        .map(([time, data]) => {
                          const maxCards = Math.max(...Object.values(safeStats.cards?.yellow || {})
                            .filter(v => v.total !== null)
                            .map(v => v.total));
                          const ratio = maxCards > 0 ? (data.total / maxCards) * 100 : 0;
                          
                          return (
                            <div key={time} className="flex justify-between items-center">
                              <span className="text-xs w-14">{time}분</span>
                              <div className="flex-1 h-6 bg-gray-100 rounded-sm relative overflow-hidden">
                                <div 
                                  className="absolute inset-y-0 left-0 bg-yellow-400 flex items-center justify-end pr-1"
                                  style={{ width: `${ratio}%` }}
                                >
                                  {data.total > 0 && ratio > 15 && (
                                    <span className="text-xs font-medium text-yellow-800">{data.total}장</span>
                                  )}
                                </div>
                                {(data.total === 0 || ratio <= 15) && (
                                  <div className="absolute inset-0 flex justify-end items-center px-2">
                                    <span className="text-xs font-medium text-gray-600">{data.total}장</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  
                  {/* 페널티 통계 (간소화된 버전) */}
                  {safeStats.penalty && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold mb-1">페널티</h5>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div className="bg-gray-50 p-1 rounded">
                          <p className="text-sm font-bold">{safeStats.penalty.total}</p>
                          <p className="text-xs text-gray-600">총계</p>
                        </div>
                        <div className="bg-green-50 p-1 rounded">
                          <p className="text-sm font-bold text-green-700">{safeStats.penalty.scored.total}</p>
                          <p className="text-xs text-gray-600">성공</p>
                        </div>
                        <div className="bg-red-50 p-1 rounded">
                          <p className="text-sm font-bold text-red-700">{safeStats.penalty.missed.total}</p>
                          <p className="text-xs text-gray-600">실패</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 오른쪽: 퇴장 카드 + 무득점 */}
                <div className="space-y-3">
                  {/* 퇴장 카드 */}
                  <div>
                    <h5 className="text-sm font-semibold mb-1">퇴장 카드</h5>
                    <div className="space-y-1">
                      {Object.entries(safeStats.cards?.red || {})
                        .filter(([key, data]) => key !== '' && key !== '106-120' && data.total !== null)
                        .map(([time, data]) => {
                          const maxCards = Math.max(...Object.values(safeStats.cards?.red || {})
                            .filter(v => v.total !== null)
                            .map(v => v.total));
                          const ratio = maxCards > 0 ? (data.total / maxCards) * 100 : 0;

                          return (
                            <div key={time} className="flex justify-between items-center">
                              <span className="text-xs w-14">{time}분</span>
                              <div className="flex-1 h-6 bg-gray-100 rounded-sm relative overflow-hidden">
                                <div 
                                  className="absolute inset-y-0 left-0 bg-red-500 flex items-center justify-end pr-1"
                                  style={{ width: `${ratio}%` }}
                                >
                                  {data.total > 0 && ratio > 15 && (
                                    <span className="text-xs font-medium text-white">{data.total}장</span>
                                  )}
                                </div>
                                {(data.total === 0 || ratio <= 15) && (
                                  <div className="absolute inset-0 flex justify-end items-center px-2">
                                    <span className="text-xs font-medium text-gray-600">{data.total}장</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  
                  {/* 무득점 경기 (간소화된 버전) */}
                  {safeStats.failed_to_score && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold mb-1">무득점 경기</h5>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div className="bg-gray-50 p-1 rounded">
                          <p className="text-sm font-bold">{safeStats.failed_to_score.home}</p>
                          <p className="text-xs text-gray-600">홈</p>
                        </div>
                        <div className="bg-gray-50 p-1 rounded">
                          <p className="text-sm font-bold">{safeStats.failed_to_score.away}</p>
                          <p className="text-xs text-gray-600">원정</p>
                        </div>
                        <div className="bg-gray-50 p-1 rounded">
                          <p className="text-sm font-bold">{safeStats.failed_to_score.total}</p>
                          <p className="text-xs text-gray-600">전체</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 