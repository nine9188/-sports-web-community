import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API URL 관련 유틸리티 함수
export function getAPIURL() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
}

// 토큰 관련 유틸리티 함수 추가
export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
}

/**
 * 사용자 아이콘 경로를 가져오는 함수
 * @param icon_id 데이터베이스에 저장된 아이콘 ID
 * @param iconUrl 아이콘 이미지 URL
 */
export function getIconImagePath(icon_id: number | null | undefined, iconUrl?: string): string {
  // 아이콘 ID나 URL이 없는 경우 기본 이미지 반환
  if (!icon_id && !iconUrl) {
    return '/images/default-avatar.png'; // 기본 이미지 경로
  }
  
  // 이미 완전한 URL이 제공된 경우 그대로 사용
  if (iconUrl) {
    if (iconUrl.startsWith('/') || iconUrl.startsWith('http')) {
      return iconUrl;
    }
  }
  
  // 아이콘 ID만 있는 경우, 별도 로직으로 이미지 URL 생성
  if (icon_id) {
    // 여기서는 shop_items 테이블에서 이미지 URL을 가져오는 것이 더 좋으나,
    // 임시로 ID 기반 경로를 반환
    return `/icons/${icon_id}.png`;
  }
  
  // 어떤 조건도 만족하지 않을 경우 기본 이미지
  return '/images/default-avatar.png';
}

// 기존 avatar 관련 함수는 호환성을 위해 유지하되, 내부적으로 새 함수 호출
export function getAvatarImagePath(avatar_url: string | null | undefined): string {
  // 이 함수는 레거시 지원을 위해 남겨두지만, 새로운 코드에서는 getIconImagePath 사용 권장
  if (!avatar_url) {
    return '/images/default-avatar.png';
  }
  
  if (avatar_url.startsWith('/') || avatar_url.startsWith('http')) {
    return avatar_url;
  }
  
  const imageId = avatar_url.startsWith('avatar_') ? avatar_url.substring(7) : avatar_url;
  return `/PR/${imageId}.png`;
}
