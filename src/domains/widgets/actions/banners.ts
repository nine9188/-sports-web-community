'use server'

import { getSupabaseAction } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Banner, BannerPosition } from '../types/banner'
import { getSupabaseServer } from '@/shared/lib/supabase/server'

// 특정 위치의 배너 목록 조회
export async function getBannersByPosition(position: BannerPosition) {
  const supabase = await getSupabaseAction()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('banners')
    .select('*')
    .eq('position', position)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('배너 조회 실패:', error.message || error)
    // 테이블이 존재하지 않는 경우 빈 배열 반환
    if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
      console.warn('배너 테이블이 존재하지 않습니다. /admin/banners/init 페이지에서 테이블을 생성해주세요.')
      return []
    }
    return []
  }
  
  return (data || []) as Banner[]
}

// 모든 배너 조회 (관리자용)
export async function getAllBanners() {
  const supabase = await getSupabaseAction()
  
  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  
  if (!profile?.is_admin) {
    throw new Error('관리자 권한이 필요합니다')
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('banners')
    .select('*')
    .order('position', { ascending: true })
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('배너 조회 실패:', error.message || error)
    // 테이블이 존재하지 않는 경우 안내 메시지와 함께 에러 발생
    if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
      throw new Error('배너 테이블이 존재하지 않습니다. /admin/banners/init 페이지에서 테이블을 생성해주세요.')
    }
    throw new Error('배너 조회에 실패했습니다')
  }
  
  return (data || []) as Banner[]
}

// 배너 생성
export async function createBanner(bannerData: Omit<Banner, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await getSupabaseAction()
  
  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  
  if (!profile?.is_admin) {
    throw new Error('관리자 권한이 필요합니다')
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('banners')
    .insert(bannerData)
    .select()
    .single()
  
  if (error) {
    console.error('배너 생성 실패:', error)
    throw new Error('배너 생성에 실패했습니다')
  }
  
  revalidatePath('/')
  return data as Banner
}

// 배너 수정
export async function updateBanner(id: string, bannerData: Partial<Omit<Banner, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = await getSupabaseAction()
  
  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  
  if (!profile?.is_admin) {
    throw new Error('관리자 권한이 필요합니다')
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('banners')
    .update(bannerData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('배너 수정 실패:', error)
    throw new Error('배너 수정에 실패했습니다')
  }
  
  revalidatePath('/')
  return data as Banner
}

// 배너 삭제
export async function deleteBanner(id: string) {
  const supabase = await getSupabaseAction()
  
  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  
  if (!profile?.is_admin) {
    throw new Error('관리자 권한이 필요합니다')
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('banners')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('배너 삭제 실패:', error)
    throw new Error('배너 삭제에 실패했습니다')
  }
  
  revalidatePath('/')
  return { success: true }
}

// 배너 순서 변경
export async function updateBannerOrder(bannerId: string, newOrder: number) {
  const supabase = await getSupabaseAction()
  
  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  
  if (!profile?.is_admin) {
    throw new Error('관리자 권한이 필요합니다')
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('banners')
    .update({ display_order: newOrder })
    .eq('id', bannerId)
  
  if (error) {
    console.error('배너 순서 변경 실패:', error)
    throw new Error('배너 순서 변경에 실패했습니다')
  }
  
  revalidatePath('/')
  return { success: true }
}

// 배너 이미지 업로드 결과 타입
interface BannerImageUploadResult {
  success: boolean
  url?: string
  error?: string
}

// 배너 이미지를 Supabase Storage에 업로드
export async function uploadBannerImage(file: File): Promise<BannerImageUploadResult> {
  try {
    const supabase = await getSupabaseServer()
    
    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      return { success: false, error: '이미지 파일만 업로드 가능합니다.' }
    }
    
    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: '파일 크기는 5MB 이하여야 합니다.' }
    }
    
    // 파일명 생성 (타임스탬프 + 랜덤 + 확장자)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()
    const fileName = `banners/${timestamp}_${random}.${extension}`
    
    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    
    // Supabase Storage에 업로드
    const { error: uploadError } = await supabase.storage
      .from('benner')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) {
      console.error('Banner image upload error:', uploadError)
      return { success: false, error: `업로드 실패: ${uploadError.message}` }
    }
    
    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('benner')
      .getPublicUrl(fileName)
    
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Error uploading banner image:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.' 
    }
  }
}

// 배너 이미지 삭제
export async function deleteBannerImage(imageUrl: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer()
    
    // URL에서 파일 경로 추출
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `banners/${fileName}`
    
    const { error } = await supabase.storage
      .from('benner')
      .remove([filePath])
    
    if (error) {
      console.error('Error deleting banner image:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error deleting banner image:', error)
    return false
  }
} 