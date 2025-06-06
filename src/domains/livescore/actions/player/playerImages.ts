'use server'

// import { createClient } from '@/shared/api/supabaseServer'
// import { revalidatePath } from 'next/cache'

// TODO: 테이블 생성 후 활성화
// interface PlayerImageData {
//   player_id: number
//   player_name: string
//   team_id?: number
//   team_name?: string
//   original_url: string
// }

interface CachedImageResult {
  success: boolean
  url?: string
  error?: string
}

// TODO: 테이블 생성 후 활성화
// 현재는 player_images, image_cache 테이블이 존재하지 않아 타입 에러 발생

// 선수 이미지 캐시에서 조회
export async function getCachedPlayerImage(): Promise<CachedImageResult> {
  // TODO: 테이블 생성 후 구현
  return { success: false, error: 'Not implemented yet' }
}

// 선수 이미지를 Supabase 스토리지에 업로드
export async function uploadPlayerImageToStorage(): Promise<CachedImageResult> {
  // TODO: 테이블 생성 후 구현
  return { success: false, error: 'Not implemented yet' }
}

// 배치로 여러 선수 이미지 처리
export async function batchProcessPlayerImages(): Promise<void> {
  // TODO: 테이블 생성 후 구현
}

// 만료된 캐시 정리
export async function cleanupExpiredCache(): Promise<void> {
  // TODO: 테이블 생성 후 구현
}

// 특정 선수의 이미지 강제 새로고침
export async function refreshPlayerImage(): Promise<CachedImageResult> {
  // TODO: 테이블 생성 후 구현
  return { success: false, error: 'Not implemented yet' }
}

/*
// 테이블 생성 후 아래 코드 활성화

// 선수 이미지 캐시에서 조회
export async function getCachedPlayerImage(playerId: number): Promise<CachedImageResult> {
  try {
    const supabase = await createClient()
    
    // 먼저 처리된 이미지가 있는지 확인
    const { data: playerImage } = await supabase
      .from('player_images')
      .select('storage_url, is_processed')
      .eq('player_id', playerId)
      .eq('is_processed', true)
      .single()
    
    if (playerImage?.storage_url) {
      return { success: true, url: playerImage.storage_url }
    }
    
    // 캐시 테이블에서 확인
    const cacheKey = `player_${playerId}`
    const { data: cached } = await supabase
      .from('image_cache')
      .select('cached_url, status, expires_at')
      .eq('cache_key', cacheKey)
      .single()
    
    if (cached?.cached_url && cached.status === 'success') {
      // 만료 시간 확인
      const now = new Date()
      const expiresAt = new Date(cached.expires_at)
      
      if (expiresAt > now) {
        return { success: true, url: cached.cached_url }
      }
    }
    
    return { success: false, error: 'No cached image found' }
  } catch (error) {
    console.error('Error getting cached player image:', error)
    return { success: false, error: 'Cache lookup failed' }
  }
}

// 선수 이미지를 Supabase 스토리지에 업로드
export async function uploadPlayerImageToStorage(imageData: PlayerImageData): Promise<CachedImageResult> {
  try {
    const supabase = await createClient()
    
    // 이미지 다운로드
    const response = await fetch(imageData.original_url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const imageBuffer = await response.arrayBuffer()
    const fileName = `players/${imageData.player_id}.jpg`
    
    // Supabase 스토리지에 업로드
    const { error: uploadError } = await supabase.storage
      .from('player-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }
    
    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('player-images')
      .getPublicUrl(fileName)
    
    // 데이터베이스에 저장
    await supabase
      .from('player_images')
      .upsert({
        player_id: imageData.player_id,
        player_name: imageData.player_name,
        team_id: imageData.team_id,
        team_name: imageData.team_name,
        original_url: imageData.original_url,
        storage_path: fileName,
        storage_url: publicUrl,
        file_size: imageBuffer.byteLength,
        is_processed: true,
        last_updated: new Date().toISOString()
      })
    
    // 캐시 테이블 업데이트
    const cacheKey = `player_${imageData.player_id}`
    await supabase
      .from('image_cache')
      .upsert({
        cache_key: cacheKey,
        image_url: imageData.original_url,
        cached_url: publicUrl,
        status: 'success',
        retry_count: 0,
        last_attempt: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일 후 만료
      })
    
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Error uploading player image:', error)
    
    // 실패 시 캐시에 에러 상태 저장
    const supabase = await createClient()
    const cacheKey = `player_${imageData.player_id}`
    
    await supabase
      .from('image_cache')
      .upsert({
        cache_key: cacheKey,
        image_url: imageData.original_url,
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: 1,
        last_attempt: new Date().toISOString()
      })
    
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' }
  }
}

// 배치로 여러 선수 이미지 처리
export async function batchProcessPlayerImages(playersData: PlayerImageData[]): Promise<void> {
  const BATCH_SIZE = 5 // 동시 처리 제한
  
  for (let i = 0; i < playersData.length; i += BATCH_SIZE) {
    const batch = playersData.slice(i, i + BATCH_SIZE)
    
    await Promise.allSettled(
      batch.map(async (playerData) => {
        // 이미 처리된 이미지인지 확인
        const cached = await getCachedPlayerImage(playerData.player_id)
        if (cached.success) {
          return // 이미 캐시됨
        }
        
        // 새로 처리
        await uploadPlayerImageToStorage(playerData)
      })
    )
    
    // 배치 간 딜레이 (API 부하 방지)
    if (i + BATCH_SIZE < playersData.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  revalidatePath('/livescore')
}

// 만료된 캐시 정리
export async function cleanupExpiredCache(): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('image_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
    
    if (error) {
      console.error('Error cleaning up expired cache:', error)
    }
  } catch (error) {
    console.error('Error in cleanup:', error)
  }
}

// 특정 선수의 이미지 강제 새로고침
export async function refreshPlayerImage(playerId: number): Promise<CachedImageResult> {
  try {
    const supabase = await createClient()
    
    // 기존 캐시 삭제
    await supabase
      .from('image_cache')
      .delete()
      .eq('cache_key', `player_${playerId}`)
    
    // 새로 처리
    return await uploadPlayerImageToStorage({
      player_id: playerId,
      player_name: `Player ${playerId}`,
      original_url: ''
    })
  } catch (error) {
    console.error('Error refreshing player image:', error)
    return { success: false, error: 'Refresh failed' }
  }
}
*/ 