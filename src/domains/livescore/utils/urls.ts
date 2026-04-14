/**
 * 라이브스코어 URL 빌더
 * 모든 내부 링크는 이 함수들을 통해 생성
 */

export function teamUrl(id: number, slug?: string): string {
  const s = slug ? `/${slug}` : '';
  return `/livescore/football/team/${id}${s}`;
}

export function playerUrl(id: number, slug?: string): string {
  const s = slug ? `/${slug}` : '';
  return `/livescore/football/player/${id}${s}`;
}

export function leagueUrl(id: number, slug?: string): string {
  const s = slug ? `/${slug}` : '';
  return `/livescore/football/leagues/${id}${s}`;
}

export function matchUrl(id: number, slug?: string): string {
  const s = slug ? `/${slug}` : '';
  return `/livescore/football/match/${id}${s}`;
}
