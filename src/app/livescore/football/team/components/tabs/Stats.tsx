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
    <div className="space-y-6">
      {/* 2. 리그 정보 + 기본 통계 (한 줄에 4개 카드) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 리그 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold mb-4">리그 정보</h4>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 relative flex-shrink-0">
              <Image
                src={safeLeague.logo || ''}
                alt={safeLeague.name || ''}
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <div>
              <p className="font-medium">{safeLeague.name || ''}</p>
              <p className="text-sm text-gray-600">시즌: {safeLeague.season || ''}</p>
              <p className="text-sm text-gray-600">국가: {safeLeague.country || ''}</p>
            </div>
          </div>
        </div>

        {/* 시즌 통계 요약 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold mb-4">시즌 통계</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{safeFixtures.wins.total}</p>
              <p className="text-sm">승</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{safeFixtures.draws.total}</p>
              <p className="text-sm">무</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{safeFixtures.loses.total}</p>
              <p className="text-sm">패</p>
            </div>
          </div>
        </div>

        {/* 득실 통계 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold mb-4">득실 통계</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{safeGoals.for.total.total}</p>
              <p className="text-sm text-gray-600">득점</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{safeGoals.against.total.total}</p>
              <p className="text-sm text-gray-600">실점</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{safeCleanSheet.total}</p>
              <p className="text-sm text-gray-600">클린시트</p>
            </div>
          </div>
        </div>

        {/* 최근 5경기 & 포메이션 */}
        <div className="space-y-4">
          {/* 최근 5경기 */}
          <div>
            <h5 className="text-sm font-semibold mb-2">최근 5경기</h5>
            <div className="flex gap-1">
              {safeStats.form
                ?.split('')
                .reverse()
                .slice(0, 5)
                .map((result, index) => (
                  <div 
                    key={index}
                    className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded ${
                      result === 'W' ? 'bg-green-100 text-green-800' : 
                      result === 'D' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {result}
                  </div>
                ))}
            </div>
          </div>

          {/* 포메이션 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-sm font-semibold">주요 포메이션</h5>
              {safeStats.lineups && safeStats.lineups.length > 2 && (
                <button 
                  onClick={() => setShowAllFormations(!showAllFormations)}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  {showAllFormations ? '접기' : '더보기'}
                </button>
              )}
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {safeStats.lineups
                  ?.sort((a, b) => b.played - a.played)
                  .slice(0, showAllFormations ? undefined : 2)
                  .map((lineup, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 text-sm font-medium">{lineup.formation}</td>
                      <td className="py-2 text-sm text-right">{lineup.played}경기</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. 홈/원정 상세 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 홈 통계 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold mb-4">홈 경기 통계</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <p className="text-xl font-bold">{safeFixtures.wins.home}</p>
                <p className="text-sm text-gray-600">승</p>
              </div>
              <div>
                <p className="text-xl font-bold">{safeFixtures.draws.home}</p>
                <p className="text-sm text-gray-600">무</p>
              </div>
              <div>
                <p className="text-xl font-bold">{safeFixtures.loses.home}</p>
                <p className="text-sm text-gray-600">패</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>득점</span>
                <span className="font-medium">{safeGoals.for.total.home}골 {safeGoals.for.average && `(평균 ${safeGoals.for.average.home})`}</span>
              </div>
              <div className="flex justify-between">
                <span>실점</span>
                <span className="font-medium">{safeGoals.against.total.home}골 {safeGoals.against.average && `(평균 ${safeGoals.against.average.home})`}</span>
              </div>
              <div className="flex justify-between">
                <span>클린시트</span>
                <span className="font-medium">{safeCleanSheet.home}회</span>
              </div>
            </div>
          </div>
        </div>

        {/* 원정 통계 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold mb-4">원정 경기 통계</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <p className="text-xl font-bold">{safeFixtures.wins.away}</p>
                <p className="text-sm text-gray-600">승</p>
              </div>
              <div>
                <p className="text-xl font-bold">{safeFixtures.draws.away}</p>
                <p className="text-sm text-gray-600">무</p>
              </div>
              <div>
                <p className="text-xl font-bold">{safeFixtures.loses.away}</p>
                <p className="text-sm text-gray-600">패</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>득점</span>
                <span className="font-medium">{safeGoals.for.total.away}골 {safeGoals.for.average && `(평균 ${safeGoals.for.average.away})`}</span>
              </div>
              <div className="flex justify-between">
                <span>실점</span>
                <span className="font-medium">{safeGoals.against.total.away}골 {safeGoals.against.average && `(평균 ${safeGoals.against.average.away})`}</span>
              </div>
              <div className="flex justify-between">
                <span>클린시트</span>
                <span className="font-medium">{safeCleanSheet.away}회</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 시간대별 득실점 */}
      {safeGoals.for.total.minute && safeGoals.against.total.minute && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold mb-4">시간대별 득실점</h4>
          <div className="space-y-6">
            {/* 득점 차트 */}
            <div>
              <p className="text-sm font-medium mb-2">득점 분포</p>
              <div className="grid grid-cols-6 gap-1">
                {Object.entries(safeGoals.for.total.minute)
                  .filter(([key]) => key !== '106-120' && key !== 'percentage')
                  .map(([time, data]) => (
                    <div key={time} className="flex flex-col items-center">
                      <div className="h-24 w-full bg-gray-100 relative">
                        <div 
                          className="absolute bottom-0 w-full bg-green-500"
                          style={{ height: `${data.percentage}` }}
                        ></div>
                      </div>
                      <span className="text-xs mt-1">{time}분</span>
                      <span className="text-xs font-medium">{data.total}골</span>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* 실점 차트 */}
            <div>
              <p className="text-sm font-medium mb-2">실점 분포</p>
              <div className="grid grid-cols-6 gap-1">
                {Object.entries(safeGoals.against.total.minute)
                  .filter(([key]) => key !== '106-120' && key !== 'percentage')
                  .map(([time, data]) => (
                    <div key={time} className="flex flex-col items-center">
                      <div className="h-24 w-full bg-gray-100 relative">
                        <div 
                          className="absolute bottom-0 w-full bg-red-500"
                          style={{ height: `${data.percentage}` }}
                        ></div>
                      </div>
                      <span className="text-xs mt-1">{time}분</span>
                      <span className="text-xs font-medium">{data.total}골</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. 시즌 기록 */}
      {safeStats.biggest && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold mb-4">시즌 기록</h4>
          <div className="grid grid-cols-3 gap-6">
            {/* 연속 기록 */}
            <div className="border-r border-gray-100 pr-6">
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
            <div className="border-r border-gray-100 pr-6">
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
            <div>
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

      {/* 6. 기타 통계 (페널티, 무득점, 카드) */}
      <div className="grid grid-cols-3 gap-6">
        {/* 왼쪽 열: 페널티 & 무득점 통계 */}
        <div className="h-full flex flex-col">
          {/* 페널티 통계 */}
          {safeStats.penalty && (
            <div className="bg-white rounded-lg shadow-sm p-6 flex-1">
              <h4 className="text-lg font-semibold mb-4">페널티 통계</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>총 페널티</span>
                  <span className="font-medium">{safeStats.penalty.total}개</span>
                </div>
                <div className="flex justify-between">
                  <span>성공</span>
                  <span className="font-medium">{safeStats.penalty.scored.total}개 ({safeStats.penalty.scored.percentage})</span>
                </div>
                <div className="flex justify-between">
                  <span>실패</span>
                  <span className="font-medium">{safeStats.penalty.missed.total}개 ({safeStats.penalty.missed.percentage})</span>
                </div>
              </div>
            </div>
          )}

          {/* 무득점 경기 */}
          {safeStats.failed_to_score && (
            <div className="bg-white rounded-lg shadow-sm p-6 flex-1 mt-6">
              <h4 className="text-lg font-semibold mb-4">무득점 경기</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>홈</span>
                  <span className="font-medium">{safeStats.failed_to_score.home}경기</span>
                </div>
                <div className="flex justify-between">
                  <span>원정</span>
                  <span className="font-medium">{safeStats.failed_to_score.away}경기</span>
                </div>
                <div className="flex justify-between">
                  <span>전체</span>
                  <span className="font-medium">{safeStats.failed_to_score.total}경기</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 중앙 & 오른쪽 열: 카드 통계 */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 h-full">
            <h4 className="text-lg font-semibold mb-4">카드 통계</h4>
            <div className="grid grid-cols-2 gap-6">
              {/* 경고 카드 */}
              <div>
                <h5 className="text-sm font-semibold mb-3">경고 카드🟨</h5>
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
                          <span className="text-sm w-20">{time}분</span>
                          <div className="flex-1 h-8 bg-gray-100 relative">
                            <div 
                              className="absolute inset-y-0 left-0 bg-yellow-400"
                              style={{ width: `${ratio}%` }}
                            />
                            <div className="absolute inset-0 flex justify-end items-center px-3">
                              <span className="text-sm font-medium">{data.total}장</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 퇴장 카드 */}
              <div>
                <h5 className="text-sm font-semibold mb-3">퇴장 카드🟥</h5>
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
                          <span className="text-sm w-20">{time}분</span>
                          <div className="flex-1 h-8 bg-gray-100 relative">
                            <div 
                              className="absolute inset-y-0 left-0 bg-red-500"
                              style={{ width: `${ratio}%` }}
                            />
                            <div className="absolute inset-0 flex justify-end items-center px-3">
                              <span className="text-sm font-medium">{data.total}장</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 