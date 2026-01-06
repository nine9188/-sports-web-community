'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { FixtureData } from '@/domains/livescore/types/player';
import { EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';

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
const TeamLogo = ({ name, teamId }: { name: string; teamId?: number }) => {
  return (
    <div className="relative w-6 h-6 shrink-0 overflow-hidden rounded-full">
      {teamId && teamId > 0 ? (
        <UnifiedSportsImage 
          imageId={teamId}
          imageType={ImageType.Teams}
          alt={name}
          width={24}
          height={24}
          className="object-contain w-full h-full"
        />
      ) : (
        <Image 
          src="/placeholder-team.png" 
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
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
    case '무':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
    case '패':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
    default:
      return '';
  }
};

export default function PlayerFixtures({ 
  fixturesData: initialFixturesData = { data: [], status: 'error', message: '데이터가 없습니다' }
}: PlayerFixturesProps) {
  const router = useRouter();
  
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

  // 페이지네이션 적용 - 메모이제이션
  const { paginatedData, totalPages } = useMemo(() => {
    const allData = fixturesData.data || [];
    
    // 총 페이지 수 계산
    const total = allData.length;
    const pages = Math.ceil(total / itemsPerPage);
    
    // 현재 페이지에 해당하는 데이터 추출
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, total);
    const currentItems = allData.slice(startIndex, endIndex);
    
    // 현재 페이지 데이터를 리그별로 그룹화
    const grouped = new Map<number, { league: { id: number; name: string; logo: string }; fixtures: FixtureData[] }>();
    
    currentItems.forEach((fixture: FixtureData) => {
      const leagueId = fixture.league.id;
      if (!grouped.has(leagueId)) {
        grouped.set(leagueId, {
          league: {
            id: fixture.league.id,
            name: fixture.league.name,
            logo: fixture.league.logo
          },
          fixtures: []
        });
      }
      grouped.get(leagueId)!.fixtures.push(fixture);
    });
    
    return { 
      paginatedData: Array.from(grouped.values()), 
      totalPages: pages
    };
  }, [fixturesData.data, currentPage, itemsPerPage]);

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
      <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
        <ContainerContent className="text-center py-8">
          <EmptyState 
            title="경기 기록이 없습니다" 
            message={fixturesData.message || "API에서 이 선수의 경기 기록을 불러올 수 없습니다."} 
          />
        </ContainerContent>
      </Container>
    );
  }

  return (
    <div className="space-y-4">

      {/* 리그별 경기 목록 */}
      {paginatedData.map((leagueGroup) => (
        <Container key={leagueGroup.league.id} className="mb-4 bg-white dark:bg-[#1D1D1D]">
          {/* 리그 헤더 */}
          <ContainerHeader>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <UnifiedSportsImage
                  imageId={leagueGroup.league.id}
                  imageType={ImageType.Leagues}
                  alt={leagueGroup.league.name}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <ContainerTitle>{getLeagueKoreanName(leagueGroup.league.name) || leagueGroup.league.name}</ContainerTitle>
              <span className="text-xs text-gray-500 dark:text-gray-400">({leagueGroup.fixtures.length}경기)</span>
            </div>
          </ContainerHeader>
          
          <ContainerContent className="!p-0">
            {/* 데스크탑 버전 - md 이상 화면에서만 표시 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">
                    <th className="px-3 py-3 text-left border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">날짜</th>
                    <th className="px-3 py-3 text-right border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">홈팀</th>
                    <th className="px-3 py-3 text-center border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">스코어</th>
                    <th className="px-3 py-3 text-left border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">원정팀</th>
                    <th className="px-3 py-3 text-center border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">결과</th>
                    <th className="px-3 py-3 text-center border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">출전</th>
                    <th className="px-3 py-3 text-center border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">평점</th>
                    <th className="px-3 py-3 text-center border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">골</th>
                    <th className="px-3 py-3 text-center border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">도움</th>
                    <th className="px-3 py-3 text-center border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">슈팅</th>
                    <th className="px-3 py-3 text-center border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">유효</th>
                    <th className="px-3 py-3 text-center border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">패스</th>
                    <th className="px-3 py-3 text-center border-b border-black/5 dark:border-white/10 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">키패스</th>
                  </tr>
                </thead>
                <tbody>
                  {leagueGroup.fixtures.map((fixture: FixtureData) => {
                const playerTeamId = fixture.teams.playerTeamId;
                const matchResult = getMatchResult(fixture);
                const resultStyle = getMatchResultStyle(matchResult);

                    return (
                    <tr 
                      key={fixture.fixture.id}
                      className="hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer border-b border-black/5 dark:border-white/10 transition-colors"
                      onClick={() => router.push(`/livescore/football/match/${fixture.fixture.id}`)}
                    >
                      <td className="px-3 py-3 text-left whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                        {format(new Date(fixture.fixture.date), 'yyyy-MM-dd', { locale: ko })}
                      </td>
                      <td className="py-3 pr-1 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <span className={`max-w-[150px] truncate text-gray-900 dark:text-[#F0F0F0] ${playerTeamId === fixture.teams.home.id ? 'font-bold' : ''}`}>
                            {getTeamById(fixture.teams.home.id)?.name_ko || fixture.teams.home.name}
                          </span>
                          <TeamLogo
                            name={fixture.teams.home.name}
                            teamId={fixture.teams.home.id}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-1 text-center font-medium text-gray-900 dark:text-[#F0F0F0]">
                        {fixture.goals.home} - {fixture.goals.away}
                      </td>
                      <td className="py-3 pl-1 text-left">
                        <div className="flex items-center space-x-1">
                          <TeamLogo
                            name={fixture.teams.away.name}
                            teamId={fixture.teams.away.id}
                          />
                          <span className={`max-w-[150px] truncate text-gray-900 dark:text-[#F0F0F0] ${playerTeamId === fixture.teams.away.id ? 'font-bold' : ''}`}>
                            {getTeamById(fixture.teams.away.id)?.name_ko || fixture.teams.away.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-1 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${resultStyle}`}>
                          {matchResult}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-gray-900 dark:text-[#F0F0F0]">
                        {fixture.statistics?.games?.minutes || '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-900 dark:text-[#F0F0F0]">
                        {fixture.statistics?.games?.rating ? 
                          Number(fixture.statistics.games.rating).toFixed(1) : '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-900 dark:text-[#F0F0F0]">
                        {fixture.statistics?.goals?.total || '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-900 dark:text-[#F0F0F0]">
                        {fixture.statistics?.goals?.assists || '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-900 dark:text-[#F0F0F0]">
                        {fixture.statistics?.shots?.total || '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-900 dark:text-[#F0F0F0]">
                        {fixture.statistics?.shots?.on || '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-900 dark:text-[#F0F0F0]">
                        {fixture.statistics?.passes?.total || '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-900 dark:text-[#F0F0F0]">
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
              {leagueGroup.fixtures.map((fixture: FixtureData) => {
            const playerTeamId = fixture.teams.playerTeamId;
            const matchResult = getMatchResult(fixture);
            const resultStyle = getMatchResultStyle(matchResult);
            
                return (
                  <div 
                    key={fixture.fixture.id}
                    className="border-b border-black/5 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors"
                    onClick={() => router.push(`/livescore/football/match/${fixture.fixture.id}`)}
                  >
                    {/* 첫 번째 줄: 날짜, 홈팀, 스코어, 원정팀, 결과 */}
                    <div className="flex items-center py-2 px-2 border-b border-black/5 dark:border-white/10">
                      {/* 날짜 */}
                      <div className="flex-shrink-0 w-[55px] text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {format(new Date(fixture.fixture.date), 'yy/MM/dd', { locale: ko })}
                      </div>
                      
                      {/* 홈팀 */}
                      <div className="flex-1 flex items-center justify-end space-x-1 overflow-hidden">
                        <span className={`text-xs truncate text-gray-900 dark:text-[#F0F0F0] ${playerTeamId === fixture.teams.home.id ? 'font-bold' : ''}`}>
                          {getTeamById(fixture.teams.home.id)?.name_ko || fixture.teams.home.name}
                        </span>
                        <TeamLogo
                          name={fixture.teams.home.name}
                          teamId={fixture.teams.home.id}
                        />
                      </div>
                      
                      {/* 스코어 */}
                      <div className="flex-shrink-0 px-2 font-medium text-center text-gray-900 dark:text-[#F0F0F0]">
                        {fixture.goals.home} - {fixture.goals.away}
                      </div>
                      
                      {/* 원정팀 */}
                      <div className="flex-1 flex items-center space-x-1 overflow-hidden">
                        <TeamLogo
                          name={fixture.teams.away.name}
                          teamId={fixture.teams.away.id}
                        />
                        <span className={`text-xs truncate text-gray-900 dark:text-[#F0F0F0] ${playerTeamId === fixture.teams.away.id ? 'font-bold' : ''}`}>
                          {getTeamById(fixture.teams.away.id)?.name_ko || fixture.teams.away.name}
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
                    <div className="flex justify-between py-2 text-xs text-gray-700 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626]">
                      <div className="flex-1 text-center border-r border-black/10 dark:border-white/10">
                        <div className="font-medium mb-1">골</div>
                        <div>{fixture.statistics?.goals?.total || '-'}</div>
                      </div>
                      <div className="flex-1 text-center border-r border-black/10 dark:border-white/10">
                        <div className="font-medium mb-1">도움</div>
                        <div>{fixture.statistics?.goals?.assists || '-'}</div>
                      </div>
                      <div className="flex-1 text-center border-r border-black/10 dark:border-white/10">
                        <div className="font-medium mb-1">슈팅</div>
                        <div>{fixture.statistics?.shots?.total || '-'}</div>
                      </div>
                      <div className="flex-1 text-center border-r border-black/10 dark:border-white/10">
                        <div className="font-medium mb-1">유효</div>
                        <div>{fixture.statistics?.shots?.on || '-'}</div>
                      </div>
                      <div className="flex-1 text-center border-r border-black/10 dark:border-white/10">
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
          </ContainerContent>
        </Container>
      ))}
      
      {/* 페이지네이션 */}
      {renderPagination()}
    </div>
  );
} 