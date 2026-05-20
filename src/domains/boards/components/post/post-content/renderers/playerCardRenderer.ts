import type { PlayerCardData } from '@/shared/types/playerCard';
import { getImageUrls } from '@/shared/utils/matchCard';
import { getPlayerHref } from '@/domains/livescore/utils/entityLinks';
import { normalizeDisplayImageUrl } from '@/shared/images/urls';

const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

function normalizePlayerCardData(data: Record<string, unknown>): PlayerCardData {
  const team = data.team as Record<string, unknown> | undefined;

  return {
    id: (data.id as number) || 0,
    name: (data.name as string) || '',
    name_en: data.name_en as string | null | undefined,
    name_ko: data.name_ko as string | null | undefined,
    slug: data.slug as string | null | undefined,
    koreanName: data.koreanName as string | undefined,
    photo: normalizeDisplayImageUrl(data.photo as string | undefined, { fallback: PLAYER_PLACEHOLDER }),
    team: {
      id: (team?.id as number) || 0,
      name: (team?.name as string) || '',
      name_en: team?.name_en as string | null | undefined,
      name_ko: team?.name_ko as string | null | undefined,
      slug: team?.slug as string | null | undefined,
      koreanName: team?.koreanName as string | undefined,
      logo: normalizeDisplayImageUrl(team?.logo as string | undefined, { fallback: TEAM_PLACEHOLDER }),
    },
    position: data.position as string | null | undefined,
    number: data.number as number | null | undefined,
    age: data.age as number | null | undefined,
    stats: data.stats as PlayerCardData['stats'] | undefined,
  };
}

export function renderPlayerCard(data: { playerId: string | number; playerData: Record<string, unknown> }): string {
  const { playerData: rawData } = data;
  const playerData = normalizePlayerCardData(rawData);
  const playerId = playerData.id || data.playerId;

  const displayName = playerData.koreanName || playerData.name;
  const teamDisplayName = playerData.team?.koreanName || playerData.team?.name || '';
  const href = getPlayerHref({ ...playerData, id: playerId });
  const teamImages = getImageUrls(playerData.team?.logo, playerData.team?.id, 'teams');

  return `
    <div class="player-card" data-type="player-card" data-player-id="${playerId}">
      <a href="${href}">
        <div class="league-header">
          <div style="display: flex; align-items: center;">
            ${playerData.team?.id ? `
              <div class="league-logo-box">
                <img
                  src="${teamImages.light}"
                  data-light-src="${teamImages.light}"
                  data-dark-src="${teamImages.dark}"
                  alt="${teamDisplayName}"
                  onerror="this.onerror=null;this.src='${TEAM_PLACEHOLDER}';"
                />
              </div>
            ` : ''}
            <span class="league-name">${teamDisplayName}</span>
          </div>
        </div>

        <div class="player-main">
          <div class="player-photo">
            <img
              src="${playerData.photo}"
              alt="${displayName}"
              onerror="this.onerror=null;this.src='${PLAYER_PLACEHOLDER}';"
            />
          </div>
          <span class="player-name">${displayName}</span>
        </div>

        <div class="match-footer">
          <span class="footer-link">선수 페이지 보기 &gt;</span>
        </div>
      </a>
    </div>
  `;
}
