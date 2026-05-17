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
  ERROR_COOLDOWN,
  PENDING_WAIT_TIME,
  SIZE_CONFIG,
  VENUE_SIZE_CONFIG,
} from './constants';

/**
 * Asset 캐시 시스템
 *
 * 핵심 전략: unstable_cache(Vercel Data Cache)로 DB 쿼리 최소화
 * - 타입별 ready ID Set을 1시간마다 DB에서 1회 조회 → 캐싱
 * - 나머지 요청은 캐시 히트 → DB 0회, KV 0회
 * - KV는 hot path에서 완전히 제거 (무료 한도 보호)
 *
 * 호출 비용:
 * - Cloudflare KV: 0회/일
 * - Supabase DB: ~120회/일 (5타입 × 24시간)
 * - API-Sports: 새 이미지 캐싱 시만
 */

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
const SOURCE_FETCH_TIMEOUT_MS = 4500;
const MAX_SOURCE_IMAGE_BYTES = 5 * 1024 * 1024;

class ExpectedAssetCacheMissError extends Error {}

function isSupportedImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  const startsWith = (...bytes: number[]) => bytes.every((byte, index) => buffer[index] === byte);
  const textPrefix = buffer.subarray(0, 128).toString('utf8').trimStart().toLowerCase();

  return (
    startsWith(0x89, 0x50, 0x4e, 0x47) ||
    startsWith(0xff, 0xd8, 0xff) ||
    startsWith(0x47, 0x49, 0x46, 0x38) ||
    startsWith(0x52, 0x49, 0x46, 0x46) ||
    textPrefix.startsWith('<svg')
  );
}

function getStoragePublicUrl(type: AssetType, entityId: number, size: ImageSize = 'md'): string {
  const bucket = BUCKET_MAP[type];
  const ext = EXTENSION_MAP[type];
  return `${SUPABASE_STORAGE_URL}/${bucket}/${size}/${entityId}.${ext}`;
}

function getApiSportsUrl(type: AssetType, entityId: number): string {
  const path = API_PATH_MAP[type];
  return `${API_SPORTS_BASE_URL}/${path}/${entityId}.png`;
}

function getStoragePath(type: AssetType, entityId: number, size: ImageSize): string {
  const ext = EXTENSION_MAP[type];
  return `${size}/${entityId}.${ext}`;
}

/**
 * 타입별 ready ID Set (unstable_cache 1시간)
 *
 * DB에서 ready 상태인 entity_id만 조회 → Set으로 캐싱
 * Vercel Data Cache에 저장되어 서버 재시작해도 유지됨
 * 1시간마다 자동 갱신 (revalidate: 3600)
 *
 * 비용: 5타입 × 24시간 = 120 DB 쿼리/일
 */
const _getReadyAssetIdsImpl = (type: AssetType) => unstable_cache(
  async (): Promise<number[]> => {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('asset_cache')
        .select('entity_id')
        .eq('type', type)
        .eq('status', 'ready');
      return (data || []).map((r: { entity_id: number }) => r.entity_id);
    } catch {
      return [];
    }
  },
  ['asset-ready-ids-db', type],
  { revalidate: 3600, tags: ['asset-cache', `asset-cache-${type}`] }
)();

async function getReadyAssetIdSet(type: AssetType): Promise<Set<number>> {
  const ids = await _getReadyAssetIdsImpl(type);
  return new Set(ids);
}

/**
 * 단일 에셋 캐시 확인 및 URL 반환
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
    // 0. Fast path: unstable_cache에서 ready Set 확인 (DB/KV 호출 0회)
    const readySet = await getReadyAssetIdSet(type);
    if (readySet.has(entityId)) {
      return getStoragePublicUrl(type, entityId, size);
    }

    const supabase = getSupabaseAdmin();

    // 1. Set에 없는 ID만 DB 개별 조회 (신규/error/pending)
    const { data: cache } = await supabase
      .from('asset_cache')
      .select('*')
      .eq('type', type)
      .eq('entity_id', entityId)
      .maybeSingle();

    const cacheRow = cache as AssetCacheRow | null;

    // 2. ready 상태면 URL 반환 (캐시 갱신 전 업로드된 것)
    if (cacheRow?.status === 'ready') {
      return getStoragePublicUrl(type, entityId, size);
    }

    // 3. pending 상태 — stale 체크 (60초 이상 = 죽은 작업)
    if (cacheRow?.status === 'pending') {
      const pendingElapsed = Date.now() - new Date(cacheRow.checked_at).getTime();
      const STALE_PENDING_MS = 60 * 1000;

      if (pendingElapsed < STALE_PENDING_MS) {
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

        return PLACEHOLDER_URLS[type];
      }
      // 60초 이상 stale pending → 아래에서 재시도
    }

    // 4. error 상태 - 쿨다운 (24시간)
    if (cacheRow?.status === 'error') {
      const elapsed = Date.now() - new Date(cacheRow.checked_at).getTime();
      if (elapsed < ERROR_COOLDOWN) {
        return PLACEHOLDER_URLS[type];
      }
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
 */
