'use client';

import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Board } from '../../types/board';
import BoardItem from './BoardItem';
import Submenu from './Submenu';

interface DropdownMenuProps {
  board: Board;
  position: { top: number; left: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const DropdownMenu = React.memo(function DropdownMenu({ 
  board, 
  position, 
  onClose,
  onMouseEnter,
  onMouseLeave
}: DropdownMenuProps) {
  const [submenuBoard, setSubmenuBoard] = useState<Board | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 하위 메뉴가 많은지 확인 (5개 이상이면 서브메뉴 사용)
  const shouldUseSubmenu = (board: Board) => {
    return board.children && board.children.length > 5;
  };

  // 서브메뉴 호버 처리
  const handleSubmenuHover = (childBoard: Board, element: HTMLDivElement) => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const submenuWidth = 200;
    const spacing = 5;
    
    // 모바일 감지 (768px 이하)
    const isMobile = viewportWidth <= 768;
    
    let left: number;
    let top: number;
    
    if (isMobile) {
      // 모바일: 아래쪽으로 펼치기 (스크롤 위치 제거)
      left = Math.max(10, Math.min(rect.left, viewportWidth - submenuWidth - 10));
      top = rect.bottom + spacing;
    } else {
      // 데스크탑: 오른쪽으로 펼치기, 화면 밖으로 나가면 왼쪽으로
      const rightSpace = viewportWidth - rect.right;
      const leftSpace = rect.left;
      
      if (rightSpace >= submenuWidth + spacing) {
        // 오른쪽에 공간이 충분함 (스크롤 위치 제거)
        left = rect.right + spacing;
      } else if (leftSpace >= submenuWidth + spacing) {
        // 왼쪽에 공간이 충분함 (스크롤 위치 제거)
        left = rect.left - submenuWidth - spacing;
      } else {
        // 양쪽 모두 공간이 부족하면 화면 중앙에
        left = (viewportWidth - submenuWidth) / 2;
      }
      
      top = rect.top; // 스크롤 위치 제거
    }
    
    setSubmenuPosition({ top, left });
    setSubmenuBoard(childBoard);
  };

  // 서브메뉴 호버 종료
  const handleSubmenuLeave = () => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    
    submenuTimeoutRef.current = setTimeout(() => {
      setSubmenuBoard(null);
      setSubmenuPosition(null);
    }, 150);
  };

  // 서브메뉴에 마우스 진입
  const handleSubmenuMouseEnter = () => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
  };

  // 서브메뉴에서 마우스 이탈
  const handleSubmenuMouseLeave = () => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    
    submenuTimeoutRef.current = setTimeout(() => {
      setSubmenuBoard(null);
      setSubmenuPosition(null);
    }, 150);
  };

  const closeSubmenu = () => {
    setSubmenuBoard(null);
    setSubmenuPosition(null);
    onClose();
  };

  return ReactDOM.createPortal(
    <div 
      className="fixed bg-white border rounded-md shadow-lg py-1 hidden md:block"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '240px',
        maxWidth: '240px',
        maxHeight: '60vh',
        overflowY: 'auto',
        zIndex: 50
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 메인 게시판 링크 */}
      <Link 
        href={`/boards/${board.slug || board.id}`}
        className="block px-3 py-1.5 text-primary text-sm font-medium hover:bg-gray-100 border-b border-gray-100"
        onClick={onClose}
      >
        <div className="flex items-center">
          <ChevronRight className="h-3.5 w-3.5 mr-1" />
          <span>{board.name || '게시판'} 메인 페이지</span>
        </div>
      </Link>
      
      {/* 하위 게시판 목록 */}
      <div className="py-0.5">
        {board.children && board.children.length > 0 ? (
          board.children
            .sort((a, b) => a.display_order - b.display_order)
            .map(child => (
              <BoardItem 
                key={child.id} 
                board={child} 
                level={0} 
                onItemClick={onClose}
                showSubmenu={shouldUseSubmenu(child)}
                onSubmenuHover={handleSubmenuHover}
                onSubmenuLeave={handleSubmenuLeave}
              />
            ))
        ) : (
          <div className="px-3 py-1.5 text-sm text-gray-500 italic">
            하위 게시판이 없습니다
          </div>
        )}
      </div>

      {/* 서브메뉴 */}
      {submenuBoard && submenuPosition && (
        <Submenu
          board={submenuBoard}
          position={submenuPosition}
          onClose={closeSubmenu}
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
        />
      )}
    </div>,
    document.body
  );
});

export default DropdownMenu; 