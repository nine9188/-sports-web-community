'use server';

import {
  KOREAN_CHANNELS,
  LEAGUE_TO_KOREAN_CHANNEL,
  OFFICIAL_TEAM_CHANNELS,
} from '@/domains/livescore/constants/youtube-channels';
import { getTeamById } from '@/domains/livescore/constants/teams';
import type { HighlightMatchResult } from '@/domains/livescore/types/highlight';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * 한글 팀명 별칭 (쿠팡플레이/SPOTV 제목에서 사용하는 약칭)
 */
const TEAM_NAME_ALIASES: Record<number, string[]> = {
  // EPL
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
  66: ['에스턴 빌라', '빌라'],
  // 라리가
  541: ['R.마드리드', '레알', '레알마드리드'],
  529: ['바르셀로나', '바르사'],
  530: ['AT 마드리드', '아틀레티코', '아틀레티코 마드리드'],
  // 분데스리가
  157: ['바이에른', '뮌헨', '바이에른 뮌헨'],
  165: ['도르트문트'],
  // 세리에 A
  489: ['AC 밀란', '밀란'],
  505: ['인터 밀란', '인터'],
  496: ['유벤투스', '유베'],
  497: ['AS 로마', '로마'],
  492: ['나폴리'],
  // K리그
  2761: ['울산'],
  2763: ['전북'],
  2760: ['수원'],
  2762: ['포항'],
  2766: ['대전'],
  2767: ['인천'],
  2769: ['제주'],
  2764: ['강원'],
  2765: ['서울'],
  15498: ['김천'],
  2768: ['성남'],
  2770: ['광주'],
  18855: ['안양'],
};

/**
 * 팀의 검색용 이름 반환 (가장 짧은 한글 별칭 우선)
 */
function getSearchName(teamId: number): string {
  const aliases = TEAM_NAME_ALIASES[teamId];
  if (aliases?.length) return aliases[0];
  const team = getTeamById(teamId);
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

    const data = await res.json();
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
function findHighlightInResults(
  items: YouTubeSearchItem[],
  homeTeamId: number,
  awayTeamId: number
): YouTubeSearchItem | null {
  const homeTeam = getTeamById(homeTeamId);
  const awayTeam = getTeamById(awayTeamId);
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

  for (const item of items) {
    const title = item.snippet.title;
    const titleLower = title.toLowerCase();

    // "하이라이트" or "highlight" 포함 필수
    if (!title.includes('하이라이트') && !titleLower.includes('highlight'))
      continue;

    const homeIdx = findNameIndex(title, titleLower, homeNames);
    const awayIdx = findNameIndex(title, titleLower, awayNames);

    // 양팀 모두 존재 + 홈팀이 어웨이팀보다 앞에 나와야 함
    if (homeIdx !== -1 && awayIdx !== -1 && homeIdx < awayIdx) return item;
  }

  return null;
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
  const homeName = getSearchName(homeTeamId);
  const awayName = getSearchName(awayTeamId);

  if (!homeName || !awayName) return null;

  const query = `${homeName} ${awayName} 하이라이트`;
  const { after, before } = getDateRange(matchDate);

  // 1순위: 한국 채널 (쿠팡플레이 / SPOTV)
  const koreanChannelKey = LEAGUE_TO_KOREAN_CHANNEL[leagueId];

  if (koreanChannelKey) {
    const channel = KOREAN_CHANNELS[koreanChannelKey];
    const items = await searchYouTube(channel.channelId, query, 5, after, before);

    if (items) {
      const match = findHighlightInResults(items, homeTeamId, awayTeamId);
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

  // 2순위: 홈팀 공식 채널 (영어 검색)
  const homeTeamChannelId = OFFICIAL_TEAM_CHANNELS[homeTeamId];

  if (homeTeamChannelId) {
    const homeTeam = getTeamById(homeTeamId);
    const awayTeam = getTeamById(awayTeamId);
    const engQuery = `${homeTeam?.name_en || ''} ${awayTeam?.name_en || ''} highlights`;

    const items = await searchYouTube(homeTeamChannelId, engQuery, 5, after, before);

    if (items) {
      const match = findHighlightInResults(items, homeTeamId, awayTeamId);
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
