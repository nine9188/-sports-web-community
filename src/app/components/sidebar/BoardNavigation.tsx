'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase-browser';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface Board {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  slug: string;
  children?: Board[];
}

export default function BoardNavigation() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBoards, setExpandedBoards] = useState<Record<string, boolean>>({});

  // 게시판 데이터 가져오기
  useEffect(() => {
    async function fetchBoards() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('boards')
          .select('id, name, parent_id, display_order, slug')
          .order('display_order', { ascending: true })
          .order('name');
          
        if (error) {
          console.error('게시판 불러오기 오류:', error);
          return;
        }
        
        // 계층 구조로 데이터 변환
        const boardsMap: Record<string, Board> = {};
        const rootBoards: Board[] = [];
        
        // 모든 게시판을 맵에 추가
        (data || []).forEach(board => {
          boardsMap[board.id] = { ...board, children: [] };
        });
        
        // 부모-자식 관계 설정
        Object.values(boardsMap).forEach(board => {
          if (board.parent_id && boardsMap[board.parent_id]) {
            // 부모가 있으면 부모의 children에 추가
            if (!boardsMap[board.parent_id].children) {
              boardsMap[board.parent_id].children = [];
            }
            boardsMap[board.parent_id].children!.push(board);
          } else if (!board.parent_id) {
            // 부모가 없으면 루트 게시판
            rootBoards.push(board);
          }
        });
        
        // 최상위 게시판 순서 정렬 - display_order 기준
        rootBoards.sort((a, b) => {
          // 먼저 display_order로 정렬
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order;
          }
          // 동일한 display_order 값을 가질 경우 이름으로 정렬
          return a.name.localeCompare(b.name);
        });
        
        // 기본적으로 모든 게시판 펼치기
        const initialExpandedState: Record<string, boolean> = {};
        Object.values(boardsMap).forEach(board => {
          initialExpandedState[board.id] = true;
        });
        
        setExpandedBoards(initialExpandedState);
        setBoards(rootBoards);
      } catch (error) {
        console.error('게시판 불러오기 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBoards();
  }, []);

  // 게시판 접기 (펼침 상태가 기본이므로 접기만 가능)
  const toggleCollapse = (e: React.MouseEvent, boardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 현재 상태가 접혀있으면 펼치고, 펼쳐져 있으면 접기
    setExpandedBoards(prev => ({
      ...prev,
      [boardId]: !prev[boardId]
    }));
  };

  // 게시판 렌더링 함수 (재귀적)
  const renderBoard = (board: Board, level: number = 0) => {
    const hasChildren = board.children && board.children.length > 0;
    const isExpanded = expandedBoards[board.id];
    const isChildBoard = level > 0;
    
    return (
      <div key={board.id} className="my-0.5">
        <div className="flex items-center">
          <div style={{ width: `${level * 12}px` }} />
          
          <div className="flex items-center flex-1">
            {/* 하위 게시판 아이콘 표시 */}
            {isChildBoard && (
              <span className="text-gray-400 mr-1 text-xs font-mono">ㄴ</span>
            )}
            
            <Link 
              href={`/boards/${board.slug || board.id}`}
              className={`flex-1 px-1.5 py-0.5 rounded hover:bg-gray-100 text-sm ${level === 0 ? 'font-medium' : ''}`}
            >
              {board.name}
            </Link>
            
            {/* 하위 게시판이 있는 경우에만 접기 아이콘 표시 */}
            {hasChildren && (
              <button 
                onClick={(e) => toggleCollapse(e, board.id)} 
                className="ml-0.5 p-0.5 hover:bg-gray-100 rounded flex items-center"
                aria-label={isExpanded ? "접기" : "펼치기"}
              >
                {isExpanded ? 
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" /> : 
                  <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                }
              </button>
            )}
          </div>
        </div>
        
        {/* 하위 게시판 - 펼쳐진 경우에만 표시 */}
        {hasChildren && isExpanded && (
          <div className="ml-3">
            {board.children!
              .sort((a, b) => {
                // 표시 순서 기준으로 정렬
                if (a.display_order !== b.display_order) {
                  return a.display_order - b.display_order;
                }
                return a.name.localeCompare(b.name);
              })
              .map(child => renderBoard(child, level + 1))
            }
          </div>
        )}
      </div>
    );
  };

  // 모든 게시판 펼치기 버튼
  // 기능 확장시 사용 예정이므로 주석 처리
  /*
  const expandAllBoards = () => {
    const allExpanded: Record<string, boolean> = {};
    
    // 모든 게시판을 순회하며 펼침 상태로 설정
    const setAllExpanded = (boardList: Board[]) => {
      boardList.forEach(board => {
        allExpanded[board.id] = true;
        if (board.children && board.children.length > 0) {
          setAllExpanded(board.children);
        }
      });
    };
    
    setAllExpanded(boards);
    setExpandedBoards(allExpanded);
  };
  */

  return (
    <div className="space-y-4">
      {loading ? (
        // 로딩 UI
        <div>
          <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
          <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
          <div className="h-7 bg-gray-100 animate-pulse rounded"></div>
        </div>
      ) : boards.length === 0 ? (
        // 게시판이 없을 때
        <div className="p-1.5 text-center text-gray-500 text-sm">
          게시판이 없습니다
        </div>
      ) : (
        // 계층형 구조로 게시판 렌더링
        <div className="space-y-0.5">
          {boards.map(board => renderBoard(board))}
        </div>
      )}
    </div>
  );
} 