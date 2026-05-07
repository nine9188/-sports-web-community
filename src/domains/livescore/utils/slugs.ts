/**
 * SEO 슬러그 유틸리티
 * URL에 사용할 slug 생성 및 엔티티별 slug 조회
 */

/**
 * 문자열을 URL-safe slug로 변환
 * - 소문자 변환
 * - 발음 기호(diacritics) 제거: Müller → muller, Mbappé → mbappe
 * - 특수문자 제거, 공백/하이픈 정리
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')                     // 유니코드 분해 (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '')      // 발음 기호 제거
    .replace(/[^\w\s-]/g, '')             // 특수문자 제거 (알파벳, 숫자, 공백, 하이픈만 유지)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')                 // 공백 → 하이픈
    .replace(/-+/g, '-')                  // 연속 하이픈 정리
    .replace(/^-|-$/g, '');               // 양쪽 하이픈 제거
}

/**
 * 리그 slug 매핑 (상수 기반, 34개 리그)
 */
export const LEAGUE_SLUGS: Record<number, string> = {
  1: 'world-cup',
  // 유럽 Top 5
  39: 'premier-league',
  140: 'la-liga',
  78: 'bundesliga',
  135: 'serie-a',
  61: 'ligue-1',
  // 유럽 2군
  40: 'championship',
  179: 'scottish-premiership',
  88: 'eredivisie',
  94: 'primeira-liga',
  // 유럽 컵
  2: 'champions-league',
  3: 'europa-league',
  848: 'conference-league',
  531: 'uefa-super-cup',
  // 국제 대회
  32: 'world-cup-qualifiers-europe',
  30: 'world-cup-qualifiers-asia',
  10: 'international-friendly',
  5: 'nations-league',
  9: 'euro',
  13: 'copa-america',
  15: 'club-world-cup',
  // 국내 컵
  45: 'fa-cup',
  48: 'efl-cup',
  143: 'copa-del-rey',
  137: 'coppa-italia',
  66: 'coupe-de-france',
  81: 'dfb-pokal',
  // 아시아
  292: 'k-league-1',
  293: 'k-league-2',
  98: 'j1-league',
  169: 'chinese-super-league',
  17: 'afc-champions-league',
  307: 'saudi-pro-league',
  // 아메리카
  253: 'mls',
  71: 'brasileirao',
  262: 'liga-mx',
  // 기타
  119: 'danish-superliga',
};

/**
 * 리그 slug 가져오기
 */
export function getLeagueSlug(leagueId: number): string {
  return LEAGUE_SLUGS[leagueId] || `league-${leagueId}`;
}

/**
 * 팀 slug 가져오기 (DB slug 컬럼 또는 name에서 생성)
 */
export function getTeamSlugFromName(name: string): string {
  return slugify(name);
}

/**
 * 선수 slug 가져오기 (name에서 생성)
 */
export function getPlayerSlugFromName(name: string): string {
  const slug = slugify(name);
  if (slug === 'player' || /^player-\d+$/.test(slug)) return '';
  return slug;
}

/**
 * 경기 slug 생성 (홈팀 vs 어웨이팀)
 */
export function getMatchSlug(homeTeam: string, awayTeam: string): string {
  const homeSlug = slugify(homeTeam || '');
  const awaySlug = slugify(awayTeam || '');

  if (homeSlug && awaySlug) return `${homeSlug}-vs-${awaySlug}`;
  if (homeSlug) return homeSlug;
  if (awaySlug) return awaySlug;

  return '';
}
