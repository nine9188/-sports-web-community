'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LeagueTeam } from '@/domains/livescore/actions/footballApi';
import { getTeamById } from '@/domains/livescore/constants/teams';

interface TeamCardProps {
  team: LeagueTeam;
}

const DEFAULT_TEAM_LOGO = 'https://cdn.sportmonks.com/images/soccer/team_placeholder.png';

export default function TeamCard({ team }: TeamCardProps) {
  // 한국어 팀명 매핑
  const teamInfo = getTeamById(team.id);
  const displayName = teamInfo?.name_ko || team.name;

  return (
    <Link 
      href={`/livescore/football/team/${team.id}`}
      className={`group block bg-white rounded-lg border transition-all duration-200 p-2 lg:p-4 relative ${
        team.isWinner 
          ? 'border-yellow-400 hover:border-yellow-500 hover:shadow-lg shadow-md' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      {/* 우승 표시 */}
      {team.isWinner && (
        <div className="absolute top-1 right-1 lg:top-2 lg:right-2 bg-yellow-500 text-white text-[8px] lg:text-xs font-bold px-1 lg:px-2 py-0.5 lg:py-1 rounded shadow-sm">
          우승
        </div>
      )}
      
      <div className="flex flex-col items-center space-y-1 lg:space-y-3">
        {/* 팀 로고 */}
        <div className="relative w-8 h-8 lg:w-16 lg:h-16 flex-shrink-0">
          <Image
            src={team.logo || DEFAULT_TEAM_LOGO}
            alt={`${displayName} 로고`}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 1024px) 32px, 64px"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = DEFAULT_TEAM_LOGO;
            }}
          />
        </div>

        {/* 팀 정보 */}
        <div className="text-center w-full">
          {/* 팀 이름 */}
          <h3 className={`${displayName.length >= 8 ? 'text-[10px] lg:text-sm' : 'text-xs lg:text-sm'} font-medium lg:font-semibold text-gray-900 text-center leading-tight group-hover:text-blue-600 transition-colors line-clamp-2`}>
            {displayName}
          </h3>
          
          {/* 데스크탑에서만 표시되는 추가 정보 */}
          <div className="hidden lg:block space-y-1 mt-2">
            {team.venue.name && (
              <p className="text-xs text-gray-500 truncate">
                {team.venue.name}
              </p>
            )}
            
            {team.venue.city && (
              <p className="text-xs text-gray-400">
                {team.venue.city}
              </p>
            )}
            
            {team.founded > 0 && (
              <p className="text-xs text-gray-400">
                창단 {team.founded}년
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 