async function cacheAsset(type: AssetType, entityId: number, size: ImageSize = 'md'): Promise<string> {
  const supabase = getSupabaseAdmin();
  const sourceUrl = getApiSportsUrl(type, entityId);

  try {
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

    const response = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(SOURCE_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new ExpectedAssetCacheMissError(`Download failed: ${response.status}`);
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (contentType && !contentType.startsWith('image/')) {
      throw new ExpectedAssetCacheMissError(`Unsupported source content-type: ${contentType}`);
    }

    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (contentLength > MAX_SOURCE_IMAGE_BYTES) {
      throw new ExpectedAssetCacheMissError(`Source image too large: ${contentLength} bytes`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    if (imageBuffer.length > MAX_SOURCE_IMAGE_BYTES) {
      throw new ExpectedAssetCacheMissError(`Source image too large: ${imageBuffer.length} bytes`);
    }
    if (!isSupportedImageBuffer(imageBuffer)) {
      throw new ExpectedAssetCacheMissError('Unsupported source image format');
    }

    const bucket = BUCKET_MAP[type];
    const sizeConfig = type === 'venue_photo' ? VENUE_SIZE_CONFIG : SIZE_CONFIG;

    for (const s of ALL_SIZES) {
      const maxDim = sizeConfig[s];
      const webpBuffer = await sharp(imageBuffer)
        .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const storagePath = getStoragePath(type, entityId, s);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, webpBuffer, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000',
        });

      if (uploadError) {
        throw new Error(`Upload failed for ${s}: ${uploadError.message}`);
      }
    }

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

    return getStoragePublicUrl(type, entityId, size);

  } catch (error) {
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

    if (error instanceof ExpectedAssetCacheMissError || errorMessage.includes('The operation was aborted')) {
      console.warn(`[cacheAsset] Skipped ${type}/${entityId}:`, errorMessage);
    } else {
      console.error(`[cacheAsset] Failed for ${type}/${entityId}:`, errorMessage);
    }
    return PLACEHOLDER_URLS[type];
  }
}

/**
 * 배치로 여러 에셋 캐시 확인 및 URL 맵 반환
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
    // 1. Fast path: unstable_cache에서 ready Set (DB/KV 호출 0회)
    const readySet = await getReadyAssetIdSet(type);
    const unknownIds: number[] = [];

    for (const id of uniqueIds) {
      if (readySet.has(id)) {
        result[id] = getStoragePublicUrl(type, id, size);
      } else {
        unknownIds.push(id);
      }
    }

    if (unknownIds.length === 0) {
      return result;
    }

    const supabase = getSupabaseAdmin();

    // 2. Set에 없는 것만 DB 배치 조회 (신규/error만 해당)
    const { data: caches } = await supabase
      .from('asset_cache')
      .select('entity_id, status, checked_at')
      .eq('type', type)
      .in('entity_id', unknownIds);

    const cacheMap = new Map<number, AssetCacheRow>();
    (caches || []).forEach((c: AssetCacheRow) => {
      cacheMap.set(c.entity_id, c);
    });

    const needsCaching: number[] = [];

    for (const id of unknownIds) {
      const cache = cacheMap.get(id);

      if (cache?.status === 'ready') {
        result[id] = getStoragePublicUrl(type, id, size);
      } else if (cache?.status === 'error') {
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

    // 3. 캐싱 필요한 것만 병렬 처리
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

    for (const id of uniqueIds) {
      result[id] = PLACEHOLDER_URLS[type];
    }
    return result;
  }
}

/**
 * 에셋 강제 재다운로드 (관리자용)
 */
export async function forceRefreshAsset(
  type: AssetType,
  entityId: number,
  size: ImageSize = 'md'
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    await supabase
      .from('asset_cache')
      .delete()
      .eq('type', type)
      .eq('entity_id', entityId);

    // unstable_cache 무효화 (삭제된 ID가 Set에서 빠지도록)
    revalidateTag(`asset-cache-${type}`, 'default');

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
