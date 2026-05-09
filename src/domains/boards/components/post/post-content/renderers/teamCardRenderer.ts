import type { TeamCardData } from '@/shared/types/teamCard';
import { getImageUrls } from '@/shared/utils/matchCard';
import { getTeamHref } from '@/domains/livescore/utils/entityLinks';

const SUPABASE_URL = 'https://cdn.4590football.com';

function normalizeTeamCardData(data: Record<string, unknown>): TeamCardData {
  const league = data.league as Record<string, unknown> | undefined;

  return {
    id: (data.id as number) || 0,
    name: (data.name as string) || '',
    name_en: data.name_en as string | null | undefined,
    name_ko: data.name_ko as string | null | undefined,
    slug: data.slug as string | null | undefined,
    koreanName: data.koreanName as string | undefined,
    logo: (data.logo as string) || `${SUPABASE_URL}/teams/md/${data.id}.webp`,
    league: {
      id: (league?.id as number) || 0,
      name: (league?.name as string) || '',
      koreanName: league?.koreanName as string | undefined,
      logo: league?.logo as string | undefined,
    },
    country: data.country as string | undefined,
    venue: data.venue as string | undefined,
    currentPosition: data.currentPosition as number | null | undefined,
  };
}

export function renderTeamCard(data: { teamId: string | number; teamData: Record<string, unknown> }): string {
  const { teamData: rawData } = data;
  const teamData = normalizeTeamCardData(rawData);
  const teamId = teamData.id || data.teamId;

  const displayName = teamData.koreanName || teamData.name;
  const leagueDisplayName = teamData.league?.koreanName || teamData.league?.name || '';
  const href = getTeamHref({ ...teamData, id: teamId });
  const leagueImages = getImageUrls(teamData.league?.logo, teamData.league?.id, 'leagues');
  const teamImages = getImageUrls(teamData.logo, teamData.id, 'teams');

  return `
    <div class="team-card" data-type="team-card" data-team-id="${teamId}">
      <a href="${href}">
        <div class="league-header">
          <div style="display: flex; align-items: center;">
            ${teamData.league?.id ? `
              <div class="league-logo-box">
                <img
                  src="${leagueImages.light}"
                  data-light-src="${leagueImages.light}"
                  data-dark-src="${leagueImages.dark}"
                  alt="${leagueDisplayName}"
                  onerror="this.onerror=null;this.src='/placeholder.webp';"
                />
              </div>
            ` : ''}
            <span class="league-name">${leagueDisplayName}</span>
          </div>
        </div>

        <div class="team-main">
          <div class="team-logo-box">
            <img
              src="${teamImages.light}"
              data-light-src="${teamImages.light}"
              data-dark-src="${teamImages.dark}"
              alt="${displayName}"
              onerror="this.onerror=null;this.src='${SUPABASE_URL}/teams/md/${teamId}.webp';"
            />
          </div>
          <span class="team-name">${displayName}</span>
        </div>

        <div class="match-footer">
          <span class="footer-link">팀 정보 확인</span>
        </div>
      </a>
    </div>
  `;
}
