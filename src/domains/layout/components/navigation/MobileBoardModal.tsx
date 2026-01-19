'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, X, ShoppingBag, Search, FileText, Flame } from 'lucide-react';
import { Board } from '../../types/board';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { Button } from '@/shared/components/ui';

interface MobileBoardModalProps {
  boards: Board[];
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const MobileBoardModal = React.memo(function MobileBoardModal({
  boards,
  isOpen,
  onClose,
  isAdmin = false
}: MobileBoardModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(() => {
    // 초기 상태에서 1단계 게시판들은 모두 펼쳐진 상태로 설정
    const initialExpanded = new Set<string>();
    boards.forEach(board => {
      if (board.children && board.children.length > 0) {
        initialExpanded.add(board.id);
      }
    });
    return initialExpanded;
  });
  const router = useRouter();

  // 모든 게시판을 평면화하여 검색 가능하게 만들기
  const flattenBoards = (boards: Board[]): Board[] => {
    const result: Board[] = [];
    boards.forEach(board => {
      result.push(board);
      if (board.children) {
        result.push(...flattenBoards(board.children));
      }
    });
    return result;
  };

  const allBoards = flattenBoards(boards);
  const filteredBoards = searchTerm
    ? allBoards.filter(board =>
        board.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : boards;

  const handleBoardClick = (board: Board) => {
    router.push(`/boards/${board.slug || board.id}`);
    onClose();
  };

  const toggleExpanded = (boardId: string) => {
    const newExpanded = new Set(expandedBoards);
    if (newExpanded.has(boardId)) {
      newExpanded.delete(boardId);
    } else {
      newExpanded.add(boardId);
    }
    setExpandedBoards(newExpanded);
  };

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
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#1D1D1D] transform transition-transform duration-300 ease-in-out z-[1000] md:hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } flex flex-col`}>
        {/* 헤더 - 고정 */}
        <div className="flex items-center justify-between p-4 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0]">게시판 선택</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-9 w-9"
          >
            <X className="h-4 w-4" />
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

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          {/* 전체글, 인기글, 라이브스코어, 데이터센터, 아이콘샵 링크 */}
          <div className="border-b border-black/5 dark:border-white/10">
            <Link
              href="/boards/all"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
            >
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">전체글</span>
            </Link>

            <Link
              href="/boards/popular"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
            >
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">인기글</span>
            </Link>

            <Link
              href="/livescore/football"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
              <span className="text-sm font-medium">라이브스코어</span>
            </Link>

            <Link
              href="/transfers"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5M16 8l5-5m-1 10v5h-5m-8-5l-5 5v-5h5m8-8v5h5m-5-5l5 5"/>
              </svg>
              <span className="text-sm font-medium">이적시장</span>
            </Link>

            <Link
              href="/livescore/football/leagues"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
                <path d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
              </svg>
              <span className="text-sm font-medium">데이터센터</span>
            </Link>

            <Link
              href="/shop"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm font-medium">아이콘샵</span>
            </Link>

            {/* 관리자 페이지 링크 - 관리자에게만 표시 */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span className="text-sm font-medium">관리자</span>
              </Link>
            )}
          </div>

          {/* 게시판 목록 */}
          <div className="pb-4">
            {searchTerm ? (
              // 검색 결과
              <div>
                {filteredBoards.map(board => (
                  <Button
                    key={board.id}
                    variant="ghost"
                    onClick={() => handleBoardClick(board)}
                    className="w-full justify-start px-4 py-3 h-auto rounded-none text-gray-900 dark:text-[#F0F0F0]"
                  >
                    <div className="text-sm font-medium">{board.name}</div>
                  </Button>
                ))}
                {filteredBoards.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            ) : (
              // 카테고리별 게시판 (아코디언 스타일)
              <div>
                {boards.map(board => (
                  <div key={board.id}>
                    {/* 1단계: 크기 줄임, 다른 버튼들과 동일한 크기 */}
                    <Button
                      variant="ghost"
                      onClick={() => handleBoardClick(board)}
                      className="w-full justify-start px-4 py-3 h-auto rounded-none bg-[#F5F5F5] dark:bg-[#262626]"
                    >
                      <div className="font-semibold text-gray-900 dark:text-[#F0F0F0] text-sm">{board.name}</div>
                    </Button>

                    {/* 2단계: 항상 표시됨 */}
                    {board.children && board.children.length > 0 && (
                      <div className="ml-4">
                        {board.children
                          .sort((a, b) => a.display_order - b.display_order)
                          .map(child => (
                            <div key={child.id}>
                              <div className="flex items-center">
                                {/* 2단계 게시판 이름 */}
                                <Button
                                  variant="ghost"
                                  onClick={() => handleBoardClick(child)}
                                  className="flex-1 justify-start px-4 py-3 h-auto rounded-none text-sm text-gray-900 dark:text-[#F0F0F0]"
                                >
                                  {child.name}
                                </Button>

                                {/* 3단계 하위 메뉴가 있는 경우에만 펼치기/접기 버튼 */}
                                {child.children && child.children.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    onClick={() => toggleExpanded(child.id)}
                                    className="px-4 py-3 h-auto rounded-none border-l border-black/5 dark:border-white/10"
                                  >
                                    <ChevronDown
                                      className={`h-3 w-3 transition-transform ${
                                        expandedBoards.has(child.id) ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </Button>
                                )}
                              </div>

                              {/* 3단계 하위 게시판 (펼쳐진 경우에만 표시) */}
                              {child.children && child.children.length > 0 && expandedBoards.has(child.id) && (
                                <div className="ml-4">
                                  {child.children
                                    .sort((a, b) => a.display_order - b.display_order)
                                    .map(grandChild => (
                                      <Button
                                        key={grandChild.id}
                                        variant="ghost"
                                        onClick={() => handleBoardClick(grandChild)}
                                        className="w-full justify-start px-4 py-3 h-auto rounded-none text-sm text-gray-900 dark:text-[#F0F0F0]"
                                      >
                                        ┗ {grandChild.name}
                                      </Button>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

export default MobileBoardModal;
