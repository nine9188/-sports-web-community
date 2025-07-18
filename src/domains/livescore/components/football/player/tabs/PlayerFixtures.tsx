'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { FixtureData } from '@/domains/livescore/types/player';
import { EmptyState } from '@/domains/livescore/components/common/CommonComponents';

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
  fixturesData?: { 
    data: FixtureData[];
    status?: string;
    message?: string;
  };
}

// 팀 로고 컴포넌트
const TeamLogo = ({ logo, name, teamId }: { logo: string; name: string; teamId?: number }) => {
  return (
    <div className="relative w-6 h-6 shrink-0 overflow-hidden rounded-full">
      {logo && teamId ? (
        <ApiSportsImage 
          src={logo} 
          imageId={teamId}
          imageType={ImageType.Teams}
          alt={name}
          width={24}
          height={24}
          className="object-contain w-full h-full"
        />
      ) : (
        <Image 
          src={logo || '/placeholder-team.png'} 
          alt={name}
          width={24}
          height={24}
          className="object-contain w-full h-full"
          unoptimized
        />
      )}
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
  fixturesData: initialFixturesData = { data: [], status: 'error', message: '데이터가 없습니다' }
}: PlayerFixturesProps) {
  const router = useRouter();
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15; // 페이지당 15개 항목

  // 안전하게 데이터 추출 및 확인
  const fixturesData = useMemo(() => {
    // 데이터가 객체이고 data 속성이 배열인지 확인
    const isValidData = 
      initialFixturesData && 
      typeof initialFixturesData === 'object' && 
      Array.isArray(initialFixturesData.data);
    
    // 유효한 데이터인 경우 사용, 아니면 빈 배열로 초기화
    const data = isValidData ? initialFixturesData.data : [];
    const status = initialFixturesData?.status || 'error';
    const message = initialFixturesData?.message || '데이터를 불러올 수 없습니다';
    
    // 데이터 무결성 확인 - 필요한 속성이 모두 있는지 확인
    const validatedData = data.map(fixture => {
      // 안전한 goals 속성 확인
      const safeGoals = {
        home: typeof fixture.goals?.home === 'string' ? fixture.goals.home : String(fixture.goals?.home || 0),
        away: typeof fixture.goals?.away === 'string' ? fixture.goals.away : String(fixture.goals?.away || 0)
      };
      
      // 필요한 속성이 있는지 확인하고 없으면 기본값 할당
      return {
        ...fixture,
        fixture: {
          id: fixture.fixture?.id || 0,
          date: fixture.fixture?.date || '',
          timestamp: fixture.fixture?.timestamp || 0
        },
        goals: safeGoals,
        statistics: fixture.statistics || {
          games: { minutes: 0, rating: '0' },
          goals: { total: 0, assists: 0 },
          shots: { total: 0, on: 0 },
          passes: { total: 0, key: 0 }
        }
      };
    });
    
    return {
      data: validatedData,
      status,
      message
    };
  }, [initialFixturesData]);

  // 사용 가능한 리그 목록 (전체 리그 데이터에서 추출) - 메모이제이션
  const availableLeagues = useMemo(() => {
    if (!fixturesData.data || fixturesData.data.length === 0) return [];
    
    return [...new Map(fixturesData.data.map((fixture: FixtureData) => [
      fixture.league.id,
      {
        id: fixture.league.id,
        name: fixture.league.name,
        logo: fixture.league.logo
      }
    ])).values()];
  }, [fixturesData.data]);

  // 선택된 리그 정보
  const selectedLeagueInfo = availableLeagues.find(league => league.id.toString() === selectedLeague);

  // 소속팀의 승/무/패 상태를 계산하는 함수
  const getMatchResult = (fixture: FixtureData): '승' | '무' | '패' => {
    const playerTeamId = fixture.teams?.playerTeamId || null;
    const homeGoals = fixture.goals?.home ? Number(fixture.goals.home) : 0;
    const awayGoals = fixture.goals?.away ? Number(fixture.goals.away) : 0;
    
    // 무승부인 경우
    if (homeGoals === awayGoals) {
      return '무';
    }
    
    // playerTeamId가 null인 경우 두 팀 중 하나로 가정(통계가 더 많은 쪽으로)
    if (playerTeamId === null || playerTeamId === undefined) {
      // 통계 데이터를 기준으로 어느 팀에 소속되었는지 추정
      const homeMinutes = fixture.statistics?.games?.minutes || 0;
      if (homeMinutes > 0) {
        // 통계가 있으면 home 팀으로 가정
        return homeGoals > awayGoals ? '승' : '패';
      } else {
        // 통계가 없거나 적으면 away 팀으로 가정
        return awayGoals > homeGoals ? '승' : '패';
      }
    }
    
    // 소속팀이 홈팀인 경우
    if (playerTeamId === fixture.teams?.home?.id) {
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

  // 데이터가 없을 때 표시
  if (!fixturesData.data || !Array.isArray(fixturesData.data) || fixturesData.data.length === 0) {
    return (
      <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
        <div className="text-center py-4">
          <EmptyState 
            title="경기 기록이 없습니다" 
            message={fixturesData.message || "API에서 이 선수의 경기 기록을 불러올 수 없습니다."} 
          />
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
              {/* 리그 선택 드롭다운 */}
              <div className="flex-1 min-w-[120px] max-w-[200px]">
                <label htmlFor="fixture-league-select" className="block text-sm font-medium text-gray-700 mb-1">
                  리그 선택
                </label>
                <select
                  id="fixture-league-select"
                  value={selectedLeague}
                  onChange={(e) => {
                    setSelectedLeague(e.target.value);
                    setCurrentPage(1); // 리그 변경 시 첫 페이지로 이동
                  }}
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
                        teamId={fixture.teams.home.id}
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
                        teamId={fixture.teams.away.id}
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
                      teamId={fixture.teams.home.id}
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
                      teamId={fixture.teams.away.id}
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