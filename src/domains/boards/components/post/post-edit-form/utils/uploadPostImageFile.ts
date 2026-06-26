'use client';

import { getSupabaseBrowser } from '@/shared/lib/supabase';

const WEBP_QUALITY = 0.85;
const CONVERT_TIMEOUT_MS = 10_000;
const SESSION_TIMEOUT_MS = 10_000;
const UPLOAD_TIMEOUT_MS = 30_000;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_SYNC_CONVERT_SIZE_BYTES = 4 * 1024 * 1024;

const IMAGE_DEBUG = false;

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]);

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  'avif',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
]);

function logImageDebug(message: string, data?: unknown) {
  if (!IMAGE_DEBUG) return;
  console.log(`[IMAGE_DEBUG] ${message}`, data ?? '');
}

function logImageError(message: string, error?: unknown) {
  console.error(`[IMAGE_ERROR] ${message}`, error ?? '');
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      logImageError('timeout', { timeoutMs, message });
      reject(new Error(message));
    }, timeoutMs);

    Promise.resolve(promise)
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timer));
  });
}

function convertWithWorker(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      self.onmessage = async function(e) {
        const { file, quality } = e.data;
        try {
          const bitmap = await createImageBitmap(file);
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context is null');
          }
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
          const blob = await canvas.convertToBlob({
            type: 'image/webp',
            quality: quality
          });
          self.postMessage({ success: true, blob });
        } catch (err) {
          self.postMessage({ success: false, error: err.message || String(err) });
        }
      };
    `;

    let settled = false;
    const blobUrl = URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' }));
    const worker = new Worker(blobUrl);

    const done = (result: File) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      resolve(result);
    };

    const timer = window.setTimeout(() => {
      logImageDebug('Worker convert timeout: using original file');
      done(file);
    }, CONVERT_TIMEOUT_MS);

    worker.onmessage = (e) => {
      window.clearTimeout(timer);
      const { success, blob, error } = e.data;
      if (success && blob) {
        if (blob.size >= file.size) {
          logImageDebug('Worker webp bigger than original: using original file', {
            originalSize: file.size,
            webpSize: blob.size,
          });
          done(file);
        } else {
          const baseName = file.name.replace(/\.[^.]+$/, '');
          done(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
        }
      } else {
        logImageError('Worker conversion error, falling back', error);
        reject(new Error(error || 'Worker compression failed'));
      }
    };

    worker.onerror = (err) => {
      window.clearTimeout(timer);
      logImageError('Worker error, falling back', err);
      reject(err);
    };

    worker.postMessage({ file, quality: WEBP_QUALITY });
  });
}

function convertWithMainThreadCanvas(file: File): Promise<File> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const done = (result: File) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);

      logImageDebug('Main-thread convert result', {
        originalName: file.name,
        originalType: file.type,
        originalSize: file.size,
        resultName: result.name,
        resultType: result.type,
        resultSize: result.size,
        converted: result !== file,
      });

      resolve(result);
    };

    const timer = window.setTimeout(() => {
      logImageDebug('Main-thread convert timeout: using original file');
      done(file);
    }, CONVERT_TIMEOUT_MS);

    const img = new window.Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        logImageDebug('Main-thread image loaded for convert', {
          width: img.naturalWidth,
          height: img.naturalHeight,
        });

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          window.clearTimeout(timer);
          logImageDebug('Main-thread canvas context missing: using original file');
          done(file);
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            window.clearTimeout(timer);

            if (!blob) {
              logImageDebug('Main-thread toBlob failed: using original file');
              done(file);
              return;
            }

            if (blob.size >= file.size) {
              logImageDebug('Main-thread webp bigger than original: using original file', {
                originalSize: file.size,
                webpSize: blob.size,
              });
              done(file);
              return;
            }

            const baseName = file.name.replace(/\.[^.]+$/, '');
            done(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
          },
          'image/webp',
          WEBP_QUALITY
        );
      } catch (error) {
        window.clearTimeout(timer);
        logImageError('Main-thread convert exception: using original file', error);
        done(file);
      }
    };

    img.onerror = () => {
      window.clearTimeout(timer);
      logImageError('Main-thread image load failed for convert: using original file', {
        name: file.name,
        type: file.type,
      });
      done(file);
    };

    img.src = objectUrl;
  });
}

async function convertToWebP(file: File): Promise<File> {
  logImageDebug('convert check', {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  if (file.type === 'image/webp' || file.type === 'image/gif') {
    logImageDebug('convert skipped: already webp or gif');
    return file;
  }

  // 1. OffscreenCanvas + Web Worker (UI 비선점 백그라운드 처리)
  if (
    typeof window !== 'undefined' &&
    'Worker' in window &&
    'OffscreenCanvas' in window &&
    'createImageBitmap' in window
  ) {
    try {
      logImageDebug('Attempting conversion via Web Worker');
      return await convertWithWorker(file);
    } catch (workerErr) {
      logImageError('Web Worker conversion failed, falling back to main thread', workerErr);
    }
  }

  // 2. 메인 스레드 Canvas (구형 브라우저 등 지원 안 하는 환경에서의 Fallback)
  logImageDebug('Using main-thread Canvas fallback');
  return convertWithMainThreadCanvas(file);
}

type UploadPostImageFileOptions = {
  userId?: string | null;
};

export async function uploadPostImageFile(
  file: File,
  options: UploadPostImageFileOptions = {}
): Promise<{ publicUrl: string; altText: string }> {
  try {
    logImageDebug('upload start', {
      env: process.env.NODE_ENV,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
    });

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const hasSupportedExtension = SUPPORTED_IMAGE_EXTENSIONS.has(extension);

    logImageDebug('file validation', {
      extension,
      hasSupportedExtension,
      mimeType: file.type,
      mimeStartsWithImage: file.type.startsWith('image/'),
    });

    if (!file.type.startsWith('image/') && !hasSupportedExtension) {
      throw new Error('이미지 파일만 업로드할 수 있습니다.');
    }

    const isSupportedImage =
      SUPPORTED_IMAGE_TYPES.has(file.type) ||
      (!file.type && hasSupportedExtension) ||
      (file.type.startsWith('image/') && hasSupportedExtension);

    if (!isSupportedImage) {
      throw new Error(
        'avif, png, jpg, jpeg, gif, webp 이미지만 업로드할 수 있습니다. 아이폰 HEIC 사진은 사진 앱에서 호환 형식으로 저장한 뒤 업로드해주세요.'
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('이미지 파일은 10MB 이하만 업로드할 수 있습니다.');
    }

    const supabase = getSupabaseBrowser();

    let userId = options.userId ?? null;

    if (!userId) {
      logImageDebug('user check start');

      const userRequest = supabase.auth.getUser();

      const { data: userData, error: userError } = await withTimeout<
        Awaited<typeof userRequest>
      >(
        userRequest,
        SESSION_TIMEOUT_MS,
        '로그인 사용자 확인 시간이 초과되었습니다. 새로고침 후 다시 시도해주세요.'
      );

      const user = userData.user;

      logImageDebug('user check result', {
        hasUser: !!user,
        userId: user?.id,
        userError,
      });

      if (userError || !user) {
        throw new Error('로그인 상태를 확인해주세요.');
      }

      userId = user.id;
    }

    const fileToUpload =
      file.size <= MAX_SYNC_CONVERT_SIZE_BYTES
        ? await convertToWebP(file)
        : file;

    logImageDebug('file selected for upload', {
      originalName: file.name,
      originalType: file.type,
      originalSize: file.size,
      uploadName: fileToUpload.name,
      uploadType: fileToUpload.type,
      uploadSize: fileToUpload.size,
    });

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeFileName = fileToUpload.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${userId}/images/${timestamp}_${randomString}_${safeFileName}`;

    logImageDebug('supabase upload start', {
      bucket: 'post-images',
      path: fileName,
      contentType: fileToUpload.type,
      size: fileToUpload.size,
    });

    const uploadRequest = supabase.storage
      .from('post-images')
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileToUpload.type || undefined,
      });

    const { data: uploadData, error: uploadError } = await withTimeout<
      Awaited<typeof uploadRequest>
    >(
      uploadRequest,
      UPLOAD_TIMEOUT_MS,
      '이미지 업로드 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.'
    );

    logImageDebug('supabase upload result', {
      uploadData,
      uploadError,
    });

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

    logImageDebug('public url result', {
      publicUrl: urlData.publicUrl,
    });

    if (!urlData.publicUrl) {
      throw new Error('업로드된 이미지 URL을 가져오지 못했습니다.');
    }

    logImageDebug('upload success', {
      publicUrl: urlData.publicUrl,
      altText: file.name,
    });

    return {
      publicUrl: urlData.publicUrl,
      altText: file.name,
    };
  } catch (error) {
    logImageError('upload failed', error);
    throw error;
  }
}
