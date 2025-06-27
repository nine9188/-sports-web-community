'use client';

import React from 'react';

interface TeamStats {
  name: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  goals: number;
  conceded: number;
  goalDifference: number;
  form?: string;
  injuries?: number;
}

interface BettingOdds {
  home: number;
  draw: number;
  away: number;
}

interface MatchStatsChartProps {
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  bettingOdds?: BettingOdds | null;
}

// 폼 문자열을 개별 결과로 파싱하는 함수
const parseForm = (form?: string): string[] => {
  if (!form) return [];
  // 다양한 구분자 지원: -, 공백, 쉼표 등
  return form.split(/[-\s,]+/).map(result => result.trim()).filter(Boolean);
};

// 심플한 폼 아이콘 컴포넌트
const FormIcon: React.FC<{ result: string }> = ({ result }) => {
  const getStyle = () => {
    switch (result.toUpperCase()) {
      case 'W': return 'bg-green-500 text-white';
      case 'D': return 'bg-gray-400 text-white';
      case 'L': return 'bg-red-500 text-white';
      default: return 'bg-gray-300 text-gray-600';
    }
  };

  return (
    <span className={`inline-block w-5 h-5 text-xs font-bold text-center leading-5 ${getStyle()}`}>
      {result.toUpperCase()}
    </span>
  );
};

// 비교 바 컴포넌트
const ComparisonBar: React.FC<{
  label: string;
  homeValue: number;
  awayValue: number;
  homeLabel?: string;
  awayLabel?: string;
  unit?: string;
}> = ({ label, homeValue, awayValue, homeLabel, awayLabel, unit = '' }) => {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">
          {homeLabel || `${homeValue}${unit}`}
        </span>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className="text-xs font-medium text-gray-700">
          {awayLabel || `${awayValue}${unit}`}
        </span>
      </div>
      <div className="flex h-3 bg-gray-200 overflow-hidden">
        <div 
          className="bg-blue-500" 
          style={{ width: `${homePercent}%` }}
        />
        <div 
          className="bg-red-500" 
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
};

