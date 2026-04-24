'use server';

import {
  KOREAN_CHANNELS,
  LEAGUE_TO_KOREAN_CHANNEL,
  OFFICIAL_TEAM_CHANNELS,
} from '@/domains/livescore/constants/youtube-channels';
import { getTeamById, getTeamsByIds } from '@/domains/livescore/actions/teamLeagueData';
import type { HighlightMatchResult } from '@/domains/livescore/types/highlight';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * 한글 팀명 별칭 (쿠팡플레이/SPOTV 제목에서 사용하는 약칭)
 */
const TEAM_NAME_ALIASES: Record<number, string[]> = {
  // EPL (쿠팡플레이)
  42: ['아스날'],
  33: ['맨유'],
  50: ['맨시', '맨시티'],
  47: ['토트넘'],
  48: ['웨스트햄'],
  34: ['뉴캐슬'],
  46: ['레스터'],
  45: ['에버턴'],
  55: ['브렌트포드'],
  51: ['브라이턴'],
  52: ['크리스탈 팰리스', '크팰'],
  39: ['울버햄튼', '울브스'],
  40: ['리버풀'],
  49: ['첼시'],
  35: ['본머스'],
  36: ['풀럼'],
  41: ['사우스햄튼', '사우샘프턴'],
  57: ['입스위치'],
  65: ['노팅엄', '노팅엄 포레스트'],
  66: ['아스톤 빌라', '에스턴 빌라', '빌라'],
  63: ['리즈'],
  44: ['번리'],
  746: ['선덜랜드'],
  // 라리가 (쿠팡플레이) — Coupang 제목 기준
  541: ['레알 마드리드', '레알', 'R.마드리드', '레알마드리드'],
  529: ['바르셀로나', '바르사'],
  530: ['AT.마드리드', 'AT 마드리드', '아틀레티코', '아틀레티코 마드리드'],
  531: ['아틀레틱', '아틀레틱 클럽'],
  533: ['비야레알'],
  536: ['세비야'],
  538: ['셀타 비고', '셀타'],
  540: ['에스파뇰'],
  542: ['알라베스'],
  543: ['레알 베티스', '베티스'],
  546: ['헤타페'],
  547: ['지로나'],
  548: ['레알 소시에다드', '소시에다드'],
  727: ['오사수나'],
  728: ['라요 바예카노', '라요'],
  798: ['마요르카'],
  720: ['바야돌리드'],
  534: ['라스 팔마스'],
  537: ['레가네스'],
  // 분데스리가 (쿠팡플레이) — Coupang 제목 기준
  157: ['바이에른 뮌헨', '바이에른', '뮌헨'],
  165: ['도르트문트'],
  168: ['레버쿠젠', '바이어 레버쿠젠'],
  164: ['마인츠'],
  172: ['슈투트가르트'],
  173: ['라이프치히', 'RB 라이프치히'],
  167: ['호펜하임'],
  169: ['프랑크푸르트', '아인트라흐트'],
  162: ['브레멘', '베르더 브레멘'],
  163: ['묀헨글라트바흐', '글라드바흐'],
  161: ['볼프스부르크'],
  160: ['프라이부르크'],
  182: ['우니온 베를린'],
  170: ['아우크스부르크'],
  176: ['보훔'],
  180: ['하이덴하임'],
  186: ['장크트 파울리', '파울리'],
  191: ['홀슈타인 킬', '킬'],
  192: ['쾰른'],
  175: ['함부르크'],
  // 세리에A (SPOTV) — SPOTV 제목 기준
  489: ['AC 밀란', '밀란'],
  505: ['인터 밀란', '인터', '인테르'],
  496: ['유벤투스', '유베'],
  497: ['AS 로마', '로마'],
  492: ['나폴리'],
  499: ['아탈란타'],
  500: ['볼로냐'],
  487: ['라치오'],
  502: ['피오렌티나'],
  503: ['토리노'],
  495: ['제노아'],
  494: ['우디네세'],
  504: ['베로나'],
  490: ['칼리아리'],
  511: ['엠폴리'],
  517: ['베네치아'],
  523: ['파르마'],
  867: ['레체'],
  895: ['코모'],
  1579: ['몬자'],
  801: ['피사'],
  488: ['사수올로'],
  // 리그1 (쿠팡플레이) — Coupang 제목 기준
  85: ['PSG', '파리 생제르맹', '파리'],
  91: ['모나코'],
  81: ['마르세유'],
  79: ['릴'],
  80: ['리옹'],
  84: ['니스'],
  95: ['스트라스부르'],
  96: ['툴루즈'],
  106: ['브레스트'],
  116: ['랑스'],
  93: ['랭스'],
  94: ['렌'],
  83: ['낭트'],
  77: ['앙제'],
  111: ['르 아브르'],
  112: ['메스'],
  114: ['파리 FC'],
  97: ['로리앙'],
  1063: ['생테티엔'],
  82: ['몽펠리에'],
  // K리그1
  2767: ['울산', '울산HD'],
  2762: ['전북', '전북현대'],
  2763: ['인천', '인천유나이티드'],
  2764: ['포항', '포항스틸러스'],
  2766: ['서울', 'FC서울'],
  2761: ['제주', '제주유나이티드'],
  2768: ['김천', '김천상무'],
  2746: ['강원', '강원FC'],
  2750: ['대전', '대전하나'],
  2759: ['광주', '광주FC'],
  2748: ['안양', 'FC안양'],
  2745: ['부천', '부천FC'],
  // K리그2
  2747: ['대구', '대구FC'],
  2749: ['서울E', '서울이랜드', '이랜드'],
  2751: ['경남', '경남FC'],
  2752: ['부산', '부산아이파크'],
  2753: ['충남아산', '아산'],
  2756: ['수원FC'],
  2757: ['성남', '성남FC'],
  2758: ['안산', '안산그리너스'],
  2760: ['전남', '전남드래곤즈'],
  2765: ['수원삼성', '수원블루윙즈'],
  7060: ['천안', '천안시티'],
  7061: ['충북청주', '청주FC'],
  7076: ['김해', '김해FC'],
  7078: ['김포', '김포FC'],
  7087: ['화성', '화성FC'],
  7098: ['파주', '파주시민'],
  9171: ['용인', '용인FC'],
};

