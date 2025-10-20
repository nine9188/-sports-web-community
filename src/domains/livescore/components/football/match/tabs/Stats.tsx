'use client';

import { useState, memo, useEffect, useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useMatchData, isStatsTabData } from '@/domains/livescore/components/football/match/context/MatchDataContext';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { fetchCachedMatchLineups } from '@/domains/livescore/actions/match/lineupData';
import { fetchCachedMultiplePlayerStats } from '@/domains/livescore/actions/match/playerStats';
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';

import { TeamStats, Team } from '@/domains/livescore/types/match';

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
        <ApiSportsImage
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

// 가로 스크롤 힌트 컨테이너
const HorizontalScrollContainer = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    const onScroll = () => {
      update();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="relative">
      {/* 모바일 전용 1회성 힌트 */}
      <div className="md:hidden px-3 pb-1 text-[11px] text-gray-500 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        좌우로 스와이프
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
      <div ref={containerRef} className="overflow-x-auto w-full">
        {children}
      </div>
      {/* 엣지 페이드 오버레이 */}
      <div className={`pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent ${canScrollLeft ? '' : 'hidden'}`}></div>
      <div className={`pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent ${canScrollRight ? '' : 'hidden'}`}></div>
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
        
        <span className="font-medium text-sm w-8 text-left ml-2">{awayValue || '0'}</span>
      </div>
    </motion.div>
  );
});

StatItem.displayName = 'StatItem';