const MatchStatsChart: React.FC<MatchStatsChartProps> = ({ 
  homeTeam, 
  awayTeam, 
  bettingOdds 
}) => {
  const homeForm = parseForm(homeTeam.form);
  const awayForm = parseForm(awayTeam.form);

  return (
    <div className="mb-4 bg-white border overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gray-50 px-3 py-2 border-b">
        <div className="flex items-center justify-between">
          <div className="text-left flex-1">
            <div className="font-semibold text-gray-900 text-sm">{homeTeam.name}</div>
            <div className="text-xs text-gray-500">홈팀</div>
          </div>
          <div className="px-3 text-center">
            <span className="text-sm font-medium text-gray-600">VS</span>
          </div>
          <div className="text-right flex-1">
            <div className="font-semibold text-gray-900 text-sm">{awayTeam.name}</div>
            <div className="text-xs text-gray-500">원정팀</div>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* 주요 통계 시각화 */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">경기 통계 비교</h4>
          
          <ComparisonBar
            label="승률"
            homeValue={homeTeam.winRate || 0}
            awayValue={awayTeam.winRate || 0}
            homeLabel={`${(homeTeam.winRate || 0).toFixed(1)}%`}
            awayLabel={`${(awayTeam.winRate || 0).toFixed(1)}%`}
          />
          
          <ComparisonBar
            label="득점력"
            homeValue={homeTeam.goals || 0}
            awayValue={awayTeam.goals || 0}
            unit="골"
          />
          
          <ComparisonBar
            label="실점"
            homeValue={awayTeam.conceded || 0}  // 실점은 낮을수록 좋으므로 반대로
            awayValue={homeTeam.conceded || 0}
            homeLabel={`${homeTeam.conceded || 0}골`}
            awayLabel={`${awayTeam.conceded || 0}골`}
          />
          
          <ComparisonBar
            label="경기수"
            homeValue={homeTeam.matches || 0}
            awayValue={awayTeam.matches || 0}
            unit="경기"
          />
        </div>

        {/* 상세 수치 */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">상세 통계</h4>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <div className="text-gray-800 font-semibold">{homeTeam.wins || 0}승</div>
              <div className="text-xs text-gray-500">홈팀 승수</div>
            </div>
            <div>
              <div className="text-gray-800 font-semibold">
                {(homeTeam.matches || 0) + (awayTeam.matches || 0)}경기
              </div>
              <div className="text-xs text-gray-500">총 경기수</div>
            </div>
            <div>
              <div className="text-gray-800 font-semibold">{awayTeam.wins || 0}승</div>
              <div className="text-xs text-gray-500">원정팀 승수</div>
            </div>
          </div>
        </div>

        {/* 득실차 비교 */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">득실차 비교</h4>
          <div className="flex justify-between items-center bg-gray-50 p-2">
            <div className="text-center">
              <div className={`text-lg font-bold ${homeTeam.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {homeTeam.goalDifference > 0 ? '+' : ''}{homeTeam.goalDifference || 0}
              </div>
              <div className="text-xs text-gray-500">홈팀</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600">득실차</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${awayTeam.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {awayTeam.goalDifference > 0 ? '+' : ''}{awayTeam.goalDifference || 0}
              </div>
              <div className="text-xs text-gray-500">원정팀</div>
            </div>
          </div>
        </div>

        {/* 최근 폼 시각화 */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">최근 경기 폼</h4>
          
          {/* 데스크탑: 1행 4열 */}
          <div className="hidden sm:grid grid-cols-4 gap-2 text-center">
            {/* 홈팀명 */}
            <div className="text-xs text-gray-600 font-medium">
              <span className="truncate block">{homeTeam.name}</span>
            </div>
            
            {/* 홈팀 폼 */}
            <div className="flex space-x-1 justify-center">
              {homeForm.length > 0 ? (
                homeForm.slice(-5).map((result, index) => (
                  <FormIcon key={index} result={result} />
                ))
              ) : (
                <span className="text-gray-400 text-xs">-</span>
              )}
            </div>
            
            {/* 원정팀 폼 */}
            <div className="flex space-x-1 justify-center">
              {awayForm.length > 0 ? (
                awayForm.slice(-5).map((result, index) => (
                  <FormIcon key={index} result={result} />
                ))
              ) : (
                <span className="text-gray-400 text-xs">-</span>
              )}
            </div>
            
            {/* 원정팀명 */}
            <div className="text-xs text-gray-600 font-medium">
              <span className="truncate block">{awayTeam.name}</span>
            </div>
          </div>
          
          {/* 모바일: 2행 2열 */}
          <div className="sm:hidden space-y-2">
            {/* 홈팀 행 */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="text-xs text-gray-600 font-medium">
                <span className="truncate block">{homeTeam.name}</span>
              </div>
              <div className="flex space-x-1 justify-center">
                {homeForm.length > 0 ? (
                  homeForm.slice(-5).map((result, index) => (
                    <FormIcon key={index} result={result} />
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            </div>
            
            {/* 원정팀 행 */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="text-xs text-gray-600 font-medium">
                <span className="truncate block">{awayTeam.name}</span>
              </div>
              <div className="flex space-x-1 justify-center">
                {awayForm.length > 0 ? (
                  awayForm.slice(-5).map((result, index) => (
                    <FormIcon key={index} result={result} />
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 배당률 정보 */}
        {bettingOdds && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">배당률 정보</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 p-2 border border-gray-200">
                <div className="text-sm font-bold text-gray-800">{bettingOdds.home || 0}</div>
                <div className="text-xs text-gray-600">홈 승리</div>
                <div className="text-xs text-gray-500">
                  {bettingOdds.home && bettingOdds.home > 0 ? `${(100/bettingOdds.home).toFixed(1)}%` : '0%'}
                </div>
              </div>
              <div className="bg-gray-50 p-2 border border-gray-200">
                <div className="text-sm font-bold text-gray-800">{bettingOdds.draw || 0}</div>
                <div className="text-xs text-gray-600">무승부</div>
                <div className="text-xs text-gray-500">
                  {bettingOdds.draw && bettingOdds.draw > 0 ? `${(100/bettingOdds.draw).toFixed(1)}%` : '0%'}
                </div>
              </div>
              <div className="bg-gray-50 p-2 border border-gray-200">
                <div className="text-sm font-bold text-gray-800">{bettingOdds.away || 0}</div>
                <div className="text-xs text-gray-600">원정 승리</div>
                <div className="text-xs text-gray-500">
                  {bettingOdds.away && bettingOdds.away > 0 ? `${(100/bettingOdds.away).toFixed(1)}%` : '0%'}
                </div>
              </div>
            </div>
            
            <div className="mt-2 text-center text-xs text-gray-500">
              예상 우승팀: <span className="font-medium text-gray-700">
                {Math.min(bettingOdds.home || 999, bettingOdds.draw || 999, bettingOdds.away || 999) === (bettingOdds.home || 999) ? homeTeam.name :
                 Math.min(bettingOdds.home || 999, bettingOdds.draw || 999, bettingOdds.away || 999) === (bettingOdds.draw || 999) ? '무승부' : awayTeam.name}
              </span>
            </div>
          </div>
        )}

        {/* 기타 정보 */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">기타 정보</h4>
          <div className="flex justify-between text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-800">{homeTeam.injuries || 0}명</div>
              <div className="text-xs text-gray-500">홈팀 부상자</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-800">{awayTeam.injuries || 0}명</div>
              <div className="text-xs text-gray-500">원정팀 부상자</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchStatsChart;
