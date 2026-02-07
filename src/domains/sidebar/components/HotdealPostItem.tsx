import Link from 'next/link';
import { Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { formatPrice, getDiscountRate } from '@/domains/boards/utils/hotdeal';
import type { HotdealSidebarPost, HotdealTabType } from '../types/hotdeal';

interface HotdealPostItemProps {
  post: HotdealSidebarPost;
  tabType: HotdealTabType;
  isLast: boolean;
}

/**
 * 핫딜 아이템 서버 컴포넌트
 *
 * - 개별 핫딜 게시글을 서버에서 렌더링
 * - tabType에 따라 다른 통계 표시
 */
export default function HotdealPostItem({ post, tabType, isLast }: HotdealPostItemProps) {
  const discountRate = getDiscountRate(
    post.deal_info.price,
    post.deal_info.original_price
  );

  // 탭에 따른 통계 표시
  const renderStats = () => {
    if (tabType === 'hot') {
      return (
        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-0.5" aria-hidden="true" />
            {post.views}
          </span>
          <span className="flex items-center">
            <ThumbsUp className="h-3 w-3 mr-0.5" aria-hidden="true" />
            {post.likes}
          </span>
        </div>
      );
    } else if (tabType === 'discount') {
      return discountRate ? (
        <span className="text-orange-600 dark:text-orange-400 font-bold text-xs">
          {discountRate}%↓
        </span>
      ) : null;
    } else if (tabType === 'likes') {
      return (
        <span className="text-gray-500 dark:text-gray-400 text-[10px] flex items-center">
          <ThumbsUp className="h-3 w-3 mr-0.5" aria-hidden="true" />
          {post.likes}
        </span>
      );
    } else if (tabType === 'comments') {
      return (
        <span className="text-gray-500 dark:text-gray-400 text-[10px] flex items-center">
          <MessageSquare className="h-3 w-3 mr-0.5" aria-hidden="true" />
          {post.comment_count || 0}
        </span>
      );
    }
    return null;
  };

  return (
    <li className={!isLast ? 'border-b border-black/5 dark:border-white/10' : ''}>
      <Link
        href={`/boards/${post.board_slug}/${post.post_number}`}
        className="block px-3 py-2.5 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors overflow-hidden"
      >
        {/* 제목 */}
        <div className="text-xs text-gray-900 dark:text-[#F0F0F0] truncate mb-1">
          {post.title}
        </div>

        {/* 쇼핑몰 + 가격 + 할인율 */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-gray-500 dark:text-gray-400">
            {post.deal_info.store}
          </span>
          <span className="text-red-600 dark:text-red-400 font-bold">
            {formatPrice(post.deal_info.price)}
          </span>
          {discountRate && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              {discountRate}%↓
            </span>
          )}
          <span className="ml-auto">
            {renderStats()}
          </span>
        </div>
      </Link>
    </li>
  );
}
