'use client';

import Link from 'next/link';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { LeagueTeam } from '@/domains/livescore/actions/footballApi';
import { getTeamById } from '@/domains/livescore/constants/teams';

interface TeamCardProps {
  team: LeagueTeam;
}

export default function TeamCard({ team }: TeamCardProps) {
  // 한국어 팀명 매핑
  const teamInfo = getTeamById(team.id);
  const displayName = teamInfo?.name_ko || team.name;

  return (
    <Link
      href={`/livescore/football/team/${team.id}`}
      className={`group flex flex-col items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-lg transition-colors p-2 lg:p-3 relative ${
        team.isWinner
          ? 'ring-2 ring-yellow-400 dark:ring-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
          : 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
      }`}
    >
      {team.isWinner && (
        <div className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 bg-yellow-500 text-white text-[6px] lg:text-[10px] font-bold px-1 py-0.5 rounded">
          우승
        </div>
      )}
      <UnifiedSportsImage
        imageId={team.id}
        imageType={ImageType.Teams}
        alt={`${displayName} 로고`}
        size="md"
        className="w-7 h-7 lg:w-10 lg:h-10"
      />
      <h3 className="mt-1 lg:mt-2 text-[9px] lg:text-xs font-medium text-gray-900 dark:text-[#F0F0F0] text-center leading-tight line-clamp-2">
        {displayName}
      </h3>
    </Link>
  );
}
