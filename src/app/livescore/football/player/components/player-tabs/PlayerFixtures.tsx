'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FixtureData } from '../../types/player';
import { fetchPlayerFixtures } from '@/app/actions/livescore/player/fixtures';

// 페이지네이션 버튼 컴포넌트
const PaginationButton = ({ 
  children, 
  onClick, 
  active = false,
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  active?: boolean;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-8 w-8 p-0 rounded-md flex items-center justify-center text-sm font-medium transition-colors
        ${active 
          ? "bg-blue-600 text-white hover:bg-blue-700" 
          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
};

// Props 타입 정의
interface PlayerFixturesProps {
  playerId: number;
  seasons: number[];
  fixturesData?: { data: FixtureData[] };
  initialSeason: number;
}

// 팀 로고 컴포넌트
const TeamLogo = ({ logo, name }: { logo: string; name: string }) => {
  return (
    <div className="relative w-6 h-6 shrink-0 overflow-hidden rounded-full">
      <Image 
        src={logo || '/placeholder-team.png'} 
        alt={name}
        width={24}
        height={24}
        className="object-contain w-full h-full"
        unoptimized
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/placeholder-team.png';
        }}
      />
    </div>
  );
};

// 경기 결과에 따른 스타일 및 텍스트 설정
const getMatchResultStyle = (result: '승' | '무' | '패') => {
  switch (result) {
    case '승':
      return 'bg-green-100 text-green-800';
    case '무':
      return 'bg-gray-100 text-gray-800';
    case '패':
      return 'bg-red-100 text-red-800';
    default:
      return '';
  }
};

