'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { siteConfig } from '@/shared/config';
import type { TopicPost, TabType } from '../types';

interface TopicPostItemProps {
  post: TopicPost;
  tabType: TabType;
  isLast: boolean;
}

/**
 * 인기글 아이템 클라이언트 컴포넌트
 *
 * - 개별 게시글 렌더링
 * - tabType에 따라 다른 카운트 표시
 * - 4590 표준: team_logo/league_logo는 서버에서 Storage URL로 전달됨
 * - 다크모드 리그 로고 지원
 */
export default function TopicPostItem({ post, tabType, isLast }: TopicPostItemProps) {
  const [isDark, setIsDark] = useState(false);

  // 다크모드 감지
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

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

  // 로고 이미지 URL 결정 (4590 표준 + 다크모드)
  const getLogoUrl = () => {
    // 팀 로고가 있으면 팀 로고 사용 (다크모드 없음)
    if (post.team_logo) {
      return post.team_logo;
    }
    // 리그 로고가 있으면 다크모드에 따라 선택
    if (post.league_logo) {
      return isDark && post.league_logo_dark ? post.league_logo_dark : post.league_logo;
    }
    // 기본 사이트 로고
    return siteConfig.logo;
  };

  const logoUrl = getLogoUrl();
  const needsInvert = !post.team_logo && !post.league_logo;

  return (
    <li className={!isLast ? "border-b border-black/5 dark:border-white/10" : ""}>
      <Link
        href={`/boards/${post.board_slug}/${post.post_number}`}
        className="block px-3 py-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] overflow-hidden"
      >
        <div className="flex items-center text-xs gap-1">
          <div className="relative w-5 h-5 flex-shrink-0">
            <Image
              src={logoUrl}
              alt={post.board_name}
              width={20}
              height={20}
              className={`object-contain w-5 h-5 ${needsInvert ? 'dark:invert' : ''}`}
              loading="lazy"
            />
          </div>
          <span className="truncate">{post.title}</span>
          {renderCount()}
        </div>
      </Link>
    </li>
  );
}
