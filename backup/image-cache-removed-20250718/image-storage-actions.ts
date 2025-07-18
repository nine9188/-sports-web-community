'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Supabase 클라이언트 생성
const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// API-Sports.io 기본 URL
const API_SPORTS_BASE_URL = 'https://media.api-sports.io/football'

// 지원하는 이미지 타입
const VALID_IMAGE_TYPES = ['players', 'teams', 'leagues', 'coachs'] as const
type ValidImageType = typeof VALID_IMAGE_TYPES[number]

// 버킷 이름 매핑
const BUCKET_MAPPING: Record<ValidImageType, string> = {
  'players': 'players',
  'teams': 'teams',
  'leagues': 'leagues',
  'coachs': 'coachs',
}

/**
 * Supabase Storage에서 캐시된 이미지를 가져오거나 새로 캐시하는 함수
 */
export async function getCachedImageFromStorage(type: ValidImageType, id: string | number): Promise<{
  success: boolean
  url?: string
  error?: string
  cached?: boolean
}> {
  try {
    // 파라미터 유효성 검사
    if (!type || !id) {
      return { success: false, error: 'Missing required parameters: type and id' }
    }
    
    if (!VALID_IMAGE_TYPES.includes(type)) {
      return { success: false, error: `Invalid image type. Must be one of: ${VALID_IMAGE_TYPES.join(', ')}` }
    }
    
    // ID를 문자열로 변환하고 유효성 검사
    const idString = String(id)
    if (!/^\d+$/.test(idString)) {
      return { success: false, error: 'ID must be a number' }
    }

    const supabase = await createClient()
    const bucketName = BUCKET_MAPPING[type]
    const filePath = `${idString}.png`
    
    // 1. 먼저 Storage에 이미지가 있는지 확인
    const { data: existingFiles, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { 
        search: `${idString}.png`,
        limit: 1
      })
    
    if (listError) {
      console.error('Storage list error:', listError)
      return { success: false, error: 'Failed to check storage' }
    }
    
    if (existingFiles && existingFiles.length > 0) {
      // 이미지가 이미 캐시되어 있음 - Storage URL 반환
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)
      
      return { 
        success: true, 
        url: urlData.publicUrl,
        cached: true
      }
    }
    
    // 2. Storage에 없으면 API-Sports에서 가져와서 저장
    const imageUrl = `${API_SPORTS_BASE_URL}/${type}/${idString}.png`
    
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Sports-Web-Community/1.0)',
          'Accept': 'image/*',
        },
        // 타임아웃 설정 (15초)
        signal: AbortSignal.timeout(15000)
      })
      
      if (!response.ok) {
        return { 
          success: false, 
          error: `Failed to fetch image from API-Sports: ${response.status}` 
        }
      }
      
      // 이미지 데이터 가져오기
      const imageBuffer = await response.arrayBuffer()
      
      // 이미지 크기 확인 (10MB 제한)
      if (imageBuffer.byteLength > 10 * 1024 * 1024) {
        return { success: false, error: 'Image too large (max 10MB)' }
      }
      
      // 3. Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imageBuffer, {
          contentType: 'image/png',
          cacheControl: '2592000', // 30일 캐시
          upsert: true // 이미 존재하면 덮어쓰기
        })
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return { success: false, error: 'Failed to upload image to storage' }
      }
      
      // 4. 업로드된 이미지의 공개 URL 반환
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)
      
      return { 
        success: true, 
        url: urlData.publicUrl,
        cached: false
      }
      
    } catch (fetchError) {
      console.error('Image fetch error:', fetchError)
      
      // 네트워크 에러인 경우 원본 API-Sports URL 반환
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return { 
          success: true, 
          url: imageUrl,
          cached: false,
          error: 'Timeout - using original URL'
        }
      }
      
      return { success: false, error: 'Failed to fetch image from API-Sports' }
    }
    
  } catch (error) {
    console.error('Image cache error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * 여러 이미지를 배치로 캐시하는 함수
 */
export async function batchCacheImages(images: Array<{ type: ValidImageType; id: string | number }>): Promise<{
  success: boolean
  results: Array<{ type: ValidImageType; id: string | number; cached: boolean; url?: string; error?: string }>
}> {
  const results: Array<{ type: ValidImageType; id: string | number; cached: boolean; url?: string; error?: string }> = []
  const BATCH_SIZE = 5 // 동시 처리 제한
  
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE)
    
    const batchResults = await Promise.allSettled(
      batch.map(async ({ type, id }) => {
        const result = await getCachedImageFromStorage(type, id)
        return {
          type,
          id,
          cached: result.success && result.cached === true,
          url: result.url,
          error: result.error
        }
      })
    )
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          type: batch[index].type,
          id: batch[index].id,
          cached: false,
          error: 'Processing failed'
        })
      }
    })
    
    // 배치 간 딜레이 (API 부하 방지)
    if (i + BATCH_SIZE < images.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return {
    success: true,
    results
  }
}

/**
 * 특정 이미지를 Storage에서 제거하는 함수
 */
export async function removeImageFromStorage(type: ValidImageType, id: string | number): Promise<{
  success: boolean
  error?: string
}> {
  try {
    if (!VALID_IMAGE_TYPES.includes(type)) {
      return { success: false, error: 'Invalid image type' }
    }
    
    const supabase = await createClient()
    const bucketName = BUCKET_MAPPING[type]
    const filePath = `${String(id)}.png`
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])
    
    if (error) {
      console.error('Storage remove error:', error)
      return { success: false, error: 'Failed to remove image from storage' }
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Remove image error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Storage 버킷의 이미지 목록 가져오기
 */
export async function listStorageImages(type: ValidImageType, limit = 100): Promise<{
  success: boolean
  images?: Array<{ name: string; size: number; lastModified: string }>
  error?: string
}> {
  try {
    if (!VALID_IMAGE_TYPES.includes(type)) {
      return { success: false, error: 'Invalid image type' }
    }
    
    const supabase = await createClient()
    const bucketName = BUCKET_MAPPING[type]
    
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list('', { 
        limit,
        sortBy: { column: 'updated_at', order: 'desc' }
      })
    
    if (error) {
      console.error('Storage list error:', error)
      return { success: false, error: 'Failed to list storage images' }
    }
    
    const images = files?.map(file => ({
      name: file.name,
      size: file.metadata?.size || 0,
      lastModified: file.updated_at || file.created_at || ''
    })) || []
    
    return { success: true, images }
    
  } catch (error) {
    console.error('List storage images error:', error)
    return { success: false, error: 'Internal server error' }
  }
} 