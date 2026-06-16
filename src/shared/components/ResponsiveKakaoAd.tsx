'use client';

import { useEffect, useState } from 'react';
import KakaoAd from './KakaoAd';

interface ResponsiveKakaoAdProps {
  adUnit: string;
  adWidth: number;
  adHeight: number;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
}

function matchesMedia(minWidth?: number, maxWidth?: number) {
  if (typeof window === 'undefined') return false;
  if (minWidth !== undefined && !window.matchMedia(`(min-width: ${minWidth}px)`).matches) {
    return false;
  }
  if (maxWidth !== undefined && !window.matchMedia(`(max-width: ${maxWidth}px)`).matches) {
    return false;
  }
  return true;
}

export default function ResponsiveKakaoAd({
  adUnit,
  adWidth,
  adHeight,
  className,
  minWidth,
  maxWidth,
}: ResponsiveKakaoAdProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const update = () => setShouldRender(matchesMedia(minWidth, maxWidth));
    update();

    const queries = [
      minWidth !== undefined ? window.matchMedia(`(min-width: ${minWidth}px)`) : null,
      maxWidth !== undefined ? window.matchMedia(`(max-width: ${maxWidth}px)`) : null,
    ].filter((query): query is MediaQueryList => query !== null);

    queries.forEach((query) => query.addEventListener('change', update));
    return () => queries.forEach((query) => query.removeEventListener('change', update));
  }, [minWidth, maxWidth]);

  if (!shouldRender) return null;

  return (
    <KakaoAd
      adUnit={adUnit}
      adWidth={adWidth}
      adHeight={adHeight}
      className={className}
    />
  );
}
