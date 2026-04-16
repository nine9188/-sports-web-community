'use server';

import sharp from 'sharp';
import { unstable_cache, revalidateTag } from 'next/cache';
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

/**
 * 타입별 ready 상태 asset_cache entity_id 목록을 캐싱 (24시간)
 *
 * 하루 85만 회의 asset_cache SELECT를 타입당 1회/24h로 감소.
 * - Set 크기: 타입당 ~30KB (전체 ~155KB)
 * - 새 이미지 업로드 시 cacheAsset이 revalidateTag('asset-cache') 호출 → 즉시 무효화
 * - error/pending 상태는 Set에 없음 → 기존 DB 로직으로 fallback
 */
const _getReadyAssetIdSetImpl = (type: AssetType) => unstable_cache(
  async (): Promise<number[]> => {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('asset_cache')
      .select('entity_id')
      .eq('type', type)
      .eq('status', 'ready');
    return (data || []).map(r => r.entity_id as number);
  },
  ['asset-cache-ready', type],
  { revalidate: 86400, tags: ['asset-cache', `asset-cache-${type}`] }
)();

async function getReadyAssetIdSet(type: AssetType): Promise<Set<number>> {
  const ids = await _getReadyAssetIdSetImpl(type);
  return new Set(ids);
}

interface AssetCacheRow {
  id: string;
  type: string;
  entity_id: number;
  storage_path: string;
  status: 'ready' | 'pending' | 'error';
  checked_at: string;
  error_message?: string;
}

const ALL_SIZES: ImageSize[] = ['sm', 'md'];

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
    // 0. Fast path: unstable_cache에 ready로 등록된 ID면 DB 스킵
    const readySet = await getReadyAssetIdSet(type);
    if (readySet.has(entityId)) {
      return getStoragePublicUrl(type, entityId, size);
    }

    const supabase = getSupabaseAdmin();

    // 1. 캐시 조회 (readySet에 없는 ID만 도달: 신규/error/pending)
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

    // 3. pending 상태 — stale 락 체크 (60초 이상 pending = 죽은 작업으로 간주)
    if (cacheRow?.status === 'pending') {
      const pendingElapsed = Date.now() - new Date(cacheRow.checked_at).getTime();
      const STALE_PENDING_MS = 60 * 1000; // 60초

      if (pendingElapsed < STALE_PENDING_MS) {
        // 다른 인스턴스가 처리 중 → 짧은 대기 후 재확인
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

        // 여전히 pending → placeholder 반환 (재업로드 시도 안 함)
        return PLACEHOLDER_URLS[type];
      }
      // 60초 이상 pending = stale → 아래 cacheAsset로 재시도
    }

    // 4. error 상태 - 쿨다운 체크 (24시간)
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
 * 3. sharp로 2사이즈 WebP 변환 및 업로드
 * 4. DB 업데이트
 */
async function cacheAsset(type: AssetType, entityId: number, size: ImageSize = 'md'): Promise<string> {
  const supabase = getSupabaseAdmin();
  const sourceUrl = getApiSportsUrl(type, entityId);

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
      return PLACEHOLDER_URLS[type];
    }

    // 2. API-Sports에서 이미지 다운로드
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

    // 3. sharp로 2사이즈 WebP 변환 및 업로드
    const sizeConfig = type === 'venue_photo' ? VENUE_SIZE_CONFIG : SIZE_CONFIG;

    for (const s of ALL_SIZES) {
      const maxDim = sizeConfig[s];
      const webpBuffer = await sharp(Buffer.from(imageBuffer))
        .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const storagePath = getStoragePath(type, entityId, s);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, webpBuffer, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000', // 1년 캐시 (팀/리그 로고는 거의 변하지 않음)
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

    // 5. readySet 캐시 무효화 (새로 ready된 ID 즉시 반영)
    revalidateTag(`asset-cache-${type}`);

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

  try {
    // 1. Fast path: unstable_cache의 ready Set으로 DB 조회 없이 분류
    const readySet = await getReadyAssetIdSet(type);
    const unknownIds: number[] = [];

    for (const id of uniqueIds) {
      if (readySet.has(id)) {
        result[id] = getStoragePublicUrl(type, id, size);
      } else {
        unknownIds.push(id);
      }
    }

    // 모든 ID가 ready면 DB 조회 완전 스킵
    if (unknownIds.length === 0) {
      return result;
    }

    const supabase = getSupabaseAdmin();

    // 2. readySet에 없는 것들만 DB 조회 (신규/error/pending)
    const { data: caches } = await supabase
      .from('asset_cache')
      .select('entity_id, status, checked_at')
      .eq('type', type)
      .in('entity_id', unknownIds);

    const cacheMap = new Map<number, AssetCacheRow>();
    (caches || []).forEach((c: AssetCacheRow) => {
      cacheMap.set(c.entity_id, c);
    });

    // 3. 상태별 분기
    const needsCaching: number[] = [];

    for (const id of unknownIds) {
      const cache = cacheMap.get(id);

      if (cache?.status === 'ready') {
        // readySet 캐시가 아직 갱신 전인 경우 (업로드 직후)
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

/**
 * 에셋 강제 재다운로드 (관리자용)
 *
 * 기존 캐시를 삭제하고 ensureAssetCached를 호출하면
 * "레코드 없음" 경로를 타서 새로 다운로드됩니다.
 */
export async function forceRefreshAsset(
  type: AssetType,
  entityId: number,
  size: ImageSize = 'md'
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // 기존 캐시 삭제
    await supabase
      .from('asset_cache')
      .delete()
      .eq('type', type)
      .eq('entity_id', entityId);

    // readySet 캐시 무효화 (삭제된 ID가 Set에서 빠지도록)
    revalidateTag(`asset-cache-${type}`);

    // 새로 다운로드 (ensureAssetCached가 "레코드 없음" → cacheAsset 실행)
    const url = await ensureAssetCached(type, entityId, size);
    const isPlaceholder = url.startsWith('/images/placeholder');

    return {
      success: !isPlaceholder,
      url,
      error: isPlaceholder ? '이미지 다운로드 실패' : undefined,
    };
  } catch (error) {
    return {
      success: false,
      url: PLACEHOLDER_URLS[type],
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}
