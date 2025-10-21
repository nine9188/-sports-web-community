'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';
import { PageMetadataFormData } from '../types';

/**
 * 페이지 메타데이터를 업데이트합니다.
 */
export async function updatePageMetadata(
  id: string,
  data: Partial<PageMetadataFormData>
): Promise<{ success: boolean; error?: string }> {
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

  const { error } = await supabase
    .from('page_metadata')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('페이지 메타데이터 업데이트 오류:', error);
    return { success: false, error: '메타데이터 업데이트에 실패했습니다.' };
  }

  // 해당 페이지 경로 캐시 무효화
  if (data.page_path) {
    revalidatePath(data.page_path);
  }
  revalidatePath('/admin/site-management');

  return { success: true };
}

/**
 * 새로운 페이지 메타데이터를 추가합니다.
 */
export async function createPageMetadata(
  data: PageMetadataFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
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

  const { data: result, error } = await supabase
    .from('page_metadata')
    .insert(data)
    .select('id')
    .single();

  if (error) {
    console.error('페이지 메타데이터 생성 오류:', error);
    return { success: false, error: '메타데이터 생성에 실패했습니다.' };
  }

  revalidatePath('/admin/site-management');

  return { success: true, id: result.id };
}

/**
 * 페이지 메타데이터를 삭제합니다.
 */
export async function deletePageMetadata(
  id: string
): Promise<{ success: boolean; error?: string }> {
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

  const { error } = await supabase
    .from('page_metadata')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('페이지 메타데이터 삭제 오류:', error);
    return { success: false, error: '메타데이터 삭제에 실패했습니다.' };
  }

  revalidatePath('/admin/site-management');

  return { success: true };
}

/**
 * 페이지 메타데이터 활성화 상태를 토글합니다.
 */
export async function togglePageMetadataActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
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

  const { error } = await supabase
    .from('page_metadata')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('페이지 메타데이터 활성화 토글 오류:', error);
    return { success: false, error: '상태 변경에 실패했습니다.' };
  }

  revalidatePath('/admin/site-management');

  return { success: true };
}
