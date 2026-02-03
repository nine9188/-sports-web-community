import Link from 'next/link';
import Image from 'next/image';
import { Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { siteConfig } from '@/shared/config';
import { renderContentTypeIcons } from '@/domains/boards/components/post/postlist/components/shared/PostRenderers';
import type { TopicPost, TabType } from '../types';

interface TopicPostItemProps {
  post: TopicPost;
  tabType: TabType;
  isLast: boolean;
}

/**
 * 인기글 아이템 서버 컴포넌트
 *
 * - 개별 게시글을 서버에서 렌더링
 * - tabType에 따라 다른 카운트 표시
 */
export default function TopicPostItem({ post, tabType, isLast }: TopicPostItemProps) {
  // 탭에 따른 카운트 표시
  const renderCount = () => {
    if (tabType === 'hot') {
      return (
        <span className="text-gray-500 dark:text-gray-400 ml-1 shrink-0 flex items-center gap-2">
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-0.5" aria-hidden="true" />
            {post.views}
          </span>
          <span className="flex items-center">
            <ThumbsUp className="h-3 w-3 mr-0.5" aria-hidden="true" />
            {post.likes}
          </span>
        </span>
      );
    } else if (tabType === 'views') {
      return (
        <span className="text-gray-500 dark:text-gray-400 ml-1 shrink-0 flex items-center">
          <Eye className="h-3 w-3 mr-0.5" aria-hidden="true" />
          {post.views}
        </span>
      );
    } else if (tabType === 'likes') {
      return (
        <span className="text-gray-500 dark:text-gray-400 ml-1 shrink-0 flex items-center">
          <ThumbsUp className="h-3 w-3 mr-0.5" aria-hidden="true" />
          {post.likes}
        </span>
      );
    } else if (tabType === 'comments') {
      return (
        <span className="text-gray-500 dark:text-gray-400 ml-1 shrink-0 flex items-center">
          <MessageSquare className="h-3 w-3 mr-0.5" aria-hidden="true" />
          {post.comment_count || 0}
        </span>
      );
    }
    return null;
  };

  return (
    <li className={!isLast ? "border-b border-black/5 dark:border-white/10" : ""}>
      <Link
        href={`/boards/${post.board_slug}/${post.post_number}?from=root`}
        className="block px-3 py-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] overflow-hidden"
      >
        <div className="flex items-center text-xs gap-1">
          {post.team_id || post.league_id ? (
            <div className="relative w-5 h-5 flex-shrink-0">
              <UnifiedSportsImage
                imageId={post.team_id || post.league_id || 0}
                imageType={post.team_id ? ImageType.Teams : ImageType.Leagues}
                alt={post.board_name}
                width={20}
                height={20}
                className="object-contain w-5 h-5"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="relative w-5 h-5 flex-shrink-0">
              <Image
                src={siteConfig.logo}
                alt={post.board_name}
                width={20}
                height={20}
                className="object-contain w-5 h-5 dark:invert"
                loading="lazy"
              />
            </div>
          )}
          <span className="truncate">{post.title}</span>
          {renderContentTypeIcons(post)}
          {renderCount()}
        </div>
      </Link>
    </li>
  );
}
