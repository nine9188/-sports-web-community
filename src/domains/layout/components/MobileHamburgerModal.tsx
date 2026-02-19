'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { Board } from '../types/board';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { Button } from '@/shared/components/ui';
import ClientBoardNavigation from '@/domains/sidebar/components/board/ClientBoardNavigation';
import KakaoAd from '@/shared/components/KakaoAd';

interface MobileHamburgerModalProps {
  boards: Board[];
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  totalPostCount?: number;
}

const MobileHamburgerModal = React.memo(function MobileHamburgerModal({
  boards,
  isOpen,
  onClose,
  isAdmin = false,
  totalPostCount
}: MobileHamburgerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const flattenBoards = (boardList: Board[]): Board[] => {
    const result: Board[] = [];
    boardList.forEach((board) => {
      result.push(board);
      if (board.children && board.children.length > 0) {
        result.push(...flattenBoards(board.children));
      }
    });
    return result;
  };

  const allBoards = flattenBoards(boards);
  const trimmedSearchTerm = searchTerm.trim();
  const filteredBoards = trimmedSearchTerm
    ? allBoards.filter((board) =>
        board.name.toLowerCase().includes(trimmedSearchTerm.toLowerCase())
      )
    : [];

  // SSR 보호: 클라이언트 마운트 후에만 포털 사용
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[999] md:hidden"
          onClick={onClose}
        />
      )}

      {/* 햄버거 메뉴 모달 */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#1D1D1D] transform transition-transform duration-300 ease-in-out z-[1000] md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* 헤더 - 고정 */}
        <div className="flex items-center justify-between p-4 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0]">게시판 선택</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-md h-9 w-9"
            aria-label="메뉴 닫기"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* 테마 토글 - 고정 */}
        <div className="p-4 border-b border-black/7 dark:border-white/10 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">테마 설정</span>
          <ThemeToggle />
        </div>

        {/* 검색 - 고정 */}
        <div className="p-4 border-b border-black/5 dark:border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="게시판 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-black/7 dark:border-white/10 rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] transition-colors duration-200 text-sm bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* 카카오 광고 */}
        <div className="flex justify-center py-2 border-b border-black/5 dark:border-white/10">
          <KakaoAd
            adUnit="DAN-xQCe8VgP6G8I1XtL"
            adWidth={320}
            adHeight={50}
          />
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          {trimmedSearchTerm ? (
            <div className="pb-4">
              {filteredBoards.length > 0 ? (
                filteredBoards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/boards/${board.slug || board.id}`}
                    onClick={onClose}
                    className="block px-4 py-3 text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
                  >
                    {board.name}
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          ) : (
            <div className="pb-4">
              <ClientBoardNavigation
                initialData={{ rootBoards: boards, totalPostCount }}
                onNavigate={onClose}
                showAdminLink={isAdmin}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default MobileHamburgerModal;
