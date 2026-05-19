'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAction } from '@/shared/lib/supabase/server';

export async function votePostPoll(pollId: string, optionId: string): Promise<{ success: boolean; error?: string }> {
  if (!pollId || !optionId) {
    return { success: false, error: '투표 정보를 확인할 수 없습니다.' };
  }

  const supabase = await getSupabaseAction();
  if (!supabase) {
    return { success: false, error: 'Supabase 클라이언트 초기화 오류' };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const supabaseAny = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
          };
        };
      };
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string; code?: string } | null }>;
    };
  };

  const { data: option, error: optionError } = await supabaseAny
    .from('post_poll_options')
    .select('id')
    .eq('id', optionId)
    .eq('poll_id', pollId)
    .maybeSingle();

  if (optionError || !option) {
    return { success: false, error: '선택지를 확인할 수 없습니다.' };
  }

  const { error } = await supabaseAny
    .from('post_poll_votes')
    .insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id,
    });

  if (error) {
    if (error.code === '23505' || error.message.includes('duplicate')) {
      return { success: false, error: '이미 투표했습니다.' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/boards');
  return { success: true };
}
