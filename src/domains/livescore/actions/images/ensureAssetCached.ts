'use server';

import sharp from 'sharp';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import {
  AssetType,
  ImageSize,
  BUCKET_MAP,
  API_SPORTS_BASE_URL,
  API_PATH_MAP,
  EXTENSION_MAP,
  SUPABASE_STORAGE_URL,
  PLACEHOLDER_URLS,
  TTL_MAP,
  ERROR_COOLDOWN,
  PENDING_WAIT_TIME,
  CUSTOM_ASSETS,
  SIZE_CONFIG,
  VENUE_SIZE_CONFIG,
} from './constants';

interface AssetCacheRow {
  id: string;
  type: string;
  entity_id: number;
  storage_path: string;
  status: 'ready' | 'pending' | 'error';
  checked_at: string;
  error_message?: string;
}

const ALL_SIZES: ImageSize[] = ['sm', 'md', 'lg'];

/**
 * Storage 공개 URL 생성
 * 새 구조: {bucket}/{size}/{entityId}.webp
 */
function getStoragePublicUrl(type: AssetType, entityId: number, size: ImageSize = 'md'): string {
  const bucket = BUCKET_MAP[type];
  const ext = EXTENSION_MAP[type];
  return `${SUPABASE_STORAGE_URL}/${bucket}/${size}/${entityId}.${ext}`;
}

/**
 * API-Sports 원본 URL 생성
 */
function getApiSportsUrl(type: AssetType, entityId: number): string {
  const path = API_PATH_MAP[type];
  return `${API_SPORTS_BASE_URL}/${path}/${entityId}.png`;
}

/**
 * Storage 경로 생성
 * 새 구조: {size}/{entityId}.webp
 */
function getStoragePath(type: AssetType, entityId: number, size: ImageSize): string {
  const ext = EXTENSION_MAP[type];
  return `${size}/${entityId}.${ext}`;
}

/**
 * 단일 에셋 캐시 확인 및 URL 반환
 *
 * 1. asset_cache 조회
 * 2. ready면 Storage URL 반환
 * 3. 없거나 error면 캐싱 시도
 * 4. 실패 시 placeholder 반환
 */
export async function ensureAssetCached(
  type: AssetType,
  entityId: number,
  size: ImageSize = 'md'
): Promise<string> {
  if (!entityId || entityId <= 0) {
    return PLACEHOLDER_URLS[type];
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. 캐시 조회
    const { data: cache } = await supabase
      .from('asset_cache')
      .select('*')
      .eq('type', type)
      .eq('entity_id', entityId)
      .maybeSingle();

    const cacheRow = cache as AssetCacheRow | null;

    // 2. ready 상태면 URL 반환
    if (cacheRow?.status === 'ready') {
      return getStoragePublicUrl(type, entityId, size);
    }

    // 3. pending 상태면 잠시 대기 후 재확인
    if (cacheRow?.status === 'pending') {
      await new Promise(resolve => setTimeout(resolve, PENDING_WAIT_TIME));

      const { data: recheckCache } = await supabase
        .from('asset_cache')
        .select('status')
        .eq('type', type)
        .eq('entity_id', entityId)
        .maybeSingle();

      if (recheckCache?.status === 'ready') {
        return getStoragePublicUrl(type, entityId, size);
      }

      // 여전히 pending이거나 실패면 placeholder
      return PLACEHOLDER_URLS[type];
    }

    // 4. error 상태 - 쿨다운 체크
    if (cacheRow?.status === 'error') {
      const elapsed = Date.now() - new Date(cacheRow.checked_at).getTime();
      if (elapsed < ERROR_COOLDOWN) {
        return PLACEHOLDER_URLS[type];
      }
      // 쿨다운 지남 - 재시도
    }

    // 5. 캐싱 시도
    return await cacheAsset(type, entityId, size);

  } catch (error) {
    console.error(`[ensureAssetCached] Error for ${type}/${entityId}:`, error);
    return PLACEHOLDER_URLS[type];
  }
}

/**
 * 에셋 캐싱 실행 (멀티사이즈 WebP 변환)
 *
 * 1. pending 락 선점
 * 2. API-Sports에서 다운로드
 * 3. sharp로 3사이즈 WebP 변환 및 업로드
 * 4. DB 업데이트
 */
