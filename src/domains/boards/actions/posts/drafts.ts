'use server';

import { getSupabaseAction } from '@/shared/lib/supabase/server';
import { calculateBoardViewerPermissions } from '../permissions';
import type { PostPollDraft } from '@/domains/boards/types/poll';
import { getLeagueLogoUrl, getPlayerPhotoUrl, getTeamLogoUrl } from '@/domains/livescore/actions/images';

export type PostDraftDealInfo = {
  deal_url?: string;
  store?: string;
  product_name?: string;
  price?: string | number;
  original_price?: string | number | null;
  shipping?: string;
  [key: string]: unknown;
};

export type PostDraft = {
  id: string;
  boardId: string;
  title: string;
  content: unknown;
  dealInfo: PostDraftDealInfo | null;
  poll: PostPollDraft | null;
  updatedAt: string;
  expiresAt: string;
};

type DraftActionResponse =
  | { success: true; draft?: PostDraft }
  | { success: false; error: string };

type DraftQueryResponse =
  | { success: true; draft: PostDraft | null }
  | { success: false; error: string };

type DraftListResponse =
  | { success: true; drafts: PostDraft[] }
  | { success: false; error: string };

type SavePostDraftInput = {
  draftId?: string | null;
  boardId: string;
  title: string;
  content: unknown;
  dealInfo?: PostDraftDealInfo | null;
  poll?: PostPollDraft | null;
};

type PostDraftRow = {
  id: string;
  board_id: string;
  title: string;
  content: unknown;
  deal_info: PostDraftDealInfo | null;
  poll: PostPollDraft | null;
  updated_at: string;
  expires_at: string;
};

type DraftNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: unknown[];
  [key: string]: unknown;
};

async function mapDraft(row: PostDraftRow): Promise<PostDraft> {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    content: await hydrateDraftContent(row.content),
    dealInfo: row.deal_info,
    poll: row.poll,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  };
}

function toNumberId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function buildTeamCardData(teamId: number) {
  const supabase = await getSupabaseAction();
  if (!supabase) return null;

  const { data } = await supabase
    .from('football_teams')
    .select('team_id, name, name_ko, league_id, league_name, league_name_ko')
    .eq('team_id', teamId)
    .maybeSingle();

  if (!data) return null;

  const leagueId = Number(data.league_id);
  const [teamLogo, leagueLogo] = await Promise.all([
    getTeamLogoUrl(teamId),
    Number.isFinite(leagueId) ? getLeagueLogoUrl(leagueId) : Promise.resolve(''),
  ]);

  return {
    id: teamId,
    name: data.name,
    koreanName: data.name_ko || undefined,
    logo: teamLogo,
    league: {
      id: leagueId,
      name: data.league_name,
      koreanName: data.league_name_ko || data.league_name,
      logo: leagueLogo,
    },
  };
}

async function buildPlayerCardData(playerId: number) {
  const supabase = await getSupabaseAction();
  if (!supabase) return null;

  const { data: player } = await supabase
    .from('football_players')
    .select('player_id, name, korean_name, photo_url, position, number, team_id')
    .eq('player_id', playerId)
    .maybeSingle();

  if (!player) return null;

  const teamId = Number(player.team_id);
  const { data: team } = Number.isFinite(teamId)
    ? await supabase
        .from('football_teams')
        .select('team_id, name, name_ko')
        .eq('team_id', teamId)
        .maybeSingle()
    : { data: null };

  const [playerPhoto, teamLogo] = await Promise.all([
    getPlayerPhotoUrl(playerId),
    Number.isFinite(teamId) ? getTeamLogoUrl(teamId) : Promise.resolve(''),
  ]);

  return {
    id: playerId,
    name: player.name,
    koreanName: player.korean_name || player.name,
    photo: playerPhoto || player.photo_url || '',
    position: player.position || undefined,
    number: player.number || undefined,
    team: {
      id: teamId,
      name: team?.name || player.team_id?.toString() || '',
      koreanName: team?.name_ko || undefined,
      logo: teamLogo,
    },
  };
}

async function hydrateDraftContent(value: unknown): Promise<unknown> {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return Promise.all(value.map(hydrateDraftContent));
  }

  const node = value as DraftNode;

  if (node.type === 'teamCard' && !node.attrs?.teamData) {
    const teamId = toNumberId(node.attrs?.teamId);
    const teamData = teamId ? await buildTeamCardData(teamId) : null;
    return {
      ...node,
      attrs: {
        ...node.attrs,
        teamData,
      },
    };
  }

  if (node.type === 'playerCard' && !node.attrs?.playerData) {
    const playerId = toNumberId(node.attrs?.playerId);
    const playerData = playerId ? await buildPlayerCardData(playerId) : null;
    return {
      ...node,
      attrs: {
        ...node.attrs,
        playerData,
      },
    };
  }

  if (Array.isArray(node.content)) {
    return {
      ...node,
      content: await Promise.all(node.content.map(hydrateDraftContent)),
    };
  }

  return value;
}

async function getCurrentUserAndSupabase() {
  const supabase = await getSupabaseAction();
  if (!supabase) {
    return { supabase: null, user: null, error: 'Supabase 클라이언트 초기화 오류' };
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { supabase, user: null, error: '로그인이 필요합니다.' };
  }

  return { supabase, user, error: null };
}

