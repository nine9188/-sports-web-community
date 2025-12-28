'use client';

import Link from 'next/link';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

interface LeagueCardProps {
  leagueId: number;
  name: string;
}

export default function LeagueCard({ leagueId, name }: LeagueCardProps) {
  return (
    <Link
      href={`/livescore/football/leagues/${leagueId}`}
      className="group flex flex-col items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors p-2 lg:p-3"
    >
      <UnifiedSportsImage
        imageId={leagueId}
        imageType={ImageType.Leagues}
        alt={`${name} 로고`}
        size="md"
        className="w-7 h-7 lg:w-10 lg:h-10"
      />
      <h3 className="mt-1 lg:mt-2 text-[9px] lg:text-xs font-medium text-gray-900 dark:text-[#F0F0F0] text-center leading-tight line-clamp-2">
        {name}
      </h3>
    </Link>
  );
} 