async function cacheAsset(type: AssetType, entityId: number, size: ImageSize = 'md'): Promise<string> {
  const supabase = getSupabaseAdmin();
  const sourceUrl = getApiSportsUrl(type, entityId);

  console.log(`[4590] 캐싱 시작: ${type}/${entityId}`);

  try {
    // 1. pending 락 선점 (upsert)
    const { error: lockError } = await supabase
      .from('asset_cache')
      .upsert(
        {
          type,
          entity_id: entityId,
          storage_path: getStoragePath(type, entityId, 'md'),
          source_url: sourceUrl,
          status: 'pending',
          checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'type,entity_id' }
      );

    if (lockError) {
      console.log(`[4590] 락 실패 (다른 요청 처리 중): ${type}/${entityId}`);
      return PLACEHOLDER_URLS[type];
    }

    // 2. API-Sports에서 이미지 다운로드
    console.log(`[4590] 다운로드 중: ${sourceUrl}`);
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const bucket = BUCKET_MAP[type];
    console.log(`[4590] 다운로드 완료: ${(imageBuffer.byteLength / 1024).toFixed(1)}KB`);

    // 3. sharp로 3사이즈 WebP 변환 및 업로드
    const sizeConfig = type === 'venue_photo' ? VENUE_SIZE_CONFIG : SIZE_CONFIG;

    for (const s of ALL_SIZES) {
      const maxDim = sizeConfig[s];
      const webpBuffer = await sharp(Buffer.from(imageBuffer))
        .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const storagePath = getStoragePath(type, entityId, s);
      console.log(`[4590] 업로드 중: ${bucket}/${storagePath} (${(webpBuffer.byteLength / 1024).toFixed(1)}KB)`);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, webpBuffer, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed for ${s}: ${uploadError.message}`);
      }
    }

    // 4. 성공 - DB 업데이트
    await supabase
      .from('asset_cache')
      .update({
        status: 'ready',
        error_message: null,
        checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('type', type)
      .eq('entity_id', entityId);

    console.log(`[4590] ✅ 캐싱 완료: ${type}/${entityId} (3사이즈 WebP)`);
    return getStoragePublicUrl(type, entityId, size);

  } catch (error) {
    // 실패 - error 상태로 업데이트
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('asset_cache')
      .update({
        status: 'error',
        error_message: errorMessage,
        checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('type', type)
      .eq('entity_id', entityId);

    console.error(`[cacheAsset] Failed for ${type}/${entityId}:`, errorMessage);
    return PLACEHOLDER_URLS[type];
  }
}

/**
 * 배치로 여러 에셋 캐시 확인 및 URL 맵 반환
 *
 * 성능 최적화:
 * - 한 번의 DB 조회로 모든 캐시 확인
 * - 없는 것들만 병렬로 캐싱 시도
 */
export async function ensureAssetsCached(
  type: AssetType,
  entityIds: number[],
  size: ImageSize = 'md'
): Promise<Record<number, string>> {
  const uniqueIds = [...new Set(entityIds.filter(id => id && id > 0))];

  if (uniqueIds.length === 0) {
    return {};
  }

  const result: Record<number, string> = {};
  const supabase = getSupabaseAdmin();

  try {
    // 1. 한 번에 모든 캐시 조회
    const { data: caches } = await supabase
      .from('asset_cache')
      .select('entity_id, status, checked_at')
      .eq('type', type)
      .in('entity_id', uniqueIds);

    const cacheMap = new Map<number, AssetCacheRow>();
    (caches || []).forEach((c: AssetCacheRow) => {
      cacheMap.set(c.entity_id, c);
    });

    // 2. ready인 것들은 바로 URL 생성
    const needsCaching: number[] = [];

    for (const id of uniqueIds) {
      const cache = cacheMap.get(id);

      if (cache?.status === 'ready') {
        result[id] = getStoragePublicUrl(type, id, size);
      } else if (cache?.status === 'error') {
        // 에러 쿨다운 체크
        const elapsed = Date.now() - new Date(cache.checked_at).getTime();
        if (elapsed < ERROR_COOLDOWN) {
          result[id] = PLACEHOLDER_URLS[type];
        } else {
          needsCaching.push(id);
        }
      } else {
        needsCaching.push(id);
      }
    }

    // 3. 캐싱이 필요한 것들 병렬 처리 (최대 5개씩)
    if (needsCaching.length > 0) {
      const BATCH_SIZE = 5;

      for (let i = 0; i < needsCaching.length; i += BATCH_SIZE) {
        const batch = needsCaching.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.allSettled(
          batch.map(id => ensureAssetCached(type, id, size))
        );

        batchResults.forEach((res, idx) => {
          const id = batch[idx];
          if (res.status === 'fulfilled') {
            result[id] = res.value;
          } else {
            result[id] = PLACEHOLDER_URLS[type];
          }
        });
      }
    }

    return result;

  } catch (error) {
    console.error(`[ensureAssetsCached] Error for ${type}:`, error);

    // 전체 실패 시 placeholder로 채움
    for (const id of uniqueIds) {
      result[id] = PLACEHOLDER_URLS[type];
    }
    return result;
  }
}

/**
 * TTL 체크 및 백그라운드 갱신 (선택적)
 * - stale-while-revalidate 패턴
 * - 응답은 캐시로 즉시, 갱신은 백그라운드
 */
export async function checkAndRefreshIfStale(
  type: AssetType,
  entityId: number
): Promise<void> {
  // 커스텀 에셋은 재다운로드 스킵
  if (CUSTOM_ASSETS.has(`${type}:${entityId}`)) {
    return;
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: cache } = await supabase
      .from('asset_cache')
      .select('checked_at')
      .eq('type', type)
      .eq('entity_id', entityId)
      .maybeSingle();

    if (!cache) return;

    const elapsed = Date.now() - new Date(cache.checked_at).getTime();
    const ttl = TTL_MAP[type];

    if (elapsed > ttl) {
      // 백그라운드에서 갱신 시도 (fire-and-forget)
      cacheAsset(type, entityId).catch(() => {});
    }
  } catch {
    // 무시
  }
}
