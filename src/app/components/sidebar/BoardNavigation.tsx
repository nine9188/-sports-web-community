'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase-client';
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
  const [error, setError] = useState<string | null>(null);
  const [expandedBoards, setExpandedBoards] = useState<Record<string, boolean>>({});
  const fetchAttempts = useRef(0);
  const dataLoaded = useRef(false);

  // 게시판 데이터 처리 함수
  const processBoards = useCallback((boardsData: Board[]) => {
    // 빈 배열 체크 추가
    if (!boardsData || boardsData.length === 0) {
      console.warn("BoardNavigation: 받은 게시판 데이터가 없습니다.");
      return;
    }

    try {
      // 계층 구조로 데이터 변환
      const boardsMap: Record<string, Board> = {};
      const rootBoards: Board[] = [];
      
      // 모든 게시판을 맵에 추가
      boardsData.forEach(board => {
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
      dataLoaded.current = true;  // 데이터 로드 완료 표시
    } catch (err) {
      console.error("게시판 데이터 처리 중 오류:", err);
      setError("게시판 데이터 처리 중 오류가 발생했습니다");
    }
  }, []);

  // 게시판 데이터 가져오기 함수를 useCallback으로 메모이제이션
  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('boards')
        .select('id, name, parent_id, display_order, slug')
        .order('display_order', { ascending: true })
        .order('name');
        
      if (error) {
        console.error('게시판 불러오기 오류:', error);
        setError("게시판을 불러오는 데 실패했습니다");
        return;
      }
      
      if (!data || data.length === 0) {
        fetchAttempts.current += 1;
        if (fetchAttempts.current <= 3) {
          // 최대 3번까지 재시도
          console.warn(`BoardNavigation: 게시판 데이터가 없습니다. 재시도 (${fetchAttempts.current}/3)`);
          setTimeout(fetchBoards, 1000); // 1초 후 재시도
          return;
        } else {
          setError("게시판 데이터를 불러올 수 없습니다");
        }
      } else {
        processBoards(data);
      }
    } catch (error) {
      console.error('게시판 불러오기 중 오류 발생:', error);
      setError("게시판 데이터 로딩 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [processBoards]);

  // useEffect에서 마운트시 데이터 페칭
  useEffect(() => {
    // 브라우저 환경이고 아직 데이터가 로드되지 않았으면 데이터 가져오기
    if (typeof window !== 'undefined' && !dataLoaded.current) {
      fetchBoards();
    }
    
    // 상태 및 ref 초기화 함수 
    return () => {
      dataLoaded.current = false;
      fetchAttempts.current = 0;
    };
  }, [fetchBoards]);

  // 게시판 접기/펼치기
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

  return (
    <div className="space-y-4">
      {loading ? (
        // 로딩 UI
        <div>
          <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
          <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
          <div className="h-7 bg-gray-100 animate-pulse rounded"></div>
        </div>
      ) : error ? (
        // 오류 메시지 표시
        <div className="p-1.5 text-center text-red-500 text-sm">
          {error}
          <button 
            onClick={() => fetchBoards()} 
            className="block mx-auto mt-2 text-blue-500 text-xs underline"
          >
            다시 시도
          </button>
        </div>
      ) : boards.length === 0 ? (
        // 게시판이 없을 때
        <div className="p-1.5 text-center text-gray-500 text-sm">
          게시판이 없습니다
          <button 
            onClick={() => fetchBoards()} 
            className="block mx-auto mt-2 text-blue-500 text-xs underline"
          >
            새로고침
          </button>
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