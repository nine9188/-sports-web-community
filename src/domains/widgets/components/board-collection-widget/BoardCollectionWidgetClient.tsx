'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { BoardCollectionData } from './types';

// 상수 정의
const POSTS_PER_PAGE = 10;

// 타입 정의
type Post = BoardCollectionData['recentPosts'][number];

interface BoardCollectionWidgetClientProps {
  boardsData: BoardCollectionData[];
}

// 게시판 로고 컴포넌트
const BoardLogo = ({ post }: { post: Post }) => {
  if (post.team_logo || post.league_logo) {
    return (
      <div className="flex items-center">
        <div className="relative w-4 h-4 mr-1 flex-shrink-0">
          <Image
            src={post.team_logo || post.league_logo || ''}
            alt={post.board_name}
            fill
            sizes="16px"
            className="object-contain"
            loading="lazy"
          />
        </div>
        <span
          className="text-[10px] text-gray-700 dark:text-gray-300 truncate max-w-[60px]"
          title={post.board_name}
        >
          {post.board_name}
        </span>
      </div>
    );
  }

  return (
    <span
      className="inline-block text-[10px] bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full truncate flex-shrink-0 max-w-[70px]"
      title={post.board_name}
    >
      {post.board_name}
    </span>
  );
};

// 댓글 수 컴포넌트
const CommentCount = ({ count }: { count: number }) => {
  if (count <= 0) return null;

  return (
    <span
      className="text-xs text-orange-600 dark:text-orange-400 font-medium flex-shrink-0"
      title={`댓글 ${count}개`}
    >
      [{count}]
    </span>
  );
};

// 게시글 아이템 컴포넌트 (중복 제거)
const PostItem = ({ post, isLast }: { post: Post; isLast: boolean }) => (
  <Link
    href={`/boards/${post.board_slug}/${post.post_number}`}
    className={`text-xs text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4 flex items-center gap-2 min-w-0 ${
      isLast ? '' : 'border-b border-black/5 dark:border-white/10'
    }`}
  >
    <div className="flex-shrink-0">
      <BoardLogo post={post} />
    </div>
    <span className="flex-1 min-w-0 line-clamp-1">{post.title}</span>
    <CommentCount count={post.comment_count} />
  </Link>
);

export default function BoardCollectionWidgetClient({ boardsData }: BoardCollectionWidgetClientProps) {
  // 현재 선택된 게시판 인덱스 (데스크톱/모바일 공용)
  const [selectedBoardIndex, setSelectedBoardIndex] = useState(0);

  const currentBoardData = boardsData[selectedBoardIndex];
  const totalBoards = boardsData.length;

  // 다음 게시판
  const handleNext = () => {
    setSelectedBoardIndex((prev) => (prev + 1) % totalBoards);
  };

  // 이전 게시판
  const handlePrev = () => {
    setSelectedBoardIndex((prev) => (prev - 1 + totalBoards) % totalBoards);
  };

  // 현재 게시판에 게시글이 없으면 메시지 표시
  const hasNoPosts =
    !currentBoardData ||
    (currentBoardData.recentPosts.length === 0 && currentBoardData.popularPosts.length === 0);

  return (
    <>
      {/* 데스크톱 버전 */}
      <Container className="hidden md:block bg-white dark:bg-[#1D1D1D]">
        {/* 헤더 */}
        <ContainerHeader className="justify-between">
          <ContainerTitle>게시판</ContainerTitle>
          {/* 페이지네이션 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedBoardIndex + 1} / {totalBoards}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              aria-label="이전"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              aria-label="다음"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </ContainerHeader>

        {/* 게시판 탭 */}
        <div className="flex border-b border-black/5 dark:border-white/10">
          {boardsData.map((data, index) => (
            <Button
              key={data.board.id}
              variant="ghost"
              onClick={() => setSelectedBoardIndex(index)}
              className={`flex-1 text-xs py-2 px-1 h-auto rounded-none whitespace-nowrap ${
                index === selectedBoardIndex
                  ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-[#262626] dark:border-[#F0F0F0] font-medium text-gray-900 dark:text-[#F0F0F0]'
                  : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              }`}
            >
              {data.board.name}
            </Button>
          ))}
        </div>

        {/* 컨텐츠 */}
        <div>
          {hasNoPosts ? (
            <div className="text-center py-8 text-gray-500">
              <p>아직 게시글이 없습니다.</p>
            </div>
          ) : (
            /* 텍스트 목록 2열: 왼쪽(1~10) / 오른쪽(11~20) */
            <div className="grid grid-cols-2">
              {/* 왼쪽 열: 1~10번 */}
              <div className="flex flex-col border-r border-black/5 dark:border-white/10">
                {currentBoardData.recentPosts.slice(0, POSTS_PER_PAGE).map((post, index) => (
                  <PostItem
                    key={post.id}
                    post={post}
                    isLast={index === POSTS_PER_PAGE - 1}
                  />
                ))}
              </div>

              {/* 오른쪽 열: 11~20번 */}
              <div className="flex flex-col">
                {currentBoardData.recentPosts
                  .slice(POSTS_PER_PAGE, POSTS_PER_PAGE * 2)
                  .map((post, index) => (
                    <PostItem
                      key={post.id}
                      post={post}
                      isLast={index === POSTS_PER_PAGE - 1}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </Container>

      {/* 모바일 버전 - ContainerHeader + 탭 패턴 */}
      <Container className="md:hidden bg-white dark:bg-[#1D1D1D]">
        {/* ContainerHeader - h-12 */}
        <ContainerHeader className="justify-between">
          <ContainerTitle>게시판</ContainerTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {selectedBoardIndex + 1} / {totalBoards}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              aria-label="이전 게시판"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              aria-label="다음 게시판"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </ContainerHeader>

        {/* 게시판 탭 (균등 배분) */}
        <div className="flex border-b border-black/5 dark:border-white/10">
          {boardsData.map((data, index) => (
            <Button
              key={data.board.id}
              variant="ghost"
              onClick={() => setSelectedBoardIndex(index)}
              className={`flex-1 text-xs py-2 px-1 h-auto rounded-none whitespace-nowrap ${
                index === selectedBoardIndex
                  ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-[#262626] dark:border-[#F0F0F0] font-medium text-gray-900 dark:text-[#F0F0F0]'
                  : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              }`}
            >
              {data.board.name}
            </Button>
          ))}
        </div>

        {/* 게시글 목록 */}
        <div className="flex flex-col">
          {hasNoPosts ? (
            <div className="text-center py-8 text-gray-500">
              <p>아직 게시글이 없습니다.</p>
            </div>
          ) : (
            currentBoardData.recentPosts.slice(0, POSTS_PER_PAGE).map((post, index) => (
              <PostItem
                key={post.id}
                post={post}
                isLast={index === POSTS_PER_PAGE - 1 || index === currentBoardData.recentPosts.length - 1}
              />
            ))
          )}
        </div>
      </Container>
    </>
  );
}
