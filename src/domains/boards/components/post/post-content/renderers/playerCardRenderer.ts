import type { PlayerCardData } from '@/shared/types/playerCard';
import { getImageUrls } from '@/shared/utils/matchCard';

const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

/**
 * 선수 카드 데이터 정규화
 */
function normalizePlayerCardData(data: Record<string, unknown>): PlayerCardData {
  const team = data.team as Record<string, unknown> | undefined;

  return {
    id: (data.id as number) || 0,
    name: (data.name as string) || '',
    koreanName: data.koreanName as string | undefined,
    photo: (data.photo as string) || `https://media.api-sports.io/football/players/${data.id}.png`,
    team: {
      id: (team?.id as number) || 0,
      name: (team?.name as string) || '',
      koreanName: team?.koreanName as string | undefined,
      logo: (team?.logo as string) || `${SUPABASE_URL}/storage/v1/object/public/teams/${team?.id}.png`,
    },
    position: data.position as string | null | undefined,
    number: data.number as number | null | undefined,
    age: data.age as number | null | undefined,
    stats: data.stats as PlayerCardData['stats'] | undefined,
  };
}

/**
 * 선수 카드 HTML 생성
 */
export function renderPlayerCard(data: { playerId: string | number; playerData: Record<string, unknown> }): string {
  const { playerId, playerData: rawData } = data;
  const playerData = normalizePlayerCardData(rawData);

  const displayName = playerData.koreanName || playerData.name;
  const teamDisplayName = playerData.team?.koreanName || playerData.team?.name || '';

  // 다크모드 이미지 URL 생성
  const teamImages = getImageUrls(playerData.team?.logo, playerData.team?.id, 'teams');

  return `
    <div class="player-card" data-type="player-card" data-player-id="${playerId}">
      <a href="/livescore/football/player/${playerId}">
        <!-- 헤더: 팀 로고 + 팀명 -->
        <div class="league-header">
          <div style="display: flex; align-items: center;">
            ${playerData.team?.id ? `
              <div class="league-logo-box">
                <img
                  src="${teamImages.light}"
                  data-light-src="${teamImages.light}"
                  data-dark-src="${teamImages.dark}"
                  alt="${teamDisplayName}"
                  onerror="this.onerror=null;this.src='/placeholder.png';"
                />
              </div>
            ` : ''}
            <span class="league-name">${teamDisplayName}</span>
          </div>
        </div>

        <!-- 메인: 선수 사진 + 이름 -->
        <div class="player-main">
          <div class="player-photo">
            <img
              src="${playerData.photo}"
              alt="${displayName}"
              onerror="this.onerror=null;this.src='https://media.api-sports.io/football/players/${playerId}.png';"
            />
          </div>
          <span class="player-name">${displayName}</span>
        </div>

        <!-- 푸터: 선수 정보 확인 -->
        <div class="match-footer">
          <span class="footer-link">선수 정보 확인</span>
        </div>
      </a>
    </div>
  `;
}
