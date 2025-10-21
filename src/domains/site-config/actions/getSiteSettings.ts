'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { SiteSetting, SiteSettingsByCategory } from '../types';

/**
 * 모든 사이트 설정을 가져옵니다.
 */
export async function getAllSiteSettings(): Promise<SiteSetting[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('category', { ascending: true })
    .order('key', { ascending: true });

  if (error) {
    console.error('사이트 설정 조회 오류:', error);
    throw new Error('사이트 설정을 가져올 수 없습니다.');
  }

  return data as SiteSetting[];
}

/**
 * 카테고리별로 그룹화된 사이트 설정을 가져옵니다.
 */
export async function getSiteSettingsByCategory(): Promise<SiteSettingsByCategory> {
  const settings = await getAllSiteSettings();

  const grouped: SiteSettingsByCategory = {
    seo: [],
    branding: [],
    analytics: [],
    general: [],
  };

  settings.forEach(setting => {
    grouped[setting.category].push(setting);
  });

  return grouped;
}

/**
 * 특정 키의 설정값을 가져옵니다.
 */
export async function getSiteSetting(key: string): Promise<SiteSetting | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('사이트 설정 조회 오류:', error);
    throw new Error('사이트 설정을 가져올 수 없습니다.');
  }

  return data as SiteSetting;
}

/**
 * 특정 카테고리의 설정들을 가져옵니다.
 */
export async function getSiteSettingsByType(
  category: SiteSetting['category']
): Promise<SiteSetting[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('category', category)
    .order('key', { ascending: true });

  if (error) {
    console.error('사이트 설정 조회 오류:', error);
    throw new Error('사이트 설정을 가져올 수 없습니다.');
  }

  return data as SiteSetting[];
}

/**
 * 공개 설정만 가져옵니다 (클라이언트에서 사용 가능).
 */
export async function getPublicSiteSettings(): Promise<Record<string, any>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('is_public', true);

  if (error) {
    console.error('공개 설정 조회 오류:', error);
    return {};
  }

  const settings: Record<string, any> = {};
  data?.forEach(item => {
    settings[item.key] = item.value;
  });

  return settings;
}
