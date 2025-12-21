/**
 * PostList 패키지 Public API
 *
 * 이 파일을 통해 외부에서 PostList 컴포넌트와 타입을 import합니다.
 *
 * @example
 * ```tsx
 * import PostList, { Post, PostListProps } from '@/domains/boards/components/post/postlist';
 * ```
 */

// 메인 컴포넌트
export { default } from './PostListMain';
export { default as PostList } from './PostListMain';

// 타입 export
export type { Post, PostListProps, PostVariant, PostItemProps, ContentTypeCheck } from './types';

// 유틸 함수 export (필요시 외부에서 사용)
export {
  checkContentType,
  extractFirstImageUrl,
  calculateHeight,
  isDeletedPost,
  isHiddenPost,
  getPostTitleText,
  getPostTitleClassName,
} from './utils';

// 상수 export (필요시 외부에서 사용)
export {
  VIRTUALIZATION_THRESHOLD,
  MOBILE_BREAKPOINT,
  ITEM_HEIGHTS,
  DEFAULT_MAX_HEIGHT,
} from './constants';

// 훅 export
export { useIsMobile } from './hooks';
