'use client';

import { SyntheticEvent } from 'react';

/**
 * 이미지 로드 실패 시 대체 이미지를 표시하는 핸들러
 * @param e 이미지 이벤트
 * @param fallbackSrc 대체 이미지 경로
 */
export const onImageError = (e: SyntheticEvent<HTMLImageElement, Event>, fallbackSrc: string): void => {
  const target = e.target as HTMLImageElement;
  target.src = fallbackSrc;
};

/**
 * 이미지 URL을 처리하는 유틸리티 함수
 * @param url 원본 URL
 * @param defaultUrl 기본 URL (원본이 없을 경우 사용)
 * @returns 유효한 이미지 URL
 */
export const getImageUrl = (url: string | undefined, defaultUrl: string): string => {
  if (!url) return defaultUrl;
  return url.startsWith('http') ? url : defaultUrl;
}; 