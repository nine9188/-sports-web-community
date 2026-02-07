'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

// 4590 표준: placeholder URL
const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
import { Container, ContainerHeader, ContainerTitle, Button } from '@/shared/components/ui';
import { PlayerStats } from '@/domains/livescore/actions/teams/player-stats';
import { Player, Coach } from '@/domains/livescore/actions/teams/squad';
import { PlayerKoreanNames } from '../../../TeamPageClient';

interface SeasonHighlightsProps {
  playerStats: Record<number, PlayerStats>;
  squad: (Player | Coach)[];
  onTabChange?: (tab: string) => void;
  playerKoreanNames?: PlayerKoreanNames;
  // 4590 표준: Storage URL 맵
  playerPhotoUrls?: Record<number, string>;
}

interface RankedPlayer {
  id: number;
  name: string;
  photo: string;
  value: number;
}

export default function SeasonHighlights({ playerStats, squad, onTabChange, playerKoreanNames = {}, playerPhotoUrls = {} }: SeasonHighlightsProps) {
  const router = useRouter();

  // 4590 표준: URL 조회 헬퍼
  const getPlayerPhoto = (id: number) => playerPhotoUrls[id] || PLAYER_PLACEHOLDER;

  // 선수 페이지로 이동
  const handlePlayerClick = (playerId: number) => {
    router.push(`/livescore/football/player/${playerId}`);
  };
  const { topScorers, topAssists } = useMemo(() => {
    // squad에서 선수 정보 매핑 (코치 제외)
    const playerMap = new Map<number, { name: string; photo: string }>();
    for (const member of squad) {
      if ('position' in member && member.position !== 'Coach') {
        playerMap.set(member.id, { name: member.name, photo: member.photo });
      }
    }

    const scorers: RankedPlayer[] = [];
    const assisters: RankedPlayer[] = [];

    for (const [idStr, stats] of Object.entries(playerStats)) {
      const id = Number(idStr);
      const info = playerMap.get(id);
      if (!info) continue;

      const displayName = playerKoreanNames[id] || info.name;

      if (stats.goals > 0) {
        scorers.push({ id, name: displayName, photo: info.photo, value: stats.goals });
      }
      if (stats.assists > 0) {
        assisters.push({ id, name: displayName, photo: info.photo, value: stats.assists });
      }
    }

    scorers.sort((a, b) => b.value - a.value);
    assisters.sort((a, b) => b.value - a.value);

    return {
      topScorers: scorers.slice(0, 3),
      topAssists: assisters.slice(0, 3),
    };
  }, [playerStats, squad, playerKoreanNames]);

  if (topScorers.length === 0 && topAssists.length === 0) {
    return null;
  }

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>시즌 하이라이트</ContainerTitle>
      </ContainerHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/10">
        {/* 최다 득점 */}
        <div>
          <div className="bg-[#F5F5F5] dark:bg-[#262626] py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/10">
            최다 득점
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {topScorers.length > 0 ? (
              topScorers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#333333] transition-colors"
                  onClick={() => handlePlayerClick(player.id)}
                >
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-4 text-center">
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 bg-[#F5F5F5] dark:bg-[#333333] rounded-full overflow-hidden flex-shrink-0">
                    <UnifiedSportsImageClient
                      src={getPlayerPhoto(player.id)}
                      alt={player.name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <span className="text-xs md:text-sm text-gray-900 dark:text-[#F0F0F0] truncate flex-1">
                    {player.name}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                    {player.value}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center">
                데이터 없음
              </div>
            )}
          </div>
        </div>

        {/* 최다 어시스트 */}
        <div>
          <div className="bg-[#F5F5F5] dark:bg-[#262626] py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/10">
            최다 어시스트
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {topAssists.length > 0 ? (
              topAssists.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#333333] transition-colors"
                  onClick={() => handlePlayerClick(player.id)}
                >
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-4 text-center">
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 bg-[#F5F5F5] dark:bg-[#333333] rounded-full overflow-hidden flex-shrink-0">
                    <UnifiedSportsImageClient
                      src={getPlayerPhoto(player.id)}
                      alt={player.name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <span className="text-xs md:text-sm text-gray-900 dark:text-[#F0F0F0] truncate flex-1">
                    {player.name}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                    {player.value}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center">
                데이터 없음
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 선수단 보기 버튼 */}
      {onTabChange && (
        <Button
          variant="secondary"
          onClick={() => onTabChange('squad')}
          className="w-full rounded-none md:rounded-b-lg border-t border-black/5 dark:border-white/10"
        >
          <div className="flex items-center justify-center gap-1">
            <span className="text-sm font-medium">선수단 보기</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Button>
      )}
    </Container>
  );
}
