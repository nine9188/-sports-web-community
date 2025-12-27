'use client';

import Image from 'next/image';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import Link from 'next/link';
import { LeagueDetails } from '@/domains/livescore/actions/footballApi';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';
import { ContainerHeader, ContainerContent } from '@/shared/components/ui';

interface LeagueHeaderProps {
  league: LeagueDetails;
}

export default function LeagueHeader({ league }: LeagueHeaderProps) {
  // 한국어 리그명 매핑
  const leagueInfo = getLeagueById(league.id);
  const displayName = leagueInfo?.nameKo || league.name;

  return (
    <>
      <ContainerHeader>
        {/* 상단 네비게이션 */}
        <Link
          href="/livescore/football/leagues"
          className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors group px-2 py-1 rounded outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-bold">리그 선택</span>
        </Link>
      </ContainerHeader>

      <ContainerContent>
        <div className="flex items-center space-x-2">
          {/* 리그 로고 */}
          {league.logo && (
            <div className="relative w-8 h-8 flex-shrink-0">
              <UnifiedSportsImage
                imageId={league.id}
                imageType={ImageType.Leagues}
                alt={`${displayName} 로고`}
                width={32}
                height={32}
                className="object-contain w-8 h-8"
              />
            </div>
          )}

          {/* 리그 정보 */}
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
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
                <span className="font-medium">{league.season} 시즌</span>
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
