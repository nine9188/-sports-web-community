/**
 * 모바일 게시글 리스트 (서버 컴포넌트)
 *
 * - 30개 미만일 때 사용
 * - useDeferredValue 없이 직접 렌더링
 * - LCP 최적화: 초기 HTML에 콘텐츠 포함
 */

import { PostListProps } from '../../types';
import { MobilePostItem } from './MobilePostItem';

type MobilePostListServerProps = Omit<
  PostListProps,
  'loading' | 'showBoard' | 'emptyMessage' | 'headerContent' | 'footerContent' | 'className'
>;

/**
 * 모바일 게시글 리스트 서버 컴포넌트
 */
export function MobilePostListServer({
  posts,
  currentPostId,
  currentBoardId,
  variant = 'text',
}: MobilePostListServerProps) {
  return (
    <div className="mobile-post-list block sm:hidden w-full max-w-full overflow-hidden">
      {posts.map((post, index) => (
        <MobilePostItem
          key={post.id}
          post={post}
          isLast={index === posts.length - 1}
          currentPostId={currentPostId}
          currentBoardId={currentBoardId}
          showBoard={false}
          variant={variant}
        />
      ))}
    </div>
  );
}
