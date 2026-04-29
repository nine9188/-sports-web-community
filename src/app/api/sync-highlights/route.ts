import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { findHighlightInResults, type YouTubeSearchItem } from '@/domains/livescore/actions/highlights/fetchHighlights';
import {
  HIGHLIGHT_SUPPORTED_LEAGUE_IDS,
  KOREAN_CHANNELS,
} from '@/domains/livescore/constants/youtube-channels';
import type { YouTubePlaylistItem, YouTubePlaylistResponse } from '@/domains/livescore/types/highlight';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const HIGHLIGHT_KO = '\uD558\uC774\uB77C\uC774\uD2B8';
const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];
const DEFAULT_FIXTURE_DAYS = 7;
const MAX_FIXTURE_DAYS = 30;
const VIDEO_RETENTION_DAYS = 14;

type ChannelConfig = {
  channelId: string;
  uploadsPlaylistId: string;
  name: string;
};

type IndexedVideo = {
  video_id: string;
  channel_id: string;
  channel_name: string;
  title: string;
  normalized_title: string;
  thumbnail_url: string | null;
  published_at: string | null;
};

type FixtureRow = {
  fixture_id: number;
  home_team_id: number;
  away_team_id: number;
  league_id: number;
  match_date: string;
  status_short: string;
};

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

function getFixtureDays(request: Request): number {
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get('days'));
  if (!Number.isFinite(requested) || requested <= 0) return DEFAULT_FIXTURE_DAYS;
  return Math.min(Math.floor(requested), MAX_FIXTURE_DAYS);
}

function normalizeTitle(title: string): string {
  return title.normalize('NFKC').toLowerCase();
}

function isHighlightTitle(title: string): boolean {
  const normalized = normalizeTitle(title);
  return title.includes(HIGHLIGHT_KO) || normalized.includes('highlight');
}

function getThumbnailUrl(item: YouTubePlaylistItem): string | null {
  const thumbnails = item.snippet.thumbnails;
  return thumbnails.maxres?.url
    || thumbnails.standard?.url
    || thumbnails.high?.url
    || thumbnails.medium?.url
    || thumbnails.default?.url
    || null;
}

function toSearchItem(video: IndexedVideo): YouTubeSearchItem {
  const thumbnail = video.thumbnail_url || '';

  return {
    id: { videoId: video.video_id },
    snippet: {
      publishedAt: video.published_at || new Date(0).toISOString(),
      title: video.title,
      channelTitle: video.channel_name,
      thumbnails: {
        default: { url: thumbnail },
        medium: { url: thumbnail },
        high: { url: thumbnail },
      },
    },
  };
}

