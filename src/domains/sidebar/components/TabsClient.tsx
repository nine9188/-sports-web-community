'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, ThumbsUp, MessageSquare, Image as ImageIcon, Link as LinkIcon, Video as VideoIcon, Youtube as YoutubeIcon } from 'lucide-react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { TopicPostsData, TabType, TopicPost } from '../types';

interface TopicTabsClientProps {
  postsData: TopicPostsData;
}

export function TopicTabsClient({ postsData }: TopicTabsClientProps) {
  // 현재 활성화된 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('views');

  // 현재 탭에 맞는 게시글 배열 가져오기
  const getCurrentPosts = (): TopicPost[] => {
    return postsData[activeTab] || [];
  };

  // 게시글 내용에서 특수 항목(이미지, 비디오 등) 감지
  const checkContentType = (content?: string | object) => {
    if (!content) return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };

    // content를 문자열로 변환
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    const hasImage = contentStr.includes('<img') || contentStr.includes('data-type="image"');
    const hasVideo = contentStr.includes('<video') || contentStr.includes('data-type="video"');

    const urlPattern = /https?:\/\/[^\s<>"']+/g;
    const urls = contentStr.match(urlPattern) || [];
    
    let foundYoutubeUrl = false;
    let foundNonYoutubeUrl = false;
    
    for (const url of urls) {
      if (/youtube\.com|youtu\.be/i.test(url)) {
        foundYoutubeUrl = true;
      } else if (!/\.(jpg|jpeg|png|gif|webp|svg|bmp|mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i.test(url)) {
        foundNonYoutubeUrl = true;
      }
      
      if (foundYoutubeUrl && foundNonYoutubeUrl) break;
    }
    
    if (!foundNonYoutubeUrl && contentStr.includes('<a href')) {
      foundNonYoutubeUrl = !(
        contentStr.includes('<a href="https://youtube.com') ||
        contentStr.includes('<a href="https://www.youtube.com') ||
        contentStr.includes('<a href="https://youtu.be')
      );
    }

    const hasYoutube = foundYoutubeUrl ||
                       contentStr.includes('data-type="youtube"') ||
                       contentStr.includes('youtube-video') ||
                       (contentStr.includes('<iframe') && (contentStr.includes('youtube.com') || contentStr.includes('youtu.be')));
    
    const hasLink = foundNonYoutubeUrl;
    
    return { hasImage, hasVideo, hasYoutube, hasLink };
  };

  // 탭에 따른 카운트 표시
  const renderCount = (post: TopicPost) => {
    if (activeTab === 'views') {
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
    <div className="mb-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0">
      <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center border-b border-black/5 dark:border-white/10 rounded-t-lg">
        <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">인기글</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">최근 24시간 기준</span>
      </div>

      <div className="flex border-b border-black/5 dark:border-white/10">
        {[
          { id: 'views', label: '조회수', icon: <Eye className="h-3 w-3 mr-0.5" /> },
          { id: 'likes', label: '추천수', icon: <ThumbsUp className="h-3 w-3 mr-0.5" /> },
          { id: 'comments', label: '댓글수', icon: <MessageSquare className="h-3 w-3 mr-0.5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 text-xs py-2 px-2 flex items-center justify-center transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-medium border-b-2 border-slate-800 dark:border-white'
                : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {currentPosts.length === 0 ? (
          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
            게시글이 없습니다.
          </div>
        ) : (
          <ul>
            {currentPosts.map((post, index) => {
              const { hasImage, hasVideo, hasYoutube, hasLink } = checkContentType(post.content);

              return (
                <li key={post.id} className={index < currentPosts.length - 1 ? "border-b border-black/5 dark:border-white/10" : ""}>
                  <Link
                    href={`/boards/${post.board_slug}/${post.post_number}?from=root`}
                    className="block px-3 py-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
                  >
                    <div className="flex items-center text-xs">
                      {post.team_id || post.league_id ? (
                        <div className="relative w-5 h-5 mr-1 flex-shrink-0">
                          <ApiSportsImage
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
                        <div className="w-5 h-5 bg-[#F5F5F5] dark:bg-[#262626] rounded-full mr-1 flex-shrink-0 flex items-center justify-center">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{post.board_name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex items-center flex-1">
                        <span className="line-clamp-1 mr-1">{post.title}</span>
                        <div className="flex items-center space-x-1 mr-1">
                          {hasImage && <ImageIcon className="h-3 w-3 text-gray-400" />}
                          {hasVideo && <VideoIcon className="h-3 w-3 text-gray-400" />}
                          {hasYoutube && <YoutubeIcon className="h-3 w-3 text-red-400" />}
                          {hasLink && <LinkIcon className="h-3 w-3 text-blue-400" />}
                        </div>
                      </div>
                      {renderCount(post)}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
} 