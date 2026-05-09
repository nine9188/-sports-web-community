import React from 'react';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { ChevronRight } from 'lucide-react';
import PostList, { type Post } from '@/domains/boards/components/post/PostList';
import { HOTDEAL_BOARD_SLUGS } from '@/domains/boards/types/hotdeal';
import { getTeamLogoUrls, getLeagueLogoUrls } from '@/domains/livescore/actions/images';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { formatDate } from '@/shared/utils/dateUtils';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';

type HomePostRow = {
  id: string;
  title: string | null;
  board_id: string | null;
  post_number: number | null;
  created_at: string | null;
  views: number | null;
  likes: number | null;
  user_id: string | null;
  thumbnail_url?: string | null;
  deal_info?: unknown;
  is_notice?: boolean | null;
  is_must_read?: boolean | null;
  notice_type?: 'global' | 'board' | null;
  show_in_widget?: boolean | null;
  is_hidden?: boolean | null;
  is_deleted?: boolean | null;
  profiles?: {
    nickname?: string | null;
    level?: number | null;
    exp?: number | null;
    icon_id?: number | null;
    public_id?: string | null;
  } | null;
  boards?: {
    name?: string | null;
    slug?: string | null;
    team_id?: number | null;
    league_id?: number | null;
  } | null;
  comments?: Array<{ count: number | null }> | null;
};

const HOTDEAL_SLUGS = new Set<string>(HOTDEAL_BOARD_SLUGS);
const HOME_WIDGET_QUERY_MAX_ATTEMPTS = 3;
const HOME_WIDGET_QUERY_RETRY_DELAYS_MS = [250, 1000];

type LogoMaps = {
  teamLogoMap?: Record<number, string>;
  leagueLogoMap?: Record<number, string>;
  leagueLogoDarkMap?: Record<number, string>;
};

