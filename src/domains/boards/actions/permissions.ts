import { getSupabaseServer } from '@/shared/lib/supabase/server';

type BoardPermissionInput = {
  slug?: string | null;
  access_level?: string | null;
};

type ViewerProfile = {
  is_admin?: boolean | null;
  is_suspended?: boolean | null;
  suspended_until?: string | null;
};

export interface BoardViewerPermissions {
  isLoggedIn: boolean;
  isAdmin: boolean;
  canWrite: boolean;
  canWriteNotice: boolean;
}

function isSuspensionActive(profile: ViewerProfile | null): boolean {
  if (!profile?.is_suspended) return false;
  if (!profile.suspended_until) return true;

  const until = new Date(profile.suspended_until).getTime();
  return Number.isNaN(until) || until > Date.now();
}

export function calculateBoardViewerPermissions(
  board: BoardPermissionInput,
  profile: ViewerProfile | null
): BoardViewerPermissions {
  const isLoggedIn = Boolean(profile);
  const isAdmin = Boolean(profile?.is_admin);
  const isSuspended = isSuspensionActive(profile);
  const accessLevel = (board.access_level || 'public').toLowerCase();
  const isNoticeBoard = board.slug === 'notice' || board.slug === 'notices';

  const canWriteNotice = isLoggedIn && isAdmin && !isSuspended;
  let canWrite = isLoggedIn && !isSuspended;

  if (isNoticeBoard || accessLevel === 'admin') {
    canWrite = canWriteNotice;
  }

  return {
    isLoggedIn,
    isAdmin,
    canWrite,
    canWriteNotice,
  };
}

export async function getBoardViewerPermissions(
  board: BoardPermissionInput
): Promise<BoardViewerPermissions> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return calculateBoardViewerPermissions(board, null);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_suspended, suspended_until')
    .eq('id', user.id)
    .single();

  return calculateBoardViewerPermissions(board, profile);
}
