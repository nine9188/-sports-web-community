'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  normalizeDisplayImageUrl,
  shouldUnoptimizeImageUrl,
} from '@/shared/images/urls';
const MAX_RETRIES = 1;
const FALLBACK_LIGHT = '/logo/4590_logo_02-01.jpg';
const FALLBACK_DARK = '/logo/4590_logo_02-02.jpg';

/** 외부 이미지 URL을 Cloudflare CDN 프록시 경유 URL로 변환 */
function toProxyUrl(url: string): string {
  return normalizeDisplayImageUrl(url, {
    fallback: FALLBACK_LIGHT,
    proxyExternal: true,
  });
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

  const rawUrl = hasValidUrl ? toProxyUrl(imageUrl!) : FALLBACK_LIGHT;
  const finalImageUrl = useFallback
    ? FALLBACK_LIGHT
    : retryCount > 0
      ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}_r=${retryCount}`
      : rawUrl;

  const shouldUnoptimize = useFallback
    ? false
    : shouldUnoptimizeImageUrl(finalImageUrl);

  const handleError = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
    } else {
      setFailed(true);
    }
  };

  return (
    <>
      {useFallback ? (
        <>
          <Image
            src={FALLBACK_LIGHT}
            alt={alt}
            fill
            className="object-cover transition-all dark:hidden"
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
          <Image
            src={FALLBACK_DARK}
            alt={alt}
            fill
            className="object-cover transition-all hidden dark:block"
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
        </>
      ) : (
        <Image
          key={finalImageUrl}
          src={finalImageUrl}
          alt={alt}
          fill
          unoptimized={shouldUnoptimize}
          className="object-cover transition-all"
          sizes={sizes}
          priority={priority}
          onError={handleError}
          data-nosnippet="true"
          data-pinterest-nopin="true"
          loading={priority ? undefined : "lazy"}
        />
      )}

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/25 transition-all pointer-events-none" />
    </>
  );
}