function getChannels(): ChannelConfig[] {
  const channels = [
    KOREAN_CHANNELS.COUPANG_PLAY,
    KOREAN_CHANNELS.SPOTV,
    KOREAN_CHANNELS.UEFA,
  ];

  const seen = new Set<string>();
  return channels.filter(channel => {
    const key = channel.uploadsPlaylistId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchUploadPlaylist(channel: ChannelConfig): Promise<IndexedVideo[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    playlistId: channel.uploadsPlaylistId,
    maxResults: '50',
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${params}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn(`[sync-highlights] YouTube playlistItems failed channel=${channel.name} status=${res.status}`, body);
    return [];
  }

  const data = (await res.json()) as YouTubePlaylistResponse;
  if (!Array.isArray(data.items)) return [];

  return data.items.flatMap(item => {
    const videoId = item.snippet.resourceId?.videoId;
    const title = item.snippet.title;

    if (!videoId || !title || !isHighlightTitle(title)) {
      return [];
    }

    return [{
      video_id: videoId,
      channel_id: channel.channelId,
      channel_name: channel.name,
      title,
      normalized_title: normalizeTitle(title),
      thumbnail_url: getThumbnailUrl(item),
      published_at: item.snippet.publishedAt || null,
    }];
  });
}

async function matchFixturesToVideos(fixtures: FixtureRow[], videos: IndexedVideo[]) {
  const searchItems = videos.map(toSearchItem);
  const videoById = new Map(videos.map(video => [video.video_id, video]));
  const now = new Date().toISOString();
  const rows = [];

  for (const fixture of fixtures) {
    const matchTime = new Date(fixture.match_date).getTime();
    const after = matchTime - 6 * 60 * 60 * 1000;
    const before = matchTime + 3 * 24 * 60 * 60 * 1000;
    const relevantItems = Number.isFinite(matchTime)
      ? searchItems.filter(item => {
        const publishedAt = new Date(item.snippet.publishedAt).getTime();
        return Number.isFinite(publishedAt) && publishedAt >= after && publishedAt <= before;
      })
      : searchItems;

    if (!relevantItems.length) continue;

    const match = await findHighlightInResults(
      relevantItems,
      fixture.home_team_id,
      fixture.away_team_id
    );

    if (!match) continue;

    const video = videoById.get(match.id.videoId);
    if (!video) continue;

    rows.push({
      fixture_id: fixture.fixture_id,
      league_id: fixture.league_id,
      video_id: video.video_id,
      video_title: video.title,
      channel_name: video.channel_name,
      source_type: video.channel_name === KOREAN_CHANNELS.UEFA.name ? 'official' : 'korean',
      thumbnail_url: video.thumbnail_url,
      published_at: video.published_at,
      updated_at: now,
    });
  }

  return rows;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YOUTUBE_API_KEY not set' }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const fixtureDays = getFixtureDays(request);
  const fixtureCutoff = new Date(now.getTime() - fixtureDays * 24 * 60 * 60 * 1000).toISOString();
  const videoCutoff = new Date(now.getTime() - VIDEO_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const fetchedVideos = (await Promise.all(getChannels().map(fetchUploadPlaylist))).flat();
  const uniqueVideos = Array.from(
    new Map(fetchedVideos.map(video => [video.video_id, video])).values()
  );

  let indexed = 0;
  if (uniqueVideos.length) {
    const { error } = await supabase
      .from('youtube_video_index')
      .upsert(
        uniqueVideos.map(video => ({ ...video, updated_at: now.toISOString() })),
        { onConflict: 'video_id' }
      );

    if (error) {
      console.error('[sync-highlights] youtube_video_index upsert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    indexed = uniqueVideos.length;
  }

  const { data: fixtures, error: fixturesError } = await supabase
    .from('fixtures')
    .select('fixture_id, home_team_id, away_team_id, league_id, match_date, status_short')
    .in('status_short', FINISHED_STATUSES)
    .in('league_id', [...HIGHLIGHT_SUPPORTED_LEAGUE_IDS])
    .gte('match_date', fixtureCutoff)
    .lte('match_date', now.toISOString())
    .order('match_date', { ascending: false })
    .limit(200);

  if (fixturesError) {
    console.error('[sync-highlights] fixtures query error:', fixturesError.message);
    return NextResponse.json({ error: fixturesError.message }, { status: 500 });
  }

  const { data: indexedVideos, error: videosError } = await supabase
    .from('youtube_video_index')
    .select('video_id, channel_id, channel_name, title, normalized_title, thumbnail_url, published_at')
    .gte('published_at', videoCutoff)
    .order('published_at', { ascending: false })
    .limit(300);

  if (videosError) {
    console.error('[sync-highlights] youtube_video_index query error:', videosError.message);
    return NextResponse.json({ error: videosError.message }, { status: 500 });
  }

  const matchedRows = await matchFixturesToVideos(
    (fixtures || []) as FixtureRow[],
    (indexedVideos || []) as IndexedVideo[]
  );

  let matched = 0;
  if (matchedRows.length) {
    const { error } = await supabase
      .from('match_highlights')
      .upsert(matchedRows, { onConflict: 'fixture_id' });

    if (error) {
      console.error('[sync-highlights] match_highlights upsert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    matched = matchedRows.length;
  }

  const { error: cleanupError } = await supabase
    .from('youtube_video_index')
    .delete()
    .lt('published_at', videoCutoff);

  if (cleanupError) {
    console.warn('[sync-highlights] old video cleanup failed:', cleanupError.message);
  }

  return NextResponse.json({
    ok: true,
    fixtureDays,
    fetchedVideos: fetchedVideos.length,
    indexed,
    fixturesChecked: fixtures?.length || 0,
    matched,
    cleanupError: cleanupError?.message || null,
  });
}