/**
 * 팀의 검색용 이름 반환 (가장 짧은 한글 별칭 우선)
 */
async function getSearchName(teamId: number): Promise<string> {
  const aliases = TEAM_NAME_ALIASES[teamId];
  if (aliases?.length) return aliases[0];
  const team = await getTeamById(teamId);
  return team?.name_ko || team?.name_en || '';
}

/**
 * YouTube search.list로 검색 (100 units/회)
 * 특정 채널 내에서 키워드로 정확 검색
 */
async function searchYouTube(
  channelId: string,
  query: string,
  maxResults = 5,
  publishedAfter?: string,
  publishedBefore?: string
): Promise<YouTubeSearchItem[] | null> {
  if (!YOUTUBE_API_KEY) {
    console.error('[Highlights] YOUTUBE_API_KEY not set');
    return null;
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      channelId,
      q: query,
      type: 'video',
      order: 'date',
      maxResults: String(maxResults),
      key: YOUTUBE_API_KEY,
    });

    // 날짜 필터 (챔스 등 동일 팀 매치업 구분용)
    if (publishedAfter) params.set('publishedAfter', publishedAfter);
    if (publishedBefore) params.set('publishedBefore', publishedBefore);

    const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error('[Highlights] YouTube search error:', res.status);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    return data.items || null;
  } catch (error) {
    console.error('[Highlights] Search error:', error);
    return null;
  }
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    publishedAt: string;
    title: string;
    channelTitle: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
}

/**
 * 검색 결과에서 하이라이트 영상 필터링
 */