export default function PlayerFixtures({ 
  playerId, 
  seasons = [], 
  fixturesData: initialFixturesData = { data: [] }, 
  initialSeason
}: PlayerFixturesProps) {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [fixturesData, setFixturesData] = useState<{ data: FixtureData[] }>(initialFixturesData);
  const [loading, setLoading] = useState<boolean>(!initialFixturesData.data || initialFixturesData.data.length === 0);
  const [error, setError] = useState<string | null>(null);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15; // 페이지당 15개 항목
  
  // API 요청 상태 추적
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 시즌별 데이터를 캐싱하기 위한 ref
  const cachedDataRef = useRef<Record<number, { data: FixtureData[], timestamp: number }>>({
    [initialSeason]: { data: initialFixturesData.data, timestamp: Date.now() }
  });

  // 데이터 페치 진행 중인지 추적하는 ref
  const isFetchingRef = useRef<Record<number, boolean>>({});
  
  // 캐시 만료 시간: 1시간 (밀리초 단위)
  const CACHE_EXPIRY = 60 * 60 * 1000;

  // 사용 가능한 시즌 목록 - 내림차순 정렬
  const availableSeasons = useMemo(() => {
    return [...(seasons || [])].sort((a: number, b: number) => b - a);
  }, [seasons]);

  // 데이터 가져오기 함수를 useCallback으로 메모이제이션
  const fetchFixturesData = useCallback(async (season: number) => {
    // 이미 캐시된 데이터가 있고 만료되지 않은 경우 사용
    const now = Date.now();
    if (
      cachedDataRef.current[season] && 
      cachedDataRef.current[season].data.length > 0 &&
      (now - cachedDataRef.current[season].timestamp) < CACHE_EXPIRY
    ) {
      console.log(`선수 ${playerId}의 캐시된 데이터 사용: ${season} 시즌, ${cachedDataRef.current[season].data.length}개 경기`);
      setFixturesData({ data: cachedDataRef.current[season].data });
      return;
    }
    
    // 동일한 시즌 데이터를 이미 요청 중이면 중복 요청 방지
    if (isFetchingRef.current[season]) {
      console.log(`선수 ${playerId}의 ${season} 시즌 데이터를 이미 요청 중입니다`);
      return;
    }

    // 이전 요청이 있으면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 새 요청을 위한 AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      isFetchingRef.current[season] = true;
      setLoading(true);
      setError(null);
      setSelectedLeague(''); // 시즌이 변경되면 리그 선택 초기화

      console.log(`선수 ${playerId}의 경기 데이터 요청 시작: 시즌 ${season}`);
      
      // 미래 시즌인 경우 현재 가용한 최신 시즌으로 변경
      const currentYear = new Date().getFullYear();
      const requestSeason = season > currentYear ? currentYear : season;
      console.log(`요청 시즌: ${season}${requestSeason !== season ? ` → ${requestSeason}(미래 시즌은 현재 데이터가 없어 ${currentYear}로 조정)` : ''}`);
      
      const startTime = Date.now();
      
      // 서버 액션 직접 호출 (최대 20개 경기)
      const result = await fetchPlayerFixtures(playerId, requestSeason, 20);
      
      const endTime = Date.now();
      const loadTime = (endTime - startTime) / 1000;
      
      // 실제 사용된 시즌 확인 (API가 다른 시즌 데이터를 반환한 경우)
      const actualSeason = result.seasonUsed || season;
      if (actualSeason !== season) {
        console.log(`선수 ${playerId}의 ${season} 시즌 데이터가 없어서 ${actualSeason} 시즌 데이터를 사용합니다`);
      }
      
      console.log(`선수 ${playerId}의 경기 데이터 요청 완료: ${actualSeason} 시즌, ${result.data?.length || 0}개 항목, 소요시간: ${loadTime}초`);
      
      // 데이터 반환 시 캐시 여부 확인하여 사용자에게 알림
      if (result.cached) {
        console.log(`선수 ${playerId}의 서버 캐시된 데이터 사용됨`);
      }
      
      // 데이터 변환 및 캐시에 저장
      const formattedData = { data: result.data || [] };
      cachedDataRef.current[season] = { 
        data: result.data || [], 
        timestamp: now 
      };
      
      setFixturesData(formattedData);
    } catch (err) {
      // AbortError는 사용자 취소이므로 에러 처리 안함
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(`선수 ${playerId}의 데이터 요청이 취소되었습니다`);
        return;
      }
      
      console.error(`선수 ${playerId}의 경기 데이터 로딩 오류:`, err);
      setError('경기 데이터를 가져오는데 실패했습니다');
      setFixturesData({ data: [] });
    } finally {
      setLoading(false);
      isFetchingRef.current[season] = false;
      abortControllerRef.current = null;
    }
  }, [playerId, CACHE_EXPIRY]);

  // 컴포넌트 마운트 시 데이터 가져오기 (초기 데이터가 비어있는 경우)
  useEffect(() => {
    // 초기 데이터가 있으면 캐시에 저장하고 중복 요청 방지
    if (initialFixturesData.data && initialFixturesData.data.length > 0) {
      if (!cachedDataRef.current[selectedSeason] || 
          cachedDataRef.current[selectedSeason].data.length === 0) {
        console.log(`선수 ${playerId}의 초기 데이터 캐싱: ${selectedSeason} 시즌, ${initialFixturesData.data.length}개 경기`);
        cachedDataRef.current[selectedSeason] = { 
          data: initialFixturesData.data,
          timestamp: Date.now()
        };
      }
      return;
    }

    // 초기 데이터가 없고 시즌이 이미 선택되어 있으면 해당 시즌 데이터 로드
    if (selectedSeason) {
      console.log(`선수 ${playerId}의 초기 데이터가 없어 데이터 로드 시도: ${selectedSeason} 시즌`);
      fetchFixturesData(selectedSeason);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 시즌이 변경될 때 새 데이터 가져오기
  useEffect(() => {
    if (!selectedSeason) return;
    
    // 시즌 변경 시 첫 페이지로 리셋
    setCurrentPage(1);
    
    // 이미 캐시된 데이터가 있고 만료되지 않았으면 사용
    const now = Date.now();
    if (
      cachedDataRef.current[selectedSeason]?.data?.length > 0 && 
      (now - (cachedDataRef.current[selectedSeason]?.timestamp || 0)) < CACHE_EXPIRY
    ) {
      console.log(`선수 ${playerId}의 캐시된 데이터 사용 (시즌 변경): ${selectedSeason} 시즌`);
      setFixturesData({ data: cachedDataRef.current[selectedSeason].data });
    } else {
      console.log(`선수 ${playerId}의 새 데이터 요청 (시즌 변경): ${selectedSeason} 시즌`);
      fetchFixturesData(selectedSeason);
    }
  }, [selectedSeason, fetchFixturesData, playerId, CACHE_EXPIRY]);

  // 컴포넌트 언마운트 시 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 리그 선택 변경 핸들러
  const handleLeagueChange = useCallback((leagueId: string) => {
    setSelectedLeague(leagueId);
    setCurrentPage(1); // 리그 변경 시 첫 페이지로 이동
  }, []);

  // 사용 가능한 리그 목록 (전체 리그 데이터에서 추출) - 메모이제이션
  const availableLeagues = useMemo(() => {
    if (!fixturesData?.data || fixturesData.data.length === 0) return [];
    
    return [...new Map(fixturesData.data.map((fixture: FixtureData) => [
      fixture.league.id,
      {
        id: fixture.league.id,
        name: fixture.league.name,
        logo: fixture.league.logo
      }
    ])).values()];
  }, [fixturesData]);

  // 선택된 리그 정보
  const selectedLeagueInfo = availableLeagues.find(league => league.id.toString() === selectedLeague);

  // 소속팀의 승/무/패 상태를 계산하는 함수
  const getMatchResult = (fixture: FixtureData): '승' | '무' | '패' => {
    const playerTeamId = fixture.teams.playerTeamId;
    const homeGoals = Number(fixture.goals.home);
    const awayGoals = Number(fixture.goals.away);
    
    // 무승부인 경우
    if (homeGoals === awayGoals) {
      return '무';
    }
    
    // 소속팀이 홈팀인 경우
    if (playerTeamId === fixture.teams.home.id) {
      return homeGoals > awayGoals ? '승' : '패';
    } 
    // 소속팀이 원정팀인 경우
    else {
      return awayGoals > homeGoals ? '승' : '패';
    }
  };

  // 현재 보여줄 데이터 필터링 및 페이지네이션 적용 - 메모이제이션
  const { paginatedData, totalPages, totalItems } = useMemo(() => {
    // 리그 필터링 적용
    let filteredData = fixturesData.data || [];
    if (selectedLeague) {
      filteredData = filteredData.filter(
        (fixture: FixtureData) => fixture.league.id.toString() === selectedLeague
      );
    }
    
    // 총 페이지 수 계산
    const total = filteredData.length;
    const pages = Math.ceil(total / itemsPerPage);
    
    // 현재 페이지에 해당하는 데이터 추출
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, total);
    const currentItems = filteredData.slice(startIndex, endIndex);
    
    return { 
      paginatedData: currentItems, 
      totalPages: pages,
      totalItems: total
    };
  }, [fixturesData.data, selectedLeague, currentPage, itemsPerPage]);

  // 페이지네이션 구성 함수
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const generatePageNumbers = () => {
      const pageNumbers = [];
      const maxPagesToShow = 5;
      
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      return pageNumbers;
    };

    return (
      <div className="flex justify-center items-center gap-1 my-4">
        {/* 처음 페이지 버튼 */}
        <PaginationButton 
          onClick={() => setCurrentPage(1)} 
          disabled={currentPage === 1}
        >
          &lt;&lt;
        </PaginationButton>
        
        {/* 이전 페이지 버튼 */}
        <PaginationButton 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
          disabled={currentPage === 1}
        >
          &lt;
        </PaginationButton>
        
        {/* 페이지 번호 */}
        {generatePageNumbers().map(page => (
          <PaginationButton 
            key={page} 
            onClick={() => setCurrentPage(page)} 
            active={currentPage === page}
          >
            {page}
          </PaginationButton>
        ))}
        
        {/* 다음 페이지 버튼 */}
        <PaginationButton 
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
          disabled={currentPage === totalPages}
        >
          &gt;
        </PaginationButton>
        
        {/* 마지막 페이지 버튼 */}
        <PaginationButton 
          onClick={() => setCurrentPage(totalPages)} 
          disabled={currentPage === totalPages}
        >
          &gt;&gt;
        </PaginationButton>
      </div>
    );
  };

  // 로딩 상태 표시
  if (loading) {
    return null;
  }

  // 에러 상태 표시
  if (error) {
    return null;
  }

  // 데이터가 없을 때 표시
  if (!fixturesData.data || fixturesData.data.length === 0) {
    return (
      <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
        <div className="text-center py-4">
          <div className="mb-4">
            {/* 시즌 선택 드롭다운 */}
            <div className="max-w-xs mx-auto">
              <label htmlFor="fixture-season-select" className="block text-sm font-medium text-gray-700 mb-1">
                시즌 선택
              </label>
              <select
                id="fixture-season-select"
                value={selectedSeason}
                onChange={(e) => {
                  const newSeason = Number(e.target.value);
                  setSelectedSeason(newSeason);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {availableSeasons.map((season: number) => (
                  <option key={season} value={season}>
                    {season}/{season + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-gray-500">
            {selectedSeason} 시즌에 대한 경기 기록이 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 컨트롤 - 스타일 통일 */}
      <div className="mb-4 bg-white rounded-lg border overflow-hidden">
        <div className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
            <div className="flex flex-wrap gap-4 items-center flex-1">
              {/* 시즌 선택 드롭다운 */}
              <div className="flex-1 min-w-[120px] max-w-[200px]">
                <label htmlFor="fixture-season-select" className="block text-sm font-medium text-gray-700 mb-1">
                  시즌 선택
                </label>
                <select
                  id="fixture-season-select"
                  value={selectedSeason}
                  onChange={(e) => {
                    const newSeason = Number(e.target.value);
                    setSelectedSeason(newSeason);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {availableSeasons.map((season: number) => (
                    <option key={season} value={season}>
                      {season}/{season + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* 리그 선택 드롭다운 */}
              <div className="flex-1 min-w-[120px] max-w-[200px]">
                <label htmlFor="fixture-league-select" className="block text-sm font-medium text-gray-700 mb-1">
                  리그 선택
                </label>
                <select
                  id="fixture-league-select"
                  value={selectedLeague}
                  onChange={(e) => handleLeagueChange(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  disabled={availableLeagues.length === 0}
                >
                  <option value="">모든 리그</option>
                  {availableLeagues.map((league) => (
                    <option key={league.id} value={league.id.toString()}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 선택된 리그 표시 */}
          {selectedLeague && selectedLeagueInfo && (
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <div className="w-6 h-6 flex items-center justify-center">
                <Image
                  src={selectedLeagueInfo.logo}
                  alt={selectedLeagueInfo.name}
                  width={24}
                  height={24}
                  className="w-5 h-5 object-contain"
                  unoptimized
                />
              </div>
              <span className="font-medium">{selectedLeagueInfo.name}</span>
            </div>
          )}
          
          {/* 데이터 요약 정보 */}
          {totalItems > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              총 {totalItems}개 경기 중 {Math.min(itemsPerPage, paginatedData.length)}개 표시 ({currentPage}/{totalPages || 1} 페이지)
            </div>
          )}
        </div>
      </div>

      {/* 경기 목록 */}
      <div className="mb-4 bg-white rounded-lg border overflow-hidden">
        {/* 데스크탑 버전 - md 이상 화면에서만 표시 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-2 py-3 text-left border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">리그</th>
                <th className="px-2 py-3 text-right border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">홈팀</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">스코어</th>
                <th className="px-2 py-3 text-left border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">원정팀</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">결과</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">출전</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">평점</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">골</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">도움</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">슈팅</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">유효</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">패스</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">키패스</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((fixture: FixtureData) => {
                const playerTeamId = fixture.teams.playerTeamId;
                const matchResult = getMatchResult(fixture);
                const resultStyle = getMatchResultStyle(matchResult);

                return (
                <tr 
                  key={fixture.fixture.id}
                  className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  onClick={() => router.push(`/livescore/football/match/${fixture.fixture.id}`)}
                >
                  <td className="px-2 py-3 text-left whitespace-nowrap">
                    {format(new Date(fixture.fixture.date), 'yyyy-MM-dd', { locale: ko })}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <Image
                        src={fixture.league.logo}
                        alt={fixture.league.name}
                        width={20}
                        height={20}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-1 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <span className={`max-w-[150px] truncate ${playerTeamId === fixture.teams.home.id ? 'font-bold' : ''}`}>
                        {fixture.teams.home.name}
                      </span>
                      <TeamLogo
                        logo={fixture.teams.home.logo}
                        name={fixture.teams.home.name}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-1 text-center font-medium">
                    {fixture.goals.home} - {fixture.goals.away}
                  </td>
                  <td className="py-3 pl-1 text-left">
                    <div className="flex items-center space-x-1">
                      <TeamLogo
                        logo={fixture.teams.away.logo}
                        name={fixture.teams.away.name}
                      />
                      <span className={`max-w-[150px] truncate ${playerTeamId === fixture.teams.away.id ? 'font-bold' : ''}`}>
                        {fixture.teams.away.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-1 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${resultStyle}`}>
                      {matchResult}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {fixture.statistics?.games?.minutes || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.games?.rating ? 
                      Number(fixture.statistics.games.rating).toFixed(1) : '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.goals?.total || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.goals?.assists || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.shots?.total || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.shots?.on || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.passes?.total || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.passes?.key || '-'}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 모바일 버전 - md 미만 화면에서만 표시 */}
        <div className="block md:hidden">
          {paginatedData.map((fixture: FixtureData) => {
            const playerTeamId = fixture.teams.playerTeamId;
            const matchResult = getMatchResult(fixture);
            const resultStyle = getMatchResultStyle(matchResult);
            
            return (
              <div 
                key={fixture.fixture.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/livescore/football/match/${fixture.fixture.id}`)}
              >
                {/* 첫 번째 줄: 날짜, 리그, 홈팀, 스코어, 원정팀, 결과 */}
                <div className="flex items-center py-2 px-2">
                  {/* 날짜 */}
                  <div className="flex-shrink-0 w-[70px] text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(fixture.fixture.date), 'yyyy-MM-dd', { locale: ko })}
                  </div>
                  
                  {/* 리그 로고 */}
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mx-1">
                    <Image
                      src={fixture.league.logo}
                      alt={fixture.league.name}
                      width={16}
                      height={16}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  
                  {/* 홈팀 */}
                  <div className="flex-1 flex items-center justify-end space-x-1 overflow-hidden">
                    <span className={`text-xs truncate ${playerTeamId === fixture.teams.home.id ? 'font-bold' : ''}`}>
                      {fixture.teams.home.name}
                    </span>
                    <TeamLogo
                      logo={fixture.teams.home.logo}
                      name={fixture.teams.home.name}
                    />
                  </div>
                  
                  {/* 스코어 */}
                  <div className="flex-shrink-0 px-2 font-medium text-center">
                    {fixture.goals.home} - {fixture.goals.away}
                  </div>
                  
                  {/* 원정팀 */}
                  <div className="flex-1 flex items-center space-x-1 overflow-hidden">
                    <TeamLogo
                      logo={fixture.teams.away.logo}
                      name={fixture.teams.away.name}
                    />
                    <span className={`text-xs truncate ${playerTeamId === fixture.teams.away.id ? 'font-bold' : ''}`}>
                      {fixture.teams.away.name}
                    </span>
                  </div>
                  
                  {/* 경기 결과 */}
                  <div className="flex-shrink-0 ml-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${resultStyle}`}>
                      {matchResult}
                    </span>
                  </div>
                </div>
                
                {/* 두 번째 줄: 골, 도움, 슈팅, 유효슈팅, 패스, 키패스 */}
                <div className="flex justify-between py-2 px-2 text-xs text-gray-700 bg-gray-50">
                  <div className="flex-1 text-center">
                    <div className="font-medium mb-1">골</div>
                    <div>{fixture.statistics?.goals?.total || '-'}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="font-medium mb-1">도움</div>
                    <div>{fixture.statistics?.goals?.assists || '-'}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="font-medium mb-1">슈팅</div>
                    <div>{fixture.statistics?.shots?.total || '-'}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="font-medium mb-1">유효</div>
                    <div>{fixture.statistics?.shots?.on || '-'}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="font-medium mb-1">패스</div>
                    <div>{fixture.statistics?.passes?.total || '-'}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="font-medium mb-1">키패스</div>
                    <div>{fixture.statistics?.passes?.key || '-'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 페이지네이션 */}
      {renderPagination()}
    </div>
  );
}