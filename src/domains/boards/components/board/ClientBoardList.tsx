'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Board {
  id: string;
  name: string;
  slug?: string | null;
  parent_id?: string | null;
  display_order?: number | null;
}

interface ClientBoardListProps {
  boards: Board[];
  className?: string;
}

export default function ClientBoardList({ boards, className = '' }: ClientBoardListProps) {
  const pathname = usePathname();
  
  return (
    <div className={`space-y-2 ${className}`}>
      {boards.length === 0 ? (
        <div className="p-4 text-center text-gray-500">등록된 게시판이 없습니다.</div>
      ) : (
        <ul className="divide-y">
          {boards.map((board) => {
            const boardSlug = board.slug || board.id;
            const boardUrl = `/boards/${boardSlug}`;
            const isActive = pathname === boardUrl;
            
            return (
              <li key={board.id} className="py-1">
                <Link
                  href={boardUrl}
                  className={`block px-4 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {board.name}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
} 