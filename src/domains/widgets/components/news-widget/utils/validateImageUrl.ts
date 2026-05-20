/**
 * 이미지 URL 유효성 검사
 */

/**
 * 이미지 URL이 유효한지 검사합니다.
 * - 빈 문자열: false
 * - 로컬 경로 (/로 시작): true
 * - 외부 URL: http(s)://로 시작하면 통과 (실제 로드 실패는 NewsImageClient가 처리)
 *
 * 이전에 확장자 패턴 검사를 했으나 다음 케이스들이 누락됨:
 * - .avif 확장자
 * - CDN 리사이즈 URL (확장자 없음)
 * - 쿼리스트링에 & 포함 (뉴스 CDN URL)
 * - format=jpeg 같이 쿼리에서 포맷 지정하는 URL
 */
export function validateImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return false;

  // 로컬 이미지는 항상 유효
  if (trimmedUrl.startsWith('/')) return true;

  // 외부 URL: http(s)://로 시작하면 유효로 간주
  // 실제 로드 실패/에러는 NewsImageClient의 onError + 5초 타임아웃이 처리
  return /^https?:\/\/.+/i.test(trimmedUrl);
}
