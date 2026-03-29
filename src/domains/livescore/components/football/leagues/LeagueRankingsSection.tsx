'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { PlayerRanking } from '@/domains/livescore/types/player';
import { getTeamDisplayName } from '@/domains/livescore/constants/teams';

const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

interface LeagueRankingsSectionProps {
  topScorers: PlayerRanking[];
  topAssists: PlayerRanking[];
  playerPhotoUrls: Record<number, string>;
  teamLogoUrls: Record<number, string>;
  playerKoreanNames: Record<number, string | null>;
  leagueId: number;
}

const PlayerRow = memo(({
  ranking,
  index,
  type,
  playerPhotoUrl,
  teamLogoUrl,
  koreanName,
}: {
  ranking: PlayerRanking;
  index: number;
  type: 'goals' | 'assists';
  playerPhotoUrl?: string;
  teamLogoUrl?: string;
  koreanName?: string | null;
}) => {
  const stat = ranking.statistics[0];
  const value = type === 'goals' ? stat.goals?.total || 0 : stat.goals?.assists || 0;
  const teamName = getTeamDisplayName(stat.team?.id || 0) || stat.team?.name || '';
  const displayName = koreanName || ranking.player.name;

  return (
    <Link
      href={`/livescore/football/player/${ranking.player.id}`}
      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
    >
      {/* 순위 */}
      <span className={`w-5 text-center text-xs font-bold flex-shrink-0 ${
        index < 3 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
      }`}>
        {index + 1}
      </span>

      {/* 선수 사진 */}
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-[#333]">
        <UnifiedSportsImageClient
          src={playerPhotoUrl || PLAYER_PLACEHOLDER}
          alt={displayName}
          width={32}
          height={32}
          className="object-cover w-8 h-8"
        />
      </div>

      {/* 선수명 + 팀 */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
          {displayName}
        </p>
        <div className="flex items-center gap-1">
          {/* 팀 로고: 모바일 숨김 */}
          <div className="w-3.5 h-3.5 flex-shrink-0 hidden md:block">
            <UnifiedSportsImageClient
              src={teamLogoUrl || TEAM_PLACEHOLDER}
              alt={teamName}
              width={14}
              height={14}
              className="object-contain w-3.5 h-3.5"
            />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {teamName}
          </span>
        </div>
      </div>

      {/* 경기수 */}
      <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
        {stat.games?.appearences || 0}경기
      </span>

      {/* 스탯 */}
      <span className="w-8 text-right text-sm font-bold text-gray-900 dark:text-gray-100 flex-shrink-0">
        {value}
      </span>
    </Link>
  );
});
PlayerRow.displayName = 'PlayerRow';

const RankingTable = memo(({
  title,
  rankings,
  type,
  playerPhotoUrls,
  teamLogoUrls,
  playerKoreanNames,
}: {
  title: string;
  rankings: PlayerRanking[];
  type: 'goals' | 'assists';
  playerPhotoUrls: Record<number, string>;
  teamLogoUrls: Record<number, string>;
  playerKoreanNames: Record<number, string | null>;
}) => {
  if (rankings.length === 0) return null;

  return (
    <Container>
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="p-0">
        {/* 헤더 */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 dark:border-gray-700/50 text-[11px] text-gray-400 dark:text-gray-500">
          <span className="w-5 text-center">#</span>
          <span className="w-8" />
          <span className="flex-1">선수</span>
          <span className="flex-shrink-0">경기</span>
          <span className="w-8 text-right">{type === 'goals' ? '골' : '도움'}</span>
        </div>
        {/* 리스트 */}
        <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
          {rankings.map((ranking, index) => (
            <PlayerRow
              key={ranking.player.id}
              ranking={ranking}
              index={index}
              type={type}
              playerPhotoUrl={playerPhotoUrls[ranking.player.id]}
              teamLogoUrl={teamLogoUrls[ranking.statistics[0]?.team?.id || 0]}
              koreanName={playerKoreanNames[ranking.player.id]}
            />
          ))}
        </div>
      </ContainerContent>
    </Container>
  );
});
RankingTable.displayName = 'RankingTable';

export default function LeagueRankingsSection({
  topScorers,
  topAssists,
  playerPhotoUrls,
  teamLogoUrls,
  playerKoreanNames,
}: LeagueRankingsSectionProps) {
  if (topScorers.length === 0 && topAssists.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RankingTable
        title="득점 순위"
        rankings={topScorers}
        type="goals"
        playerPhotoUrls={playerPhotoUrls}
        teamLogoUrls={teamLogoUrls}
        playerKoreanNames={playerKoreanNames}
      />
      <RankingTable
        title="도움 순위"
        rankings={topAssists}
        type="assists"
        playerPhotoUrls={playerPhotoUrls}
        teamLogoUrls={teamLogoUrls}
        playerKoreanNames={playerKoreanNames}
      />
    </div>
  );
}