type SupabaseQueryResult = {
  data?: unknown;
  count?: number | null;
  error: unknown | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorText(error: unknown): string {
  if (!error) return '';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isRetryableQueryError(error: unknown): boolean {
  const text = errorText(error).toLowerCase();

  return [
    'fetch failed',
    'network',
    'timeout',
    'timed out',
    'econnreset',
    'etimedout',
    'enotfound',
    '502',
    '503',
    '504',
  ].some((needle) => text.includes(needle));
}

async function runHomeWidgetQuery<T extends SupabaseQueryResult>(
  label: string,
  query: () => PromiseLike<T>
): Promise<T> {
  let result = await query();

  for (let attempt = 1; result.error && attempt < HOME_WIDGET_QUERY_MAX_ATTEMPTS; attempt += 1) {
    if (!isRetryableQueryError(result.error)) break;

    console.warn(`[AllPostsWidget] ${label} retry ${attempt}/${HOME_WIDGET_QUERY_MAX_ATTEMPTS - 1}:`, result.error);
    await sleep(HOME_WIDGET_QUERY_RETRY_DELAYS_MS[attempt - 1] ?? 1000);
    result = await query();
  }

  return result;
}

function collectLogoIds(rows: HomePostRow[]) {
  const teamIds = new Set<number>();
  const leagueIds = new Set<number>();

  rows.forEach((row) => {
    if (row.boards?.team_id) {
      teamIds.add(row.boards.team_id);
    }
    if (row.boards?.league_id) {
      leagueIds.add(row.boards.league_id);
    }
  });

  return {
    teamIds: [...teamIds],
    leagueIds: [...leagueIds],
  };
}

async function getBoardLogoMaps(rows: HomePostRow[]): Promise<Required<LogoMaps>> {
  const { teamIds, leagueIds } = collectLogoIds(rows);
  const [teamLogoMap, leagueLogoMap, leagueLogoDarkMap] = await Promise.all([
    teamIds.length > 0 ? getTeamLogoUrls(teamIds) : Promise.resolve({} as Record<number, string>),
    leagueIds.length > 0 ? getLeagueLogoUrls(leagueIds) : Promise.resolve({} as Record<number, string>),
    leagueIds.length > 0 ? getLeagueLogoUrls(leagueIds, true) : Promise.resolve({} as Record<number, string>),
  ]);

  return { teamLogoMap, leagueLogoMap, leagueLogoDarkMap };
}

function mapHomePost(row: HomePostRow, logoMaps: LogoMaps = {}): Post {
  const board = row.boards;
  const profile = row.profiles;
  const level = profile?.level || 1;
  const createdAt = row.created_at || '';
  const teamId = board?.team_id || null;
  const leagueId = board?.league_id || null;

  return {
    id: row.id,
    title: row.title || '',
    board_id: row.board_id || '',
    board_name: board?.name || '게시판',
    board_slug: board?.slug || '',
    post_number: row.post_number || 0,
    created_at: createdAt,
    views: row.views || 0,
    likes: row.likes || 0,
    author_nickname: profile?.nickname || '익명',
    author_id: row.user_id || '',
    author_public_id: profile?.public_id || null,
    author_level: level,
    author_exp: profile?.exp || 0,
    author_icon_id: profile?.icon_id || null,
    author_icon_url: getLevelIconUrl(level),
    comment_count: row.comments?.[0]?.count || 0,
    content: '',
    thumbnail_url: row.thumbnail_url || null,
    team_id: teamId,
    league_id: leagueId,
    team_logo: teamId ? logoMaps.teamLogoMap?.[teamId] || null : null,
    league_logo: leagueId ? logoMaps.leagueLogoMap?.[leagueId] || null : null,
    league_logo_dark: leagueId ? logoMaps.leagueLogoDarkMap?.[leagueId] || null : null,
    formattedDate: createdAt ? formatDate(createdAt) : '-',
    is_notice: row.is_notice || false,
    notice_type: row.notice_type || null,
    is_must_read: row.is_must_read || false,
    is_hidden: row.is_hidden || false,
    is_deleted: row.is_deleted || false,
    deal_info: (row.deal_info || null) as Post['deal_info'],
  };
}

const getHomeLatestPosts = unstable_cache(
  async (): Promise<Post[]> => {
    const supabase = getSupabaseAdmin();

    const { data, error } = await runHomeWidgetQuery('latest posts query', () => supabase
      .from('posts')
      .select(`
        id,
        title,
        board_id,
        post_number,
        created_at,
        views,
        likes,
        user_id,
        thumbnail_url,
        deal_info,
        is_notice,
        is_must_read,
        notice_type,
        is_hidden,
        is_deleted,
        profiles (
          nickname,
          level,
          exp,
          icon_id,
          public_id
        ),
        boards (
          name,
          slug,
          team_id,
          league_id
        ),
        comments!post_id(count)
      `)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(20));

    if (error || !data) {
      console.error('[AllPostsWidget] latest posts query failed:', error);
      return [];
    }

    const rows = (data as unknown as HomePostRow[])
      .filter((row) => !HOTDEAL_SLUGS.has(row.boards?.slug || ''))
      .slice(0, 10);
    const logoMaps = await getBoardLogoMaps(rows);

    return rows.map((row) => mapHomePost(row, logoMaps));
  },
  ['home-latest-posts-widget'],
  { revalidate: 60, tags: ['posts', 'home-widgets'] }
);

const getHomeWidgetNotices = unstable_cache(
  async (): Promise<Post[]> => {
    const supabase = getSupabaseAdmin();

    const { data, error } = await runHomeWidgetQuery('notices query', () => supabase
      .from('posts')
      .select(`
        id,
        title,
        board_id,
        post_number,
        created_at,
        views,
        likes,
        user_id,
        thumbnail_url,
        is_notice,
        is_must_read,
        notice_type,
        show_in_widget,
        is_hidden,
        is_deleted,
        profiles (
          nickname,
          level,
          exp,
          icon_id,
          public_id
        ),
        boards (
          name,
          slug,
          team_id,
          league_id
        ),
        comments!post_id(count)
      `)
      .eq('is_notice', true)
      .eq('show_in_widget', true)
      .order('is_must_read', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5));

    if (error || !data) {
      console.error('[AllPostsWidget] notices query failed:', error);
      return [];
    }

    const rows = data as unknown as HomePostRow[];
    const logoMaps = await getBoardLogoMaps(rows);

    return rows.map((row) => mapHomePost(row, logoMaps));
  },
  ['home-widget-notices'],
  { revalidate: 300, tags: ['posts', 'notices', 'home-widgets'] }
);

interface AllPostsWidgetProps {
  initialData?: Post[];
}

export default async function AllPostsWidget({ initialData }: AllPostsWidgetProps = {}) {
  try {
    const postsPromise = initialData
      ? Promise.resolve(initialData)
      : getHomeLatestPosts();

    const noticesPromise = getHomeWidgetNotices();

    const [posts, notices] = await Promise.all([postsPromise, noticesPromise]);

    if (posts.length === 0) {
      return (
        <Container className="h-full bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader>
            <div className="w-full h-full flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">최신 게시글</h2>
              <Link
                href="/boards/all"
                prefetch={false}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-0.5"
              >
                전체글 보기
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </ContainerHeader>
          <ContainerContent className="h-12 px-3 py-0 flex items-center justify-center text-center">
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              게시글이 없습니다.
            </p>
          </ContainerContent>
        </Container>
      );
    }

    const noticeIds = new Set(notices.map((notice) => notice.id));
    const combinedPosts = [
      ...notices,
      ...posts.filter((post) => !noticeIds.has(post.id)),
    ];

    const headerContent = (
      <div className="w-full h-full flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">최신 게시글</h2>
        <Link
          href="/boards/all"
          prefetch={false}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-0.5"
        >
          전체글 보기
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );

    return (
      <div className="h-full">
        <PostList
          posts={combinedPosts}
          loading={false}
          emptyMessage="아직 게시글이 없습니다."
          headerContent={headerContent}
          showBoard
          currentBoardId="all"
          className="h-full"
        />
      </div>
    );
  } catch (error) {
    console.error('AllPostsWidget data loading failed:', error);

    return (
      <Container className="h-full bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>최신 게시글</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="h-12 px-3 py-0 flex items-center justify-center text-center">
          <p className="text-[13px] text-gray-500 dark:text-gray-400">게시글을 불러오는 중 오류가 발생했습니다.</p>
        </ContainerContent>
      </Container>
    );
  }
}
