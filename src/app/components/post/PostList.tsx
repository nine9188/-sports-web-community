'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollArea } from '@/app/ui/scroll-area';
import { Image as ImageIcon, Link as LinkIcon, Video as VideoIcon, Youtube as YoutubeIcon } from 'lucide-react';
import { getUserIconInfo } from '@/app/utils/level-icons';

interface Post {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  views: number;
  likes: number;
  author_nickname: string;
  author_id?: string;
  comment_count: number;
  content?: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
}

interface PostListProps {
  posts: Post[];
  loading?: boolean;
  showBoard?: boolean;
  currentPostId?: string;
  emptyMessage?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  className?: string;
  maxHeight?: string;
  currentBoardId: string;
  boardNameMaxWidth?: string;
}

export default function PostList({
  posts,
  loading = false,
  showBoard = true,
  currentPostId,
  emptyMessage = "게시글이 없습니다.",
  headerContent,
  footerContent,
  className = "",
  maxHeight,
  currentBoardId,
  boardNameMaxWidth = "100px"
}: PostListProps) {
  const [authorIcons, setAuthorIcons] = useState<Record<string, {url: string | null, name: string | null}>>({});
  const iconCache = useRef<Record<string, {url: string, name: string}>>({});
  
  // 게시글 내용에 특정 요소가 포함되어 있는지 확인하는 함수
  const checkContentType = (content: string) => {
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
  
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (postDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (date > oneYearAgo) {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    }
    
    return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
  };

  // 모든 작성자의 아이콘 정보 가져오기
  useEffect(() => {
    if (loading || posts.length === 0) return;
    
    // 고유한 작성자 ID 추출
    const uniqueAuthorIds = Array.from(
      new Set(
        posts
          .map(post => post.author_id)
          .filter(Boolean) as string[]
      )
    );
    
    if (uniqueAuthorIds.length === 0) return;
    
    const fetchIcons = async () => {
      const newIconsMap: Record<string, {url: string | null, name: string | null}> = {};
      
      // 각 사용자의 아이콘 정보 비동기로 가져오기
      await Promise.all(
        uniqueAuthorIds.map(async (authorId) => {
          // 이미 캐시에 있는 경우
          if (iconCache.current[authorId]) {
            newIconsMap[authorId] = iconCache.current[authorId];
            return;
          }
          
          try {
            // getUserIconInfo를 사용하여 아이콘 정보 가져오기
            const iconInfo = await getUserIconInfo(authorId);
            
            if (iconInfo && iconInfo.currentIconUrl) {
              // 결과 저장
              const result = {
                url: iconInfo.currentIconUrl,
                name: iconInfo.currentIconName || '사용자 아이콘'
              };
              
              // 캐시 및 결과맵에 저장
              iconCache.current[authorId] = result;
              newIconsMap[authorId] = result;
            }
          } catch (error) {
            console.error(`아이콘 정보 가져오기 오류 (${authorId}):`, error);
          }
        })
      );
      
      // 상태 업데이트
      setAuthorIcons(prev => ({...prev, ...newIconsMap}));
    };
    
    fetchIcons();
  }, [posts, loading]);

  // 이미지 로드 에러 핸들러
  const handleImageError = (authorId: string) => {
    if (authorId) {
      // 캐시에서 제거
      delete iconCache.current[authorId];
      
      // 상태에서도 제거
      setAuthorIcons(prev => {
        const newState = {...prev};
        delete newState[authorId];
        return newState;
      });
    }
  };

  const renderContentTypeIcons = (post: Post) => {
    if (!post.content) return null;
    
    const { hasImage, hasVideo, hasYoutube, hasLink } = checkContentType(post.content);
    
    return (
      <div className="flex items-center ml-1 space-x-1">
        {hasImage && <ImageIcon className="h-3 w-3 text-gray-400" />}
        {hasVideo && <VideoIcon className="h-3 w-3 text-gray-400" />}
        {hasYoutube && <YoutubeIcon className="h-3 w-3 text-red-400" />}
        {hasLink && <LinkIcon className="h-3 w-3 text-blue-400" />}
        {post.comment_count > 0 && (
          <span className="text-xs text-gray-500 ml-0.5">[{post.comment_count}]</span>
        )}
      </div>
    );
  };

  const scrollAreaClass = maxHeight ? `max-h-[${maxHeight}]` : "h-full";

  return (
    <div className={`bg-white border rounded-md shadow-sm ${className}`}>
      {headerContent && (
        <div className="px-6 py-4 border-b">
          {headerContent}
        </div>
      )}
      
      <ScrollArea className={scrollAreaClass}>
        {loading ? (
          <div className="p-4 space-y-2">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-5 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-t border-b bg-gray-50">
                  {showBoard && (
                    <th className={`py-2 px-3 text-center w-[${boardNameMaxWidth}] text-sm font-medium text-gray-500`}>게시판</th>
                  )}
                  <th className="py-2 px-4 text-center text-sm font-medium text-gray-500">제목</th>
                  <th className={`py-2 px-3 text-center w-[${boardNameMaxWidth}] text-sm font-medium text-gray-500 hidden sm:table-cell`}>글쓴이</th>
                  <th className="py-2 px-1 text-center w-16 text-sm font-medium text-gray-500 hidden sm:table-cell">날짜</th>
                  <th className="py-2 px-1 text-center w-12 text-sm font-medium text-gray-500 hidden sm:table-cell">조회</th>
                  <th className="py-2 px-1 text-center w-12 text-sm font-medium text-gray-500 hidden sm:table-cell">추천</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr 
                    key={post.id} 
                    className={`border-b hover:bg-gray-50 ${post.id === currentPostId ? 'bg-blue-50' : ''}`}
                  >
                    {showBoard && (
                      <td className="py-2 px-3 align-middle">
                        {(post.team_logo || post.league_logo) ? (
                          <div className="flex items-center">
                            <div className="relative w-5 h-5 mr-1">
                              <Image 
                                src={post.team_logo || post.league_logo || ''}
                                alt={post.board_name}
                                fill
                                className="object-contain"
                                sizes="20px"
                                priority={true}
                              />
                            </div>
                            <span className="text-xs text-gray-700 truncate" 
                                  title={post.board_name} 
                                  style={{maxWidth: '85px'}}>
                              {post.board_name}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block text-xs bg-gray-100 px-1.5 py-0.5 rounded-full truncate" 
                                title={post.board_name} 
                                style={{maxWidth: '90px'}}>
                            {post.board_name}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="py-2 px-4 align-middle">
                      <Link 
                        href={`/boards/${post.board_slug}/${post.post_number}?from=${currentBoardId}`} 
                        className="block w-full"
                      >
                        <div className="flex items-center">
                          <span className={`text-sm hover:text-blue-600 line-clamp-1 ${post.id === currentPostId ? 'text-blue-600 font-medium' : ''}`}>
                            {post.title}
                          </span>
                          {renderContentTypeIcons(post)}
                        </div>
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-gray-500 align-middle hidden sm:table-cell">
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 mr-1 flex-shrink-0 relative rounded-full overflow-hidden" 
                             title={post.author_id && authorIcons[post.author_id]?.name || undefined}>
                          {post.author_id && authorIcons[post.author_id]?.url ? (
                            <Image 
                              src={authorIcons[post.author_id].url || ''}
                              alt={post.author_nickname}
                              fill
                              className="object-cover"
                              sizes="20px"
                              unoptimized={true}
                              priority={true}
                              onError={() => handleImageError(post.author_id || '')}
                              style={{opacity: 1}}
                            />
                          ) : (
                            <div className="w-full h-full bg-transparent"></div>
                          )}
                        </div>
                        <span className="truncate text-xs" style={{maxWidth: '85px'}}>
                          {post.author_nickname || '익명'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center text-xs text-gray-500 align-middle hidden sm:table-cell">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="py-2 px-1 text-center text-xs text-gray-500 align-middle hidden sm:table-cell">
                      {post.views || 0}
                    </td>
                    <td className="py-2 px-1 text-center text-xs text-gray-500 align-middle hidden sm:table-cell">
                      {post.likes || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ScrollArea>
      
      {footerContent && (
        <div className="px-6 py-4 border-t">
          {footerContent}
        </div>
      )}
    </div>
  );
} 