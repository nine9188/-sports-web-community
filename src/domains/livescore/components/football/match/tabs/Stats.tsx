'use client';

import { useState, memo, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMatchData, isStatsTabData } from '@/domains/livescore/components/football/match/context/MatchDataContext';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { fetchMatchPlayerStats } from '@/domains/livescore/actions/match/matchPlayerStats';
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';

import { TeamStats, Team } from '@/domains/livescore/types/match';
import Spinner from '@/shared/components/Spinner';

interface StatsProps {
  matchId: string;
  matchData: {
    stats?: TeamStats[];
    homeTeam?: Team;
    awayTeam?: Team;
  };
}

// 팀 로고 컴포넌트 - 메모이제이션
const TeamLogo = memo(({ name, teamId }: { name: string; teamId?: number }) => {
  return (
    <div className="w-8 h-8 relative flex-shrink-0 overflow-hidden">
      {teamId && teamId > 0 ? (
        <UnifiedSportsImage
          imageId={teamId}
          imageType={ImageType.Teams}
          alt={name || '팀'}
          width={32}
          height={32}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
          로고 없음
        </div>
      )}
    </div>
  );
});

TeamLogo.displayName = 'TeamLogo';

// 가로 스크롤 컨테이너 (힌트 제거)
const HorizontalScrollContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="overflow-x-auto w-full">
      {children}
    </div>
  );
};

// 통계 항목 렌더링 함수 - 메모이제이션
const StatItem = memo(({ homeValue, awayValue, koreanLabel, index = 0 }: { 
  homeValue: string | number | null; 
  awayValue: string | number | null; 
  koreanLabel: string;
  index?: number;
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
    <motion.div 
      className="mb-3"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
    >
      {/* 통계 제목 */}
      <div className="text-center text-xs font-semibold mb-1 uppercase tracking-wide text-gray-700 dark:text-gray-300">
        {koreanLabel}
      </div>

      {/* 통계 값 및 바 */}
      <div className="flex items-center">
        <span className="font-medium text-sm w-8 text-right mr-2 text-gray-900 dark:text-[#F0F0F0]">{homeValue || '0'}</span>

        {/* 그래프 컨테이너 - 회색 배경에 컬러 바 */}
        <div className="w-full bg-[#EAEAEA] dark:bg-[#333333] relative" style={{ height: '4px' }}>
          {/* 중앙 기준점 (보이지 않는 구분선) */}
          <div className="absolute left-1/2 top-0 h-full w-0"></div>
          
          {/* 왼쪽 팀 바 (파란색) - 중앙에서 왼쪽으로 */}
          <motion.div 
            className="absolute top-0 h-full"
            style={{ 
              backgroundColor: '#0ea5e9',
              right: '50%',
              transform: 'translateX(-0%)'
            }}
            initial={{ width: 0 }}
            whileInView={{ width: `${homeWidth}%` }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.8, 
              delay: index * 0.1 + 0.3,
              ease: "easeOut"
            }}
          />
          
          {/* 오른쪽 팀 바 (녹색) - 중앙에서 오른쪽으로 */}
          <motion.div 
            className="absolute top-0 h-full"
            style={{ 
              backgroundColor: '#84cc16',
              left: '50%',
              transform: 'translateX(0%)'
            }}
            initial={{ width: 0 }}
            whileInView={{ width: `${awayWidth}%` }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.8, 
              delay: index * 0.1 + 0.3,
              ease: "easeOut"
            }}
          />
        </div>

        <span className="font-medium text-sm w-8 text-left ml-2 text-gray-900 dark:text-[#F0F0F0]">{awayValue || '0'}</span>
      </div>
    </motion.div>
  );
});

StatItem.displayName = 'StatItem';

