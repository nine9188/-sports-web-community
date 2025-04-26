'use client';

import { useState, memo, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { TeamStats, Team } from '../../types';
import { fetchMatchStats } from '@/app/actions/livescore/matches/stats';
import { fetchMatchData } from '@/app/actions/livescore/matches/match';

interface StatsProps {
  matchId: string;
  matchData?: {
    stats?: TeamStats[];
    homeTeam?: Team;
    awayTeam?: Team;
  };
}

// 팀 로고 컴포넌트 - 메모이제이션
const TeamLogo = memo(({ logo, name }: { logo: string; name: string }) => {
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
});

TeamLogo.displayName = 'TeamLogo';

// 통계 항목 렌더링 함수 - 메모이제이션
const StatItem = memo(({ homeValue, awayValue, koreanLabel }: { 
  homeValue: string | number | null; 
  awayValue: string | number | null; 
  koreanLabel: string 
}) => {
  // 숫자 값으로 변환 (퍼센트 기호 제거)
  const homeNum = parseFloat(String(homeValue || '0').replace('%', '')) || 0;
  const awayNum = parseFloat(String(awayValue || '0').replace('%', '')) || 0;
  
  // 각 팀의 비율 계산
  // Ball Possession 같은 경우는 이미 퍼센트로 표시됨
  const isPercentageType = koreanLabel === '점유율' || koreanLabel === '패스 성공률';
  
  // 최대 길이 계산 (0~50% 범위)
  let homeWidth = 0;
  let awayWidth = 0;
  
  if (isPercentageType) {
    // 점유율처럼 이미 퍼센트로 되어 있는 경우
    homeWidth = Math.min(homeNum / 2, 50); // 50%가 최대값
    awayWidth = Math.min(awayNum / 2, 50);
  } else {
    // 일반 통계는 상대적 비율로 계산
    const total = homeNum + awayNum || 1;
    homeWidth = Math.min((homeNum / total) * 50, 50);
    awayWidth = Math.min((awayNum / total) * 50, 50);
  }
  
  return (
    <div className="mb-3">
      {/* 통계 제목 */}
      <div className="text-center text-xs font-semibold mb-1 uppercase tracking-wide text-gray-700">
        {koreanLabel}
      </div>
      
      {/* 통계 값 및 바 */}
      <div className="flex items-center">
        <span className="font-medium text-sm w-8 text-right mr-2">{homeValue || '0'}</span>
        
        {/* 그래프 컨테이너 - 회색 배경에 컬러 바 */}
        <div className="w-full bg-gray-200 relative" style={{ height: '4px' }}>
          {/* 중앙 기준점 (보이지 않는 구분선) */}
          <div className="absolute left-1/2 top-0 h-full w-0"></div>
          
          {/* 왼쪽 팀 바 (파란색) - 중앙에서 왼쪽으로 */}
          <div 
            className="absolute top-0 right-1/2 h-full"
            style={{ 
              width: `${homeWidth}%`,
              backgroundColor: '#0ea5e9'
            }}
          />
          
          {/* 오른쪽 팀 바 (녹색) - 중앙에서 오른쪽으로 */}
          <div 
            className="absolute top-0 left-1/2 h-full"
            style={{ 
              width: `${awayWidth}%`,
              backgroundColor: '#84cc16'
            }}
          />
        </div>
        
        <span className="font-medium text-sm w-8 text-left ml-2">{awayValue || '0'}</span>
      </div>
    </div>
  );
});

StatItem.displayName = 'StatItem';

function Stats({ matchId, matchData }: StatsProps) {
  const [stats, setStats] = useState<TeamStats[]>(matchData?.stats || []);
  const [homeTeam, setHomeTeam] = useState<Team | undefined>(matchData?.homeTeam);
  const [awayTeam, setAwayTeam] = useState<Team | undefined>(matchData?.awayTeam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 통계 데이터 가져오기
  useEffect(() => {
    // 이미 데이터가 있으면 다시 가져오지 않음
    if (matchId && (!stats.length || !homeTeam || !awayTeam)) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // 통계 데이터 가져오기
          const statsResponse = await fetchMatchStats(matchId);
          if (statsResponse.success && statsResponse.response.length > 0) {
            setStats(statsResponse.response);
          }

          // 필요하면 기본 매치 데이터도 가져와서 홈/어웨이 팀 정보 설정
          if (!homeTeam || !awayTeam) {
            const matchResponse = await fetchMatchData(matchId);
            if (matchResponse.success && matchResponse.data) {
              setHomeTeam({
                id: matchResponse.data.teams?.home?.id || 0,
                name: matchResponse.data.teams?.home?.name || '',
                logo: matchResponse.data.teams?.home?.logo || '',
              });
              setAwayTeam({
                id: matchResponse.data.teams?.away?.id || 0,
                name: matchResponse.data.teams?.away?.name || '',
                logo: matchResponse.data.teams?.away?.logo || '',
              });
            }
          }

          setError(null);
        } catch (err) {
          setError('통계 데이터를 가져오는데 실패했습니다.');
          console.error('통계 데이터 로딩 오류:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [matchId, stats.length, homeTeam, awayTeam]);

  // 통계 항목 매핑 (API에서 사용하는 키값 -> 표시 레이블)
  const statMappings = useMemo(() => [
    // 슈팅 관련 통계
    { key: 'Shots on Goal', label: '유효슈팅', category: 'shooting' },
    { key: 'Shots off Goal', label: '빗나간 슈팅', category: 'shooting' },
    { key: 'Total Shots', label: '전체 슈팅', category: 'shooting' },
    { key: 'Blocked Shots', label: '막힌 슈팅', category: 'shooting' },
    { key: 'Shots insidebox', label: '박스 안 슈팅', category: 'shooting' },
    { key: 'Shots outsidebox', label: '박스 밖 슈팅', category: 'shooting' },
    
    // 기본 통계
    { key: 'Ball Possession', label: '점유율', category: 'basic' },
    { key: 'Fouls', label: '파울', category: 'basic' },
    { key: 'Corner Kicks', label: '코너킥', category: 'basic' },
    { key: 'Offsides', label: '오프사이드', category: 'basic' },
    { key: 'Yellow Cards', label: '옐로카드', category: 'basic' },
    { key: 'Red Cards', label: '레드카드', category: 'basic' },
    { key: 'Goalkeeper Saves', label: '골키퍼 선방', category: 'basic' },
    
    // 패스 관련 통계
    { key: 'Total passes', label: '총 패스', category: 'passing' },
    { key: 'Passes accurate', label: '정확한 패스', category: 'passing' },
    { key: 'Passes %', label: '패스 성공률', category: 'passing' }
  ], []);

  // 카테고리별로 통계 그룹화
  const categoryGroups = useMemo(() => {
    const groups: Record<string, typeof statMappings> = {
      'shooting': [],
      'basic': [],
      'passing': []
    };
    
    statMappings.forEach(item => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });
    
    return groups;
  }, [statMappings]);

  // 카테고리별 헤더 렌더링
  const renderCategoryHeader = (category: string, isFirst = false) => {
    const titles: Record<string, string> = {
      'shooting': '슈팅',
      'basic': '기본 통계',
      'passing': '패스'
    };
    
    return (
      <div className="px-3 py-2 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800">{titles[category]}</h3>
          
          {isFirst && homeTeam && awayTeam && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <TeamLogo logo={homeTeam.logo} name={homeTeam.name} />
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <TeamLogo logo={awayTeam.logo} name={awayTeam.name} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="mb-4 bg-white rounded-lg border p-4">
        <div className="flex flex-col justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="mb-4 bg-white rounded-lg border p-4">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 mx-auto text-red-500 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <p className="text-lg font-medium text-gray-600">오류 발생</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없을 경우 메시지 표시
  if (!stats.length) {
    return (
      <div className="mb-4 bg-white rounded-lg border p-4">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 mx-auto text-gray-400 mb-2" 
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
            <p className="text-sm text-gray-500 mt-1">현재 이 경기에 대한 통계 정보를 제공할 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  // 안전하게 팀 데이터 가져오기
  const firstTeam = stats[0] || { team: { id: 0, name: '', logo: '' }, statistics: [] };
  const secondTeam = stats[1] || { team: { id: 0, name: '', logo: '' }, statistics: [] };

  // 각 팀 확인 (홈팀과 원정팀 매칭)
  const isFirstTeamHome = homeTeam && firstTeam.team.id === homeTeam.id;
  const dataHomeTeam = isFirstTeamHome ? firstTeam : secondTeam;
  const dataAwayTeam = isFirstTeamHome ? secondTeam : firstTeam;

  // 특정 통계 항목 찾기 함수
  const findStat = (team: TeamStats, type: string) => {
    const stat = team.statistics?.find(s => s.type === type);
    return stat ? stat.value : null;
  };

  // 통계 항목 렌더링 함수
  const renderStat = (keyType: string, displayLabel: string) => {
    const homeValue = findStat(dataHomeTeam, keyType);
    const awayValue = findStat(dataAwayTeam, keyType);
    
    return (
      <StatItem 
        key={keyType}
        homeValue={homeValue} 
        awayValue={awayValue} 
        koreanLabel={displayLabel} 
      />
    );
  };

  return (
    <div className="p-0 min-h-[400px]">
      <div className="space-y-2">
        {/* 슈팅 통계 */}
        <div className="bg-white rounded-lg border">
          {renderCategoryHeader('shooting', true)}
          <div className="p-3">
            {categoryGroups.shooting.map(({ key, label }) => renderStat(key, label))}
          </div>
        </div>
        
        {/* 기본 통계 */}
        <div className="bg-white rounded-lg border">
          {renderCategoryHeader('basic')}
          <div className="p-3">
            {categoryGroups.basic.map(({ key, label }) => renderStat(key, label))}
          </div>
        </div>
        
        {/* 패스 통계 */}
        <div className="bg-white rounded-lg border">
          {renderCategoryHeader('passing')}
          <div className="p-3">
            {categoryGroups.passing.map(({ key, label }) => renderStat(key, label))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Stats); 