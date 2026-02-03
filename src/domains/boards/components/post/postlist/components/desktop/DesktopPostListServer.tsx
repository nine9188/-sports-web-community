/**
 * 데스크톱 게시글 리스트 (서버 컴포넌트)
 *
 * - 30개 미만일 때 사용
 * - useDeferredValue 없이 직접 렌더링
 * - LCP 최적화: 초기 HTML에 콘텐츠 포함
 */

import { PostListProps } from '../../types';
import { DesktopPostItem } from './DesktopPostItem';

type DesktopPostListServerProps = Omit<
  PostListProps,
  'loading' | 'emptyMessage' | 'headerContent' | 'footerContent' | 'className'
>;

/**
 * 데스크톱 게시글 리스트 서버 컴포넌트
 */
export function DesktopPostListServer({
  posts,
  currentPostId,
  currentBoardId,
  showBoard = true,
  variant = 'text',
}: DesktopPostListServerProps) {
  // image-table variant: 카드형 레이아웃
  if (variant === 'image-table') {
    return (
      <div className="hidden sm:block">
        <div>
          {posts.map((post, index) => (
            <DesktopPostItem
              key={post.id}
              post={post}
              isLast={index === posts.length - 1}
              currentPostId={currentPostId}
              currentBoardId={currentBoardId}
              showBoard={showBoard}
              variant={variant}
            />
          ))}
        </div>
      </div>
    );
  }

  // text variant: 테이블 형식
  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          {showBoard && <col style={{ width: '130px' }} />}
          <col />
          <col style={{ width: '120px' }} />
          <col style={{ width: '70px' }} />
          <col style={{ width: '40px' }} />
          <col style={{ width: '40px' }} />
        </colgroup>
        <thead>
          <tr className="border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
            {showBoard && (
              <th className="py-2 px-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                게시판
              </th>
            )}
            <th className="py-2 px-4 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              제목
            </th>
            <th className="py-2 px-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              글쓴이
            </th>
            <th className="py-2 px-1 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              날짜
            </th>
            <th className="py-2 px-1 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              조회
            </th>
            <th className="py-2 px-1 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              추천
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, index) => (
            <DesktopPostItem
              key={post.id}
              post={post}
              isLast={index === posts.length - 1}
              currentPostId={currentPostId}
              currentBoardId={currentBoardId}
              showBoard={showBoard}
              variant={variant}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
