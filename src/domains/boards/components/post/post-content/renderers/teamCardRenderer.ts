import type { TeamCardData } from '@/shared/types/teamCard';
import { getImageUrls } from '@/shared/utils/matchCard';

const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

/**
 * 팀 카드 데이터 정규화
 */
function normalizeTeamCardData(data: Record<string, unknown>): TeamCardData {
  return {
    id: (data.id as number) || 0,
    name: (data.name as string) || '',
    koreanName: data.koreanName as string | undefined,
    logo: (data.logo as string) || `${SUPABASE_URL}/storage/v1/object/public/teams/${data.id}.png`,
    league: {
      id: ((data.league as Record<string, unknown>)?.id as number) || 0,
      name: ((data.league as Record<string, unknown>)?.name as string) || '',
      koreanName: (data.league as Record<string, unknown>)?.koreanName as string | undefined,
      logo: (data.league as Record<string, unknown>)?.logo as string | undefined,
    },
    country: data.country as string | undefined,
    venue: data.venue as string | undefined,
    currentPosition: data.currentPosition as number | null | undefined,
  };
}

/**
 * 팀 카드 HTML 생성
 */
export function renderTeamCard(data: { teamId: string | number; teamData: Record<string, unknown> }): string {
  const { teamId, teamData: rawData } = data;
  const teamData = normalizeTeamCardData(rawData);

  const displayName = teamData.koreanName || teamData.name;
  const leagueDisplayName = teamData.league?.koreanName || teamData.league?.name || '';

  // 다크모드 이미지 URL 생성
  const leagueImages = getImageUrls(teamData.league?.logo, teamData.league?.id, 'leagues');
  const teamImages = getImageUrls(teamData.logo, teamData.id, 'teams');

  return `
    <div class="team-card" data-type="team-card" data-team-id="${teamId}">
      <a href="/livescore/football/team/${teamId}">
        <!-- 헤더: 리그 로고 + 리그명 -->
        <div class="league-header">
          <div style="display: flex; align-items: center;">
            ${teamData.league?.id ? `
              <div class="league-logo-box">
                <img
                  src="${leagueImages.light}"
                  data-light-src="${leagueImages.light}"
                  data-dark-src="${leagueImages.dark}"
                  alt="${leagueDisplayName}"
                  onerror="this.onerror=null;this.src='/placeholder.png';"
                />
              </div>
            ` : ''}
            <span class="league-name">${leagueDisplayName}</span>
          </div>
        </div>

        <!-- 메인: 팀 로고 + 팀명 -->
        <div class="team-main">
          <div class="team-logo-box">
            <img
              src="${teamImages.light}"
              data-light-src="${teamImages.light}"
              data-dark-src="${teamImages.dark}"
              alt="${displayName}"
              onerror="this.onerror=null;this.src='${SUPABASE_URL}/storage/v1/object/public/teams/${teamId}.png';"
            />
          </div>
          <span class="team-name">${displayName}</span>
        </div>

        <!-- 푸터: 팀 정보 확인 -->
        <div class="match-footer">
          <span class="footer-link">팀 정보 확인</span>
        </div>
      </a>
    </div>
  `;
}
