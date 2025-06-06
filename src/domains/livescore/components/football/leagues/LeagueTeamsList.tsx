'use client';

import { LeagueTeam } from '@/domains/livescore/actions/footballApi';
import TeamCard from './TeamCard';

interface LeagueTeamsListProps {
  teams: LeagueTeam[];
  isLoading?: boolean;
}

export default function LeagueTeamsList({ teams, isLoading = false }: LeagueTeamsListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">소속 팀</h2>
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2 lg:gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-2 lg:p-4 animate-pulse border"
            >
              <div className="flex flex-col items-center space-y-1 lg:space-y-3">
                <div className="w-8 h-8 lg:w-16 lg:h-16 bg-gray-200 rounded-full"></div>
                <div className="space-y-1 w-full">
                  <div className="h-3 lg:h-4 bg-gray-200 rounded w-full"></div>
                  <div className="hidden lg:block h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  <div className="hidden lg:block h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">소속 팀</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            0개 팀
          </span>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">
            소속 팀 정보를 찾을 수 없습니다
          </div>
          <div className="text-gray-400 text-sm">
            리그 정보를 다시 확인해주세요
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">소속 팀</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          총 {teams.length}개 팀
        </span>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2 lg:gap-4">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </div>
  );
} 