// 정렬 아이콘 컴포넌트
const SortIcon = ({ field, currentField, direction }: { field: string; currentField: string; direction: 'asc' | 'desc' }) => {
  if (field !== currentField) {
    return (
      <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  
  return direction === 'asc' ? (
    <svg className="w-3 h-3 ml-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-3 h-3 ml-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
};

const Stats = memo(({ matchData: propsMatchData }: StatsProps) => {
  const { tabData, isTabLoading, tabLoadError, matchData } = useMatchData();
  
  // 상태 관리
  const [stats, setStats] = useState<TeamStats[]>(propsMatchData?.stats || []);
  const [homeTeam, setHomeTeam] = useState<Team | undefined>(propsMatchData?.homeTeam);
  const [awayTeam, setAwayTeam] = useState<Team | undefined>(propsMatchData?.awayTeam);
  const [loading, setLoading] = useState(isTabLoading || !propsMatchData?.stats?.length);
  const [error, setError] = useState<string | null>(tabLoadError || null);

  // 정렬 상태 관리 (홈팀)
  const [homeSortField, setHomeSortField] = useState<string>('minutes');
  const [homeSortDirection, setHomeSortDirection] = useState<'asc' | 'desc'>('desc');

  // 정렬 상태 관리 (원정팀)
  const [awaySortField, setAwaySortField] = useState<string>('minutes');
  const [awaySortDirection, setAwaySortDirection] = useState<'asc' | 'desc'>('desc');

  // 각 섹션의 ref 관리
  const basicRef = useRef(null);
  const shootingRef = useRef(null);
  const passingRef = useRef(null);
  const homePlayersRef = useRef(null);
  const awayPlayersRef = useRef(null);

  // matchId 추출
  const fixtureId = useMemo(() => {
    if (!matchData || !('fixture' in (matchData as Record<string, unknown>))) return null;
    return String((matchData as { fixture: { id: number } }).fixture?.id);
  }, [matchData]);

  // React Query로 선수 통계 가져오기 (새로운 통합 액션 사용)
  const { data: playerStatsData } = useQuery({
    queryKey: ['matchPlayerStats', fixtureId],
    queryFn: () => fixtureId ? fetchMatchPlayerStats(fixtureId) : null,
    enabled: !!fixtureId,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 10 * 60 * 1000, // 10분
  });

  // props로 받은 데이터 업데이트
  useEffect(() => {
    if (propsMatchData) {
      if (propsMatchData.stats && propsMatchData.stats.length > 0) {
        setStats(propsMatchData.stats);
        setLoading(false);
      }

      if (propsMatchData.homeTeam) {
        setHomeTeam(propsMatchData.homeTeam);
      }

      if (propsMatchData.awayTeam) {
        setAwayTeam(propsMatchData.awayTeam);
      }
    } else if (tabData && isStatsTabData(tabData) && tabData.stats && tabData.stats.length > 0) {
      setStats(tabData.stats);
      setLoading(false);

      if (matchData) {
        const homeTeamData = (matchData as { teams?: { home?: Team } })?.teams?.home;
        const awayTeamData = (matchData as { teams?: { away?: Team } })?.teams?.away;

        if (homeTeamData) setHomeTeam(homeTeamData);
        if (awayTeamData) setAwayTeam(awayTeamData);
      }
    }
  }, [propsMatchData, tabData, matchData, isTabLoading]);

  // 로딩, 에러 상태 업데이트
  useEffect(() => {
    setLoading(isTabLoading);
    if (tabLoadError) setError(tabLoadError);
  }, [isTabLoading, tabLoadError]);

  // 통계 항목 매핑 (API에서 사용하는 키값 -> 표시 레이블)
  const statMappings = useMemo(() => [
    // 슈팅 관련 통계
    { key: 'Total Shots', label: '전체 슈팅', category: 'shooting' },
    { key: 'Shots on Goal', label: '유효슈팅', category: 'shooting' },
    { key: 'Shots off Goal', label: '빗나간 슈팅', category: 'shooting' },
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


  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <Spinner size="xl" className="mx-auto mb-2" />
          <p className="text-sm text-gray-600">통계 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }
  
  // 에러 상태 표시
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">통계 데이터를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
      </div>
    );
  }

  // 데이터가 없을 경우 메시지 표시
  if (!stats.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-600">통계 데이터가 없습니다</p>
        <p className="text-xs text-gray-500 mt-1">현재 이 경기에 대한 통계 정보를 제공할 수 없습니다.</p>
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

  // 정렬 핸들러 (홈팀)
  const handleHomeSort = (field: string) => {
    if (homeSortField === field) {
      setHomeSortDirection(homeSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setHomeSortField(field);
      setHomeSortDirection('desc');
    }
  };

  // 정렬 핸들러 (원정팀)
  const handleAwaySort = (field: string) => {
    if (awaySortField === field) {
      setAwaySortDirection(awaySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setAwaySortField(field);
      setAwaySortDirection('desc');
    }
  };

  // 선수 데이터 정렬 함수
  const sortPlayers = <T extends Record<string, unknown>>(players: T[], sortField: string, sortDirection: 'asc' | 'desc') => {
    return [...players].sort((a, b) => {
      let aValue: string | number = a[sortField] as string | number;
      let bValue: string | number = b[sortField] as string | number;

      // 포지션은 문자열로 정렬
      if (sortField === 'position') {
        const aStr = String(aValue || '');
        const bStr = String(bValue || '');
        return sortDirection === 'asc' 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      }

      // 평점은 문자열을 숫자로 변환
      if (sortField === 'rating') {
        aValue = parseFloat(String(aValue)) || 0;
        bValue = parseFloat(String(bValue)) || 0;
      } else {
        // 나머지는 숫자로 처리
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });
  };

  // 통계 항목 렌더링 함수
  const renderStat = (keyType: string, displayLabel: string, index: number) => {
    const homeValue = findStat(dataHomeTeam, keyType);
    const awayValue = findStat(dataAwayTeam, keyType);

    return (
      <StatItem
        key={keyType}
        homeValue={homeValue}
        awayValue={awayValue}
        koreanLabel={displayLabel}
        index={index}
      />
    );
  };

  return (
    <div className="p-0 relative">
      <motion.div
        className="space-y-2 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 기본 통계 */}
        <motion.div
          ref={basicRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.3,
            ease: "easeOut"
          }}
        >
          <Container className="bg-white dark:bg-[#1D1D1D]">
            <ContainerHeader>
              <div className="flex items-center justify-between w-full">
                <ContainerTitle>기본 통계</ContainerTitle>
                {homeTeam && awayTeam && (
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <TeamLogo name={homeTeam.name} teamId={homeTeam.id} />
                      <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                      <TeamLogo name={awayTeam.name} teamId={awayTeam.id} />
                    </div>
                  </div>
                )}
              </div>
            </ContainerHeader>
            <ContainerContent>
              {categoryGroups.basic.map(({ key, label }, index) => renderStat(key, label, index))}
            </ContainerContent>
          </Container>
        </motion.div>

        {/* 슈팅 통계 */}
        <motion.div
          ref={shootingRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: 0.6,
            delay: 0.2,
            ease: "easeOut"
          }}
        >
          <Container className="bg-white dark:bg-[#1D1D1D]">
            <ContainerHeader>
              <ContainerTitle>슈팅</ContainerTitle>
            </ContainerHeader>
            <ContainerContent>
              {categoryGroups.shooting.map(({ key, label }, index) => renderStat(key, label, index))}
            </ContainerContent>
          </Container>
        </motion.div>

        {/* 패스 통계 */}
        <motion.div
          ref={passingRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: 0.6,
            delay: 0.3,
            ease: "easeOut"
          }}
        >
          <Container className="bg-white dark:bg-[#1D1D1D]">
            <ContainerHeader>
              <ContainerTitle>패스</ContainerTitle>
            </ContainerHeader>
            <ContainerContent>
              {categoryGroups.passing.map(({ key, label }, index) => renderStat(key, label, index))}
            </ContainerContent>
          </Container>
        </motion.div>

        {/* 선수 종합 통계 - 홈팀 */}
        {playerStatsData?.success && playerStatsData.data?.homeTeam && (
          <motion.div
            ref={homePlayersRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <Container className="bg-white dark:bg-[#1D1D1D]">
              <ContainerHeader>
                <Link
                  href={`/livescore/football/team/${playerStatsData.data.homeTeam.id}`}
                  className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
                >
                  <UnifiedSportsImage
                    imageId={playerStatsData.data.homeTeam.id}
                    imageType={ImageType.Teams}
                    alt={playerStatsData.data.homeTeam.name}
                    size="sm"
                    variant="square"
                    fit="contain"
                  />
                  <ContainerTitle className="group-hover:underline">
                    {getTeamById(playerStatsData.data.homeTeam.id)?.name_ko || playerStatsData.data.homeTeam.name}
                  </ContainerTitle>
                </Link>
              </ContainerHeader>
              <ContainerContent>
                <HorizontalScrollContainer>
                  <table className="min-w-max divide-y divide-gray-200 text-sm">
                    <thead className="bg-[#F5F5F5] dark:bg-[#262626] whitespace-nowrap">
                      <tr>
                        <th className="sticky left-0 z-10 bg-[#F5F5F5] dark:bg-[#262626] px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] w-32 min-w-[8rem] max-w-[8rem]">선수</th>
                        <th 
                          className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleHomeSort('position')}
                        >
                          <div className="flex items-center justify-center">
                            포지션
                            <SortIcon field="position" currentField={homeSortField} direction={homeSortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleHomeSort('minutes')}
                        >
                          <div className="flex items-center justify-end">
                            분
                            <SortIcon field="minutes" currentField={homeSortField} direction={homeSortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleHomeSort('rating')}
                        >
                          <div className="flex items-center justify-end">
                            평점
                            <SortIcon field="rating" currentField={homeSortField} direction={homeSortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleHomeSort('goals')}
                        >
                          <div className="flex items-center justify-end">
                            골
                            <SortIcon field="goals" currentField={homeSortField} direction={homeSortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleHomeSort('assists')}
                        >
                          <div className="flex items-center justify-end">
                            도움
                            <SortIcon field="assists" currentField={homeSortField} direction={homeSortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleHomeSort('shotsTotal')}
                        >
                          <div className="flex items-center justify-end">
                            슈팅(유효)
                            <SortIcon field="shotsTotal" currentField={homeSortField} direction={homeSortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleHomeSort('passesTotal')}
                        >
                          <div className="flex items-center justify-end">
                            패스(키, 성공률)
                            <SortIcon field="passesTotal" currentField={homeSortField} direction={homeSortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleHomeSort('dribblesSuccess')}
                        >
                          <div className="flex items-center justify-end">
                            드리블
                            <SortIcon field="dribblesSuccess" currentField={homeSortField} direction={homeSortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleHomeSort('duelsWon')}
                        >
                          <div className="flex items-center justify-end">
                            듀얼
                            <SortIcon field="duelsWon" currentField={homeSortField} direction={homeSortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleHomeSort('foulsCommitted')}
                        >
                          <div className="flex items-center justify-end">
                            파울
                            <SortIcon field="foulsCommitted" currentField={homeSortField} direction={homeSortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleHomeSort('yellowCards')}
                        >
                          <div className="flex items-center justify-end">
                            카드
                            <SortIcon field="yellowCards" currentField={homeSortField} direction={homeSortDirection} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#1D1D1D] whitespace-nowrap">
                      {sortPlayers(playerStatsData.data.homeTeam.players, homeSortField, homeSortDirection)
                        .map((player) => {
                          const koreanName = getPlayerKoreanName(player.playerId);
                          const displayName = koreanName || player.playerName || String(player.playerId);
                          
                          return (
                            <tr key={`home-${player.playerId}`} className="hover:bg-[#F5F5F5] dark:hover:bg-[#262626]">
                              <td className="sticky left-0 z-10 bg-white dark:bg-[#1D1D1D] px-2 py-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] w-32 min-w-[8rem] max-w-[8rem]">
                                <Link 
                                  href={`/livescore/football/player/${player.playerId}`}
                                  className="flex items-center gap-1.5 hover:underline transition-all"
                                >
                                  {player.playerNumber && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium min-w-[1.5rem]">
                                      {player.playerNumber}
                                    </span>
                                  )}
                                  <div className="truncate text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">{displayName}</div>
                                </Link>
                              </td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <span className="text-xs text-gray-600 dark:text-gray-400">{player.position || '-'}</span>
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">{player.minutes ?? 0}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">{player.rating || '-'}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">{player.goals ?? 0}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">{player.assists ?? 0}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {player.shotsTotal ?? 0} ({player.shotsOn ?? 0})
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {player.passesTotal ?? 0} ({player.passesKey ?? 0}, {player.passesAccuracy ?? 0}%)
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {player.dribblesSuccess ?? 0}/{player.dribblesAttempts ?? 0}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {player.duelsWon ?? 0}/{player.duelsTotal ?? 0}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">{player.foulsCommitted ?? 0}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {player.yellowCards ?? 0}/{player.redCards ?? 0}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </HorizontalScrollContainer>
              </ContainerContent>
            </Container>
          </motion.div>
        )}

        {/* 선수 종합 통계 - 원정팀 */}
        {playerStatsData?.success && playerStatsData.data?.awayTeam && (
          <motion.div
            ref={awayPlayersRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          >
            <Container className="bg-white dark:bg-[#1D1D1D]">
              <ContainerHeader>
                <Link
                  href={`/livescore/football/team/${playerStatsData.data.awayTeam.id}`}
                  className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
                >
                  <UnifiedSportsImage
                    imageId={playerStatsData.data.awayTeam.id}
                    imageType={ImageType.Teams}
                    alt={playerStatsData.data.awayTeam.name}
                    size="sm"
                    variant="square"
                    fit="contain"
                  />
                  <ContainerTitle className="group-hover:underline">
                    {getTeamById(playerStatsData.data.awayTeam.id)?.name_ko || playerStatsData.data.awayTeam.name}
                  </ContainerTitle>
                </Link>
              </ContainerHeader>
              <ContainerContent>
                <HorizontalScrollContainer>
                  <table className="min-w-max divide-y divide-gray-200 text-sm">
                    <thead className="bg-[#F5F5F5] dark:bg-[#262626] whitespace-nowrap">
                      <tr>
                        <th className="sticky left-0 z-10 bg-[#F5F5F5] dark:bg-[#262626] px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] w-32 min-w-[8rem] max-w-[8rem]">선수</th>
                        <th
                          className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleAwaySort('position')}
                        >
                          <div className="flex items-center justify-center">
                            포지션
                            <SortIcon field="position" currentField={awaySortField} direction={awaySortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleAwaySort('minutes')}
                        >
                          <div className="flex items-center justify-end">
                            분
                            <SortIcon field="minutes" currentField={awaySortField} direction={awaySortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleAwaySort('rating')}
                        >
                          <div className="flex items-center justify-end">
                            평점
                            <SortIcon field="rating" currentField={awaySortField} direction={awaySortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleAwaySort('goals')}
                        >
                          <div className="flex items-center justify-end">
                            골
                            <SortIcon field="goals" currentField={awaySortField} direction={awaySortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleAwaySort('assists')}
                        >
                          <div className="flex items-center justify-end">
                            도움
                            <SortIcon field="assists" currentField={awaySortField} direction={awaySortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleAwaySort('shotsTotal')}
                        >
                          <div className="flex items-center justify-end">
                            슈팅(유효)
                            <SortIcon field="shotsTotal" currentField={awaySortField} direction={awaySortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleAwaySort('passesTotal')}
                        >
                          <div className="flex items-center justify-end">
                            패스(키, 성공률)
                            <SortIcon field="passesTotal" currentField={awaySortField} direction={awaySortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleAwaySort('dribblesSuccess')}
                        >
                          <div className="flex items-center justify-end">
                            드리블
                            <SortIcon field="dribblesSuccess" currentField={awaySortField} direction={awaySortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleAwaySort('duelsWon')}
                        >
                          <div className="flex items-center justify-end">
                            듀얼
                            <SortIcon field="duelsWon" currentField={awaySortField} direction={awaySortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleAwaySort('foulsCommitted')}
                        >
                          <div className="flex items-center justify-end">
                            파울
                            <SortIcon field="foulsCommitted" currentField={awaySortField} direction={awaySortDirection} />
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => handleAwaySort('yellowCards')}
                        >
                          <div className="flex items-center justify-end">
                            카드
                            <SortIcon field="yellowCards" currentField={awaySortField} direction={awaySortDirection} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#1D1D1D] whitespace-nowrap">
                      {sortPlayers(playerStatsData.data.awayTeam.players, awaySortField, awaySortDirection)
                        .map((player) => {
                          const koreanName = getPlayerKoreanName(player.playerId);
                          const displayName = koreanName || player.playerName || String(player.playerId);
                          
                          return (
                            <tr key={`away-${player.playerId}`} className="hover:bg-[#F5F5F5] dark:hover:bg-[#262626]">
                              <td className="sticky left-0 z-10 bg-white dark:bg-[#1D1D1D] px-2 py-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] w-32 min-w-[8rem] max-w-[8rem]">
                                <Link 
                                  href={`/livescore/football/player/${player.playerId}`}
                                  className="flex items-center gap-1.5 hover:underline transition-all"
                                >
                                  {player.playerNumber && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium min-w-[1.5rem]">
                                      {player.playerNumber}
                                    </span>
                                  )}
                                  <div className="truncate text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">{displayName}</div>
                                </Link>
                              </td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <span className="text-xs text-gray-600 dark:text-gray-400">{player.position || '-'}</span>
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">{player.minutes ?? 0}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">{player.rating || '-'}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">{player.goals ?? 0}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">{player.assists ?? 0}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {player.shotsTotal ?? 0} ({player.shotsOn ?? 0})
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {player.passesTotal ?? 0} ({player.passesKey ?? 0}, {player.passesAccuracy ?? 0}%)
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {player.dribblesSuccess ?? 0}/{player.dribblesAttempts ?? 0}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {player.duelsWon ?? 0}/{player.duelsTotal ?? 0}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">{player.foulsCommitted ?? 0}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                                {player.yellowCards ?? 0}/{player.redCards ?? 0}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </HorizontalScrollContainer>
              </ContainerContent>
            </Container>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
});

Stats.displayName = 'Stats';

export default Stats; 