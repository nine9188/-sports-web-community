'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createProfileUpdateNotification } from '@/domains/notifications/actions/create';

interface UseNicknameTicketResult {
  success: boolean;
  error?: string;
  newNickname?: string;
}

/**
 * 닉네임 변경권 사용
 */
export async function useNicknameTicket(
  newNickname: string
): Promise<UseNicknameTicketResult> {
  try {
    const supabase = await getSupabaseServer();

    // 1. 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 2. 닉네임 유효성 검사
    const trimmedNickname = newNickname.trim();
    if (trimmedNickname.length < 2) {
      return { success: false, error: '닉네임은 최소 2자 이상이어야 합니다.' };
    }
    if (trimmedNickname.length > 20) {
      return { success: false, error: '닉네임은 최대 20자까지 가능합니다.' };
    }

    // 금지어 체크
    const forbiddenWords = ['admin', '관리자', '운영자', 'administrator'];
    if (forbiddenWords.some(word => trimmedNickname.toLowerCase().includes(word))) {
      return { success: false, error: '사용할 수 없는 닉네임입니다.' };
    }

    // 3. 닉네임 중복 체크
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', trimmedNickname)
      .neq('id', user.id)
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: '이미 사용 중인 닉네임입니다.' };
    }

    // 4. 닉네임 변경권 보유 확인
    const { data: ownedTicket, error: ticketError } = await supabase
      .from('user_items')
      .select(`
        id,
        item_id,
        shop_items!inner (
          id,
          name,
          is_consumable,
          consumable_type
        )
      `)
      .eq('user_id', user.id)
      .eq('shop_items.consumable_type', 'nickname_change')
      .limit(1)
      .maybeSingle();

    if (ticketError || !ownedTicket) {
      return { success: false, error: '닉네임 변경권이 없습니다. 샵에서 구매해주세요.' };
    }

    // 5. 현재 닉네임 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();

    const oldNickname = profile?.nickname || '';

    // 같은 닉네임으로 변경 시도 방지
    if (oldNickname === trimmedNickname) {
      return { success: false, error: '현재 닉네임과 동일합니다.' };
    }

    // 6. 트랜잭션: 닉네임 변경 + 티켓 소모
    // 6-1. 닉네임 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nickname: trimmedNickname,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('닉네임 업데이트 오류:', updateError);
      return { success: false, error: '닉네임 변경에 실패했습니다.' };
    }

    // 6-2. 사용 기록 저장
    await supabase
      .from('item_usage_log')
      .insert({
        user_id: user.id,
        item_id: ownedTicket.item_id,
        user_item_id: ownedTicket.id,
        usage_type: 'nickname_change',
        usage_details: {
          old_nickname: oldNickname,
          new_nickname: trimmedNickname
        }
      });

    // 6-3. 티켓 삭제 (소모)
    const { error: deleteError } = await supabase
      .from('user_items')
      .delete()
      .eq('id', ownedTicket.id);

    if (deleteError) {
      // 롤백: 닉네임 원복
      console.error('티켓 삭제 오류:', deleteError);
      await supabase
        .from('profiles')
        .update({ nickname: oldNickname })
        .eq('id', user.id);
      return { success: false, error: '티켓 사용 처리에 실패했습니다.' };
    }

    // 7. 알림 생성
    await createProfileUpdateNotification({
      userId: user.id,
      changeType: 'nickname',
      oldValue: oldNickname,
      newValue: trimmedNickname
    });

    // 8. 캐시 갱신
    revalidatePath('/settings/profile');
    revalidatePath('/shop');

    return {
      success: true,
      newNickname: trimmedNickname
    };

  } catch (error) {
    console.error('닉네임 변경권 사용 오류:', error);
    return { success: false, error: '서버 오류가 발생했습니다.' };
  }
}

/**
 * 사용자의 닉네임 변경권 보유 여부 확인
 */
export async function hasNicknameTicket(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_items')
      .select(`
        id,
        shop_items!inner (consumable_type)
      `)
      .eq('user_id', user.id)
      .eq('shop_items.consumable_type', 'nickname_change')
      .limit(1)
      .maybeSingle();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * 사용자의 닉네임 변경권 개수 조회
 */
export async function getNicknameTicketCount(userId?: string): Promise<number> {
  try {
    const supabase = await getSupabaseServer();

    let targetUserId = userId;

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      targetUserId = user.id;
    }

    const { count, error } = await supabase
      .from('user_items')
      .select(`
        id,
        shop_items!inner (consumable_type)
      `, { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .eq('shop_items.consumable_type', 'nickname_change');

    return error ? 0 : (count || 0);
  } catch {
    return 0;
  }
}
