'use server'

import { createClient } from '@/shared/api/supabaseServer'
import type { ImageCacheResult, BatchImageCacheResult, ImageCacheRequest } from '@/shared/types/image'

// 지원하는 이미지 타입 정의
type ImageTypeString = 'players' | 'teams' | 'leagues' | 'coachs' | 'venues'

// API-Sports.io 기본 URL
const API_SPORTS_BASE_URL = 'https://media.api-sports.io/football'

/**
 * Supabase Storage에서 이미지 URL을 가져오거나 캐시하는 함수
 * 
 * @param type - 이미지 타입
 * @param id - 이미지 ID
 * @returns 캐시된 이미지 정보
 */
export async function getCachedImageFromStorage(
  type: ImageTypeString,
  id: string | number
): Promise<ImageCacheResult> {
  try {
    const supabase = await createClient()
    const fileName = `${id}.png`
    
    // 1. Storage에서 이미지 존재 여부 확인
    const { data: existingFile, error: listError } = await supabase.storage
      .from(type)
      .list('', {
        search: fileName
      })
    
    if (!listError && existingFile && existingFile.length > 0) {
      // 이미 존재하는 경우 Storage URL 반환
      const { data } = supabase.storage
        .from(type)
        .getPublicUrl(fileName)
      
      return {
        success: true,
        url: data.publicUrl,
        cached: true
      }
    }
    
    // 2. Storage에 없는 경우 API-Sports에서 다운로드하여 저장
    let apiUrl: string;
    
    // 경기장은 venues/{id}.png 형태로 시도
    if (type === 'venues') {
      apiUrl = `${API_SPORTS_BASE_URL}/venues/${id}.png`;
    } else {
      apiUrl = `${API_SPORTS_BASE_URL}/${type}/${id}.png`;
    }
    
    try {
      // API-Sports에서 이미지 다운로드
      const response = await fetch(apiUrl)
      if (!response.ok) {
        console.warn(`이미지 다운로드 실패 (${response.status}): ${apiUrl}`)
        return null // 404는 에러가 아닌 정상적인 상황으로 처리
      }
      
      const imageBuffer = await response.arrayBuffer()
      const imageFile = new File([imageBuffer], fileName, { type: 'image/png' })
      
      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from(type)
        .upload(fileName, imageFile, {
          contentType: 'image/png',
          cacheControl: '31536000', // 1년 캐시
          upsert: true
        })
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        // 업로드 실패 시 원본 URL 반환
        return {
          success: true,
          url: apiUrl,
          cached: false,
          error: uploadError.message
        }
      }
      
      // 업로드 성공 시 Storage URL 반환
      const { data } = supabase.storage
        .from(type)
        .getPublicUrl(fileName)
      
      return {
        success: true,
        url: data.publicUrl,
        cached: true
      }
      
    } catch (fetchError) {
      console.error('API-Sports fetch error:', fetchError)
      // API-Sports 요청 실패 시 원본 URL 반환
      return {
        success: true,
        url: apiUrl,
        cached: false,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
      }
    }
    
  } catch (error) {
    console.error('Image cache error:', error)
    // 전체 프로세스 실패 시 원본 URL 반환
    const fallbackUrl = `${API_SPORTS_BASE_URL}/${type}/${id}.png`
    return {
      success: false,
      url: fallbackUrl,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 여러 이미지를 배치로 캐시하는 함수
 * 
 * @param images - 캐시할 이미지 목록
 * @returns 배치 캐시 결과
 */
export async function batchCacheImages(images: ImageCacheRequest[]): Promise<BatchImageCacheResult> {
  const results: Array<{ id: number; cached: boolean; error?: string }> = []
  let cachedCount = 0
  let failedCount = 0
  
  // 동시 요청 수 제한 (너무 많은 요청으로 인한 오류 방지)
  const BATCH_SIZE = 5
  
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE)
    
    const batchPromises = batch.map(async ({ type, id }) => {
      try {
        const result = await getCachedImageFromStorage(type, id)
        const success = result.success && (result.cached === true)
        
        if (success) {
          cachedCount++
        } else {
          failedCount++
        }
        
        return {
          id: Number(id),
          cached: success,
          error: result.error
        }
      } catch (error) {
        failedCount++
        return {
          id: Number(id),
          cached: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // 배치 간 잠시 대기 (API 부하 방지)
    if (i + BATCH_SIZE < images.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return {
    success: true,
    cached: cachedCount,
    failed: failedCount,
    results
  }
}

/**
 * Storage 버킷이 존재하지 않는 경우 생성하는 함수
 * 
 * @param bucketName - 생성할 버킷 이름
 */
export async function createStorageBucketIfNotExists(bucketName: ImageTypeString): Promise<void> {
  try {
    const supabase = await createClient()
    
    // 버킷 존재 여부 확인
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Failed to list buckets:', listError)
      return
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (!bucketExists) {
      // 버킷 생성
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (createError) {
        console.error(`Failed to create bucket ${bucketName}:`, createError)
      } else {
        console.log(`Storage bucket '${bucketName}' created successfully`)
      }
    }
  } catch (error) {
    console.error('Error managing storage bucket:', error)
  }
}

/**
 * 모든 이미지 타입에 대한 Storage 버킷을 초기화하는 함수
 */
export async function initializeImageStorageBuckets(): Promise<void> {
  const imageTypes: ImageTypeString[] = ['players', 'teams', 'leagues', 'coachs']
  
  await Promise.all(
    imageTypes.map(type => createStorageBucketIfNotExists(type))
  )
} 