const Stats = memo(({ matchData: propsMatchData }: StatsProps) => {
  const { tabData, isTabLoading, tabLoadError, matchData } = useMatchData();
  
  // 상태 관리
  const [stats, setStats] = useState<TeamStats[]>(propsMatchData?.stats || []);
  const [homeTeam, setHomeTeam] = useState<Team | undefined>(propsMatchData?.homeTeam);
  const [awayTeam, setAwayTeam] = useState<Team | undefined>(propsMatchData?.awayTeam);
  const [loading, setLoading] = useState(isTabLoading || !propsMatchData?.stats?.length);
  const [error, setError] = useState<string | null>(tabLoadError || null);

  // 선수 종합 테이블 상태
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null);
  const [homeTeamName, setHomeTeamName] = useState<string>('');
  const [awayTeamName, setAwayTeamName] = useState<string>('');

  // 스크롤 힌트 표시 여부 추적
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // 각 섹션의 ref와 inView 상태 관리 (hooks는 항상 최상단에 위치)
  const basicRef = useRef(null);
  const shootingRef = useRef(null);
  const passingRef = useRef(null);
  const homePlayersRef = useRef(null);
  const awayPlayersRef = useRef(null);

  const basicInView = useInView(basicRef, { amount: 0.5 });
  const shootingInView = useInView(shootingRef, { amount: 0.5 });
  const passingInView = useInView(passingRef, { amount: 0.5 });
  const homePlayersInView = useInView(homePlayersRef, { amount: 0.5 });
  const awayPlayersInView = useInView(awayPlayersRef, { amount: 0.5 });

  // matchId 추출
  const fixtureId = useMemo(() => {
    if (!matchData || !('fixture' in (matchData as Record<string, unknown>))) return null;
    return String((matchData as { fixture: { id: number } }).fixture?.id);
  }, [matchData]);

  // React Query로 라인업 데이터 가져오기
  const { data: lineupsData } = useQuery({
    queryKey: ['lineups', fixtureId],
    queryFn: () => fixtureId ? fetchCachedMatchLineups(fixtureId) : null,
    enabled: !!fixtureId,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 10 * 60 * 1000, // 10분
  });

  // 라인업에서 선수 ID 추출
  const playerIds = useMemo(() => {
    if (!lineupsData?.success || !lineupsData.response) return [];
    const { home, away } = lineupsData.response;

    setHomeTeamId(home?.team?.id ?? null);
    setAwayTeamId(away?.team?.id ?? null);
    setHomeTeamName(home?.team?.name ?? '홈팀');
    setAwayTeamName(away?.team?.name ?? '원정팀');

    const ids = [
      ...(home.startXI || []).map((i: { player: { id: number } }) => i.player.id),
      ...(home.substitutes || []).map((i: { player: { id: number } }) => i.player.id),
      ...(away.startXI || []).map((i: { player: { id: number } }) => i.player.id),
      ...(away.substitutes || []).map((i: { player: { id: number } }) => i.player.id),
    ].filter((id: number) => Number.isFinite(id) && id > 0) as number[];

    return Array.from(new Set(ids));
  }, [lineupsData]);

  // 선수 통계 타입 정의
  type PlayerStats = {
    response?: Array<{
      player?: {
        name?: string;
        pos?: string;
        number?: number;
        [key: string]: unknown;
      };
      statistics?: Array<{
        team?: { id?: number; [key: string]: unknown };
        games?: { minutes?: number; position?: string; rating?: string | number; number?: number; [key: string]: unknown };
        goals?: { total?: number; assists?: number; [key: string]: unknown };
        shots?: { total?: number; on?: number; [key: string]: unknown };
        passes?: { total?: number; key?: number; accuracy?: number | string; [key: string]: unknown };
        dribbles?: { attempts?: number; success?: number; [key: string]: unknown };
        duels?: { total?: number; won?: number; [key: string]: unknown };
        fouls?: { committed?: number; [key: string]: unknown };
        cards?: { yellow?: number; red?: number; [key: string]: unknown };
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };

  // React Query로 선수 통계 가져오기
  const { data: playersStats = {} } = useQuery<Record<number, PlayerStats>>({
    queryKey: ['playerStats', fixtureId, playerIds],
    queryFn: () => fixtureId && playerIds.length > 0 ? fetchCachedMultiplePlayerStats(fixtureId, playerIds) : {},
    enabled: !!fixtureId && playerIds.length > 0,
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

  // 힌트 표시 로직: 2초 후 표시
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // 스크롤 감지: 사용자가 스크롤하면 힌트 숨김
  useEffect(() => {
    if (!showHint || hasScrolled) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setHasScrolled(true);
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [showHint, hasScrolled]);

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
      </div>
    );
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
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
    <div className="p-0 relative" style={{ overflow: 'visible' }}>
      <motion.div
        className="space-y-2 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ overflow: 'visible' }}
      >
        {/* 모바일 전용: 기본 통계 위 오버레이 힌트 */}
        {showHint && !hasScrolled && (
          <motion.div
            className="md:hidden absolute top-0 left-0 right-0 z-10 pointer-events-none"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="relative">
              {/* 그라데이션 배경 */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/40 to-transparent h-40 backdrop-blur-[1px]" />

              {/* 힌트 텍스트 */}
              <div className="relative flex flex-col items-center pt-5 pb-6">
                <motion.div
                  className="flex flex-col items-center gap-1.5 text-gray-500"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <svg className="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  <span className="text-sm font-medium">아래로 스크롤하여 더 많은 통계 보기</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
        {/* 기본 통계 */}
        <motion.div
          ref={basicRef}
          className="bg-white rounded-lg border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.3,
            ease: "easeOut"
          }}
          style={{ overflow: 'visible' }}
        >
          {renderCategoryHeader('basic', true)}
          <div className="p-3">
            {categoryGroups.basic.map(({ key, label }, index) => renderStat(key, label, index))}
          </div>
        </motion.div>

        {/* PC 전용: 기본 통계 하단 힌트 */}
        {basicInView && !shootingInView && !hasScrolled && (
          <motion.div
            className="hidden md:flex justify-center items-center py-3 text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs">아래로 스크롤하세요</span>
              <svg className="w-4 h-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </motion.div>
        )}
        
        {/* 슈팅 통계 */}
        <motion.div
          ref={shootingRef}
          className="bg-white rounded-lg border"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: 0.6,
            delay: 0.2,
            ease: "easeOut"
          }}
          style={{ overflow: 'visible' }}
        >
          {renderCategoryHeader('shooting')}
          <div className="p-3">
            {categoryGroups.shooting.map(({ key, label }, index) => renderStat(key, label, index))}
          </div>
        </motion.div>

        {/* 슈팅 통계 하단 힌트 - PC 전용 */}
        {shootingInView && !passingInView && !hasScrolled && (
          <motion.div
            className="hidden md:flex justify-center items-center py-3 text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs">아래로 스크롤하세요</span>
              <svg className="w-4 h-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </motion.div>
        )}
        
        {/* 패스 통계 */}
        <motion.div
          ref={passingRef}
          className="bg-white rounded-lg border"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: 0.6,
            delay: 0.3,
            ease: "easeOut"
          }}
          style={{ overflow: 'visible' }}
        >
          {renderCategoryHeader('passing')}
          <div className="p-3">
            {categoryGroups.passing.map(({ key, label }, index) => renderStat(key, label, index))}
          </div>
        </motion.div>

        {/* 패스 통계 하단 힌트 - PC 전용 */}
        {passingInView && !homePlayersInView && !hasScrolled && (
          <motion.div
            className="hidden md:flex justify-center items-center py-3 text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs">아래로 스크롤하세요</span>
              <svg className="w-4 h-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </motion.div>
        )}

        {/* 선수 종합 통계 (라인업 기반) - 홈/원정 분리 카드 */}
        <motion.div
          ref={homePlayersRef}
          className="bg-white rounded-lg border"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          style={{ overflow: 'visible' }}
        >
          <div className="px-3 py-2 border-b">
            <div className="flex items-center gap-2">
              {homeTeamId ? (
                <UnifiedSportsImage imageId={homeTeamId} imageType={ImageType.Teams} alt={homeTeamName || '홈팀'} size="sm" variant="square" fit="contain" />
              ) : null}
              <span className="text-sm font-bold text-gray-800">{homeTeamName || '홈팀'}</span>
            </div>
          </div>
          <div className="p-3">
            <HorizontalScrollContainer>
              <table className="w-full min-w-max divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 whitespace-nowrap">
                    <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 px-2 py-2 text-left font-medium text-gray-700 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] w-32 min-w-[8rem] max-w-[8rem]">선수</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">포지션</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">분</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">평점</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">골</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">도움</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">슈팅(유효)</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">패스(키, 성공률)</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">드리블</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">듀얼</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">파울</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">카드</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-gray-100 bg-white whitespace-nowrap">
                    {playerIds.filter((pid) => {
                      const entry = playersStats?.[pid]?.response?.[0];
                      const teamId = entry?.statistics?.[0]?.team?.id ?? null;
                      return teamId && homeTeamId && teamId === homeTeamId;
                    }).sort((a, b) => {
                      const aMinutes = playersStats?.[a]?.response?.[0]?.statistics?.[0]?.games?.minutes ?? 0;
                      const bMinutes = playersStats?.[b]?.response?.[0]?.statistics?.[0]?.games?.minutes ?? 0;
                      return bMinutes - aMinutes; // 출전 시간 내림차순 정렬
                    }).map((pid) => {
                      const entry = playersStats?.[pid]?.response?.[0];
                      const p = entry?.player;
                      const s = entry?.statistics?.[0];
                      const koreanName = getPlayerKoreanName(pid);
                      const displayName = koreanName || p?.name || String(pid);
                      const playerNumber = s?.games?.number ?? p?.number;
                      return (
                        <tr key={`home-${pid}`} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-white px-2 py-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] w-32 min-w-[8rem] max-w-[8rem]">
                            <div className="flex items-center gap-1.5">
                              {playerNumber && <span className="text-xs text-gray-500 font-medium min-w-[1.5rem]">{playerNumber}</span>}
                              <div className="truncate text-sm font-medium">{displayName}</div>
                            </div>
                          </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap"><span className="text-xs text-gray-600">{s?.games?.position || p?.pos || '-'}</span></td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.games?.minutes ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.games?.rating || '-'}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.goals?.total ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.goals?.assists ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.shots?.total ?? 0} ({s?.shots?.on ?? 0})</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.passes?.total ?? 0} ({s?.passes?.key ?? 0}, {(s?.passes?.accuracy ?? '0')}%)</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.dribbles?.success ?? 0}/{s?.dribbles?.attempts ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.duels?.won ?? 0}/{s?.duels?.total ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.fouls?.committed ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.cards?.yellow ?? 0}/{s?.cards?.red ?? 0}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </HorizontalScrollContainer>
          </div>
        </motion.div>

        {/* 홈팀 선수 하단 힌트 - PC 전용 */}
        {homePlayersInView && !awayPlayersInView && !hasScrolled && (
          <motion.div
            className="hidden md:flex justify-center items-center py-3 text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs">아래로 스크롤하세요</span>
              <svg className="w-4 h-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </motion.div>
        )}

        <motion.div
          ref={awayPlayersRef}
          className="bg-white rounded-lg border"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          style={{ overflow: 'visible' }}
        >
          <div className="px-3 py-2 border-b">
            <div className="flex items-center gap-2">
              {awayTeamId ? (
                <UnifiedSportsImage imageId={awayTeamId} imageType={ImageType.Teams} alt={awayTeamName || '원정팀'} size="sm" variant="square" fit="contain" />
              ) : null}
              <span className="text-sm font-bold text-gray-800">{awayTeamName || '원정팀'}</span>
            </div>
          </div>
          <div className="p-3">
            <HorizontalScrollContainer>
              <table className="w-full min-w-max divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 whitespace-nowrap">
                    <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 px-2 py-2 text-left font-medium text-gray-700 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] w-32 min-w-[8rem] max-w-[8rem]">선수</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">포지션</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">분</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">평점</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">골</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">도움</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">슈팅(유효)</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">패스(키, 성공률)</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">드리블</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">듀얼</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">파울</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">카드</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-gray-100 bg-white whitespace-nowrap">
                    {playerIds.filter((pid) => {
                      const entry = playersStats?.[pid]?.response?.[0];
                      const teamId = entry?.statistics?.[0]?.team?.id ?? null;
                      return teamId && awayTeamId && teamId === awayTeamId;
                    }).sort((a, b) => {
                      const aMinutes = playersStats?.[a]?.response?.[0]?.statistics?.[0]?.games?.minutes ?? 0;
                      const bMinutes = playersStats?.[b]?.response?.[0]?.statistics?.[0]?.games?.minutes ?? 0;
                      return bMinutes - aMinutes; // 출전 시간 내림차순 정렬
                    }).map((pid) => {
                      const entry = playersStats?.[pid]?.response?.[0];
                      const p = entry?.player;
                      const s = entry?.statistics?.[0];
                      const koreanName = getPlayerKoreanName(pid);
                      const displayName = koreanName || p?.name || String(pid);
                      const playerNumber = s?.games?.number ?? p?.number;
                      return (
                        <tr key={`away-${pid}`} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-white px-2 py-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] w-32 min-w-[8rem] max-w-[8rem]">
                            <div className="flex items-center gap-1.5">
                              {playerNumber && <span className="text-xs text-gray-500 font-medium min-w-[1.5rem]">{playerNumber}</span>}
                              <div className="truncate text-sm font-medium">{displayName}</div>
                            </div>
                          </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap"><span className="text-xs text-gray-600">{s?.games?.position || p?.pos || '-'}</span></td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.games?.minutes ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.games?.rating || '-'}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.goals?.total ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.goals?.assists ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.shots?.total ?? 0} ({s?.shots?.on ?? 0})</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.passes?.total ?? 0} ({s?.passes?.key ?? 0}, {(s?.passes?.accuracy ?? '0')}%)</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.dribbles?.success ?? 0}/{s?.dribbles?.attempts ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.duels?.won ?? 0}/{s?.duels?.total ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.fouls?.committed ?? 0}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{s?.cards?.yellow ?? 0}/{s?.cards?.red ?? 0}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </HorizontalScrollContainer>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
});

Stats.displayName = 'Stats';

export default Stats; 