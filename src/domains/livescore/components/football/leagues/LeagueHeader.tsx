'use client';

import Image from 'next/image';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import Link from 'next/link';
import { LeagueDetails } from '@/domains/livescore/actions/footballApi';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';

interface LeagueHeaderProps {
  league: LeagueDetails;
}

export default function LeagueHeader({ league }: LeagueHeaderProps) {
  // 한국어 리그명 매핑
  const leagueInfo = getLeagueById(league.id);
  const displayName = leagueInfo?.nameKo || league.name;

  return (
    <div className="mt-4 lg:mt-0 mb-4 bg-white rounded-lg border p-3">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-3">
        <Link 
          href="/livescore/football/leagues"
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">리그 선택</span>
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        {/* 리그 로고 */}
        {league.logo && (
          <div className="relative w-12 h-12 flex-shrink-0">
            <ApiSportsImage
              src={league.logo}
              imageId={league.id}
              imageType={ImageType.Leagues}
              alt={`${displayName} 로고`}
              width={48}
              height={48}
              className="object-contain w-12 h-12"
            />
          </div>
        )}

        {/* 리그 정보 */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900">
              {displayName}
            </h1>
            
            {/* 국가 플래그 */}
            {league.flag && (
              <div className="relative w-6 h-4 flex-shrink-0">
                <Image
                  src={league.flag}
                  alt={`${league.country} 국기`}
                  fill
                  className="object-cover rounded-sm"
                  sizes="24px"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span className="font-medium">{league.country}</span>
            <span>•</span>
            <span className="font-medium">{league.season} 시즌</span>
            {league.type && (
              <>
                <span>•</span>
                <span className="capitalize font-medium">{league.type}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 