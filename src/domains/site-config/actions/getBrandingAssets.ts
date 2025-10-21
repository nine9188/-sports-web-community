'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { BrandingAsset } from '../types';

/**
 * 모든 활성 브랜딩 자산을 가져옵니다.
 */
export async function getAllBrandingAssets(): Promise<BrandingAsset[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('branding_assets')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('브랜딩 자산 조회 오류:', error);
    return [];
  }

  return data as BrandingAsset[];
}

/**
 * 특정 타입의 브랜딩 자산을 가져옵니다.
 */
export async function getBrandingAssetsByType(
  assetType: BrandingAsset['asset_type']
): Promise<BrandingAsset[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('branding_assets')
    .select('*')
    .eq('asset_type', assetType)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('브랜딩 자산 조회 오류:', error);
    return [];
  }

  return data as BrandingAsset[];
}

/**
 * 활성화된 메인 로고를 가져옵니다.
 */
export async function getActiveLogo(variant: string = 'main'): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('branding_assets')
    .select('file_url')
    .eq('asset_type', 'logo')
    .eq('variant', variant)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.file_url;
}

/**
 * 활성화된 파비콘을 가져옵니다.
 */
export async function getActiveFavicon(): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('branding_assets')
    .select('file_url')
    .eq('asset_type', 'favicon')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.file_url;
}

/**
 * 브랜딩 설정 (로고 URL, 파비콘 등)을 한 번에 가져옵니다.
 * site_settings와 branding_assets 모두에서 조회하며, site_settings를 우선합니다.
 */
export async function getBrandingConfig(): Promise<{
  logo: string | null;
  logoDark: string | null;
  favicon: string | null;
  appleIcon: string | null;
}> {
  const supabase = await createClient();

  // site_settings에서 브랜딩 URL 가져오기
  const { data: settingsData } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['logo_url', 'logo_dark_url', 'favicon_url'])
    .eq('is_public', true);

  const settings = settingsData?.reduce((acc, item) => {
    acc[item.key] = typeof item.value === 'string' ? item.value : item.value;
    return acc;
  }, {} as Record<string, any>) || {};

  // branding_assets에서 폴백 데이터 가져오기
  const [logoData, logoDarkData, faviconData, appleIconData] = await Promise.all([
    supabase
      .from('branding_assets')
      .select('file_url')
      .eq('asset_type', 'logo')
      .eq('variant', 'main')
      .eq('is_active', true)
      .limit(1)
      .single(),
    supabase
      .from('branding_assets')
      .select('file_url')
      .eq('asset_type', 'logo')
      .eq('variant', 'dark')
      .eq('is_active', true)
      .limit(1)
      .single(),
    supabase
      .from('branding_assets')
      .select('file_url')
      .eq('asset_type', 'favicon')
      .eq('is_active', true)
      .limit(1)
      .single(),
    supabase
      .from('branding_assets')
      .select('file_url')
      .eq('asset_type', 'apple_icon')
      .eq('is_active', true)
      .limit(1)
      .single(),
  ]);

  return {
    logo: settings.logo_url || logoData.data?.file_url || null,
    logoDark: settings.logo_dark_url || logoDarkData.data?.file_url || null,
    favicon: settings.favicon_url || faviconData.data?.file_url || null,
    appleIcon: appleIconData.data?.file_url || null,
  };
}
