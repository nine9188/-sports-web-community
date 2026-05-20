/**
 * Shared match card utilities.
 *
 * This file is the single source for match card image URLs, status labels,
 * normalization, and HTML generation.
 */

import type { MatchStatus, MatchStatusInfo, ImageUrlPair } from '@/shared/types/matchCard';
import { getMatchHrefByTeams } from '@/domains/livescore/utils/entityLinks';
import {
  DARK_MODE_LEAGUE_IDS as SHARED_DARK_MODE_LEAGUE_IDS,
  normalizeDisplayImageUrl,
  sportsAssetUrlPair,
  SPORTS_PLACEHOLDERS,
} from '@/shared/images/urls';

/**
 * Leagues that have separate dark-mode logos.
 */
export const DARK_MODE_LEAGUE_IDS = SHARED_DARK_MODE_LEAGUE_IDS;

const TEAM_PLACEHOLDER = SPORTS_PLACEHOLDERS.teams;
const LEAGUE_PLACEHOLDER = SPORTS_PLACEHOLDERS.leagues;

export function getImageUrls(
  logoUrl: string | undefined,
  id: number | string | undefined,
  type: 'teams' | 'leagues'
): ImageUrlPair {
  if (id) {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    return sportsAssetUrlPair(type, numericId);
  }

  if (logoUrl) {
    const idMatch = logoUrl.match(/\/(teams|leagues)\/(?:sm\/|md\/)?(\d+)(?:-1)?\.(?:webp|png)$/);
    if (idMatch) {
      const imageType = idMatch[1] as 'teams' | 'leagues';
      const imageId = parseInt(idMatch[2], 10);
      return getImageUrls(undefined, imageId, imageType);
    }

    const fallback = type === 'leagues' ? LEAGUE_PLACEHOLDER : TEAM_PLACEHOLDER;
    const normalizedLogoUrl = normalizeDisplayImageUrl(logoUrl, { fallback });
    return { light: normalizedLogoUrl, dark: normalizedLogoUrl };
  }

  const fallback = type === 'leagues' ? LEAGUE_PLACEHOLDER : TEAM_PLACEHOLDER;
  return { light: fallback, dark: fallback };
}

export function getStatusInfo(status: MatchStatus | undefined | null): MatchStatusInfo {
  if (!status) {
    return { text: '경기 결과', className: '', isLive: false };
  }

  const statusCode = status.code || '';

  switch (statusCode) {
    case 'FT':
      return { text: '경기 종료', className: '', isLive: false };

    case 'NS':
      return { text: '경기 예정', className: '', isLive: false };

    case 'HT':
      return { text: '하프타임', className: 'live', isLive: true };

    case '1H': {
      const elapsed = status.elapsed ? `(${status.elapsed}분)` : '';
      return { text: `전반 진행 중${elapsed}`, className: 'live', isLive: true };
    }

    case '2H': {
      const elapsed = status.elapsed ? `(${status.elapsed}분)` : '';
      return { text: `후반 진행 중${elapsed}`, className: 'live', isLive: true };
    }

    case 'LIVE': {
      const elapsed = status.elapsed ? `(${status.elapsed}분)` : '';
      return { text: `진행 중${elapsed}`, className: 'live', isLive: true };
    }

    case 'PST':
      return { text: '연기됨', className: 'postponed', isLive: false };

    case 'CANC':
      return { text: '취소됨', className: 'cancelled', isLive: false };

    case 'ABD':
      return { text: '중단됨', className: 'abandoned', isLive: false };

    default:
      return { text: '경기 결과', className: '', isLive: false };
  }
}

export function isValidMatchCardData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;
  if (!obj.teams || typeof obj.teams !== 'object') return false;
  if (!obj.league || typeof obj.league !== 'object') return false;

  const teams = obj.teams as Record<string, unknown>;
  return Boolean(teams.home && teams.away);
}

