'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';
import { Container } from '@/shared/components/ui/container';
import { Pagination } from '@/shared/components/ui/pagination';
import { TabList } from '@/shared/components/ui/tabs';
import { Match } from '../overview/components/MatchItems';

const ITEMS_PER_PAGE = 20;

const MATCH_TABS = [
  { id: 'recent', label: '최근 경기' },
  { id: 'upcoming', label: '예정된 경기' },
];

interface FixturesTabProps {
  matches: Match[] | undefined;
  teamId: number;
}

export default function FixturesTab({ matches, teamId }: FixturesTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL의 subTab 파라미터에서 초기 탭 가져오기
  const initialTab = searchParams?.get('subTab') || 'recent';

  // 탭 상태
  const [activeTab, setActiveTab] = useState(initialTab);

  // URL의 subTab이 변경되면 activeTab 업데이트
  useEffect(() => {
    const subTab = searchParams?.get('subTab');
    if (subTab && (subTab === 'recent' || subTab === 'upcoming')) {
      setActiveTab(subTab);
    }
  }, [searchParams]);

  // 페이지네이션 상태
  const [recentPage, setRecentPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);

  // 매치 페이지로 이동하는 함수
  const handleMatchClick = (fixtureId: number) => {
    router.push(`/livescore/football/match/${fixtureId}`);
  };

  // 종료된 경기 (최신순)
  const recentMatches = useMemo(() => {
    if (!matches) return [];
    return matches
      .filter(match =>
        match.fixture.status.short === 'FT' ||
        match.fixture.status.short === 'AET' ||
        match.fixture.status.short === 'PEN' ||
        match.fixture.status.short === 'FT_PEN' ||
        match.fixture.status.short === 'AWD' ||
        match.fixture.status.short === 'WO' ||
        match.fixture.status.short === 'CANC'
      )
      .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());
  }, [matches]);

  // 예정된 경기 (날짜순)
  const upcomingMatches = useMemo(() => {
    if (!matches) return [];
    return matches
      .filter(match =>
        match.fixture.status.short === 'NS' ||
        match.fixture.status.short === 'TBD' ||
        match.fixture.status.short === 'SUSP' ||
        match.fixture.status.short === 'PST' ||
        match.fixture.status.short === '1H' ||
        match.fixture.status.short === '2H' ||
        match.fixture.status.short === 'HT' ||
        match.fixture.status.short === 'ET' ||
        match.fixture.status.short === 'BT' ||
        match.fixture.status.short === 'P' ||
        match.fixture.status.short === 'INT' ||
        match.fixture.status.short === 'LIVE'
      )
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
  }, [matches]);

  // 현재 탭에 따른 데이터
  const currentMatches = activeTab === 'recent' ? recentMatches : upcomingMatches;
  const currentPage = activeTab === 'recent' ? recentPage : upcomingPage;
  const setCurrentPage = activeTab === 'recent' ? setRecentPage : setUpcomingPage;
  const totalPages = Math.ceil(currentMatches.length / ITEMS_PER_PAGE);

  // 페이지네이션된 데이터
  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentMatches.slice(start, start + ITEMS_PER_PAGE);
  }, [currentMatches, currentPage]);

  // 매치 데이터가 없으면 null 반환
  if (!matches || matches.length === 0) {
    return null;
  }

  const isRecentTab = activeTab === 'recent';

  return (
    <div>
      <Container className="bg-white dark:bg-[#1D1D1D]">
        {/* 탭 (헤더 역할) */}
        <TabList
          tabs={MATCH_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="contained"
          className="mb-0 [&_button]:h-12"
        />

        {/* 테이블 */}
        <div className="overflow-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              {isRecentTab ? (
                <>
                  <col className="w-14 md:w-20" />
                  <col className="w-8 md:w-32" />
                  <col />
                  <col className="w-12 md:w-20" />
                </>
              ) : (
                <>
                  <col className="w-20 md:w-28" />
                  <col className="w-8 md:w-32" />
                  <col />
                </>
              )}
            </colgroup>
            <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
              <tr className="h-10">
                <th className="p-0 md:p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">날짜</th>
                <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">리그</th>
                <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">경기</th>
                {isRecentTab && (
                  <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">결과</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {paginatedMatches.length > 0 ? paginatedMatches.map(match => (
                <tr
                  key={match.fixture.id}
                  className="h-12 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors"
                  onClick={() => handleMatchClick(match.fixture.id)}
                >
                  <td className="p-0 md:px-2 text-xs whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                    {format(new Date(match.fixture.date), isRecentTab ? 'MM.dd' : 'MM.dd HH:mm', { locale: ko })}
                  </td>
                  <td className="p-0 md:px-2">
                    <div className="flex justify-start items-center gap-1 md:gap-2">
                      <div className="w-5 h-5 relative flex-shrink-0">
                        <UnifiedSportsImage
                          imageId={match.league.id}
                          imageType={ImageType.Leagues}
                          alt={match.league.name}
                          width={20}
                          height={20}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <span className="hidden md:block text-xs text-gray-900 dark:text-[#F0F0F0]">
                        {getLeagueKoreanName(match.league.name)}
                      </span>
                    </div>
                  </td>
                  <td className="p-0 md:px-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center justify-end gap-0 min-w-0">
                        <span className={`truncate max-w-[100px] md:max-w-[180px] text-right mr-1 text-xs md:text-sm text-gray-900 dark:text-[#F0F0F0] ${match.teams.home.id === teamId ? 'font-bold' : ''}`}>
                          {match.teams.home.name}
                        </span>
                        <UnifiedSportsImage
                          imageId={match.teams.home.id}
                          imageType={ImageType.Teams}
                          alt={match.teams.home.name}
                          width={20}
                          height={20}
                          className="object-contain w-5 h-5 flex-shrink-0"
                        />
                      </div>

                      <div className="w-10 text-center font-medium mx-1 flex-shrink-0 text-gray-900 dark:text-[#F0F0F0]">
                        {isRecentTab ? `${match.goals.home}-${match.goals.away}` : 'VS'}
                      </div>

                      <div className="flex-1 flex items-center justify-start gap-0 min-w-0">
                        <UnifiedSportsImage
                          imageId={match.teams.away.id}
                          imageType={ImageType.Teams}
                          alt={match.teams.away.name}
                          width={20}
                          height={20}
                          className="object-contain w-5 h-5 flex-shrink-0"
                        />
                        <span className={`truncate max-w-[100px] md:max-w-[180px] text-left ml-1 text-xs md:text-sm text-gray-900 dark:text-[#F0F0F0] ${match.teams.away.id === teamId ? 'font-bold' : ''}`}>
                          {match.teams.away.name}
                        </span>
                      </div>
                    </div>
                  </td>
                  {isRecentTab && (
                    <td className="px-1 py-1 md:px-2 md:py-2 text-center w-10 md:w-16">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium
                        ${match.teams.home.id === teamId
                          ? (match.teams.home.winner ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                              match.teams.away.winner ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400')
                          : (match.teams.away.winner ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                              match.teams.home.winner ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400')
                        }`}
                      >
                        {match.teams.home.id === teamId
                          ? (match.teams.home.winner ? 'W' :
                              match.teams.away.winner ? 'L' : 'D')
                          : (match.teams.away.winner ? 'W' :
                              match.teams.home.winner ? 'L' : 'D')
                        }
                      </span>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={isRecentTab ? 4 : 3} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    {isRecentTab ? '최근 경기 정보가 없습니다' : '예정된 경기 정보가 없습니다'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Container>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          mode="button"
          className="mt-4 pt-0"
        />
      )}
    </div>
  );
}
