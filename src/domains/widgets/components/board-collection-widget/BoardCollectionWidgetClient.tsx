'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BoardCollectionData } from './types';

interface BoardCollectionWidgetClientProps {
  boardsData: BoardCollectionData[];
}

export default function BoardCollectionWidgetClient({ boardsData }: BoardCollectionWidgetClientProps) {
  const [selectedBoardIndex, setSelectedBoardIndex] = useState(0);
  const [page, setPage] = useState(0);

  const currentBoardData = boardsData[selectedBoardIndex];
  const totalPages = boardsData.length;

  // 다음 게시판
  const handleNext = () => {
    setSelectedBoardIndex((prev) => (prev + 1) % totalPages);
    setPage((prev) => (prev + 1) % totalPages);
  };

  // 이전 게시판
  const handlePrev = () => {
    setSelectedBoardIndex((prev) => (prev - 1 + totalPages) % totalPages);
    setPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  // 현재 게시판에 게시글이 없으면 메시지 표시
  const hasNoPosts = !currentBoardData ||
    (currentBoardData.recentPosts.length === 0 && currentBoardData.popularPosts.length === 0);

  // 게시판 로고 렌더링 함수 (위젯에 맞게 컴팩트하게)
  const renderBoardLogo = (post: BoardCollectionData['recentPosts'][0]) => {
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
          <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate"
                title={post.board_name}
                style={{maxWidth: '60px'}}>
            {post.board_name}
          </span>
        </div>
      );
    } else {
      return (
        <span className="inline-block text-[10px] bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full truncate flex-shrink-0"
              title={post.board_name}
              style={{maxWidth: '70px'}}>
          {post.board_name}
        </span>
      );
    }
  };

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
        <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">게시판</h3>
        {/* 페이지네이션 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={handlePrev}
            className="p-1 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-700 dark:text-gray-300"
            aria-label="이전"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-700 dark:text-gray-300"
            aria-label="다음"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 게시판 탭 */}
      <div className="flex border-b border-black/5 dark:border-white/10">
        {boardsData.map((data, index) => (
          <button
            key={data.board.id}
            onClick={() => {
              setSelectedBoardIndex(index);
              setPage(index);
            }}
            className={`flex-1 text-[10px] md:text-xs py-2 px-1 transition-colors whitespace-nowrap ${
              index === selectedBoardIndex
                ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-slate-800 dark:border-white font-medium text-gray-900 dark:text-[#F0F0F0]'
                : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
          >
            {data.board.name}
          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* 왼쪽 열: 1~10번 */}
            <div className="flex flex-col">
              {currentBoardData.recentPosts.slice(0, 10).map((post, index) => (
                <Link
                  key={post.id}
                  href={`/boards/${post.board_slug}/${post.post_number}`}
                  className={`text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4 flex items-center gap-2 min-w-0 ${
                    index === 9 ? '' : 'border-b border-black/5 dark:border-white/10'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {renderBoardLogo(post)}
                  </div>
                  <span className="flex-1 min-w-0 line-clamp-1">{post.title}</span>
                  {post.comment_count > 0 && (
                    <span 
                      className="text-xs text-orange-600 dark:text-orange-400 font-medium flex-shrink-0"
                      title={`댓글 ${post.comment_count}개`}
                    >
                      [{post.comment_count}]
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* 오른쪽 열: 11~20번 */}
            <div className="flex flex-col">
              {currentBoardData.recentPosts.slice(10, 20).map((post, index) => (
                <Link
                  key={post.id}
                  href={`/boards/${post.board_slug}/${post.post_number}`}
                  className={`text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4 flex items-center gap-2 min-w-0 ${
                    index === 9 ? '' : 'border-b border-black/5 dark:border-white/10'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {renderBoardLogo(post)}
                  </div>
                  <span className="flex-1 min-w-0 line-clamp-1">{post.title}</span>
                  {post.comment_count > 0 && (
                    <span 
                      className="text-xs text-orange-600 dark:text-orange-400 font-medium flex-shrink-0"
                      title={`댓글 ${post.comment_count}개`}
                    >
                      [{post.comment_count}]
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
