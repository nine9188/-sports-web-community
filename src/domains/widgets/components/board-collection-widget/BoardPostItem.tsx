import Link from 'next/link';
import type { BoardPost } from './types';

interface BoardPostItemProps {
  post: BoardPost;
  isLast: boolean;
}

/**
 * 댓글 수 서버 컴포넌트
 */
function CommentCount({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      className="text-xs text-orange-600 dark:text-orange-400 font-medium ml-1"
      title={`댓글 ${count}개`}
    >
      [{count}]
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
      className={`text-[13px] text-gray-900 dark:text-[#F0F0F0] md:hover:bg-[#EAEAEA] md:dark:hover:bg-[#333333] transition-colors py-3 md:py-2 px-3 md:px-4 flex items-center min-w-0 ${
        isLast ? '' : 'border-b border-black/5 dark:border-white/10'
      }`}
    >
      <span className="flex-1 min-w-0 truncate">
        {post.title}
        {post.comment_count > 0 && <CommentCount count={post.comment_count} />}
      </span>
    </Link>
  );
}
