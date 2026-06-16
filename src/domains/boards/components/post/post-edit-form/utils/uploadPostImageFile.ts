'use client';

import { getSupabaseBrowser } from '@/shared/lib/supabase';

const WEBP_QUALITY = 0.85;
const CONVERT_TIMEOUT_MS = 10_000;
const UPLOAD_TIMEOUT_MS = 30_000;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_SYNC_CONVERT_SIZE_BYTES = 4 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    Promise.resolve(promise)
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timer));
  });
}

async function convertToWebP(file: File): Promise<File> {
  if (file.type === 'image/webp' || file.type === 'image/gif') return file;

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const done = (result: File) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    const timer = window.setTimeout(() => done(file), CONVERT_TIMEOUT_MS);
    const img = new window.Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          window.clearTimeout(timer);
          done(file);
          return;
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            window.clearTimeout(timer);

            if (!blob || blob.size >= file.size) {
              done(file);
              return;
            }

            const baseName = file.name.replace(/\.[^.]+$/, '');
            done(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
          },
          'image/webp',
          WEBP_QUALITY
        );
      } catch {
        window.clearTimeout(timer);
        done(file);
      }
    };

    img.onerror = () => {
      window.clearTimeout(timer);
      done(file);
    };
    img.src = objectUrl;
  });
}

export async function uploadPostImageFile(file: File): Promise<{ publicUrl: string; altText: string }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }

  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('avif, png, jpg, jpeg, gif, webp 이미지만 업로드할 수 있습니다. 아이폰 HEIC 사진은 사진 앱에서 호환 형식으로 저장한 뒤 업로드해주세요.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('이미지 파일은 10MB 이하만 업로드할 수 있습니다.');
  }

  const supabase = getSupabaseBrowser();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  if (sessionError || !user) {
    throw new Error('로그인 상태를 확인해주세요.');
  }

  const fileToUpload = file.size <= MAX_SYNC_CONVERT_SIZE_BYTES
    ? await convertToWebP(file)
    : file;
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const safeFileName = fileToUpload.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const fileName = `${user.id}/images/${timestamp}_${randomString}_${safeFileName}`;

  const uploadRequest = supabase.storage
    .from('post-images')
    .upload(fileName, fileToUpload, {
      cacheControl: '3600',
      upsert: true,
      contentType: fileToUpload.type,
    });
  const { error: uploadError } = await withTimeout<Awaited<typeof uploadRequest>>(
    uploadRequest,
    UPLOAD_TIMEOUT_MS,
    '이미지 업로드 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.'
  );

  if (uploadError) {
    if (uploadError.message.includes('Row Level Security')) {
      throw new Error('이미지 업로드 권한이 없습니다. 로그인 상태를 확인해주세요.');
    }

    if (uploadError.message.includes('Bucket not found')) {
      throw new Error('post-images 스토리지 버킷이 없습니다.');
    }

    throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('post-images')
    .getPublicUrl(fileName);

  if (!urlData.publicUrl) {
    throw new Error('업로드된 이미지 URL을 가져오지 못했습니다.');
  }

  return {
    publicUrl: urlData.publicUrl,
    altText: file.name,
  };
}
