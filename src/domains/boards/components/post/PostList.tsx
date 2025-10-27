'use client';

import React, { useState, useEffect, useCallback, useMemo, startTransition, useDeferredValue } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FixedSizeList as List } from 'react-window';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Image as ImageIcon, Link as LinkIcon, Video as VideoIcon, Youtube as YoutubeIcon, Calendar as CalendarIcon, Eye as EyeIcon } from 'lucide-react';
import UserIconComponent from '@/shared/components/UserIcon';

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
  formattedDate?: string;
  is_hidden?: boolean;
  is_deleted?: boolean;
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
  // 게시판 목록 렌더링 변형: 기본 텍스트, 이미지형 테이블 지원
  variant?: 'text' | 'image-table';
}

// 가상화된 리스트 아이템 컴포넌트
const VirtualizedPostItem = React.memo(function VirtualizedPostItem({
  index,
  style,
  data
}: {
  index: number;
  style: React.CSSProperties;
  data: {
    posts: Post[];
    currentPostId?: string;
    currentBoardId: string;
    showBoard: boolean;
    isMobile: boolean;
    renderContentTypeIcons: (post: Post) => React.ReactNode;
    renderAuthor: (post: Post, size: number, containerClass: string) => React.ReactNode;
    renderBoardLogo: (post: Post) => React.ReactNode;
    variant: 'text' | 'image-table';
    extractFirstImageUrl: (content?: string) => string | null;
  };
}) {
  const { posts, currentPostId, currentBoardId, showBoard, isMobile, renderContentTypeIcons, renderAuthor, renderBoardLogo, variant, extractFirstImageUrl } = data;
  const post = posts[index];
  
  // 🔧 안전한 날짜 포맷팅 - Hydration 불일치 방지
  const formattedDate = useMemo(() => {
    return post.formattedDate || '-'; // 서버에서 포맷된 날짜 사용
  }, [post.formattedDate]);
  
  const isCurrentPost = post.id === currentPostId;
  const href = `/boards/${post.board_slug}/${post.post_number}?from=${currentBoardId}`;
  
  if (!post) return null;
  
  if (isMobile) {
    return (
      <div style={style} className={`py-2 px-3 border-b ${isCurrentPost ? 'bg-blue-50' : ''}`}>
        <Link href={href} prefetch={false}>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center">
                  <span className={`text-sm line-clamp-1 ${isCurrentPost ? 'text-blue-600 font-medium' : ''} ${post.is_deleted ? 'text-red-500' : post.is_hidden ? 'text-gray-500' : ''}`}>
                  {post.is_deleted ? '[삭제된 게시글]' : post.is_hidden ? '[숨김 처리된 게시글]' : String(post?.title || '제목 없음')}
                </span>
                {renderContentTypeIcons(post)}
              </div>
            </div>
              {variant === 'image-table' && (
                <div className="ml-3 flex-shrink-0">
                  {(() => {
                    const url = extractFirstImageUrl(post.content);
                    if (!url) return null;
                    return (
                      <div className="relative w-28 h-16 rounded overflow-hidden border">
                        <Image src={url} alt="썸네일" fill sizes="192px" className="object-cover" loading="lazy" />
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="flex text-[11px] text-gray-500">
              <div className="w-full flex items-center justify-between gap-2">
                <div className="flex items-center overflow-hidden whitespace-nowrap">
                  {renderAuthor(post, 20, "justify-start")}
                  <span className="mx-1 flex-shrink-0">|</span>
                  <span className="flex-shrink-0 flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-0.5" />{formattedDate}
                  </span>
                </div>
                <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                  <span className="flex items-center"><EyeIcon className="w-3 h-3 mr-0.5" />{post.views || 0}</span>
                  <span>추천 {post.likes || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div style={style} className={`flex border-b hover:bg-gray-50 ${isCurrentPost ? 'bg-blue-50' : ''}`}>
      {showBoard && (
        <div className="py-2 px-3 flex items-center" style={{ width: '120px' }}>
          {renderBoardLogo(post)}
        </div>
      )}
      <div className="py-2 px-4 flex-1">
        <Link href={href} className="block w-full" prefetch={false}>
          <div className="flex items-center">
            <span className={`text-sm line-clamp-1 ${isCurrentPost ? 'text-blue-600 font-medium' : ''} ${post.is_deleted ? 'text-red-500' : post.is_hidden ? 'text-gray-500' : 'hover:text-blue-600'}`}>
              {post.is_deleted ? '[삭제된 게시글]' : post.is_hidden ? '[숨김 처리된 게시글]' : String(post?.title || '제목 없음')}
            </span>
            {renderContentTypeIcons(post)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center overflow-hidden whitespace-nowrap">
              {renderAuthor(post, 20, "justify-start")}
              <span className="mx-1 flex-shrink-0">|</span>
              <span className="flex-shrink-0 flex items-center"><CalendarIcon className="w-3 h-3 mr-0.5" />{formattedDate}</span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="flex items-center"><EyeIcon className="w-3 h-3 mr-0.5" />{post.views || 0}</span>
              <span>추천 {post.likes || 0}</span>
            </div>
          </div>
        </Link>
      </div>
      <div className="py-2 px-2 flex items-center justify-center" style={{ width: '120px' }}>
            {renderAuthor(post, 20, "justify-start")}
      </div>
      <div className="py-2 px-1 flex items-center justify-center" style={{ width: '80px' }}>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>
      <div className="py-2 px-1 flex items-center justify-center" style={{ width: '60px' }}>
        <span className="text-xs text-gray-500">{post.views || 0}</span>
      </div>
      <div className="py-2 px-1 flex items-center justify-center" style={{ width: '60px' }}>
        <span className="text-xs text-gray-500">{post.likes || 0}</span>
      </div>
      {variant === 'image-table' && (
        <div className="py-2 px-2 flex items-center justify-center" style={{ width: '96px' }}>
          {(() => {
            const url = extractFirstImageUrl(post.content);
            if (!url) return null;
            return (
              <div className="relative w-16 h-16 rounded overflow-hidden border">
                <Image src={url} alt="썸네일" fill sizes="64px" className="object-cover" loading="lazy" />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
});

// 개별 게시글 아이템 컴포넌트 - React.memo로 최적화 (비가상화용)
const PostItem = React.memo(function PostItem({
  post,
  isLast,
  currentPostId,
  currentBoardId,
  showBoard,
  isMobile,
  renderContentTypeIcons,
  renderAuthor,
  renderBoardLogo,
  variant,
  extractFirstImageUrl
}: {
  post: Post;
  isLast: boolean;
  currentPostId?: string;
  currentBoardId: string;
  showBoard: boolean;
  isMobile: boolean;
  renderContentTypeIcons: (post: Post) => React.ReactNode;
  renderAuthor: (post: Post, size: number, containerClass: string) => React.ReactNode;
  renderBoardLogo: (post: Post) => React.ReactNode;
  variant: 'text' | 'image-table';
  extractFirstImageUrl: (content?: string) => string | null;
}) {
  const isCurrentPost = post.id === currentPostId;
  const href = `/boards/${post.board_slug}/${post.post_number}?from=${currentBoardId}`;
  
  // 🔧 안전한 날짜 포맷팅 - Hydration 불일치 방지
  const formattedDate = useMemo(() => {
    return post.formattedDate || '-'; // 서버에서 포맷된 날짜 사용
  }, [post.formattedDate]);
  
  if (isMobile) {
    return (
      <div className={`py-2 px-3 ${!isLast ? 'border-b' : ''} ${isCurrentPost ? 'bg-blue-50' : ''}`}>
        <Link href={href} prefetch={false}>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center">
                <span className={`text-sm line-clamp-1 ${isCurrentPost ? 'text-blue-600 font-medium' : ''} ${post.is_deleted ? 'text-red-500' : post.is_hidden ? 'text-gray-500' : ''}`}>
                  {post.is_deleted ? '[삭제된 게시글]' : post.is_hidden ? '[숨김 처리된 게시글]' : String(post?.title || '제목 없음')}
                </span>
                {renderContentTypeIcons(post)}
              </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center overflow-hidden whitespace-nowrap">
                    {renderAuthor(post, 20, "justify-start")}
                  <span className="mx-1 flex-shrink-0">|</span>
                    <span className="flex-shrink-0 flex items-center"><CalendarIcon className="w-3 h-3 mr-0.5" />{formattedDate}</span>
                </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="flex items-center"><EyeIcon className="w-3 h-3 mr-0.5" />{post.views || 0}</span>
                  <span>추천 {post.likes || 0}</span>
                  </div>
                </div>
              </div>
              {variant === 'image-table' && (
                <div className="ml-3 flex-shrink-0">
                  {(() => {
                    const url = extractFirstImageUrl(post.content);
                    if (!url) return null;
                    return (
                      <div className="relative w-28 h-16 rounded overflow-hidden border">
                        <Image src={url} alt="썸네일" fill sizes="192px" className="object-cover" loading="lazy" />
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // 데스크톱 - 이미지형은 제목 아래 메타 + 우측 썸네일(헤더 없음)
  if (variant === 'image-table') {
    return (
      <div className={`py-2 px-3 ${!isLast ? 'border-b' : ''} ${isCurrentPost ? 'bg-blue-50' : ''}`}>
        <Link href={href} prefetch={false}>
          <div className="flex items-center justify-between gap-1">
            {/* 좌측 영역: 세로 정렬 (아이콘 / 숫자 / 추천) */}
            <div className="py-1 px-0.5 hidden sm:flex justify-center text-gray-600" style={{ width: '60px' }}>
              <div className="flex flex-col items-center text-xs leading-none space-y-1">
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path fill="currentColor" d="M12 4 L20 12 H4 Z" />
                  <rect x="10" y="12" width="4" height="6" rx="1" fill="currentColor" />
                </svg>
                <span>{post.likes || 0}</span>
                <span>추천</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center">
                <span className={`text-sm line-clamp-1 ${isCurrentPost ? 'text-blue-600 font-medium' : ''} ${post.is_deleted ? 'text-red-500' : post.is_hidden ? 'text-gray-500' : 'hover:text-blue-600'}`}>
                  {post.is_deleted ? '[삭제된 게시글]' : post.is_hidden ? '[숨김 처리된 게시글]' : String(post?.title || '제목 없음')}
                </span>
                {renderContentTypeIcons(post)}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                {/* 제목 아래: 게시판 이름 노출 */}
                <span className="inline-flex items-center max-w-[140px] truncate rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">
                  {post.board_name}
                </span>
                <span className="text-gray-300">|</span>
                {renderAuthor(post, 20, 'justify-start')}
                <span className="text-gray-300">|</span>
                <span className="flex items-center"><CalendarIcon className="w-3 h-3 mr-0.5" />{formattedDate}</span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center"><EyeIcon className="w-3 h-3 mr-0.5" />{post.views || 0}</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              {(() => {
                const url = extractFirstImageUrl(post.content);
                if (!url) return null;
                return (
                  <div className="relative w-36 h-20 rounded overflow-hidden border">
                    <Image src={url} alt="썸네일" fill sizes="240px" className="object-cover" loading="lazy" />
                  </div>
                );
              })()}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <tr className={`${!isLast ? 'border-b' : ''} hover:bg-gray-50 ${isCurrentPost ? 'bg-blue-50' : ''}`}>
      {showBoard && (
        <td className="py-2 px-3 align-middle">
          {renderBoardLogo(post)}
        </td>
      )}
      <td className="py-2 px-4 align-middle">
        <Link href={href} className="block w-full" prefetch={false}>
          <div className="flex items-center">
            <span className={`text-sm line-clamp-1 ${isCurrentPost ? 'text-blue-600 font-medium' : ''} ${post.is_deleted ? 'text-red-500' : post.is_hidden ? 'text-gray-500' : 'hover:text-blue-600'}`}>
              {post.is_deleted ? '[삭제된 게시글]' : post.is_hidden ? '[숨김 처리된 게시글]' : String(post?.title || '제목 없음')}
            </span>
            {renderContentTypeIcons(post)}
          </div>
        </Link>
      </td>
      <td className="py-2 px-2 text-center text-xs text-gray-500 align-middle">
        {renderAuthor(post, 20, "justify-start")}
      </td>
      <td className="py-2 px-1 text-center text-xs text-gray-500 align-middle">
        {formattedDate}
      </td>
      <td className="py-2 px-1 text-center text-xs text-gray-500 align-middle">
        {post.views || 0}
      </td>
      <td className="py-2 px-1 text-center text-xs text-gray-500 align-middle">
        {post.likes || 0}
      </td>
      {/* 텍스트형에서는 추가 이미지 셀 없음 */}
    </tr>
  );
});

// 로딩 스켈레톤 컴포넌트 - React.memo로 최적화
const LoadingSkeleton = React.memo(function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-2">
      {Array(10).fill(0).map((_, i) => (
        <div key={i} className="h-5 bg-gray-100 rounded animate-pulse"></div>
      ))}
    </div>
  );
});

// 빈 상태 컴포넌트 - React.memo로 최적화
const EmptyState = React.memo(function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-6 text-center">
      <p className="text-gray-500">{message}</p>
    </div>
  );
});

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
  boardNameMaxWidth = "100px",
  variant = 'text'
}: PostListProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  // React 18 동시성 기능: posts 데이터를 지연시켜 메인 스레드 블로킹 방지
  const deferredPosts = useDeferredValue(posts);
  const deferredLoading = useDeferredValue(loading);
  
  // 화면 크기 감지 - 디바운스 적용 + startTransition 사용
  useEffect(() => {
    const checkMobile = () => {
      startTransition(() => {
        setIsMobile(window.innerWidth < 640);
      });
    };
    
    checkMobile();
    
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        startTransition(() => {
          setIsMobile(window.innerWidth < 640);
        });
      }, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // 게시글 내용에 특정 요소가 포함되어 있는지 확인하는 함수 (메모이제이션)
  const checkContentType = useCallback((content: string | undefined) => {
    if (!content) return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
    
    try {
      let contentToCheck = content;
      let hasSpecialContent = false;
      
      const isJSON = content.startsWith('{') || content.startsWith('[');
      
      // JSON 형태의 콘텐츠인지 확인하고 파싱
      if (isJSON) {
        try {
          const parsedContent = JSON.parse(content);
          
          // TipTap 형식인지 확인
          if (parsedContent && typeof parsedContent === 'object') {
            if (parsedContent.type === 'doc' && Array.isArray(parsedContent.content)) {
              // TipTap 문서 형식 - 재귀적으로 모든 노드 검사
              const extractTextFromTipTap = (nodes: unknown[]): string => {
                let text = '';
                for (const node of nodes) {
                  if (typeof node === 'object' && node !== null) {
                    const nodeObj = node as Record<string, unknown>;
                    
                    if (nodeObj.type === 'text' && typeof nodeObj.text === 'string') {
                      text += nodeObj.text + ' ';
                    } else if (nodeObj.type === 'image' && 
                              typeof nodeObj.attrs === 'object' && 
                              nodeObj.attrs !== null &&
                              typeof (nodeObj.attrs as Record<string, unknown>).src === 'string') {
                      const attrs = nodeObj.attrs as Record<string, unknown>;
                      text += `<img src="${attrs.src}"> `;
                      hasSpecialContent = true;
                    } else if (nodeObj.type === 'matchCard') {
                      // 매치카드 감지
                      text += ' [매치카드] ';
                      hasSpecialContent = true;
                    } else if (Array.isArray(nodeObj.content)) {
                      text += extractTextFromTipTap(nodeObj.content);
                    }
                    
                    // 링크 마크 확인
                    if (Array.isArray(nodeObj.marks)) {
                      for (const mark of nodeObj.marks) {
                        if (typeof mark === 'object' && mark !== null) {
                          const markObj = mark as Record<string, unknown>;
                          if (markObj.type === 'link' && 
                              typeof markObj.attrs === 'object' && 
                              markObj.attrs !== null &&
                              typeof (markObj.attrs as Record<string, unknown>).href === 'string') {
                            const attrs = markObj.attrs as Record<string, unknown>;
                            text += ` ${attrs.href} `;
                          }
                        }
                      }
                    }
                  }
                }
                return text;
              };
              
              contentToCheck = extractTextFromTipTap(parsedContent.content);
            } else {
              // 다른 JSON 형식 - 문자열로 변환
              contentToCheck = JSON.stringify(parsedContent);
            }
          }
        } catch {
          // JSON 파싱 실패 시 원본 문자열 사용
          contentToCheck = content;
        }
      }
      
      // 소셜 임베드 및 특수 콘텐츠 확인
      const hasSocialEmbed = contentToCheck.includes('data-type="social-embed"') ||
                           contentToCheck.includes('twitter.com') ||
                           contentToCheck.includes('instagram.com') ||
                           contentToCheck.includes('youtube.com/embed');
      
      const hasMatchCard = contentToCheck.includes('data-type="match-card"') ||
                          contentToCheck.includes('[매치카드]') ||
                          contentToCheck.includes('match-card');
      
      // 이미지 확인 (다양한 형식)
      const hasImage = contentToCheck.includes('<img') || 
                      contentToCheck.includes('![') ||
                      contentToCheck.includes('image') ||
                      /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i.test(contentToCheck) ||
                      hasSpecialContent;
      
      // 비디오 확인
      const hasVideo = contentToCheck.includes('<video') || 
                      contentToCheck.includes('mp4') ||
                      contentToCheck.includes('webm') ||
                      contentToCheck.includes('mov') ||
                      /\.(mp4|webm|mov|avi|mkv|flv|wmv)/i.test(contentToCheck);
      
      // YouTube 확인 (더 정확한 패턴)
      const hasYoutube = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)/i.test(contentToCheck) ||
                        contentToCheck.includes('youtube') ||
                        hasSocialEmbed;
      
      // 링크 확인 (http/https 링크)
      const hasLink = /https?:\/\/[^\s<>"]+/i.test(contentToCheck) ||
                     contentToCheck.includes('href=') ||
                     hasSocialEmbed ||
                     hasMatchCard;
      
      return { hasImage, hasVideo, hasYoutube, hasLink };
    } catch {
      return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
    }
  }, []);

  // 컨텐츠 타입 아이콘 렌더링 (메모이제이션)
  const renderContentTypeIcons = useCallback((post: Post) => {
    if (!post.content) return null;
    
    const { hasImage, hasVideo, hasYoutube, hasLink } = checkContentType(post.content);
    
    // 아이콘이 하나도 없으면 null 반환
    if (!hasImage && !hasVideo && !hasYoutube && !hasLink && post.comment_count === 0) {
      return null;
    }
    
    return (
      <div className="inline-flex items-center space-x-1 ml-1">
        {hasImage && (
          <div title="이미지 포함">
            <ImageIcon className="h-3 w-3 text-green-500 flex-shrink-0" />
          </div>
        )}
        {hasVideo && (
          <div title="동영상 포함">
            <VideoIcon className="h-3 w-3 text-purple-500 flex-shrink-0" />
          </div>
        )}
        {hasYoutube && (
          <div title="YouTube 동영상">
            <YoutubeIcon className="h-3 w-3 text-red-500 flex-shrink-0" />
          </div>
        )}
        {hasLink && (
          <div title="링크 포함">
            <LinkIcon className="h-3 w-3 text-blue-500 flex-shrink-0" />
          </div>
        )}
        {post.comment_count > 0 && (
          <span 
            className="text-xs text-orange-600 font-medium ml-0.5 flex-shrink-0"
            title={`댓글 ${post.comment_count}개`}
          >
            [{post.comment_count}]
          </span>
        )}
      </div>
    );
  }, [checkContentType]);
  
  // 사용자 아이콘 렌더링 함수 (메모이제이션)
  const renderAuthor = useCallback((post: Post, size: number, containerClass: string) => {
    return (
      <div className={`flex items-center ${containerClass}`}>
        <div className="mr-0.5 flex items-center justify-center overflow-hidden">
          <UserIconComponent
            iconUrl={post.author_icon_url}
            level={post.author_level || 1}
            size={size}
            alt={post.author_nickname || '익명'}
          />
        </div>
        <span className="truncate text-xs text-gray-600" 
              title={post.author_nickname || '익명'} 
              style={{maxWidth: size === 20 ? '100px' : '100px'}}>
          {post.author_nickname || '익명'}
        </span>
      </div>
    );
  }, []);

  // 게시판 로고 렌더링 함수 (메모이제이션)
  const renderBoardLogo = useCallback((post: Post) => {
    if (post.team_logo || post.league_logo) {
      return (
        <div className="flex items-center">
          <div className="relative w-5 h-5 mr-1">
            <Image 
              src={post.team_logo || post.league_logo || ''}
              alt={post.board_name}
              fill
              sizes="20px"
              className="object-contain absolute inset-0"
              loading="lazy"
              priority={false}
            />
          </div>
          <span className="text-xs text-gray-700 truncate" 
                title={post.board_name} 
                style={{maxWidth: '85px'}}>
            {post.board_name}
          </span>
        </div>
      );
    } else {
      return (
        <span className="inline-block text-xs bg-gray-100 px-1.5 py-0.5 rounded-full truncate" 
              title={post.board_name} 
              style={{maxWidth: '90px'}}>
          {post.board_name}
        </span>
      );
    }
  }, []);

  // (삭제) 개별 배지 렌더러는 사용하지 않음

  // 콘텐츠에서 첫 이미지 URL 추출(간단 버전). 공용 유틸로 추출 예정.
  const extractFirstImageUrl = useCallback((content?: string): string | null => {
    if (!content) return null;
    try {
      if (content.trim().startsWith('{')) {
        try {
          const obj = JSON.parse(content);
          if (obj?.type === 'doc' && Array.isArray(obj.content)) {
            for (const node of obj.content) {
              if (node?.type === 'image' && node?.attrs?.src) return node.attrs.src as string;
              if (node?.type === 'paragraph' && Array.isArray(node.content)) {
                for (const sub of node.content) {
                  if (sub?.type === 'image' && sub?.attrs?.src) return sub.attrs.src as string;
                }
              }
            }
          }
          if (obj?.imageUrl) return obj.imageUrl as string;
          if (obj?.image_url) return obj.image_url as string;
        } catch {}
      }
      const imgTag = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
      if (imgTag?.[1]) return imgTag[1];
      const mdImg = content.match(/!\[[^\]]*\]\(([^)]+)\)/i);
      if (mdImg?.[1]) return mdImg[1];
      const url = content.match(/(https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|gif|webp))/i);
      if (url?.[1]) return url[1];
    } catch {}
    return null;
  }, []);

  // 가상화 사용 여부 결정 (30개 이상일 때 가상화 적용) - deferredPosts 사용
  const useVirtualization = deferredPosts.length > 30;
  
  // 가상화된 리스트 데이터 메모이제이션 - deferredPosts 사용
  const virtualizedData = useMemo(() => ({
    posts: deferredPosts,
    currentPostId,
    currentBoardId,
    showBoard,
    isMobile,
    renderContentTypeIcons,
    renderAuthor,
    renderBoardLogo,
    variant,
    extractFirstImageUrl
  }), [deferredPosts, currentPostId, currentBoardId, showBoard, isMobile, renderContentTypeIcons, renderAuthor, renderBoardLogo, variant, extractFirstImageUrl]);

  // 가상화된 모바일 뷰 렌더링
  const virtualizedMobileContent = useMemo(() => {
    if (!isMobile || !useVirtualization) return null;
    
    // 🔧 모바일에서 maxHeight 처리 개선
    let height = 400; // 기본값
    if (maxHeight) {
      if (maxHeight.startsWith('sm:')) {
        // sm: prefix가 있으면 모바일에서는 높이 제한 없음
        height = Math.min(deferredPosts.length * 80 + 100, 600); // 최대 600px로 제한
      } else {
        height = parseInt(maxHeight.replace('px', ''));
      }
    }
    
    return (
      <div className="block sm:hidden">
        <List
          height={height}
          itemCount={deferredPosts.length}
          itemSize={80} // 각 아이템의 높이
          itemData={virtualizedData}
          overscanCount={5} // 성능 최적화를 위한 오버스캔
          width="100%" // width 속성 추가
        >
          {VirtualizedPostItem}
        </List>
      </div>
    );
  }, [isMobile, useVirtualization, maxHeight, deferredPosts.length, virtualizedData]);

  // 가상화된 데스크톱 뷰 렌더링
  const virtualizedDesktopContent = useMemo(() => {
    if (isMobile || !useVirtualization) return null;
    
    // 🔧 데스크톱에서 maxHeight 처리
    let height = 400; // 기본값
    if (maxHeight) {
      if (maxHeight.startsWith('sm:')) {
        // sm: prefix가 있으면 sm: 제거하고 사용
        height = parseInt(maxHeight.replace('sm:', '').replace('px', ''));
      } else {
        height = parseInt(maxHeight.replace('px', ''));
      }
    }
    
    return (
      <div className="hidden sm:block">
        {/* 테이블 헤더 */}
        <div className="flex border-b bg-gray-50">
          {showBoard && (
            <div className="py-2 px-3 text-center text-sm font-medium text-gray-500" style={{ width: '120px' }}>게시판</div>
          )}
          <div className="py-2 px-4 text-center text-sm font-medium text-gray-500 flex-1">제목</div>
          <div className="py-2 px-3 text-center text-sm font-medium text-gray-500" style={{ width: '120px' }}>글쓴이</div>
          <div className="py-2 px-1 text-center text-sm font-medium text-gray-500" style={{ width: '80px' }}>날짜</div>
          <div className="py-2 px-1 text-center text-sm font-medium text-gray-500" style={{ width: '60px' }}>조회</div>
          <div className="py-2 px-1 text-center text-sm font-medium text-gray-500" style={{ width: '60px' }}>추천</div>
        </div>
        
        {/* 가상화된 리스트 */}
        <List
          height={height - 40} // 헤더 높이 제외
          itemCount={deferredPosts.length}
          itemSize={50} // 각 행의 높이
          itemData={virtualizedData}
          overscanCount={5}
          width="100%" // width 속성 추가
        >
          {VirtualizedPostItem}
        </List>
      </div>
    );
  }, [isMobile, useVirtualization, maxHeight, showBoard, deferredPosts.length, virtualizedData]);

  // 일반 모바일 뷰 렌더링 - 메모이제이션 + deferredPosts 사용
  const mobileContent = useMemo(() => {
    if (!isMobile || useVirtualization) return null;
    
    return (
      <div className="block sm:hidden">
        <div>
          {deferredPosts.map((post, index) => (
            <PostItem
              key={post.id}
              post={post}
              isLast={index === deferredPosts.length - 1}
              currentPostId={currentPostId}
              currentBoardId={currentBoardId}
              showBoard={showBoard}
              isMobile={true}
              renderContentTypeIcons={renderContentTypeIcons}
              renderAuthor={renderAuthor}
              renderBoardLogo={renderBoardLogo}
              variant={variant}
              extractFirstImageUrl={extractFirstImageUrl}
            />
          ))}
        </div>
      </div>
    );
  }, [isMobile, useVirtualization, deferredPosts, currentPostId, currentBoardId, showBoard, renderContentTypeIcons, renderAuthor, renderBoardLogo, extractFirstImageUrl, variant]);

  // 일반 데스크톱 뷰 렌더링 - 메모이제이션 + deferredPosts 사용
  const desktopContent = useMemo(() => {
    if (isMobile || useVirtualization) return null;
    
    return (
      <div className="hidden sm:block overflow-x-auto">
        {/* 이미지형 테이블은 헤더 제거, 텍스트형은 기존 테이블 유지 */}
        {variant === 'image-table' ? (
          <div>
            {deferredPosts.map((post, index) => (
              <PostItem
                key={post.id}
                post={post}
                isLast={index === deferredPosts.length - 1}
                currentPostId={currentPostId}
                currentBoardId={currentBoardId}
                showBoard={showBoard}
                isMobile={false}
                renderContentTypeIcons={renderContentTypeIcons}
                renderAuthor={renderAuthor}
                renderBoardLogo={renderBoardLogo}
                variant={variant}
                extractFirstImageUrl={extractFirstImageUrl}
              />
            ))}
          </div>
        ) : (
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
            {deferredPosts.map((post, index) => (
              <PostItem
                key={post.id}
                post={post}
                isLast={index === deferredPosts.length - 1}
                currentPostId={currentPostId}
                currentBoardId={currentBoardId}
                showBoard={showBoard}
                isMobile={false}
                renderContentTypeIcons={renderContentTypeIcons}
                renderAuthor={renderAuthor}
                renderBoardLogo={renderBoardLogo}
                  variant={variant}
                  extractFirstImageUrl={extractFirstImageUrl}
              />
            ))}
          </tbody>
        </table>
        )}
      </div>
    );
  }, [isMobile, useVirtualization, deferredPosts, showBoard, boardNameMaxWidth, currentPostId, currentBoardId, renderContentTypeIcons, renderAuthor, renderBoardLogo, extractFirstImageUrl, variant]);

  return (
    <div className={`mb-4 bg-white rounded-lg border overflow-hidden ${className}`}>
      {headerContent && (
        <div className="px-6 py-4">
          {headerContent}
        </div>
      )}
      
      <ScrollArea 
        className={`h-full ${isMobile && maxHeight?.startsWith('sm:') ? '' : ''}`}
        style={{ 
          maxHeight: (() => {
            if (!maxHeight) return 'none';
            
            // 🔧 모바일에서 sm: prefix 처리
            if (isMobile && maxHeight.startsWith('sm:')) {
              return 'none'; // 모바일에서는 높이 제한 없음
            }
            
            // 데스크톱에서 sm: prefix 제거
            if (maxHeight.startsWith('sm:')) {
              return maxHeight.replace('sm:', '');
            }
            
            return maxHeight;
          })()
        }}
      >
        {deferredLoading ? (
          <LoadingSkeleton />
        ) : deferredPosts.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <>
            {/* 가상화된 컨텐츠 (30개 이상일 때) */}
            {virtualizedMobileContent}
            {virtualizedDesktopContent}
            
            {/* 일반 컨텐츠 (30개 미만일 때) */}
            {mobileContent}
            {desktopContent}
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