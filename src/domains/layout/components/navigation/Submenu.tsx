'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import { Board } from '../../types/board';
import BoardItem from './BoardItem';

interface SubmenuProps {
  board: Board;
  position: { top: number; left: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const Submenu = React.memo(function Submenu({
  board,
  position,
  onClose,
  onMouseEnter,
  onMouseLeave
}: SubmenuProps) {
  return ReactDOM.createPortal(
    <div 
      className="fixed bg-white border rounded-md shadow-lg py-1 hidden md:block"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '200px',
        maxWidth: '200px',
        maxHeight: '60vh',
        overflowY: 'auto',
        zIndex: 60
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {board.children && board.children.length > 0 ? (
        board.children
          .sort((a, b) => a.display_order - b.display_order)
          .map(child => (
            <BoardItem 
              key={child.id} 
              board={child} 
              level={0} 
              onItemClick={onClose}
              showSubmenu={false}
            />
          ))
      ) : (
        <div className="px-3 py-1.5 text-sm text-gray-500 italic">
          하위 게시판이 없습니다
        </div>
      )}
    </div>,
    document.body
  );
});

export default Submenu; 