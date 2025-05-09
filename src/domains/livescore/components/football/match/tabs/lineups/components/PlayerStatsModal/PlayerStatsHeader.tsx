'use client';

import Image from 'next/image';
import { onImageError } from './utils';
import { PlayerStatistics } from '@/domains/livescore/actions/match/playerStats';

interface PlayerStatsHeaderProps {
  playerInfo: {
    name: string;
    number: string;
    pos: string;
    team: {
      id: number;
      name: string;
    };
  };
  stats: PlayerStatistics;
  playerPhotoUrl: string;
}

export default function PlayerStatsHeader({ 
  playerInfo, 
  stats, 
  playerPhotoUrl 
}: PlayerStatsHeaderProps) {
  return (
    <div className="px-6 pt-3 pb-6 text-center">
      <div className="relative w-28 h-28 mx-auto mb-4">
        <div className="relative w-28 h-28">
          <div className="absolute inset-0 rounded-full border-4 border-white shadow-lg"></div>
          <Image
            src={playerPhotoUrl}
            alt={playerInfo.name}
            width={112}
            height={112}
            className="w-full h-full rounded-full object-cover"
            unoptimized
            onError={(e) => onImageError(e, '/images/player-placeholder.png')}
          />
        </div>
        {stats.team?.logo && (
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
            <Image
              src={stats.team.logo}
              alt={stats.team?.name || '팀 로고'}
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
              unoptimized
              onError={(e) => onImageError(e, '/images/team-placeholder.png')}
            />
          </div>
        )}
      </div>
      <h2 className="text-xl font-bold mb-1">{playerInfo.name}</h2>
      <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
        <span>#{playerInfo.number}</span>
        <span>{playerInfo.pos}</span>
        {stats.games?.captain && (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
            주장
          </span>
        )}
      </div>
    </div>
  );
} 