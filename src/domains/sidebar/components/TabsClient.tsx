'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Eye,
  ThumbsUp,
  MessageSquare,
  Flame,
} from 'lucide-react';
import { Container, ContainerHeader, ContainerTitle, TabList, type TabItem } from '@/shared/components/ui';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { TopicPostsData, TabType, TopicPost } from '../types';
import { renderContentTypeIcons } from '@/domains/boards/components/post/postlist/components/shared/PostRenderers';

interface TopicTabsClientProps {
  postsData: TopicPostsData;
}

export function TopicTabsClient({ postsData }: TopicTabsClientProps) {
  // 현재 활성화된 탭 상태 (기본값: hot)
  const [activeTab, setActiveTab] = useState<TabType>('hot');

  // 현재 탭에 맞는 게시글 배열 가져오기
  const getCurrentPosts = (): TopicPost[] => {
    return postsData[activeTab] || [];
  };

  // 탭에 따른 카운트 표시
  const renderCount = (post: TopicPost) => {
    if (activeTab === 'hot') {
      return (
        <span className="text-gray-500 dark:text-gray-400 ml-1 shrink-0 flex items-center gap-2">
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-0.5" />
            {post.views}
          </span>
          <span className="flex items-center">
            <ThumbsUp className="h-3 w-3 mr-0.5" />
            {post.likes}
          </span>
        </span>
      );
    } else if (activeTab === 'views') {
      return (
        <span className="text-gray-500 dark:text-gray-400 ml-1 shrink-0 flex items-center">
          <Eye className="h-3 w-3 mr-0.5" />
          {post.views}
        </span>
      );
    } else if (activeTab === 'likes') {
      return (
        <span className="text-gray-500 dark:text-gray-400 ml-1 shrink-0 flex items-center">
          <ThumbsUp className="h-3 w-3 mr-0.5" />
          {post.likes}
        </span>
      );
    } else if (activeTab === 'comments') {
      return (
        <span className="text-gray-500 dark:text-gray-400 ml-1 shrink-0 flex items-center">
          <MessageSquare className="h-3 w-3 mr-0.5" />
          {post.comment_count || 0}
        </span>
      );
    }
    return null;
  };
  
  // 현재 표시할 게시글
  const currentPosts = getCurrentPosts();
  
  return (
    <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader className="justify-between">
        <ContainerTitle>인기글</ContainerTitle>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {postsData.windowDays ? `최근 ${postsData.windowDays}일 기준` : '최근 24시간 기준'}
        </span>
      </ContainerHeader>

      <TabList
        tabs={[
          { id: 'hot', label: 'HOT', icon: <Flame className="h-3 w-3" /> },
          { id: 'views', label: '조회수', icon: <Eye className="h-3 w-3" /> },
          { id: 'likes', label: '추천수', icon: <ThumbsUp className="h-3 w-3" /> },
          { id: 'comments', label: '댓글수', icon: <MessageSquare className="h-3 w-3" /> }
        ] as TabItem[]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabType)}
        variant="contained"
        className="mb-0"
      />

      <div>
        {currentPosts.length === 0 ? (
          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
            게시글이 없습니다.
          </div>
        ) : (
          <ul>
            {currentPosts.map((post, index) => {
              return (
                <li key={post.id} className={index < currentPosts.length - 1 ? "border-b border-black/5 dark:border-white/10" : ""}>
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
                            src="/logo/4590 로고2 이미지크기 275X200 누끼제거 버전.png"
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
                      {renderCount(post)}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Container>
  );
} 
