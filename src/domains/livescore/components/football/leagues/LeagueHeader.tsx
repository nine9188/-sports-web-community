import Image from 'next/image';
import Link from 'next/link';
import { LeagueDetails } from '@/domains/livescore/actions/footballApi';
import { ContainerHeader, ContainerContent } from '@/shared/components/ui';

// 4590 표준: placeholder 상수
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface LeagueHeaderProps {
  league: LeagueDetails;
  displayName: string;
  seasonLabel: string;
  // 4590 표준: 이미지 Storage URL
  leagueLogoUrl?: string;
  leagueLogoUrlDark?: string;
  boardSlug?: string | null;
}

export default function LeagueHeader({
  league,
  displayName,
  seasonLabel,
  leagueLogoUrl,
  leagueLogoUrlDark,
  boardSlug,
}: LeagueHeaderProps) {
  return (
    <>
      <ContainerHeader className="justify-between">
        {/* 상단 네비게이션 */}
        <Link
          href="/livescore/football/leagues"
          className="flex items-center space-x-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors group px-2 py-1 rounded outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        prefetch={false}
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-bold">리그 선택</span>
        </Link>
        {boardSlug && (
          <Link
            href={`/boards/${boardSlug}`}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors px-2 py-1"
          prefetch={false}
          >
            게시판 이동 →
          </Link>
        )}
      </ContainerHeader>

      <ContainerContent>
        <div className="flex items-center space-x-2">
          {/* 리그 로고 */}
          <div className="relative w-6 h-6 flex-shrink-0">
            {leagueLogoUrlDark && leagueLogoUrl ? (
              <>
                <Image
                  src={leagueLogoUrl}
                  alt={`${displayName} 로고`}
                  width={24}
                  height={24}
                  unoptimized
                  className="object-contain w-6 h-6 dark:hidden"
                />
                <Image
                  src={leagueLogoUrlDark}
                  alt={`${displayName} 로고`}
                  width={24}
                  height={24}
                  unoptimized
                  className="hidden object-contain w-6 h-6 dark:block"
                />
              </>
            ) : (
              <Image
                src={leagueLogoUrlDark || leagueLogoUrl || LEAGUE_PLACEHOLDER}
                alt={`${displayName} 로고`}
                width={24}
                height={24}
                unoptimized
                className="object-contain w-6 h-6"
              />
            )}
          </div>

          {/* 리그 정보 */}
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">
                  {displayName}
                </h1>
                {/* 국가 플래그 */}
                {league.flag && (
                  <div className="relative w-5 h-3 flex-shrink-0">
                    <Image
                      src={league.flag}
                      alt={`${league.country} 국기`}
                      fill
                      className="object-cover rounded-sm"
                      sizes="20px"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                <span className="font-medium">{league.country}</span>
                <span className="mx-1">•</span>
                <span className="font-medium">{seasonLabel}</span>
                {league.type && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="capitalize font-medium">{league.type}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </ContainerContent>
    </>
  );
}
