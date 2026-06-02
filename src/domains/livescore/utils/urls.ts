/**
 * 라이브스코어 URL 빌더
 * 모든 내부 링크는 이 함수들을 통해 생성
 */

type EntityId = number | string;

function hasPositiveEntityId(id: EntityId): boolean {
  const numericId = typeof id === 'number' ? id : Number.parseInt(id, 10);
  return Number.isFinite(numericId) && numericId > 0;
}

export function teamUrl(id: EntityId, slug?: string): string {
  const s = slug ? `/${slug}` : '';
  return `/livescore/football/team/${id}${s}`;
}

export function playerUrl(id: EntityId, slug?: string): string {
  if (!hasPositiveEntityId(id)) return '#';

  const s = slug ? `/${slug}` : '';
  return `/livescore/football/player/${id}${s}`;
}

export function leagueUrl(id: EntityId, slug?: string): string {
  const s = slug ? `/${slug}` : '';
  return `/livescore/football/leagues/${id}${s}`;
}

export function matchUrl(id: EntityId, slug?: string): string {
  const s = slug ? `/${slug}` : '';
  return `/livescore/football/match/${id}${s}`;
}

export function transferTeamUrl(id: EntityId, slug?: string): string {
  const s = slug ? `/${slug}` : '';
  return `/transfers/team/${id}${s}`;
}
