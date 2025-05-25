'use client';

import React, { useState, useEffect, useCallback, useMemo, startTransition, useDeferredValue } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FixedSizeList as List } from 'react-window';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Image as ImageIcon, Link as LinkIcon, Video as VideoIcon, Youtube as YoutubeIcon } from 'lucide-react';
import { formatDate } from '@/domains/boards/utils/post/postUtils';
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
  };
}) {
  const { posts, currentPostId, currentBoardId, showBoard, isMobile, renderContentTypeIcons, renderAuthor, renderBoardLogo } = data;
  const post = posts[index];
  
  // Hook을 조건부가 아닌 항상 호출하도록 수정
  const formattedDate = useMemo(() => {
    if (!post?.created_at) return '';
    return formatDate(post.created_at);
  }, [post?.created_at]);
  
  if (!post) return null;
  
  const isCurrentPost = post.id === currentPostId;
  const href = `/boards/${post.board_slug}/${post.post_number}?from=${currentBoardId}`;
  
  if (isMobile) {
    return (
      <div style={style} className={`py-2 px-3 border-b ${isCurrentPost ? 'bg-blue-50' : ''}`}>
        <Link href={href} prefetch={false}>
          <div className="space-y-1">
            <div>
              <div className="flex flex-wrap items-center">
                <span className={`text-sm ${isCurrentPost ? 'text-blue-600 font-medium' : ''}`}>
                  {String(post?.title || '제목 없음')}
                </span>
                {renderContentTypeIcons(post)}
              </div>
            </div>
            
            <div className="flex text-[11px] text-gray-500">
              <div className="w-full grid grid-cols-[1fr_auto] gap-2">
                <div className="flex items-center overflow-hidden whitespace-nowrap">
                  {showBoard && (
                    <span className="truncate max-w-[100px] inline-block">{post.board_name}</span>
                  )}
                  <span className="mx-1 flex-shrink-0">|</span>
                  <span className="flex-shrink-0 flex items-center">
                    {renderAuthor(post, 20, "justify-start")}
                  </span>
                  <span className="mx-1 flex-shrink-0">|</span>
                  <span className="flex-shrink-0">{formattedDate}</span>
                </div>
                <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                  <span>조회 {post.views || 0}</span>
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
      <div className="py-2 px-4 flex-1 flex items-center">
        <Link href={href} className="block w-full" prefetch={false}>
          <div className="flex items-center">
            <span className={`text-sm hover:text-blue-600 line-clamp-1 ${isCurrentPost ? 'text-blue-600 font-medium' : ''}`}>
              {String(post?.title || '제목 없음')}
            </span>
            {renderContentTypeIcons(post)}
          </div>
        </Link>
      </div>
      <div className="py-2 px-2 flex items-center justify-center" style={{ width: '120px' }}>
        {renderAuthor(post, 24, "justify-start")}
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
  renderBoardLogo
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
}) {
  const isCurrentPost = post.id === currentPostId;
  const href = `/boards/${post.board_slug}/${post.post_number}?from=${currentBoardId}`;
  
  // 날짜 포맷팅 메모이제이션
  const formattedDate = useMemo(() => formatDate(post.created_at), [post.created_at]);
  
  if (isMobile) {
    return (
      <div className={`py-2 px-3 ${!isLast ? 'border-b' : ''} ${isCurrentPost ? 'bg-blue-50' : ''}`}>
        <Link href={href} prefetch={false}>
          <div className="space-y-1">
            <div>
              <div className="flex flex-wrap items-center">
                <span className={`text-sm ${isCurrentPost ? 'text-blue-600 font-medium' : ''}`}>
                  {String(post?.title || '제목 없음')}
                </span>
                {renderContentTypeIcons(post)}
              </div>
            </div>
            
            <div className="flex text-[11px] text-gray-500">
              <div className="w-full grid grid-cols-[1fr_auto] gap-2">
                <div className="flex items-center overflow-hidden whitespace-nowrap">
                  {showBoard && (
                    <span className="truncate max-w-[100px] inline-block">{post.board_name}</span>
                  )}
                  <span className="mx-1 flex-shrink-0">|</span>
                  <span className="flex-shrink-0 flex items-center">
                    {renderAuthor(post, 20, "justify-start")}
                  </span>
                  <span className="mx-1 flex-shrink-0">|</span>
                  <span className="flex-shrink-0">{formattedDate}</span>
                </div>
                <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                  <span>조회 {post.views || 0}</span>
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
    <tr className={`${!isLast ? 'border-b' : ''} hover:bg-gray-50 ${isCurrentPost ? 'bg-blue-50' : ''}`}>
      {showBoard && (
        <td className="py-2 px-3 align-middle">
          {renderBoardLogo(post)}
        </td>
      )}
      <td className="py-2 px-4 align-middle">
        <Link href={href} className="block w-full" prefetch={false}>
          <div className="flex items-center">
            <span className={`text-sm hover:text-blue-600 line-clamp-1 ${isCurrentPost ? 'text-blue-600 font-medium' : ''}`}>
              {String(post?.title || '제목 없음')}
            </span>
            {renderContentTypeIcons(post)}
          </div>
        </Link>
      </td>
      <td className="py-2 px-2 text-center text-xs text-gray-500 align-middle">
        {renderAuthor(post, 24, "justify-start")}
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
  boardNameMaxWidth = "100px"
}: PostListProps) {
  // 모바일 화면인지 확인하는 상태 - 디바운스 적용
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
      const hasImage = content.includes('<img') || content.includes('![');
      const hasVideo = content.includes('<video') || content.includes('mp4');
      const hasYoutube = content.includes('youtube.com') || content.includes('youtu.be');
      const hasLink = content.includes('http://') || content.includes('https://');
      
      return { hasImage, hasVideo, hasYoutube, hasLink };
    } catch {
      return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
    }
  }, []);

  // 컨텐츠 타입 아이콘 렌더링 (메모이제이션)
  const renderContentTypeIcons = useCallback((post: Post) => {
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
    renderBoardLogo
  }), [deferredPosts, currentPostId, currentBoardId, showBoard, isMobile, renderContentTypeIcons, renderAuthor, renderBoardLogo]);

  // 가상화된 모바일 뷰 렌더링
  const virtualizedMobileContent = useMemo(() => {
    if (!isMobile || !useVirtualization) return null;
    
    const height = maxHeight ? parseInt(maxHeight.replace('px', '')) : 400;
    
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
    
    const height = maxHeight ? parseInt(maxHeight.replace('px', '')) : 400;
    
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
            />
          ))}
        </div>
      </div>
    );
  }, [isMobile, useVirtualization, deferredPosts, currentPostId, currentBoardId, showBoard, renderContentTypeIcons, renderAuthor, renderBoardLogo]);

  // 일반 데스크톱 뷰 렌더링 - 메모이제이션 + deferredPosts 사용
  const desktopContent = useMemo(() => {
    if (isMobile || useVirtualization) return null;
    
    return (
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
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [isMobile, useVirtualization, deferredPosts, showBoard, boardNameMaxWidth, currentPostId, currentBoardId, renderContentTypeIcons, renderAuthor, renderBoardLogo]);

  return (
    <div className={`mb-4 bg-white rounded-lg border overflow-hidden ${className}`}>
      {headerContent && (
        <div className="px-6 py-4">
          {headerContent}
        </div>
      )}
      
      <ScrollArea 
        className="h-full" 
        style={{ maxHeight: maxHeight ? maxHeight : 'none' }}
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