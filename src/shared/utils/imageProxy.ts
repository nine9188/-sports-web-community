/**
 * 이미지 프록시 유틸
 *
 * 외부 이미지 URL을 프록시 URL로 변환
 */

import { siteConfig } from '@/shared/config';

const SUPABASE_STORAGE_DOMAIN = 'vnjjfhsuzoxcljqqwwvx.supabase.co';
const API_SPORTS_DOMAIN = 'media.api-sports.io';

/**
 * 외부 이미지 URL인지 확인
 */
function isExternalImage(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // 내부 도메인 (프록시 불필요)
    if (
      hostname.includes(SUPABASE_STORAGE_DOMAIN) ||
      hostname.includes(API_SPORTS_DOMAIN) ||
      url.startsWith('/') // 상대 경로
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 이미지 URL을 프록시 URL로 변환
 *
 * @param url - 원본 이미지 URL
 * @returns 프록시 URL 또는 원본 URL
 */
export function getProxiedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // 외부 이미지가 아니면 그대로 반환
  if (!isExternalImage(url)) {
    return url;
  }

  // 프록시 URL로 변환
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

/**
 * 여러 이미지 URL을 프록시 URL로 변환
 */
export function getProxiedImageUrls(urls: (string | null | undefined)[]): (string | null)[] {
  return urls.map(getProxiedImageUrl);
}

/**
 * Next.js Image 컴포넌트용 props 생성
 *
 * @example
 * <Image {...getImageProps(imageUrl)} alt="..." />
 */
export function getImageProps(url: string | null | undefined) {
  const proxiedUrl = getProxiedImageUrl(url);

  if (!proxiedUrl) {
    return {
      src: siteConfig.logo, // 기본 이미지
      unoptimized: false,
    };
  }

  // 외부 이미지 (프록시 사용)
  if (isExternalImage(url || '')) {
    return {
      src: proxiedUrl,
      unoptimized: false, // 프록시 거치면 최적화 가능
    };
  }

  // 내부 이미지
  return {
    src: proxiedUrl,
    unoptimized: false,
  };
}
