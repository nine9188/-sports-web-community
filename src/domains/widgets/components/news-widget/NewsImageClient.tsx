'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { siteConfig } from '@/shared/config';

const MAX_RETRIES = 1;
const FALLBACK_LOGO = siteConfig.icon;

/** 외부 이미지 URL을 Cloudflare CDN 프록시 경유 URL로 변환 */
function toProxyUrl(url: string): string {
  if (url.startsWith('/') || url.includes('cdn.4590football.com')) return url;
  if (url.includes('supabase.co')) return url;
  return `https://cdn.4590football.com/proxy?url=${encodeURIComponent(url)}`;
}

/** 로컬/Supabase 이외 외부 URL 여부 */
function isExternalUrl(url: string): boolean {
  if (url.startsWith('/')) return false;
  if (url.includes('supabase.co')) return false;
  return true;
}

interface NewsImageClientProps {
  imageUrl?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}

export default function NewsImageClient({
  imageUrl,
  alt,
  sizes,
  priority = false,
}: NewsImageClientProps) {
  const hasValidUrl = !!(imageUrl && typeof imageUrl === 'string' && imageUrl.trim());

  const [retryCount, setRetryCount] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setRetryCount(0);
    setFailed(false);
  }, [imageUrl]);

  const useFallback = !hasValidUrl || failed;

  const rawUrl = hasValidUrl ? toProxyUrl(imageUrl!) : FALLBACK_LOGO;
  const finalImageUrl = useFallback
    ? FALLBACK_LOGO
    : retryCount > 0
      ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}_r=${retryCount}`
      : rawUrl;

  const shouldUnoptimize = useFallback
    ? false
    : isExternalUrl(finalImageUrl) || finalImageUrl.includes('/proxy?url=');

  const handleError = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
    } else {
      setFailed(true);
    }
  };

  return (
    <>
      <Image
        key={finalImageUrl}
        src={finalImageUrl}
        alt={alt}
        fill
        unoptimized={shouldUnoptimize}
        className={useFallback
          ? "object-contain p-4 dark:invert transition-all"
          : "object-cover transition-all"
        }
        sizes={sizes}
        priority={priority}
        onError={handleError}
        data-nosnippet="true"
        data-pinterest-nopin="true"
        loading={priority ? undefined : "lazy"}
      />

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/25 transition-all pointer-events-none" />
    </>
  );
}
