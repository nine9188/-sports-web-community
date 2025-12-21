/**
 * PostList 컴포넌트 Re-export
 *
 * 기존 import 경로 호환성 유지:
 * import PostList from '@/domains/boards/components/post/PostList'
 *
 * 실제 구현은 postlist 폴더에 있습니다.
 */

export { default } from './postlist/index';
export type { Post, PostListProps, PostVariant } from './postlist/index';
