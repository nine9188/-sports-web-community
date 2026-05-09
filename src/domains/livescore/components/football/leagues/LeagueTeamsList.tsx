'use client';

import Link from 'next/link';
import { LeagueTeam } from '@/domains/livescore/actions/footballApi';
import { ContainerContent } from '@/shared/components/ui';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { getTeamHref } from '@/domains/livescore/utils/entityLinks';

// 4590 표준: placeholder 상수
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

interface LeagueTeamsListProps {
  teams: LeagueTeam[];
  isLoading?: boolean;
  leagueId?: number | string;
  // 4590 표준: 이미지 Storage URL
  teamLogoUrls?: Record<number, string>;
}

export default function LeagueTeamsList({ teams, isLoading = false, leagueId, teamLogoUrls = {} }: LeagueTeamsListProps) {
  const { getTeamById } = useTeamLeague();
  // 4590 표준: URL 헬퍼 함수
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  // MLS 컨퍼런스 정보는 DB(football_teams.conference)에서 직접 조회
  if (isLoading) {
    return (
      <ContainerContent className="p-0">
        <div className="py-8 text-center">
          <p className="text-[13px] text-gray-500 dark:text-gray-400">불러오는 중...</p>
        </div>
      </ContainerContent>
    );
  }

  if (teams.length === 0) {
    return (
      <ContainerContent>
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            소속 팀 정보를 찾을 수 없습니다
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-[13px]">
            리그 정보를 다시 확인해주세요
          </div>
        </div>
      </ContainerContent>
    );
  }

  // MLS 컨퍼런스 분리 로직 (리그 ID: 253) — DB의 football_teams.conference 사용
  const isMLS = String(leagueId) === '253';
  const westTeams: LeagueTeam[] = [];
  const eastTeams: LeagueTeam[] = [];

  if (isMLS) {
    teams.forEach((t) => {
      const conf = getTeamById(t.id)?.conference;
      if (conf === 'WEST') westTeams.push(t);
      else if (conf === 'EAST') eastTeams.push(t);
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

  const TeamRow = ({ team }: { team: LeagueTeam }) => {
    const teamInfo = getTeamById(team.id);
    const displayName = teamInfo?.name_ko || team.name;

    return (
      <Link
        href={getTeamHref(team)}
        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors ${
          team.isWinner ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
        }`}
      prefetch={false}
      >
        <UnifiedSportsImageClient
          src={getTeamLogo(team.id)}
          alt={displayName}
          width={24}
          height={24}
          className="w-6 h-6"
        />
        <span className="text-[13px] text-gray-900 dark:text-[#F0F0F0] flex-1">
          {displayName}
        </span>
        {team.isWinner && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-yellow-500 text-white rounded">
            우승
          </span>
        )}
      </Link>
    );
  };

  return (
    <ContainerContent className="p-0">
      {isMLS ? (
        <div>
          {/* WEST */}
          <div className="px-4 py-2 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">서부 컨퍼런스 (WEST)</h3>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {westTeams.map((team) => (
              <TeamRow key={team.id} team={team} />
            ))}
          </div>

          {/* EAST */}
          <div className="px-4 py-2 bg-[#F5F5F5] dark:bg-[#262626] border-y border-black/5 dark:border-white/10">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">동부 컨퍼런스 (EAST)</h3>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {eastTeams.map((team) => (
              <TeamRow key={team.id} team={team} />
            ))}
          </div>
        </div>
      ) : (
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {teams.map((team) => (
            <TeamRow key={team.id} team={team} />
          ))}
        </div>
      )}
    </ContainerContent>
  );
}
