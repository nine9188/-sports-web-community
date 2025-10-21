'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { PageMetadata } from '../types';

/**
 * 모든 페이지 메타데이터를 가져옵니다.
 */
export async function getAllPageMetadata(): Promise<PageMetadata[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('page_metadata')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true })
    .order('page_path', { ascending: true });

  if (error) {
    console.error('페이지 메타데이터 조회 오류:', error);
    throw new Error('페이지 메타데이터를 가져올 수 없습니다.');
  }

  return data as PageMetadata[];
}

/**
 * 특정 경로의 페이지 메타데이터를 가져옵니다.
 */
export async function getPageMetadataByPath(
  path: string
): Promise<PageMetadata | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('page_metadata')
    .select('*')
    .eq('page_path', path)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('페이지 메타데이터 조회 오류:', error);
    return null;
  }

  return data as PageMetadata;
}

/**
 * 페이지 타입별로 메타데이터를 가져옵니다.
 */
export async function getPageMetadataByType(
  pageType: PageMetadata['page_type']
): Promise<PageMetadata[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('page_metadata')
    .select('*')
    .eq('page_type', pageType)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (error) {
    console.error('페이지 메타데이터 조회 오류:', error);
    return [];
  }

  return data as PageMetadata[];
}

/**
 * 관리자용: 비활성 포함 모든 페이지 메타데이터를 가져옵니다.
 */
export async function getAllPageMetadataForAdmin(): Promise<PageMetadata[]> {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  const { data, error } = await supabase
    .from('page_metadata')
    .select('*')
    .order('priority', { ascending: true })
    .order('page_path', { ascending: true });

  if (error) {
    console.error('페이지 메타데이터 조회 오류:', error);
    throw new Error('페이지 메타데이터를 가져올 수 없습니다.');
  }

  return data as PageMetadata[];
}
