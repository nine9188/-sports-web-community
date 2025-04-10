'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, ThumbsUp, MessageSquare, Image as ImageIcon, Link as LinkIcon, Video as VideoIcon, Youtube as YoutubeIcon } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  created_at: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  comment_count: number;
  views: number;
  likes: number;
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
  content?: string;
}

type TabType = '조회수' | '추천수' | '댓글수';

// 초기 데이터 타입을 prop으로 받도록 수정
interface ClientTopicTabsProps {
  initialData: Record<TabType, Post[]>;
}

export default function ClientTopicTabs({ initialData }: ClientTopicTabsProps) {
  const [displayPosts, setDisplayPosts] = useState<Post[]>(initialData['조회수']);
  const [activeTab, setActiveTab] = useState<TabType>('조회수');

  useEffect(() => {
    setDisplayPosts(initialData[activeTab]);
  }, [activeTab, initialData]);

  // 해당 탭에 맞는 수치와 아이콘 표시
  const renderCount = (post: Post) => {
    if (activeTab === '조회수') {
      return (
        <span className="text-gray-500 ml-1 shrink-0 flex items-center">
          <Eye className="h-3 w-3 mr-0.5" />
          {post.views}
        </span>
      );
    } else if (activeTab === '추천수') {
      return (
        <span className="text-gray-500 ml-1 shrink-0 flex items-center">
          <ThumbsUp className="h-3 w-3 mr-0.5" />
          {post.likes}
        </span>
      );
    } else if (activeTab === '댓글수') {
      return (
        <span className="text-gray-500 ml-1 shrink-0 flex items-center">
          <MessageSquare className="h-3 w-3 mr-0.5" />
          {post.comment_count}
        </span>
      );
    }
    return null;
  };

  // 게시글 내용에 특정 요소가 포함되어 있는지 확인하는 함수
  const checkContentType = (content?: string) => {
    if (!content) return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
    
    // 이미지 및 비디오 감지
    const hasImage = content.includes('<img') || content.includes('data-type="image"');
    const hasVideo = content.includes('<video') || content.includes('data-type="video"');
    
    // 모든 URL 찾기
    const urlPattern = /https?:\/\/[^\s<>"']+/g;
    const urls = content.match(urlPattern) || [];
    
    // 각 URL 유형을 확인하기 위한 플래그
    let foundYoutubeUrl = false;
    let foundNonYoutubeUrl = false;
    
    // 각 URL을 검사하여 유튜브 URL과 일반 URL 구분
    for (const url of urls) {
      if (/youtube\.com|youtu\.be/i.test(url)) {
        // 유튜브 URL 발견
        foundYoutubeUrl = true;
      } else if (!/\.(jpg|jpeg|png|gif|webp|svg|bmp|mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i.test(url)) {
        // 이미지나 비디오가 아닌 일반 URL 발견
        foundNonYoutubeUrl = true;
      }
      
      // 둘 다 찾았으면 더 이상 검사할 필요 없음
      if (foundYoutubeUrl && foundNonYoutubeUrl) break;
    }
    
    // 앵커 태그 검사 (URL 패턴으로 감지되지 않은 경우)
    if (!foundNonYoutubeUrl && content.includes('<a href')) {
      // 앵커 태그 중 유튜브가 아닌 것이 있는지 확인
      foundNonYoutubeUrl = !(
        content.includes('<a href="https://youtube.com') || 
        content.includes('<a href="https://www.youtube.com') || 
        content.includes('<a href="https://youtu.be')
      );
    }
    
    // 유튜브 감지 - URL 기반 또는 다른 패턴
    const hasYoutube = foundYoutubeUrl || 
                       content.includes('data-type="youtube"') ||
                       content.includes('youtube-video') ||
                       (content.includes('<iframe') && (content.includes('youtube.com') || content.includes('youtu.be')));
    
    // 일반 링크 감지 - 유튜브를 제외한 URL 또는 앵커 태그
    const hasLink = foundNonYoutubeUrl;
    
    return { hasImage, hasVideo, hasYoutube, hasLink };
  };

  return (
    <div className="mb-4 bg-white rounded-lg border">
      <div className="px-3 py-2 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold">인기글</h3>
          <span className="text-xs text-gray-500">최근 24시간 기준</span>
        </div>
      </div>
      
      <div className="px-3 py-2 border-b">
        <ul className="flex space-x-1">
          {[
            { id: '조회수', icon: <Eye className="h-3 w-3 mr-0.5" /> },
            { id: '추천수', icon: <ThumbsUp className="h-3 w-3 mr-0.5" /> },
            { id: '댓글수', icon: <MessageSquare className="h-3 w-3 mr-0.5" /> }
          ].map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`text-xs py-1 px-2 rounded-full flex items-center ${
                  activeTab === tab.id
                    ? 'bg-gray-500 text-white font-medium'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.id}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        {displayPosts.length === 0 ? (
          <div className="p-3 text-center text-gray-500 text-xs">
            게시글이 없습니다.
          </div>
        ) : (
          <ul>
            {displayPosts.map((post, index) => {
              // 게시글 내용에서 미디어 타입 확인
              const { hasImage, hasVideo, hasYoutube, hasLink } = checkContentType(post.content);
              
              return (
                <li key={post.id} className={index < displayPosts.length - 1 ? "border-b" : ""}>
                  <Link 
                    href={`/boards/${post.board_slug}/${post.post_number}?from=boards`} 
                    className="block px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center text-xs">
                      {/* 게시판 로고 또는 기본 아이콘 */}
                      {post.team_logo || post.league_logo ? (
                        <div className="relative w-5 h-5 mr-1 flex-shrink-0">
                          <Image 
                            src={post.team_logo || post.league_logo || ''}
                            alt={post.board_name}
                            fill
                            className="object-contain"
                            sizes="20px"
                          />
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-gray-100 rounded-full mr-1 flex-shrink-0 flex items-center justify-center">
                          <span className="text-[10px] text-gray-500">{post.board_name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex items-center flex-1">
                        <span className="line-clamp-1 mr-1">{post.title}</span>
                        {/* 미디어 타입 아이콘 */}
                        <div className="flex items-center space-x-1 mr-1">
                          {hasImage && <ImageIcon className="h-3 w-3 text-gray-400" />}
                          {hasVideo && <VideoIcon className="h-3 w-3 text-gray-400" />}
                          {hasYoutube && <YoutubeIcon className="h-3 w-3 text-red-400" />}
                          {hasLink && <LinkIcon className="h-3 w-3 text-blue-400" />}
                          {post.comment_count > 0 && (
                            <span className="text-xs text-gray-500 ml-0.5">[{post.comment_count}]</span>
                          )}
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