/**
 * 외부 이미지를 Supabase Storage에 복사
 *
 * 인기글, 대표 이미지 등 중요한 이미지만 복사
 */

'use server';

import { createClient } from '@/shared/api/supabaseServer';

/**
 * 외부 이미지를 Supabase Storage에 복사
 *
 * @param externalUrl - 외부 이미지 URL
 * @param folder - 저장할 폴더 (예: 'popular-posts', 'featured-images')
 * @returns Supabase Storage URL 또는 null
 */
export async function copyImageToStorage(
  externalUrl: string,
  folder: string = 'cached-images'
): Promise<string | null> {
  try {
    // URL 검증
    const url = new URL(externalUrl);
    if (url.protocol !== 'https:') {
      console.error('Only HTTPS URLs are allowed');
      return null;
    }

    // 이미지 다운로드
    const response = await fetch(externalUrl);
    if (!response.ok) {
      console.error('Failed to fetch image:', response.status);
      return null;
    }

    // Content-Type 확인
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      console.error('URL is not an image');
      return null;
    }

    // 파일 확장자 추출
    const ext = contentType.split('/')[1] || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    // Supabase에 업로드
    const supabase = await createClient();
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from('post-images') // 버킷 이름
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '31536000', // 1년 캐시
      });

    if (error) {
      console.error('Failed to upload to Supabase:', error);
      return null;
    }

    // Public URL 반환
    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error copying image to storage:', error);
    return null;
  }
}

/**
 * 게시글이 인기글이 되었을 때 이미지 복사
 *
 * @param postContent - 게시글 콘텐츠 (TipTap JSON 또는 HTML)
 * @returns 복사된 이미지 URL 매핑
 */
export async function cachePopularPostImages(
  postContent: string
): Promise<Record<string, string>> {
  const imageMapping: Record<string, string> = {};

  try {
    // TipTap JSON에서 이미지 URL 추출
    if (postContent.startsWith('{')) {
      const content = JSON.parse(postContent);
      if (content?.type === 'doc' && Array.isArray(content.content)) {
        const images = extractImagesFromTipTap(content.content);

        // 외부 이미지만 복사
        for (const imageUrl of images) {
          if (isExternalImage(imageUrl)) {
            const cachedUrl = await copyImageToStorage(imageUrl, 'popular-posts');
            if (cachedUrl) {
              imageMapping[imageUrl] = cachedUrl;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error caching popular post images:', error);
  }

  return imageMapping;
}

/**
 * TipTap JSON에서 이미지 URL 추출
 */
function extractImagesFromTipTap(nodes: any[]): string[] {
  const images: string[] = [];

  for (const node of nodes) {
    if (node.type === 'image' && node.attrs?.src) {
      images.push(node.attrs.src);
    }
    if (Array.isArray(node.content)) {
      images.push(...extractImagesFromTipTap(node.content));
    }
  }

  return images;
}

/**
 * 외부 이미지 URL인지 확인
 */
function isExternalImage(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    return !hostname.includes('supabase.co') && !hostname.includes('api-sports.io');
  } catch {
    return false;
  }
}
