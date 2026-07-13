'use client';

import { getSupabaseBrowser } from '@/shared/lib/supabase';

const MAX_VIDEO_SIZE_BYTES = 30 * 1024 * 1024;
const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

const SESSION_TIMEOUT_MS = 10_000;
const UPLOAD_TIMEOUT_MS = 60_000;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    Promise.resolve(promise)
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timer));
  });
}

type UploadPostVideoFileOptions = {
  userId?: string | null;
};

export async function uploadPostVideoFile(
  file: File,
  options: UploadPostVideoFileOptions = {}
): Promise<{ publicUrl: string; caption: string }> {
  if (!file.type.startsWith('video/')) {
    throw new Error('동영상 파일만 업로드할 수 있습니다.');
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error('동영상 파일은 30MB 이하만 업로드할 수 있습니다.');
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const fileExtension = safeFileName.split('.').pop()?.toLowerCase();

  if (!fileExtension || !ALLOWED_VIDEO_EXTENSIONS.includes(fileExtension)) {
    throw new Error('지원하지 않는 동영상 형식입니다. MP4, WebM, MOV, AVI, MKV 파일만 업로드할 수 있습니다.');
  }

  const supabase = getSupabaseBrowser();
  let userId = options.userId ?? null;

  if (!userId) {
    const sessionRequest = supabase.auth.getSession();

    const { data: sessionData, error: sessionError } = await withTimeout<
      Awaited<typeof sessionRequest>
    >(
      sessionRequest,
      SESSION_TIMEOUT_MS,
      '로그인 사용자 확인 시간이 초과되었습니다. 새로고침 후 다시 시도해주세요.'
    );

    const user = sessionData.session?.user || null;

    if (sessionError || !user) {
      throw new Error('로그인 상태를 확인해주세요.');
    }

    userId = user.id;
  }

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const fileName = `${userId}/videos/${timestamp}_${randomString}_${safeFileName}`;

  const uploadRequest = supabase.storage
    .from('post-videos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  const { error: uploadError } = await withTimeout<
    Awaited<typeof uploadRequest>
  >(
    uploadRequest,
    UPLOAD_TIMEOUT_MS,
    '동영상 업로드 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.'
  );

  if (uploadError) {
    if (uploadError.message.includes('Row Level Security') || uploadError.message.includes('row-level security')) {
      throw new Error('동영상 업로드 권한이 없습니다. 로그인 상태를 확인해주세요.');
    }

    if (uploadError.message.includes('Bucket not found')) {
      throw new Error('post-videos 스토리지 버킷이 없습니다.');
    }

    if (uploadError.message.includes('File size')) {
      throw new Error('동영상 파일이 너무 큽니다. 30MB 이하 파일을 업로드해주세요.');
    }

    throw new Error(`동영상 업로드 실패: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('post-videos')
    .getPublicUrl(fileName);

  if (!urlData.publicUrl) {
    throw new Error('업로드된 동영상 URL을 가져오지 못했습니다.');
  }

  return {
    publicUrl: urlData.publicUrl,
    caption: '',
  };
}
