/**
 * 이미지 URL 유효성 검사
 */

/** 이미지 URL 패턴 */
const IMAGE_URL_PATTERN = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;

/**
 * 이미지 URL이 유효한지 검사합니다.
 * - 빈 문자열: false
 * - 로컬 경로 (/로 시작): true
 * - 외부 URL: 이미지 확장자 패턴 검사
 *
 * @param url - 검사할 URL
 * @returns 유효 여부
 */
export function validateImageUrl(url: string): boolean {
  if (!url) return false;

  // 로컬 이미지는 항상 유효
  if (url.startsWith('/')) return true;

  // 외부 URL은 이미지 확장자 패턴 검사
  return IMAGE_URL_PATTERN.test(url);
}
