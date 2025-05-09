'use client';

import Link from 'next/link';
import Image from 'next/image';
import { onImageError } from './utils';

interface PlayerStatsEmptyProps {
  onClose: () => void;
  playerId: number;
  playerInfo: {
    name: string;
    number: string;
    pos: string;
    team: {
      id: number;
      name: string;
    };
  };
}

export default function PlayerStatsEmpty({ onClose, playerId, playerInfo }: PlayerStatsEmptyProps) {
  return (
    <div className="bg-white rounded-xl w-full max-w-md p-6 text-center">
      <div className="flex justify-end">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
          <Image
            src={`https://media.api-sports.io/football/players/${playerId}.png`}
            alt={playerInfo.name}
            width={80}
            height={80}
            className="w-full h-full object-cover"
            unoptimized
            onError={(e) => onImageError(e, '/images/player-placeholder.png')}
          />
        </div>
        <h3 className="text-lg font-semibold">{playerInfo.name}</h3>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-1 mb-4">
          <span>#{playerInfo.number}</span>
          <span>•</span>
          <span>{playerInfo.pos}</span>
          <span>•</span>
          <span>{playerInfo.team.name}</span>
        </div>
        
        <p className="text-gray-700 mb-1">선수 통계 데이터를 찾을 수 없습니다</p>
        <p className="text-sm text-gray-500 mb-4">이 경기에 대한 상세 통계가 제공되지 않습니다.</p>
        
        <div className="flex gap-2 justify-center">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium"
          >
            닫기
          </button>
          <Link 
            href={`/livescore/football/player/${playerId}`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
          >
            선수 정보 보기
          </Link>
        </div>
      </div>
    </div>
  );
} 