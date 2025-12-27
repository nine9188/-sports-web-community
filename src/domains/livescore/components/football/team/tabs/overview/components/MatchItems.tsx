'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui/container';

// 매치 타입 정의
export interface Match {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface MatchItemsProps {
  matches: Match[] | undefined;
  teamId: number;
}

export default function MatchItems({ matches, teamId }: MatchItemsProps) {
  const router = useRouter();

  // 매치 페이지로 이동하는 함수
  const handleMatchClick = (fixtureId: number) => {
    router.push(`/livescore/football/match/${fixtureId}`);
  };

  // 매치 데이터가 없으면 null 반환
  if (!matches || matches.length === 0) {
    return null;
  }

  // 경기 필터링 로직
  const recentMatches = matches
    ? matches
        .filter(match => 
          // 경기가 이미 종료된 경우
          match.fixture.status.short === 'FT' || 
          match.fixture.status.short === 'AET' ||
          match.fixture.status.short === 'PEN' ||
          match.fixture.status.short === 'FT_PEN' ||
          // 추가적인 종료 상태 처리
          match.fixture.status.short === 'AWD' || // Awarded (결정된 경기)
          match.fixture.status.short === 'WO' || // Walkover (몰수승)
          match.fixture.status.short === 'CANC' // Cancelled but with result
        )
        .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
        .slice(0, 5)
    : [];

  // 예정된 경기 필터링
  const upcomingMatches = matches
    ? matches
        .filter(match => 
          // 예정된 경기 또는 향후 일정
          match.fixture.status.short === 'NS' || // Not Started
          match.fixture.status.short === 'TBD' || // To Be Defined
          match.fixture.status.short === 'SUSP' || // Suspended
          match.fixture.status.short === 'PST' || // Postponed
          match.fixture.status.short === 'CANC' || // Cancelled
          // 현재 진행 중인 경기도 예정된 경기에 포함
          match.fixture.status.short === '1H' || // 전반전
          match.fixture.status.short === '2H' || // 후반전
          match.fixture.status.short === 'HT' || // 하프타임
          match.fixture.status.short === 'ET' || // 연장전
          match.fixture.status.short === 'BT' || // 승부차기 전
          match.fixture.status.short === 'P' || // 승부차기
          match.fixture.status.short === 'INT' || // 경기 중단
          match.fixture.status.short === 'LIVE' // 라이브
        )
        .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-4">
      {/* 최근 경기 결과 */}
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>최근 경기</ContainerTitle>
        </ContainerHeader>
        <div className="overflow-hidden">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-14 md:w-20" />
                <col className="w-8 md:w-32" />
                <col />
                <col className="w-12 md:w-20" />
              </colgroup>
              <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
                <tr className="h-10">
                  <th className="p-0 md:p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">날짜</th>
                  <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">리그</th>
                  <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">경기</th>
                  <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {recentMatches.length > 0 ? recentMatches.map(match => (
                  <tr 
                    key={match.fixture.id} 
                    className="h-12 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors"
                    onClick={() => handleMatchClick(match.fixture.id)}
                  >
                    <td className="p-0 md:px-2 text-xs whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                      {format(new Date(match.fixture.date), 'MM.dd', { locale: ko })}
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
                          {match.goals.home}-{match.goals.away}
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
                    <td className="px-1 py-1 md:px-2 md:py-2 text-center w-10 md:w-16">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium
                        ${match.teams.home.id === teamId ? 
                          (match.teams.home.winner ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 
                            match.teams.away.winner ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' : 
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400') :
                          (match.teams.away.winner ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 
                            match.teams.home.winner ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' : 
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400')
                        }`}
                      >
                        {match.teams.home.id === teamId ?
                          (match.teams.home.winner ? 'W' : 
                            match.teams.away.winner ? 'L' : 'D') :
                          (match.teams.away.winner ? 'W' : 
                            match.teams.home.winner ? 'L' : 'D')
                        }
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400">최근 경기 정보가 없습니다</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </Container>

      {/* 예정된 경기 */}
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>예정된 경기</ContainerTitle>
        </ContainerHeader>
        <div className="overflow-hidden">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-20 md:w-28" />
                <col className="w-8 md:w-32" />
                <col />
              </colgroup>
              <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
                <tr className="h-10">
                  <th className="p-0 md:p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">날짜</th>
                  <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">리그</th>
                  <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">경기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {upcomingMatches.length > 0 ? upcomingMatches.map(match => (
                  <tr 
                    key={match.fixture.id} 
                    className="h-12 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors"
                    onClick={() => handleMatchClick(match.fixture.id)}
                  >
                    <td className="p-0 md:px-2 text-xs whitespace-nowrap text-gray-900 dark:text-[#F0F0F0]">
                      {format(new Date(match.fixture.date), 'MM.dd HH:mm', { locale: ko })}
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
                          VS
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
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-500 dark:text-gray-400">예정된 경기 정보가 없습니다</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </Container>
    </div>
  );
} 