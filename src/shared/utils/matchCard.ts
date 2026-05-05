/**
 * 매치카드 공통 유틸리티
 *
 * 이 파일은 매치카드 관련 모든 유틸리티의 단일 소스입니다.
 * - 이미지 URL 생성
 * - 다크모드 리그 ID
 * - 상태 텍스트 생성
 */

import type { MatchStatus, MatchStatusInfo, ImageUrlPair } from '@/shared/types/matchCard';
import { getMatchSlug } from '@/domains/livescore/utils/slugs';
import { matchUrl } from '@/domains/livescore/utils/urls';

/**
 * 다크모드 전용 이미지가 있는 리그 ID 목록
 *
 * 이 리그들은 라이트 모드와 다크 모드에서 다른 로고를 사용합니다.
 * Supabase Storage에 {id}.png (라이트)와 {id}-1.png (다크)가 있어야 합니다.
 */
export const DARK_MODE_LEAGUE_IDS: readonly number[] = [
  39, // Premier League
  2, // Champions League
  3, // Europa League
  848, // Conference League
  179, // Scottish Premiership
  88, // Eredivisie
  119, // Superliga
  98, // J1 League
  292, // K League 1
  66, // Primeira Liga
  13, // Coupe de France
  61, // Ligue 1
] as const;

/**
 * CDN URL (Cloudflare 프록시 or Supabase 직접)
 * NEXT_PUBLIC_SUPABASE_URL은 Supabase 프로젝트 도메인이라 사용 금지 (이미지 경로 불일치)
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_STORAGE_CDN_URL || 'https://cdn.4590football.com';

// 로컬 정적 파일이 있는 팀 ID (public/teams/{id}.webp)
const STATIC_TEAM_IDS = new Set([
  33,34,35,36,39,40,42,44,45,47,48,49,50,51,52,55,63,65,66,77,79,80,81,82,83,84,85,91,93,94,95,96,97,
  106,108,111,112,114,116,157,160,161,162,163,164,165,167,168,169,170,172,173,175,176,180,182,186,191,192,
  487,488,489,490,492,494,495,496,497,499,500,502,503,504,505,511,517,520,523,529,530,531,532,533,534,
  536,537,538,539,540,541,542,543,546,547,548,718,720,727,728,746,797,798,801,867,895,
  1063,1579,2745,2746,2747,2748,2749,2750,2751,2752,2753,2756,2757,2758,2759,2760,2761,2762,2763,2764,
  2765,2766,2767,2768,7060,7061,7076,7078,7087,7098,9171,
]);

// 로컬 정적 파일이 있는 리그 ID (public/leagues/{id}.webp)
const STATIC_LEAGUE_IDS = new Set([
  2, 3, 39, 61, 78, 88, 94, 98, 135, 140, 179, 292, 293, 848,
]);

// 다크모드 로컬 파일이 있는 리그 ID (public/leagues/{id}-1.webp)
const STATIC_DARK_LEAGUE_IDS = new Set([
  2, 3, 39, 61, 88, 98, 179, 292, 848,
]);

/**
 * 이미지 URL 생성 (라이트/다크 모드 지원)
 * 로컬 정적 파일 우선, 없으면 CDN 경유
 */
export function getImageUrls(
  logoUrl: string | undefined,
  id: number | string | undefined,
  type: 'teams' | 'leagues'
): ImageUrlPair {
  // 1. ID가 있으면 로컬 정적 파일 우선 확인
  if (id) {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    // 로컬 파일이 있는 경우
    if (type === 'teams' && STATIC_TEAM_IDS.has(numericId)) {
      const localUrl = `/teams/${numericId}.webp`;
      return { light: localUrl, dark: localUrl };
    }

    if (type === 'leagues' && STATIC_LEAGUE_IDS.has(numericId)) {
      const lightUrl = `/leagues/${numericId}.webp`;
      const hasDarkLocal = STATIC_DARK_LEAGUE_IDS.has(numericId);
      const darkUrl = hasDarkLocal ? `/leagues/${numericId}-1.webp` : lightUrl;
      return { light: lightUrl, dark: darkUrl };
    }

    // 로컬에 없으면 CDN URL
    const lightUrl = `${SUPABASE_URL}/${type}/md/${numericId}.webp`;
    const hasDarkImage = type === 'leagues' && DARK_MODE_LEAGUE_IDS.includes(numericId);
    const darkUrl = hasDarkImage
      ? `${SUPABASE_URL}/${type}/md/${numericId}-1.webp`
      : lightUrl;

    return { light: lightUrl, dark: darkUrl };
  }

  // 2. URL이 있으면 처리
  if (logoUrl) {
    // 이미 로컬 경로인 경우 그대로 사용
    if (logoUrl.startsWith('/teams/') || logoUrl.startsWith('/leagues/')) {
      return { light: logoUrl, dark: logoUrl };
    }

    // Supabase Storage / CDN URL인 경우 - ID 추출 후 로컬 우선 확인
    if (logoUrl.includes('supabase.co') || logoUrl.includes('cdn.4590football.com')) {
      const idMatch = logoUrl.match(/\/(teams|leagues)\/(?:md\/)?(\d+)(?:-1)?\.(?:webp|png)$/);
      if (idMatch) {
        const imageType = idMatch[1] as 'teams' | 'leagues';
        const imageId = parseInt(idMatch[2], 10);
        return getImageUrls(undefined, imageId, imageType);
      }
    }

    // API Sports URL인 경우
    if (logoUrl.includes('media.api-sports.io')) {
      const idMatch = logoUrl.match(/\/(teams|leagues)\/(\d+)\.(?:webp|png)$/);
      if (idMatch) {
        const imageId = parseInt(idMatch[2], 10);
        return getImageUrls(undefined, imageId, type);
      }
    }

    // 그 외 URL은 그대로 사용
    return { light: logoUrl, dark: logoUrl };
  }

  // 3. 둘 다 없으면 플레이스홀더
  return { light: '/images/placeholder-team.svg', dark: '/images/placeholder-team.svg' };
}

