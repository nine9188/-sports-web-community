'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollArea } from '@/app/ui/scroll-area';
import { Image as ImageIcon, Link as LinkIcon, Video as VideoIcon, Youtube as YoutubeIcon, User as UserIcon } from 'lucide-react';
import { formatDate } from './postUtils';
import { getLevelIconUrl } from '@/app/utils/level-icons';

// 게시글 타입 정의
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
  author_level?: number;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
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
  
  // 게시글 내용에 특정 요소가 포함되어 있는지 확인하는 함수
  const checkContentType = (content: string | undefined) => {
    if (!content) return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
    
    // 문자열인 경우 (기존 로직)
    try {
      const hasImage = content.includes('<img') || content.includes('![');
      const hasVideo = content.includes('<video') || content.includes('mp4');
      const hasYoutube = content.includes('youtube.com') || content.includes('youtu.be');
      const hasLink = content.includes('http://') || content.includes('https://');
      
      return { hasImage, hasVideo, hasYoutube, hasLink };
    } catch {
      return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
    }
  };

  const renderContentTypeIcons = (post: Post) => {
    if (!post.content) return null;
    
    const { hasImage, hasVideo, hasYoutube, hasLink } = checkContentType(post.content);
    
    return (
      <div className="inline-flex items-center space-x-1 ml-1">
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

  // 모바일 뷰에서 사용할 간결한 게시글 목록 렌더링
  const renderMobilePostList = () => {
    return (
      <div className="block sm:hidden">
        <div>
          {posts.map((post, index) => (
            <div 
              key={post.id} 
              className={`py-2 px-3 ${index !== posts.length - 1 ? 'border-b' : ''} ${post.id === currentPostId ? 'bg-blue-50' : ''}`}
            >
              <Link href={`/boards/${post.board_slug}/${post.post_number}?from=${currentBoardId}`}>
                <div className="space-y-1">
                  {/* 제목 + 내용 타입 아이콘 */}
                  <div>
                    <div className="flex flex-wrap items-center">
                      <span className={`text-sm ${post.id === currentPostId ? 'text-blue-600 font-medium' : ''}`}>
                        {post.title}
                      </span>
                      {renderContentTypeIcons(post)}
                    </div>
                  </div>
                  
                  {/* 하단 정보 영역 - 그리드 레이아웃 적용 */}
                  <div className="flex text-[11px] text-gray-500">
                    <div className="w-full grid grid-cols-[1fr_auto] gap-2">
                      <div className="flex items-center overflow-hidden whitespace-nowrap">
                        {/* 왼쪽: 게시판이름 | 아이콘+글쓴이 | 시간 */}
                        {showBoard && (
                          <span className="truncate max-w-[100px] inline-block">{post.board_name}</span>
                        )}
                        <span className="mx-1 flex-shrink-0">|</span>
                        <span className="flex-shrink-0 flex items-center">
                          <div className="h-4 w-4 mr-0.5 rounded-full flex items-center justify-center">
                            {post.author_id ? (
                              <Image
                                src={post.author_icon_url || getLevelIconUrl(post.author_level || 1)}
                                alt={post.author_nickname || '익명'}
                                width={12}
                                height={12}
                                className="object-contain"
                              />
                            ) : (
                              <UserIcon className="h-3 w-3 text-gray-500" />
                            )}
                          </div>
                          <span>{post.author_nickname || '익명'}</span>
                        </span>
                        <span className="mx-1 flex-shrink-0">|</span>
                        <span className="flex-shrink-0">{formatDate(post.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                        {/* 오른쪽: 조회수 + 추천수 */}
                        <span>조회 {post.views || 0}</span>
                        <span>추천 {post.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`mb-4 bg-white rounded-lg border overflow-hidden ${className}`}>
      {headerContent && (
        <div className="px-6 py-4">
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
          <>
            {/* 모바일 뷰 */}
            {renderMobilePostList()}
            
            {/* 데스크톱 뷰 */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {showBoard && (
                      <th className={`py-2 px-3 text-center w-[${boardNameMaxWidth}] text-sm font-medium text-gray-500`}>게시판</th>
                    )}
                    <th className="py-2 px-4 text-center text-sm font-medium text-gray-500">제목</th>
                    <th className={`py-2 px-3 text-center w-[${boardNameMaxWidth}] text-sm font-medium text-gray-500`}>글쓴이</th>
                    <th className="py-2 px-1 text-center w-16 text-sm font-medium text-gray-500">날짜</th>
                    <th className="py-2 px-1 text-center w-12 text-sm font-medium text-gray-500">조회</th>
                    <th className="py-2 px-1 text-center w-12 text-sm font-medium text-gray-500">추천</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, index) => (
                    <tr 
                      key={post.id} 
                      className={`${index !== posts.length - 1 ? 'border-b' : ''} hover:bg-gray-50 ${post.id === currentPostId ? 'bg-blue-50' : ''}`}
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
                      <td className="py-2 px-2 text-center text-xs text-gray-500 align-middle">
                        <div className="flex items-center justify-start">
                          <div className="flex-shrink-0 w-5 h-5 relative rounded-full mr-1 flex items-center justify-center">
                            {post.author_id ? (
                              <Image
                                src={post.author_icon_url || getLevelIconUrl(post.author_level || 1)}
                                alt={post.author_nickname || '익명'}
                                width={20}
                                height={20}
                                className="object-contain"
                              />
                            ) : (
                              <UserIcon className="h-5 w-5 text-gray-500"/>
                            )}
                          </div>
                          <span className="truncate text-xs text-gray-600" 
                                title={post.author_nickname || '익명'} 
                                style={{maxWidth: '100px', textAlign: 'left'}}>
                            {post.author_nickname || '익명'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-1 text-center text-xs text-gray-500 align-middle">
                        {formatDate(post.created_at)}
                      </td>
                      <td className="py-2 px-1 text-center text-xs text-gray-500 align-middle">
                        {post.views || 0}
                      </td>
                      <td className="py-2 px-1 text-center text-xs text-gray-500 align-middle">
                        {post.likes || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ScrollArea>
      
      {footerContent && (
        <div>
          {footerContent}
        </div>
      )}
    </div>
  );
} 