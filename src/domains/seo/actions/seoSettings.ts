'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ========== 타입 정의 ==========

export interface SeoSettings {
  id: string;
  site_name: string;
  site_url: string;
  default_title: string;
  default_description: string;
  default_keywords: string[];
  og_image: string;
  twitter_handle: string;
  page_overrides: Record<string, PageSeoOverride>;
  updated_at: string;
}

export interface PageSeoOverride {
  title?: string;
  description?: string;
  keywords?: string[];
}

// ========== 조회 ==========

/**
 * SEO 설정 가져오기 (공개)
 */
export async function getSeoSettings(): Promise<SeoSettings | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('seo_settings')
    .select('*')
    .single();

  if (error) {
    // 빌드 단계 로그 오염 방지 (DYNAMIC_SERVER_USAGE는 정상 동작)
    if (error.message && !error.message.includes('DYNAMIC_SERVER_USAGE') && !error.message.includes('cookies')) {
      console.error('[getSeoSettings] 오류:', error);
    }
    return null;
  }

  return data as SeoSettings;
}

// ========== 업데이트 ==========

/**
 * 전역 SEO 설정 업데이트
 */
export async function updateGlobalSeo(updates: {
  site_name?: string;
  site_url?: string;
  default_title?: string;
  default_description?: string;
  default_keywords?: string[];
  og_image?: string;
  twitter_handle?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseServer();

  // 관리자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return { success: false, error: '관리자 권한이 필요합니다.' };
  }

  // 업데이트
  const { error } = await supabase
    .from('seo_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', '00000000-0000-0000-0000-000000000001');

  if (error) {
    console.error('[updateGlobalSeo] 오류:', error);
    return { success: false, error: 'SEO 설정 업데이트 실패' };
  }

  revalidatePath('/');
  revalidatePath('/admin/site-management/seo');

  return { success: true };
}

/**
 * 페이지별 SEO 오버라이드 추가/수정
 */
export async function updatePageSeo(
  path: string,
  override: PageSeoOverride
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseServer();

  // 관리자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return { success: false, error: '관리자 권한이 필요합니다.' };
  }

  // 현재 설정 가져오기
  const { data: current } = await supabase
    .from('seo_settings')
    .select('page_overrides')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  const pageOverrides = (current?.page_overrides as Record<string, PageSeoOverride>) || {};
  pageOverrides[path] = override;

  // 업데이트
  const { error } = await supabase
    .from('seo_settings')
    .update({
      page_overrides: pageOverrides,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', '00000000-0000-0000-0000-000000000001');

  if (error) {
    console.error('[updatePageSeo] 오류:', error);
    return { success: false, error: '페이지 SEO 업데이트 실패' };
  }

  revalidatePath('/');
  revalidatePath(path);
  revalidatePath('/admin/site-management/seo');

  return { success: true };
}

/**
 * 페이지별 SEO 오버라이드 삭제
 */
export async function deletePageSeo(
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseServer();

  // 관리자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return { success: false, error: '관리자 권한이 필요합니다.' };
  }

  // 현재 설정 가져오기
  const { data: current } = await supabase
    .from('seo_settings')
    .select('page_overrides')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  const pageOverrides = (current?.page_overrides as Record<string, PageSeoOverride>) || {};
  delete pageOverrides[path];

  // 업데이트
  const { error } = await supabase
    .from('seo_settings')
    .update({
      page_overrides: pageOverrides,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', '00000000-0000-0000-0000-000000000001');

  if (error) {
    console.error('[deletePageSeo] 오류:', error);
    return { success: false, error: '페이지 SEO 삭제 실패' };
  }

  revalidatePath('/');
  revalidatePath(path);
  revalidatePath('/admin/site-management/seo');

  return { success: true };
}
