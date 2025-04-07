'use client';

import { useState } from 'react';
import Image from 'next/image';

interface StatsProps {
  stats?: TeamStats[];
}

interface TeamStats {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

// 팀 로고 컴포넌트 추가
const TeamLogo = ({ logo, name }: { logo: string; name: string }) => {
  const [imgError, setImgError] = useState(false);
  const logoUrl = imgError ? '/placeholder-team.png' : logo || '/placeholder-team.png';
  
  return (
    <div className="w-8 h-8 relative flex-shrink-0 overflow-hidden">
      <Image
        src={logoUrl}
        alt={name || '팀'}
        width={32}
        height={32}
        className="w-full h-full object-contain"
        onError={() => setImgError(true)}
        unoptimized
      />
    </div>
  );
};

// 통계 항목 렌더링 함수
function StatItem({ homeValue, awayValue, koreanLabel }: { homeValue: string | number | null; awayValue: string | number | null; koreanLabel: string }) {
  // 숫자 값으로 변환 (퍼센트 기호 제거)
  const homeNum = parseFloat(String(homeValue).replace('%', '')) || 0;
  const awayNum = parseFloat(String(awayValue).replace('%', '')) || 0;
  
  // 전체 합계 계산 (0으로 나누기 방지)
  const total = homeNum + awayNum || 1;
  
  // 너비 계산 (최대 50%)
  const homeWidth = Math.min(50, (homeNum / total) * 100);
  const awayWidth = Math.min(50, (awayNum / total) * 100);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center text-sm mb-1">
        <span className="font-medium">{homeValue || '0'}</span>
        <span className="text-gray-600">{koreanLabel}</span>
        <span className="font-medium">{awayValue || '0'}</span>
      </div>
      {/* 그래프 컨테이너 - 최대 너비 제한 */}
      <div className="max-w-xl mx-auto">
        <div className="flex">
          <div className="w-1/2 flex justify-end">
            <div 
              className="bg-blue-500 h-2 rounded-l-full" 
              style={{ width: `${homeWidth * 1.6}%` }}
            />
          </div>
          <div className="w-1/2 flex justify-start">
            <div 
              className="bg-red-500 h-2 rounded-r-full" 
              style={{ width: `${awayWidth * 1.6}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Stats({ stats = [] }: StatsProps) {
  // 데이터가 없을 경우 메시지 표시
  if (!stats.length) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600">통계 데이터가 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">현재 이 경기에 대한 통계 정보를 제공할 수 없습니다.</p>
          <p className="text-sm text-gray-500 mt-1">API에서 통계 데이터를 가져오지 못했습니다. (404 오류)</p>
        </div>
      </div>
    );
  }

  const homeTeam = stats[0];
  const awayTeam = stats[1];

  // 특정 통계 항목 찾기 함수
  const findStat = (team: TeamStats, type: string) => {
    const stat = team.statistics.find(s => s.type === type);
    return stat ? stat.value : null;
  };

  // 통계 항목 렌더링 함수
  const renderStat = (type: string, koreanLabel: string) => {
    const homeValue = findStat(homeTeam, type);
    const awayValue = findStat(awayTeam, type);
    
    return (
      <StatItem 
        homeValue={homeValue} 
        awayValue={awayValue} 
        koreanLabel={koreanLabel} 
      />
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 pb-4 border-b">
        <div className="flex items-center gap-2">
          <TeamLogo logo={homeTeam.team.logo} name={homeTeam.team.name} />
          <span className="font-medium">{homeTeam.team.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{awayTeam.team.name}</span>
          <TeamLogo logo={awayTeam.team.logo} name={awayTeam.team.name} />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">기본 통계</h3>
          {renderStat('Ball Possession', '점유율')}
          {renderStat('Total Shots', '전체 슈팅')}
          {renderStat('Shots On Goal', '유효슈팅')}
          {renderStat('Shots Off Goal', '빗나간 슈팅')}
          {renderStat('Blocked Shots', '막힌 슈팅')}
          {renderStat('Corner Kicks', '코너킥')}
          {renderStat('Offsides', '오프사이드')}
          {renderStat('Yellow Cards', '옐로카드')}
          {renderStat('Red Cards', '레드카드')}
          {renderStat('Fouls', '파울')}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">패스</h3>
          {renderStat('Total passes', '전체 패스')}
          {renderStat('Passes accurate', '성공한 패스')}
          {renderStat('Passes %', '패스 성공률')}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">기타</h3>
          {renderStat('Goalkeeper Saves', '골키퍼 선방')}
          {renderStat('expected_goals', '기대 득점')}
        </div>
      </div>
    </div>
  );
} 