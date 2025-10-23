'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';
import { SiteSetting, SiteSettingFormData } from '../types';

/**
 * 사이트 설정을 업데이트합니다.
 */
export async function updateSiteSetting(
  key: string,
  value: any
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
    .from('site_settings')
    .update({
      value,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('key', key);

  if (error) {
    console.error('사이트 설정 업데이트 오류:', error);
    return { success: false, error: '설정 업데이트에 실패했습니다.' };
  }

  // 캐시 무효화
  revalidatePath('/admin/site-management');
  revalidatePath('/');

  return { success: true };
}

/**
 * 새로운 사이트 설정을 추가합니다.
 */
export async function createSiteSetting(
  data: SiteSettingFormData
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
    .from('site_settings')
    .insert({
      ...data,
      updated_by: user.id,
    });

  if (error) {
    console.error('사이트 설정 생성 오류:', error);
    return { success: false, error: '설정 생성에 실패했습니다.' };
  }

  revalidatePath('/admin/site-management');

  return { success: true };
}

/**
 * 사이트 설정을 삭제합니다.
 */
export async function deleteSiteSetting(
  key: string
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
    .from('site_settings')
    .delete()
    .eq('key', key);

  if (error) {
    console.error('사이트 설정 삭제 오류:', error);
    return { success: false, error: '설정 삭제에 실패했습니다.' };
  }

  revalidatePath('/admin/site-management');

  return { success: true };
}

/**
 * 여러 설정을 한 번에 업데이트합니다 (UPSERT 방식).
 */
export async function updateMultipleSiteSettings(
  settings: Array<{ key: string; value: any }>
): Promise<{ success: boolean; error?: string }> {
  console.log('[서버] updateMultipleSiteSettings 시작:', settings);

  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  console.log('[서버] 사용자:', user?.id);

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  console.log('[서버] 관리자 권한:', profile?.is_admin);

  if (!profile?.is_admin) {
    return { success: false, error: '관리자 권한이 필요합니다.' };
  }

  // 먼저 기존 설정 조회하여 category, label 등 확인
  const { data: existingSettings, error: selectError } = await supabase
    .from('site_settings')
    .select('*')
    .in('key', settings.map(s => s.key));

  console.log('[서버] 기존 설정:', existingSettings);
  console.log('[서버] 조회 에러:', selectError);

  // 각 설정을 순차적으로 UPSERT
  for (const setting of settings) {
    const existing = existingSettings?.find(e => e.key === setting.key);

    console.log(`[서버] ${setting.key} 처리 중... (기존 레코드: ${existing ? '있음' : '없음'})`);

    if (existing) {
      // 기존 레코드가 있으면 UPDATE
      const { error } = await supabase
        .from('site_settings')
        .update({
          value: setting.value,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('key', setting.key);

      if (error) {
        console.error(`[서버] 설정 업데이트 오류 (${setting.key}):`, error);
        return { success: false, error: `${setting.key} 업데이트 실패: ${error.message}` };
      }
      console.log(`[서버] ${setting.key} UPDATE 성공`);
    } else {
      // 기존 레코드가 없으면 INSERT (기본값으로)
      const { error } = await supabase
        .from('site_settings')
        .insert({
          key: setting.key,
          value: setting.value,
          category: 'seo', // 기본 카테고리
          label: setting.key,
          data_type: 'text',
          is_public: true,
          updated_by: user.id,
        });

      if (error) {
        console.error(`[서버] 설정 생성 오류 (${setting.key}):`, error);
        return { success: false, error: `${setting.key} 생성 실패: ${error.message}` };
      }
      console.log(`[서버] ${setting.key} INSERT 성공`);
    }
  }

  console.log('[서버] 모든 설정 저장 완료');

  revalidatePath('/admin/site-management');
  revalidatePath('/');

  return { success: true };
}
