import Link from 'next/link';
import Image from 'next/image';
import type { BoardPost } from './types';

interface BoardPostItemProps {
  post: BoardPost;
  isLast: boolean;
}

/**
 * 게시판 로고 서버 컴포넌트
 */
function BoardLogo({ post }: { post: BoardPost }) {
  if (post.team_logo || post.league_logo) {
    return (
      <div className="flex items-center">
        <div className="relative w-4 h-4 mr-1 flex-shrink-0">
          <Image
            src={post.team_logo || post.league_logo || ''}
            alt={post.board_name}
            fill
            sizes="16px"
            className="object-contain"
            loading="lazy"
          />
        </div>
        <span
          className="text-[10px] text-gray-700 dark:text-gray-300 truncate max-w-[60px]"
          title={post.board_name}
        >
          {post.board_name}
        </span>
      </div>
    );
  }

  return (
    <span
      className="inline-block text-[10px] bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full truncate flex-shrink-0 max-w-[70px]"
      title={post.board_name}
    >
      {post.board_name}
    </span>
  );
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
      className={`text-xs text-gray-900 dark:text-[#F0F0F0] md:hover:bg-[#EAEAEA] md:dark:hover:bg-[#333333] transition-colors py-2 px-4 flex items-center gap-2 min-w-0 ${
        isLast ? '' : 'border-b border-black/5 dark:border-white/10'
      }`}
    >
      <div className="flex-shrink-0">
        <BoardLogo post={post} />
      </div>
      <span className="flex-1 min-w-0 truncate">
        {post.title}
        {post.comment_count > 0 && <CommentCount count={post.comment_count} />}
      </span>
    </Link>
  );
}
