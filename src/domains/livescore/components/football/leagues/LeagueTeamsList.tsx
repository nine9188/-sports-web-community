'use client';

import { LeagueTeam } from '@/domains/livescore/actions/footballApi';
import TeamCard from './TeamCard';
import { MLS_TEAMS, MLSConference } from '@/domains/livescore/constants/teams/mls';

interface LeagueTeamsListProps {
  teams: LeagueTeam[];
  isLoading?: boolean;
  leagueId?: number | string;
}

export default function LeagueTeamsList({ teams, isLoading = false, leagueId }: LeagueTeamsListProps) {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2 lg:gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-[#F5F5F5] dark:bg-[#262626] rounded-lg p-2 lg:p-4 animate-pulse"
            >
              <div className="flex flex-col items-center space-y-1 lg:space-y-3">
                <div className="w-8 h-8 lg:w-16 lg:h-16 bg-[#EAEAEA] dark:bg-[#333333] rounded-full"></div>
                <div className="space-y-1 w-full">
                  <div className="h-3 lg:h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded w-full"></div>
                  <div className="hidden lg:block h-3 bg-[#EAEAEA] dark:bg-[#333333] rounded w-3/4 mx-auto"></div>
                  <div className="hidden lg:block h-3 bg-[#EAEAEA] dark:bg-[#333333] rounded w-1/2 mx-auto"></div>
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
      <div className="p-4">
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            소속 팀 정보를 찾을 수 없습니다
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            리그 정보를 다시 확인해주세요
          </div>
        </div>
      </div>
    );
  }

  // MLS 컨퍼런스 분리 로직 (리그 ID: 253)
  const isMLS = String(leagueId) === '253';
  const mlsConferenceById = new Map<number, MLSConference>(MLS_TEAMS.map(t => [t.id, t.conference]));
  const westTeams: LeagueTeam[] = [];
  const eastTeams: LeagueTeam[] = [];

  if (isMLS) {
    teams.forEach((t) => {
      const conf = mlsConferenceById.get(t.id);
      if (conf === MLSConference.WEST) westTeams.push(t);
      else if (conf === MLSConference.EAST) eastTeams.push(t);
    });

    const byRankThenName = (a: LeagueTeam, b: LeagueTeam) => {
      if (a.position && b.position) return a.position - b.position;
      if (a.position && !b.position) return -1;
      if (!a.position && b.position) return 1;
      return a.name.localeCompare(b.name);
    };

    westTeams.sort(byRankThenName);
    eastTeams.sort(byRankThenName);
  }

  return (
    <div className="p-4">
      {isMLS ? (
        <div className="space-y-6">
          {/* WEST */}
          <div>
            <div className="flex items-center mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-[#F0F0F0]">서부 컨퍼런스 (WEST)</h3>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2 lg:gap-4">
              {westTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </div>

          {/* EAST */}
          <div>
            <div className="flex items-center mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-[#F0F0F0]">동부 컨퍼런스 (EAST)</h3>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2 lg:gap-4">
              {eastTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2 lg:gap-4">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
