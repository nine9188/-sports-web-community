import Link from 'next/link';
import type { BoardPost } from './types';
import BoardPostTitle from './BoardPostTitle';

interface BoardPostItemProps {
  post: BoardPost;
  isLast: boolean;
}

function PostMeta({ post }: { post: BoardPost }) {
  const board = post.board_name || '';
  const author = post.author_nickname || '익명';
  const date = post.formattedDate || '-';
  const views = post.views ?? 0;
  const likes = post.likes ?? 0;

  return (
    <span className="mt-1 flex w-full min-w-0 items-center justify-start gap-1.5 text-[11px] leading-none text-gray-500 dark:text-gray-400">
      <span className="flex min-w-0 items-center gap-1.5">
        {board && (
          <>
            <span className="truncate" title={board}>{board}</span>
            <span className="flex-shrink-0 text-gray-300 dark:text-gray-600">|</span>
          </>
        )}
        <span className="truncate" title={author}>{author}</span>
        <span className="flex-shrink-0 text-gray-300 dark:text-gray-600">|</span>
        <span className="flex-shrink-0">{date}</span>
      </span>
      <span className="flex flex-shrink-0 items-center gap-1.5">
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>조회 {views}</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>추천 {likes}</span>
      </span>
    </span>
  );
}

/**
 * 게시글 아이템 서버 컴포넌트
 */
export default function BoardPostItem({ post, isLast }: BoardPostItemProps) {
  return (
    <Link
      href={`/boards/${post.board_slug}/${post.post_number}`}
      prefetch={false}
      className={`text-[13px] text-gray-900 dark:text-[#F0F0F0] md:hover:bg-[#EAEAEA] md:dark:hover:bg-[#333333] transition-colors py-2.5 px-3 md:px-4 flex flex-col min-w-0 ${
        isLast ? '' : 'border-b border-black/5 dark:border-white/10'
      }`}
    >
      <BoardPostTitle title={post.title} commentCount={post.comment_count} />
      <PostMeta post={post} />
    </Link>
  );
}
