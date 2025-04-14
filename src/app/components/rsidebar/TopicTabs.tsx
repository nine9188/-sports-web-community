'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, ThumbsUp, MessageSquare, Image as ImageIcon, Link as LinkIcon, Video as VideoIcon, Youtube as YoutubeIcon } from 'lucide-react';
import type { TopicPost } from '@/app/lib/api/topicPosts';

// 탭 타입 정의
type TabType = 'views' | 'likes' | 'comments';

// 인기글 데이터 타입
interface TopicPostsData {
  views: TopicPost[];
  likes: TopicPost[];
  comments: TopicPost[];
}

export default function TopicTabs() {
  // 상태 관리
  const [activeTab, setActiveTab] = useState<TabType>('views');
  const [postsData, setPostsData] = useState<TopicPostsData | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoadingRef = useRef(false);

  // 처음 마운트될 때 데이터 로드
  useEffect(() => {
    // 이미 API 요청 중이면 중복 방지
    if (isLoadingRef.current) return;
    
    // 데이터 가져오기
    const fetchData = async () => {
      if (postsData) {
        // 이미 데이터가 있으면 다시 로드하지 않음
        setLoading(false);
        return;
      }
      
      setLoading(true);
      isLoadingRef.current = true;
      
      try {
        // 모든 탭 데이터를 한 번에 가져오기
        const timestamp = new Date().getTime(); // 캐시 방지
        const response = await fetch(`/api/topic-posts?t=${timestamp}`, {
          cache: 'no-store'
        });
        
        if (!response.ok) throw new Error('Failed to fetch posts');
        
        const data = await response.json();
        setPostsData(data);
      } catch (error) {
        console.error('인기글 로딩 오류:', error);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };
    
    fetchData();
  }, [postsData]);

  // 현재 탭에 맞는 게시글 배열 가져오기
  const getCurrentPosts = (): TopicPost[] => {
    if (!postsData) return [];
    return postsData[activeTab] || [];
  };

  // 게시글 내용에서 특수 항목(이미지, 비디오 등) 감지
  const checkContentType = (content?: string) => {
    if (!content) return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
    
    const hasImage = content.includes('<img') || content.includes('data-type="image"');
    const hasVideo = content.includes('<video') || content.includes('data-type="video"');
    
    const urlPattern = /https?:\/\/[^\s<>"']+/g;
    const urls = content.match(urlPattern) || [];
    
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
    
    if (!foundNonYoutubeUrl && content.includes('<a href')) {
      foundNonYoutubeUrl = !(
        content.includes('<a href="https://youtube.com') || 
        content.includes('<a href="https://www.youtube.com') || 
        content.includes('<a href="https://youtu.be')
      );
    }
    
    const hasYoutube = foundYoutubeUrl || 
                       content.includes('data-type="youtube"') ||
                       content.includes('youtube-video') ||
                       (content.includes('<iframe') && (content.includes('youtube.com') || content.includes('youtu.be')));
    
    const hasLink = foundNonYoutubeUrl;
    
    return { hasImage, hasVideo, hasYoutube, hasLink };
  };

  // 탭에 따른 카운트 표시
  const renderCount = (post: TopicPost) => {
    if (activeTab === 'views') {
      return (
        <span className="text-gray-500 ml-1 shrink-0 flex items-center">
          <Eye className="h-3 w-3 mr-0.5" />
          {post.views}
        </span>
      );
    } else if (activeTab === 'likes') {
      return (
        <span className="text-gray-500 ml-1 shrink-0 flex items-center">
          <ThumbsUp className="h-3 w-3 mr-0.5" />
          {post.likes}
        </span>
      );
    } else if (activeTab === 'comments') {
      return (
        <span className="text-gray-500 ml-1 shrink-0 flex items-center">
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
            { id: 'views', label: '조회수', icon: <Eye className="h-3 w-3 mr-0.5" /> },
            { id: 'likes', label: '추천수', icon: <ThumbsUp className="h-3 w-3 mr-0.5" /> },
            { id: 'comments', label: '댓글수', icon: <MessageSquare className="h-3 w-3 mr-0.5" /> }
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
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        {loading ? (
          <div className="p-2 space-y-2">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        ) : currentPosts.length === 0 ? (
          <div className="p-3 text-center text-gray-500 text-xs">
            게시글이 없습니다.
          </div>
        ) : (
          <ul>
            {currentPosts.map((post, index) => {
              const { hasImage, hasVideo, hasYoutube, hasLink } = checkContentType(post.content);
              
              return (
                <li key={post.id} className={index < currentPosts.length - 1 ? "border-b" : ""}>
                  <Link 
                    href={`/boards/${post.board_slug}/${post.post_number}?from=root`} 
                    className="block px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center text-xs">
                      {post.team_logo || post.league_logo ? (
                        <div className="relative w-5 h-5 mr-1 flex-shrink-0">
                          <Image 
                            src={post.team_logo || post.league_logo || ''}
                            alt={post.board_name}
                            fill
                            className="object-contain"
                            sizes="20px"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-gray-100 rounded-full mr-1 flex-shrink-0 flex items-center justify-center">
                          <span className="text-[10px] text-gray-500">{post.board_name.charAt(0)}</span>
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