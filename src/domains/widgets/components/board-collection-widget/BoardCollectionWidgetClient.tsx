'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BoardCollectionData } from './types';

interface BoardCollectionWidgetClientProps {
  boardsData: BoardCollectionData[];
}

const BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

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
  const hasNoPosts = !currentBoardData || currentBoardData.posts.length === 0;

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* 헤더: 게시판 탭 + 페이지네이션 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        {/* 게시판 탭 */}
        <div className="flex items-center gap-4 flex-1 min-w-0 overflow-x-auto whitespace-nowrap pr-2">
          {boardsData.map((data, index) => (
            <button
              key={data.board.id}
              onClick={() => {
                setSelectedBoardIndex(index);
                setPage(index);
              }}
              className={`text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                index === selectedBoardIndex
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {data.board.name}
            </button>
          ))}
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-sm text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={handlePrev}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="이전"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="다음"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="p-4">
        {hasNoPosts ? (
          <div className="text-center py-8 text-gray-500">
            <p>아직 게시글이 없습니다.</p>
          </div>
        ) : currentBoardData.featuredImages.length > 0 ? (
          /* 이미지 있으면 */
          <div>
            {/* PC: 세로 2개 연속 (이미지+텍스트 5개 x 2) */}
            <div className="hidden md:flex md:flex-col gap-4">
              {/* 첫 번째 블록: 이미지 게시글 1 + 텍스트 1~5 */}
              <div className="flex gap-4">
                <div className="w-32 flex-shrink-0">
                  <Link
                    href={`/boards/${currentBoardData.posts[0].board_slug}/${currentBoardData.posts[0].post_number}`}
                    className="group h-full flex flex-col"
                  >
                    <div className="relative rounded-lg overflow-hidden mb-2 flex-1">
                      <Image
                        src={currentBoardData.featuredImages[0]}
                        alt={currentBoardData.posts[0].title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="128px"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    </div>
                    <p className="text-xs font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {currentBoardData.posts[0].title}
                    </p>
                  </Link>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  {/* 이미지 게시글 제외한 1~5번째 텍스트 */}
                  {currentBoardData.posts.slice(currentBoardData.featuredImages.length, currentBoardData.featuredImages.length + 5).map((post) => (
                    <Link
                      key={post.id}
                      href={`/boards/${post.board_slug}/${post.post_number}`}
                      className="text-sm hover:text-blue-600 transition-colors line-clamp-1"
                    >
                      {post.title}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 두 번째 블록: 이미지 게시글 2 + 텍스트 6~10 (이미지 2개 있을 때만) */}
              {currentBoardData.featuredImages.length > 1 ? (
                <div className="flex gap-4">
                  <div className="w-32 flex-shrink-0">
                    <Link
                      href={`/boards/${currentBoardData.posts[1].board_slug}/${currentBoardData.posts[1].post_number}`}
                      className="group h-full flex flex-col"
                    >
                      <div className="relative rounded-lg overflow-hidden mb-2 flex-1">
                        <Image
                          src={currentBoardData.featuredImages[1]}
                          alt={currentBoardData.posts[1].title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="128px"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                      </div>
                      <p className="text-xs font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {currentBoardData.posts[1].title}
                      </p>
                    </Link>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    {/* 이미지 게시글 2개 제외한 6~10번째 텍스트 */}
                    {currentBoardData.posts.slice(currentBoardData.featuredImages.length + 5, currentBoardData.featuredImages.length + 10).map((post) => (
                      <Link
                        key={post.id}
                        href={`/boards/${post.board_slug}/${post.post_number}`}
                        className="text-sm hover:text-blue-600 transition-colors line-clamp-1"
                      >
                        {post.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* 모바일: 상단 이미지 2개 + 하단 텍스트 5개 */}
            <div className="md:hidden">
              {/* 상단 이미지 2개 */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {currentBoardData.posts.slice(0, 2).map((post, idx) => (
                  <Link
                    key={post.id}
                    href={`/boards/${post.board_slug}/${post.post_number}`}
                    className="block group"
                  >
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-1">
                      {currentBoardData.featuredImages[idx] ? (
                        <Image
                          src={currentBoardData.featuredImages[idx]}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="50vw"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">이미지 없음</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </p>
                  </Link>
                ))}
              </div>

              {/* 하단 텍스트 5개 */}
              <div className="flex flex-col">
                {currentBoardData.posts.slice(2, 7).map((post, idx) => (
                  <Link
                    key={post.id}
                    href={`/boards/${post.board_slug}/${post.post_number}`}
                    className={`text-sm hover:text-blue-600 transition-colors py-2 truncate ${idx !== 4 ? 'border-b border-gray-200' : ''}`}
                  >
                    {post.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 이미지 없으면: 글 목록만 7개 */
          <div className="flex flex-col">
            {currentBoardData.posts.slice(0, 7).map((post, idx) => (
              <Link
                key={post.id}
                href={`/boards/${post.board_slug}/${post.post_number}`}
                className={`text-sm hover:text-blue-600 transition-colors py-2 truncate md:line-clamp-1 ${idx !== 6 ? 'border-b border-gray-200' : ''}`}
              >
                {post.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
