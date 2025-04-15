'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FixtureData } from '../../types/player';

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
  baseUrl?: string;
}

// 팀 로고 컴포넌트 - 메모이제이션 적용
const TeamLogo = ({ logo, name }: { logo: string; name: string }) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
      <Image
        src={imgError ? '/placeholder-team.png' : logo || '/placeholder-team.png'}
        alt={name}
        width={24}
        height={24}
        className="w-5 h-5 object-contain"
        onError={() => setImgError(true)}
        unoptimized
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
  initialSeason,
  baseUrl = '' 
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
  const cachedDataRef = useRef<Record<number, { data: FixtureData[] }>>({
    [initialSeason]: initialFixturesData
  });

  // 데이터 페치 진행 중인지 추적하는 ref
  const isFetchingRef = useRef<Record<number, boolean>>({});

  // 사용 가능한 시즌 목록 - 내림차순 정렬
  const availableSeasons = useMemo(() => {
    return [...(seasons || [])].sort((a: number, b: number) => b - a);
  }, [seasons]);

  // 데이터 가져오기 함수를 useCallback으로 메모이제이션
  const fetchFixturesData = useCallback(async (season: number) => {
    // 이미 캐시된 데이터가 있으면 사용
    if (cachedDataRef.current[season] && cachedDataRef.current[season].data.length > 0) {
      console.log(`캐시된 데이터 사용: ${season} 시즌, ${cachedDataRef.current[season].data.length}개 경기`);
      setFixturesData(cachedDataRef.current[season]);
      return;
    }
    
    // 동일한 시즌 데이터를 이미 요청 중이면 중복 요청 방지
    if (isFetchingRef.current[season]) {
      console.log(`이미 요청 중인 데이터: ${season} 시즌`);
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

      // API 요청 URL 설정 (baseUrl이 있으면 사용, 없으면 상대 경로)
      const apiUrl = baseUrl 
        ? `${baseUrl}/api/livescore/football/players/${playerId}/fixtures?season=${season}`
        : `/api/livescore/football/players/${playerId}/fixtures?season=${season}`;

      console.log(`경기 데이터 요청 시작: ${apiUrl}`);
      const startTime = Date.now();
      
      const response = await fetch(apiUrl, {
        signal: abortControllerRef.current.signal,
        cache: 'default' // 브라우저 캐싱 사용
      });

      if (!response.ok) {
        throw new Error(`경기 데이터를 가져오는데 실패했습니다 (HTTP ${response.status})`);
      }

      const data = await response.json();
      const endTime = Date.now();
      console.log(`경기 데이터 요청 완료: ${season} 시즌, ${data.data?.length || 0}개 항목, 소요시간: ${(endTime - startTime) / 1000}초`);
      
      // 데이터를 캐시에 저장
      cachedDataRef.current[season] = data;
      setFixturesData(data);
    } catch (err) {
      // AbortError는 사용자 취소이므로 에러 처리 안함
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('데이터 요청이 취소되었습니다.');
        return;
      }
      
      console.error('경기 데이터 로딩 오류:', err);
      setError('경기 데이터를 가져오는데 실패했습니다.');
      setFixturesData({ data: [] });
    } finally {
      setLoading(false);
      isFetchingRef.current[season] = false;
      abortControllerRef.current = null;
    }
  }, [playerId, baseUrl]);

  // 컴포넌트 마운트 시 데이터 가져오기 (초기 데이터가 비어있는 경우)
  useEffect(() => {
    // 초기 데이터가 있으면 캐시에 저장하고 중복 요청 방지
    if (initialFixturesData.data && initialFixturesData.data.length > 0) {
      if (!cachedDataRef.current[selectedSeason] || 
          cachedDataRef.current[selectedSeason].data.length === 0) {
        console.log(`초기 데이터 캐싱: ${selectedSeason} 시즌, ${initialFixturesData.data.length}개 경기`);
        cachedDataRef.current[selectedSeason] = initialFixturesData;
      }
      return;
    }

    // 시즌이 이미 선택되어 있으면 해당 시즌 데이터 로드
    if (selectedSeason) {
      console.log(`초기 데이터가 없어 데이터 로드 시도: ${selectedSeason} 시즌`);
      fetchFixturesData(selectedSeason);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFixturesData, selectedSeason]);

  // 시즌이 변경될 때 새 데이터 가져오기
  useEffect(() => {
    // 이미 캐시된 데이터가 있으면 사용하고, 없으면 새로 가져오기
    if (selectedSeason && cachedDataRef.current[selectedSeason]?.data?.length > 0) {
      setFixturesData(cachedDataRef.current[selectedSeason]);
    } else if (selectedSeason) {
      fetchFixturesData(selectedSeason);
    }
  }, [selectedSeason, fetchFixturesData]);

  // 컴포넌트 언마운트 시 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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

  // 리그나 시즌 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSeason, selectedLeague]);

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

  // 로딩 상태 표시 - 개선된 로딩 UI
  if (loading) {
    return (
      <div className="mb-4 bg-white rounded-lg border overflow-hidden p-6">
        <div className="flex flex-col justify-center items-center py-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-gray-600 text-sm font-medium">경기 데이터를 불러오는 중입니다...</p>
          <p className="text-gray-400 text-xs mt-1">최대 15초 정도 소요될 수 있습니다</p>
        </div>
      </div>
    );
  }

  // 에러 상태 표시 - 개선된 에러 UI와 재시도 버튼 추가
  if (error) {
    return (
      <div className="mb-4 bg-white rounded-lg border overflow-hidden p-6">
        <div className="flex flex-col justify-center items-center py-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-14 w-14 mx-auto text-red-500 mb-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-4">네트워크 연결을 확인하고 다시 시도해주세요.</p>
          <button
            onClick={() => fetchFixturesData(selectedSeason)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 데이터가 없을 때 표시 - 개선된 빈 상태 UI와 재시도 버튼
  if (!fixturesData.data || fixturesData.data.length === 0) {
    return (
      <div className="mb-4 bg-white rounded-lg border overflow-hidden p-6">
        <div className="text-center py-8">
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
          <p className="text-lg font-medium text-gray-600">경기 기록이 없습니다</p>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            {selectedSeason} 시즌에 대한 경기 기록을 찾을 수 없습니다.<br />
            다른 시즌을 선택하거나 아래 버튼을 클릭하여 다시 시도해 보세요.
          </p>
          <button
            onClick={() => fetchFixturesData(selectedSeason)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 컨트롤 - 스타일 통일 */}
      <div className="mb-4 bg-white rounded-lg border overflow-hidden">
        <div className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* 시즌 선택 드롭다운 */}
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="fixture-season-select" className="block text-sm font-medium text-gray-700 mb-1">
                시즌 선택
              </label>
              <select
                id="fixture-season-select"
                value={selectedSeason}
                onChange={(e) => {
                  const newSeason = Number(e.target.value);
                  setSelectedSeason(newSeason);
                  // 시즌이 변경되면 캐시된 데이터가 있는지 확인하고 없으면 새로 데이터 가져오기
                  if (!cachedDataRef.current[newSeason] || cachedDataRef.current[newSeason].data.length === 0) {
                    fetchFixturesData(newSeason);
                  }
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
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="fixture-league-select" className="block text-sm font-medium text-gray-700 mb-1">
                리그 선택
              </label>
              <select
                id="fixture-league-select"
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
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

          {/* 선택된 리그 표시 */}
          {selectedLeague && selectedLeagueInfo && (
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg mt-4">
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
              총 {totalItems}개 경기 중 {Math.min(itemsPerPage, paginatedData.length)}개 표시 ({currentPage}/{totalPages} 페이지)
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
                <th className="px-2 py-3 text-left border-b border-gray-200 whitespace-nowrap">날짜</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">리그</th>
                <th className="px-2 py-3 text-right border-b border-gray-200 whitespace-nowrap">홈팀</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">스코어</th>
                <th className="px-2 py-3 text-left border-b border-gray-200 whitespace-nowrap">원정팀</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">결과</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">출전</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">평점</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">골</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">도움</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">슈팅</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">유효</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">패스</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">키패스</th>
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
                  <div className="flex-shrink-0 w-[70px] text-xs text-gray-500">
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