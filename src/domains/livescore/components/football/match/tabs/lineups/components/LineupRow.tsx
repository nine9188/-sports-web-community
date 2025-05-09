'use client';

import React from 'react';
import { MatchEvent } from '@/domains/livescore/types/match';
import PlayerEvents from './PlayerEvents';
import { getPlayerKoreanName } from '../utils/formation';
import PlayerImage from './PlayerImage';

interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid?: string | null;
  captain?: boolean;
  photo?: string;
}

interface LineupRowProps {
  player: Player;
  teamId: number;
  teamName: string;
  events: MatchEvent[];
  onClick: (player: Player, teamId: number, teamName: string) => void;
}

export default function LineupRow({ player, teamId, teamName, events, onClick }: LineupRowProps) {
  return (
    <div 
      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
      onClick={() => onClick(player, teamId, teamName)}
    >
      <div className="relative">
        {player.photo ? (
          <PlayerImage 
            src={player.photo}
            alt={`${player.name} 선수 사진`}
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
            {player.number || '-'}
          </div>
        )}
        {player.captain && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
            C
          </span>
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">
          {getPlayerKoreanName() || player.name}
          {player.captain && (
            <span className="ml-1 text-xs text-yellow-600 font-semibold">(주장)</span>
          )}
        </div>
        <div className="text-xs text-gray-500 flex items-center flex-wrap">
          {player.pos || '-'} {player.number}
          <PlayerEvents player={player} events={events} />
        </div>
      </div>
    </div>
  );
} 