async function findHighlightInResults(
  items: YouTubeSearchItem[],
  homeTeamId: number,
  awayTeamId: number
): Promise<YouTubeSearchItem | null> {
  const teamMap = await getTeamsByIds([homeTeamId, awayTeamId]);
  const homeTeam = teamMap[homeTeamId];
  const awayTeam = teamMap[awayTeamId];
  if (!homeTeam || !awayTeam) return null;

  const homeNames = [
    homeTeam.name_ko,
    ...(TEAM_NAME_ALIASES[homeTeamId] || []),
    homeTeam.name_en,
  ];
  const awayNames = [
    awayTeam.name_ko,
    ...(TEAM_NAME_ALIASES[awayTeamId] || []),
    awayTeam.name_en,
  ];

  // 제목에서 팀명의 위치(index) 반환
  function findNameIndex(title: string, titleLower: string, names: string[]): number {
    for (const n of names) {
      const idx = title.indexOf(n);
      if (idx !== -1) return idx;
      const idxLower = titleLower.indexOf(n.toLowerCase());
      if (idxLower !== -1) return idxLower;
    }
    return -1;
  }

  const candidates: YouTubeSearchItem[] = [];

  for (const item of items) {
    const title = item.snippet.title;
    const titleLower = title.toLowerCase();

    // "하이라이트" or "highlight" 포함 필수
    if (!title.includes('하이라이트') && !titleLower.includes('highlight'))
      continue;

    const homeIdx = findNameIndex(title, titleLower, homeNames);
    const awayIdx = findNameIndex(title, titleLower, awayNames);

    // 양팀 모두 존재 + 홈팀이 어웨이팀보다 앞에 나와야 함
    if (homeIdx !== -1 && awayIdx !== -1 && homeIdx < awayIdx) {
      candidates.push(item);
    }
  }

  if (!candidates.length) return null;

  // 짧은 하이라이트(2분/3분) 우선 — 풀 하이라이트보다 로딩 빠르고 UX 적합
  const short = candidates.find(c =>
    c.snippet.title.includes('2분 하이라이트') ||
    c.snippet.title.includes('3분 하이라이트')
  );
  return short ?? candidates[0];
}

/**
 * 특정 경기의 하이라이트를 YouTube에서 검색
 */
/**
 * 경기 날짜 기준 검색 범위 계산
 * 경기 당일 ~ +3일 (하이라이트 업로드 시차 고려)
 */
function getDateRange(matchDate?: string): { after?: string; before?: string } {
  if (!matchDate) return {};

  const date = new Date(matchDate);
  if (isNaN(date.getTime())) return {};

  // 경기 시작 6시간 전부터 (시차 고려)
  const after = new Date(date.getTime() - 6 * 60 * 60 * 1000);
  // 경기 후 3일까지
  const before = new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000);

  return {
    after: after.toISOString(),
    before: before.toISOString(),
  };
}

export async function findHighlightForMatch(
  fixtureId: number,
  homeTeamId: number,
  awayTeamId: number,
  leagueId: number,
  matchDate?: string
): Promise<HighlightMatchResult | null> {
  const homeName = await getSearchName(homeTeamId);
  const awayName = await getSearchName(awayTeamId);

  if (!homeName || !awayName) return null;

  const query = `${homeName} ${awayName} 하이라이트`;
  const { after, before } = getDateRange(matchDate);

  // 1순위: 한국 채널 (쿠팡플레이 / SPOTV)
  const koreanChannelKey = LEAGUE_TO_KOREAN_CHANNEL[leagueId];

  if (koreanChannelKey) {
    const channel = KOREAN_CHANNELS[koreanChannelKey];
    const items = await searchYouTube(channel.channelId, query, 10, after, before);

    if (items) {
      const match = await findHighlightInResults(items, homeTeamId, awayTeamId);
      if (match) {
        return {
          videoId: match.id.videoId,
          videoTitle: match.snippet.title,
          channelName: channel.name,
          thumbnailUrl: match.snippet.thumbnails.high?.url || match.snippet.thumbnails.medium?.url,
          publishedAt: match.snippet.publishedAt,
          sourceType: 'korean',
        };
      }
    }
  }

  // 2순위: 홈팀 공식 채널 — 홈경기 하이라이트는 홈팀 채널에 올라오므로 홈팀만 검색
  const teamMap = await getTeamsByIds([homeTeamId, awayTeamId]);
  const homeTeam = teamMap[homeTeamId];
  const awayTeam = teamMap[awayTeamId];
  const engQuery = `${homeTeam?.name_en || ''} ${awayTeam?.name_en || ''} highlights`;

  const homeTeamChannelId = OFFICIAL_TEAM_CHANNELS[homeTeamId];
  if (homeTeamChannelId) {
    const items = await searchYouTube(homeTeamChannelId, engQuery, 10, after, before);
    if (items) {
      const match = await findHighlightInResults(items, homeTeamId, awayTeamId);
      if (match) {
        return {
          videoId: match.id.videoId,
          videoTitle: match.snippet.title,
          channelName: homeTeam?.name_en || 'Official',
          thumbnailUrl: match.snippet.thumbnails.high?.url || match.snippet.thumbnails.medium?.url,
          publishedAt: match.snippet.publishedAt,
          sourceType: 'official',
        };
      }
    }
  }

  return null;
}
