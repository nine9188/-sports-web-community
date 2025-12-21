/**
 * PostList 컴포넌트에서 사용하는 상수 정의
 * Magic numbers를 상수로 추출하여 유지보수성 향상
 */

/**
 * 가상화(react-window) 적용 임계값
 * 게시글이 이 개수를 초과하면 가상화 적용
 */
export const VIRTUALIZATION_THRESHOLD = 30;

/**
 * 모바일 breakpoint (px)
 * Tailwind의 sm: breakpoint와 동일
 */
export const MOBILE_BREAKPOINT = 640;

/**
 * resize 이벤트 디바운스 딜레이 (ms)
 */
export const RESIZE_DEBOUNCE_DELAY = 150;

/**
 * 가상화 리스트 아이템 높이 (px)
 */
export const ITEM_HEIGHTS = {
  MOBILE_TEXT: 80,
  MOBILE_IMAGE_TABLE: 120,
  DESKTOP_TEXT: 50,
  DESKTOP_IMAGE_TABLE: 120,
} as const;

/**
 * 기본 최대 높이 (px)
 */
export const DEFAULT_MAX_HEIGHT = 600;

/**
 * 가상화 오버스캔 개수
 * 성능 최적화를 위해 화면 밖 아이템을 미리 렌더링
 */
export const VIRTUALIZATION_OVERSCAN_COUNT = 5;