export interface NormalizedMatchData {
  id: string | number;
  teams: {
    home: { id?: number | string; name: string; name_en?: string | null; name_ko?: string | null; slug?: string | null; logo?: string; winner?: boolean | null };
    away: { id?: number | string; name: string; name_en?: string | null; name_ko?: string | null; slug?: string | null; logo?: string; winner?: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  league: { id?: number | string; name: string; logo?: string };
  status: { code: string; elapsed?: number | null };
}

export function normalizeMatchCardData(data: Record<string, unknown>): NormalizedMatchData {
  const teams = (data.teams as Record<string, unknown>) || {};
  const goals = (data.goals as Record<string, unknown>) || {};
  const league = (data.league as Record<string, unknown>) || {};
  const status = (data.status as Record<string, unknown>) || {};

  const homeTeam = (teams.home as Record<string, unknown>) || {};
  const awayTeam = (teams.away as Record<string, unknown>) || {};

  return {
    id: (data.id as string | number) || 'unknown',
    teams: {
      home: {
        id: homeTeam.id as number | string | undefined,
        name: (homeTeam.name as string) || '홈팀',
        name_en: homeTeam.name_en as string | null | undefined,
        name_ko: homeTeam.name_ko as string | null | undefined,
        slug: homeTeam.slug as string | null | undefined,
        logo: homeTeam.logo as string | undefined,
        winner: homeTeam.winner as boolean | null | undefined,
      },
      away: {
        id: awayTeam.id as number | string | undefined,
        name: (awayTeam.name as string) || '원정팀',
        name_en: awayTeam.name_en as string | null | undefined,
        name_ko: awayTeam.name_ko as string | null | undefined,
        slug: awayTeam.slug as string | null | undefined,
        logo: awayTeam.logo as string | undefined,
        winner: awayTeam.winner as boolean | null | undefined,
      },
    },
    goals: {
      home: typeof goals.home === 'number' ? goals.home : null,
      away: typeof goals.away === 'number' ? goals.away : null,
    },
    league: {
      id: league.id as number | string | undefined,
      name: (league.name as string) || '알 수 없는 리그',
      logo: league.logo as string | undefined,
    },
    status: {
      code: (status.code as string) || (status.short as string) || '',
      elapsed: status.elapsed as number | null | undefined,
    },
  };
}

export interface MatchCardHtmlOptions {
  useInlineStyles?: boolean;
  includeDataAttr?: boolean;
  markAsProcessed?: boolean;
}

export function generateMatchCardHtml(
  matchData: NormalizedMatchData,
  options: MatchCardHtmlOptions = {}
): string {
  const {
    useInlineStyles = false,
    includeDataAttr = false,
    markAsProcessed = true,
  } = options;

  const { teams, goals, league, status, id: matchId } = matchData;
  const homeTeam = teams.home;
  const awayTeam = teams.away;
  const homeScore = goals.home !== null ? goals.home : '-';
  const awayScore = goals.away !== null ? goals.away : '-';

  const homeTeamName = homeTeam.name_ko || homeTeam.name;
  const awayTeamName = awayTeam.name_ko || awayTeam.name;
  const leagueName = league.name;
  const href = getMatchHrefByTeams(matchId, homeTeam, awayTeam);

  const leagueImages = getImageUrls(league.logo, league.id, 'leagues');
  const homeTeamImages = getImageUrls(homeTeam.logo, homeTeam.id, 'teams');
  const awayTeamImages = getImageUrls(awayTeam.logo, awayTeam.id, 'teams');
  const statusInfo = getStatusInfo(status);
  const dataMatchAttr = includeDataAttr
    ? `data-match="${encodeURIComponent(JSON.stringify(matchData))}"`
    : '';

  if (useInlineStyles) {
    return generateInlineStyleHtml(
      matchId,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      league,
      leagueImages,
      homeTeamImages,
      awayTeamImages,
      statusInfo,
      dataMatchAttr,
      homeTeamName,
      awayTeamName,
      leagueName
    );
  }

  const processedClass = markAsProcessed ? ' processed-match-card' : '';
  const processedAttr = markAsProcessed ? ' data-processed="true"' : '';

  return `
    <div class="match-card${processedClass}" data-type="match-card" data-match-id="${matchId}"${processedAttr}>
      <a href="${href}">
        <div class="league-header">
          <div style="display: flex; align-items: center;">
            <div class="league-logo-box">
              <img
                src="${leagueImages.light}"
                data-light-src="${leagueImages.light}"
                data-dark-src="${leagueImages.dark}"
                alt="${leagueName}"
                onerror="this.onerror=null;this.src='${LEAGUE_PLACEHOLDER}';"
              />
            </div>
            <span class="league-name">${leagueName}</span>
          </div>
        </div>

        <div class="match-main">
          <div class="team-info">
            <div class="team-logo-box">
              <img
                src="${homeTeamImages.light}"
                data-light-src="${homeTeamImages.light}"
                data-dark-src="${homeTeamImages.dark}"
                alt="${homeTeam.name}"
                onerror="this.onerror=null;this.src='${TEAM_PLACEHOLDER}';"
              />
            </div>
            <span class="team-name${homeTeam.winner ? ' winner' : ''}">${homeTeamName}</span>
          </div>

          <div class="score-area">
            <div class="score">
              <span class="score-number">${homeScore}</span>
              <span class="score-separator">-</span>
              <span class="score-number">${awayScore}</span>
            </div>
            <div class="match-status${statusInfo.isLive ? ' live' : ''}">${statusInfo.text}</div>
          </div>

          <div class="team-info">
            <div class="team-logo-box">
              <img
                src="${awayTeamImages.light}"
                data-light-src="${awayTeamImages.light}"
                data-dark-src="${awayTeamImages.dark}"
                alt="${awayTeam.name}"
                onerror="this.onerror=null;this.src='${TEAM_PLACEHOLDER}';"
              />
            </div>
            <span class="team-name${awayTeam.winner ? ' winner' : ''}">${awayTeamName}</span>
          </div>
        </div>

        <div class="match-footer">
          <span class="footer-link">경기 상세 보기 &gt;</span>
        </div>
      </a>
    </div>
  `;
}

function generateInlineStyleHtml(
  matchId: string | number,
  homeTeam: NormalizedMatchData['teams']['home'],
  awayTeam: NormalizedMatchData['teams']['away'],
  homeScore: number | string,
  awayScore: number | string,
  league: NormalizedMatchData['league'],
  leagueImages: ImageUrlPair,
  homeTeamImages: ImageUrlPair,
  awayTeamImages: ImageUrlPair,
  statusInfo: MatchStatusInfo,
  dataMatchAttr: string,
  homeTeamName: string,
  awayTeamName: string,
  leagueName: string
): string {
  const statusStyle = statusInfo.isLive ? 'color: #059669; font-weight: 500;' : '';
  const href = getMatchHrefByTeams(matchId, homeTeam, awayTeam);

  return `
    <div data-type="match-card" data-match-id="${matchId}" ${dataMatchAttr} style="
      width: 100%;
      max-width: 100%;
      margin: 12px 0;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      overflow: hidden;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      display: block;
    ">
      <a href="${href}" style="display: block; text-decoration: none; color: inherit;">
        <div style="
          padding: 12px;
          background-color: #f9fafb;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          height: 40px;
        ">
          <div style="display: flex; align-items: center;">
            <img
              src="${leagueImages.light}"
              data-light-src="${leagueImages.light}"
              data-dark-src="${leagueImages.dark}"
              alt="${leagueName}"
              style="width: 24px; height: 24px; object-fit: contain; margin-right: 8px;"
              onerror="this.onerror=null;this.src='${LEAGUE_PLACEHOLDER}';"
            />
            <span style="font-size: 14px; font-weight: 500; color: #4b5563;">${leagueName}</span>
          </div>
        </div>

        <div style="padding: 12px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; flex-direction: column; align-items: center; width: 40%;">
            <img
              src="${homeTeamImages.light}"
              data-light-src="${homeTeamImages.light}"
              data-dark-src="${homeTeamImages.dark}"
              alt="${homeTeam.name}"
              style="width: 48px; height: 48px; object-fit: contain; margin-bottom: 8px;"
              onerror="this.onerror=null;this.src='${TEAM_PLACEHOLDER}';"
            />
            <span style="font-size: 14px; font-weight: 500; text-align: center; color: ${homeTeam.winner ? '#2563eb' : '#000'};">
              ${homeTeamName}
            </span>
          </div>

          <div style="text-align: center; width: 20%;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
              <span style="font-size: 24px; font-weight: bold;">${homeScore}</span>
              <span style="color: #9ca3af; margin: 0 4px;">-</span>
              <span style="font-size: 24px; font-weight: bold;">${awayScore}</span>
            </div>
            <div style="font-size: 12px; ${statusStyle}">${statusInfo.text}</div>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; width: 40%;">
            <img
              src="${awayTeamImages.light}"
              data-light-src="${awayTeamImages.light}"
              data-dark-src="${awayTeamImages.dark}"
              alt="${awayTeam.name}"
              style="width: 48px; height: 48px; object-fit: contain; margin-bottom: 8px;"
              onerror="this.onerror=null;this.src='${TEAM_PLACEHOLDER}';"
            />
            <span style="font-size: 14px; font-weight: 500; text-align: center; color: ${awayTeam.winner ? '#2563eb' : '#000'};">
              ${awayTeamName}
            </span>
          </div>
        </div>

        <div style="padding: 8px 12px; background-color: #f9fafb; border-top: 1px solid rgba(0, 0, 0, 0.05); text-align: center;">
          <span style="font-size: 12px; color: #2563eb;">경기 상세 보기 &gt;</span>
        </div>
      </a>
    </div>
  `;
}
