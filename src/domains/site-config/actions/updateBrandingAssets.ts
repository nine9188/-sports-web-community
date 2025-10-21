'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';

/**
 * 브랜딩 자산을 추가하거나 업데이트합니다.
 */
export async function upsertBrandingAsset(data: {
  asset_type: 'logo' | 'favicon' | 'og_image' | 'apple_icon';
  variant?: string;
  file_url: string;
  file_name?: string;
  size?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return { success: false, error: '관리자 권한이 필요합니다.' };
  }

  // 같은 타입/variant가 있으면 비활성화
  if (data.variant) {
    await supabase
      .from('branding_assets')
      .update({ is_active: false })
      .eq('asset_type', data.asset_type)
      .eq('variant', data.variant);
  } else {
    await supabase
      .from('branding_assets')
      .update({ is_active: false })
      .eq('asset_type', data.asset_type);
  }

  // 새 자산 추가
  const { error } = await supabase
    .from('branding_assets')
    .insert({
      ...data,
      uploaded_by: user.id,
      is_active: true,
    });

  if (error) {
    console.error('브랜딩 자산 추가 오류:', error);
    return { success: false, error: '자산 추가에 실패했습니다.' };
  }

  revalidatePath('/');
  revalidatePath('/admin/site-management');

  return { success: true };
}
