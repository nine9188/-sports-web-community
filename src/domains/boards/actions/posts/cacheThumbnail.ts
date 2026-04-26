'use server';

import sharp from 'sharp';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

const CDN_BASE = 'https://cdn.4590football.com';
const BUCKET = 'post-images';

function isAlreadyCached(url: string): boolean {
  return url.includes('cdn.4590football.com') || url.includes('supabase.co');
}

/**
 * 외부 썸네일 URL을 Supabase Storage에 WebP로 캐싱 후 CDN URL로 업데이트
 * fire-and-forget으로 호출 — 실패해도 게시글에 영향 없음
 */
export async function cacheThumbnailToStorage(
  externalUrl: string,
  postId: string
): Promise<void> {
  if (!externalUrl || !postId) return;
  if (isAlreadyCached(externalUrl)) return;

  const storagePath = `thumbnails/${postId}.webp`;
  const cdnUrl = `${CDN_BASE}/${BUCKET}/${storagePath}`;

  try {
    const response = await fetch(externalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return;

    const buffer = await response.arrayBuffer();

    const webpBuffer = await sharp(Buffer.from(buffer))
      .resize(600, 400, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const supabase = getSupabaseAdmin();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      });

    if (uploadError) {
      console.error('[cacheThumbnail] 업로드 실패:', uploadError.message);
      return;
    }

    await supabase
      .from('posts')
      .update({ thumbnail_url: cdnUrl })
      .eq('id', postId);

  } catch (err) {
    console.error('[cacheThumbnail] 실패 (무시됨):', err);
  }
}