/**
 * 경기 상태 텍스트 및 스타일 정보 생성
 *
 * @param status - 경기 상태 객체
 * @returns 상태 텍스트, CSS 클래스, 라이브 여부
 */
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
      return { text: `전반전 진행 중 ${elapsed}`, className: 'live', isLive: true };
    }

    case '2H': {
      const elapsed = status.elapsed ? `(${status.elapsed}분)` : '';
      return { text: `후반전 진행 중 ${elapsed}`, className: 'live', isLive: true };
    }

    case 'LIVE': {
      const elapsed = status.elapsed ? `(${status.elapsed}분)` : '';
      return { text: `진행 중 ${elapsed}`, className: 'live', isLive: true };
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

/**
 * MatchCardData 검증
 *
 * @param data - 검증할 데이터
 * @returns 유효한 MatchCardData인지 여부
 */
export function isValidMatchCardData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  // 필수 필드 확인
  if (!obj.teams || typeof obj.teams !== 'object') return false;
  if (!obj.league || typeof obj.league !== 'object') return false;

  const teams = obj.teams as Record<string, unknown>;
  if (!teams.home || !teams.away) return false;

  return true;
}

/**
 * 정규화된 매치 데이터 타입
 */
export interface NormalizedMatchData {
  id: string | number;
  teams: {
    home: { id?: number | string; name: string; logo?: string; winner?: boolean | null };
    away: { id?: number | string; name: string; logo?: string; winner?: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  league: { id?: number | string; name: string; logo?: string };
  status: { code: string; elapsed?: number | null };
}

/**
 * API 응답을 MatchCardData로 정규화
 *
 * API Sports 응답이나 기존 저장된 데이터를 표준 형식으로 변환
 */
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
        logo: homeTeam.logo as string | undefined,
        winner: homeTeam.winner as boolean | null | undefined,
      },
      away: {
        id: awayTeam.id as number | string | undefined,
        name: (awayTeam.name as string) || '원정팀',
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

/**
 * 매치카드 HTML 생성 옵션
 */
export interface MatchCardHtmlOptions {
  /** 인라인 스타일 사용 여부 (에디터용: true, 조회/저장용: false) */
  useInlineStyles?: boolean;
  /** data-match 속성에 원본 데이터 포함 여부 (에디터용: true) */
  includeDataAttr?: boolean;
  /** processed 마크 추가 여부 */
  markAsProcessed?: boolean;
}

/**
 * 통합 매치카드 HTML 생성기
 *
 * 모든 렌더러가 이 함수를 사용하여 일관된 HTML 생성
 *
 * @param matchData - 정규화된 매치 데이터
 * @param options - HTML 생성 옵션
 * @returns 매치카드 HTML 문자열
 */
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

  // 한글명: matchData에 이미 포함된 값 우선 (작성 시점에 createMatchCardData 등에서 한글명 채워줌)
  // - 매치 카드 생성/저장 흐름에서 home.name, away.name, league.name 자체에 한글명을 넣어 둠
  // - 본 함수는 단일 소스(DB) 조회 의존성 제거를 위해 추가 lookup을 하지 않음
  const homeTeamName = homeTeam.name;
  const awayTeamName = awayTeam.name;
  const leagueName = league.name;
  const href = matchUrl(matchId, getMatchSlug(homeTeam.name, awayTeam.name));

  // 이미지 URL 생성
  const leagueImages = getImageUrls(league.logo, league.id, 'leagues');
  const homeTeamImages = getImageUrls(homeTeam.logo, homeTeam.id, 'teams');
  const awayTeamImages = getImageUrls(awayTeam.logo, awayTeam.id, 'teams');

  // 상태 정보
  const statusInfo = getStatusInfo(status);

  // data-match 속성
  const dataMatchAttr = includeDataAttr
    ? `data-match="${encodeURIComponent(JSON.stringify(matchData))}"`
    : '';

  // CSS 클래스 vs 인라인 스타일
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

  // CSS 클래스 버전
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
                onerror="this.onerror=null;this.src='/images/placeholder-team.svg';"
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
                onerror="this.onerror=null;this.src='/images/placeholder-team.svg';"
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
                onerror="this.onerror=null;this.src='/images/placeholder-team.svg';"
              />
            </div>
            <span class="team-name${awayTeam.winner ? ' winner' : ''}">${awayTeamName}</span>
          </div>
        </div>

        <div class="match-footer">
          <span class="footer-link">매치 상세 정보</span>
        </div>
      </a>
    </div>
  `;
}

/**
 * 인라인 스타일 HTML 생성 (에디터용)
 */
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
  const href = matchUrl(matchId, getMatchSlug(homeTeam.name, awayTeam.name));

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
              onerror="this.onerror=null;this.src='/images/placeholder-team.svg';"
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
              onerror="this.onerror=null;this.src='/images/placeholder-team.svg';"
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
              onerror="this.onerror=null;this.src='/images/placeholder-team.svg';"
            />
            <span style="font-size: 14px; font-weight: 500; text-align: center; color: ${awayTeam.winner ? '#2563eb' : '#000'};">
              ${awayTeamName}
            </span>
          </div>
        </div>

        <div style="padding: 8px 12px; background-color: #f9fafb; border-top: 1px solid rgba(0, 0, 0, 0.05); text-align: center;">
          <span style="font-size: 12px; color: #2563eb;">매치 상세 정보</span>
        </div>
      </a>
    </div>
  `;
}