async function canWriteBoard(boardId: string, userId: string) {
  const supabase = await getSupabaseAction();
  if (!supabase) return false;

  const [boardResult, profileResult] = await Promise.all([
    supabase.from('boards').select('id, slug, access_level').eq('id', boardId).single(),
    supabase
      .from('profiles')
      .select('is_admin, is_suspended, suspended_until')
      .eq('id', userId)
      .single(),
  ]);

  if (boardResult.error || !boardResult.data) return false;

  const profile = profileResult.data;
  const suspendedUntil = profile?.suspended_until ? new Date(profile.suspended_until).getTime() : null;
  if (profile?.is_suspended && (!suspendedUntil || suspendedUntil > Date.now())) return false;

  return calculateBoardViewerPermissions(boardResult.data, profile).canWrite;
}

export async function getPostDraft(draftId: string): Promise<DraftQueryResponse> {
  if (!draftId) return { success: false, error: '임시저장 정보가 없습니다.' };

  const { supabase, user, error } = await getCurrentUserAndSupabase();
  if (!supabase || !user) return { success: false, error: error || '로그인이 필요합니다.' };

  const supabaseAny = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: PostDraftRow | null; error: { message: string } | null }>;
          };
        };
      };
    };
  };

  const { data, error: draftError } = await supabaseAny
    .from('post_drafts')
    .select('id, board_id, title, content, deal_info, poll, updated_at, expires_at')
    .eq('user_id', user.id)
    .eq('id', draftId)
    .maybeSingle();

  if (draftError) {
    return { success: false, error: draftError.message };
  }

  return { success: true, draft: data ? await mapDraft(data) : null };
}

export async function listPostDrafts(boardId?: string | null): Promise<DraftListResponse> {
  if (!boardId) return { success: false, error: '게시판 정보가 없습니다.' };

  const { supabase, user, error } = await getCurrentUserAndSupabase();
  if (!supabase || !user) return { success: false, error: error || '로그인이 필요합니다.' };

  const supabaseAny = supabase as unknown as {
    from: (table: string) => {
      delete: () => { lt: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            order: (column: string, options: { ascending: boolean }) => {
              limit: (count: number) => Promise<{ data: PostDraftRow[] | null; error: { message: string } | null }>;
            };
          };
        };
      };
    };
  };

  await supabaseAny.from('post_drafts').delete().lt('expires_at', new Date().toISOString());

  const { data, error: draftError } = await supabaseAny
    .from('post_drafts')
    .select('id, board_id, title, content, deal_info, poll, updated_at, expires_at')
    .eq('user_id', user.id)
    .eq('board_id', boardId)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (draftError) {
    return { success: false, error: draftError.message };
  }

  return { success: true, drafts: await Promise.all((data || []).map(mapDraft)) };
}

export async function savePostDraft(input: SavePostDraftInput): Promise<DraftActionResponse> {
  const boardId = input.boardId;
  if (!boardId) return { success: false, error: '게시판 정보가 없습니다.' };

  const { supabase, user, error } = await getCurrentUserAndSupabase();
  if (!supabase || !user) return { success: false, error: error || '로그인이 필요합니다.' };

  const canWrite = await canWriteBoard(boardId, user.id);
  if (!canWrite) {
    return { success: false, error: '이 게시판에 글을 작성할 권한이 없습니다.' };
  }

  const supabaseAny = supabase as unknown as {
    from: (table: string) => {
      insert: (row: unknown) => {
        select: (columns: string) => {
          single: () => Promise<{ data: PostDraftRow | null; error: { message: string } | null }>;
        };
      };
      update: (row: unknown) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            select: (columns: string) => {
              single: () => Promise<{ data: PostDraftRow | null; error: { message: string } | null }>;
            };
          };
        };
      };
    };
  };

  const row = {
    board_id: boardId,
    title: input.title.slice(0, 100),
    content: input.content,
    deal_info: input.dealInfo ?? null,
    poll: input.poll ?? null,
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const query = input.draftId
    ? supabaseAny
        .from('post_drafts')
        .update(row)
        .eq('user_id', user.id)
        .eq('id', input.draftId)
        .select('id, board_id, title, content, deal_info, poll, updated_at, expires_at')
        .single()
    : supabaseAny
        .from('post_drafts')
        .insert({ ...row, user_id: user.id })
        .select('id, board_id, title, content, deal_info, poll, updated_at, expires_at')
        .single();

  const { data, error: saveError } = await query;

  if (saveError) {
    return { success: false, error: saveError.message };
  }

  return { success: true, draft: data ? await mapDraft(data) : undefined };
}

export async function deletePostDraft(draftId: string): Promise<DraftActionResponse> {
  if (!draftId) return { success: false, error: '임시저장 정보가 없습니다.' };

  const { supabase, user, error } = await getCurrentUserAndSupabase();
  if (!supabase || !user) return { success: false, error: error || '로그인이 필요합니다.' };

  const supabaseAny = supabase as unknown as {
    from: (table: string) => {
      delete: () => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };
  };

  const { error: deleteError } = await supabaseAny
    .from('post_drafts')
    .delete()
    .eq('user_id', user.id)
    .eq('id', draftId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  return { success: true };
}
