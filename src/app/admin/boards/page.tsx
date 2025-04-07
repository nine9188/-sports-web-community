'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/ui/button';
import { toast } from 'react-toastify';
import { createClient } from '@/app/lib/supabase-browser';
import { ArrowUp, ArrowDown, ChevronRight, ChevronsRight } from 'lucide-react';

interface Board {
  id: string;
  name: string;
  description: string | null;
  access_level: string;
  parent_id: string | null;
  views?: number;
  display_order: number;
  level?: number; // 계층 레벨 (UI 표시용)
  children?: Board[]; // 하위 게시판 타입 명시
  team_id?: number | null; // 추가
}

export default function BoardsAdminPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [structuredBoards, setStructuredBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    access_level: 'public',
    parent_id: '',
    display_order: 0,
    team_id: null as number | null // 추가
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const supabase = createClient();

  // 게시판 목록 불러오기 - useCallback 사용
  const fetchBoards = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setBoards(data || []);
      
      // 계층 구조로 데이터 변환
      const structuredData = createBoardStructure(data || []);
      setStructuredBoards(structuredData);
      
    } catch (error) {
      console.error('게시판 목록 조회 오류:', error);
      toast.error('게시판 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]); // supabase 클라이언트만 의존성으로 추가

  // 계층 구조로 게시판 데이터 변환
  const createBoardStructure = (boardsData: Board[]): Board[] => {
    // 참조 복사 방지를 위해 기존 객체를 복사
    const processedBoards = boardsData.map(board => ({
      ...board,
      level: 0,
      children: [] as Board[] // 명시적으로 타입 지정
    }));
    
    // ID로 빠르게 접근하기 위한 맵 생성
    const boardMap: Record<string, Board> = {};
    processedBoards.forEach(board => {
      boardMap[board.id] = board;
    });
    
    // 최상위 게시판과 하위 게시판 분류
    const rootBoards: Board[] = [];
    
    processedBoards.forEach(board => {
      if (board.parent_id && boardMap[board.parent_id]) {
        // 부모가 있으면 부모의 children에 추가
        if (!boardMap[board.parent_id].children) {
          boardMap[board.parent_id].children = [];
        }
        board.level = 1; // 상위 게시판의 하위 = 레벨 1
        boardMap[board.parent_id].children!.push(board);
      } else if (!board.parent_id) {
        // 부모가 없으면 최상위 게시판
        rootBoards.push(board);
      }
    });
    
    // 각 레벨에서 순서대로 정렬
    rootBoards.sort((a, b) => a.display_order - b.display_order);
    
    // 각 부모 게시판의 하위 게시판도 정렬
    processedBoards.forEach(board => {
      if (board.children && board.children.length > 0) {
        // children에 명시적으로 Board[] 타입 캐스팅
        (board.children as Board[]).sort((a, b) => a.display_order - b.display_order);
        
        // 2단계 이상 하위 게시판의 레벨 설정
        (board.children as Board[]).forEach(child => {
          child.level = (board.level || 0) + 1;
          
          // 3단계 이상의 하위 게시판이 있다면 재귀적으로 레벨 설정
          if (child.children && child.children.length > 0) {
            const setChildLevels = (children: Board[], parentLevel: number) => {
              children.forEach(grandChild => {
                grandChild.level = parentLevel + 1;
                if (grandChild.children && grandChild.children.length > 0) {
                  setChildLevels(grandChild.children, grandChild.level);
                }
              });
            };
            
            setChildLevels(child.children as Board[], child.level);
          }
        });
      }
    });
    
    return rootBoards;
  };

  // 계층 구조를 평면화하여 테이블에 표시하기 위한 함수
  const flattenStructuredBoards = (structuredBoards: Board[]): Board[] => {
    const result: Board[] = [];
    
    const addBoardToResult = (board: Board) => {
      result.push(board);
      if (board.children && board.children.length > 0) {
        board.children.forEach(child => addBoardToResult(child));
      }
    };
    
    structuredBoards.forEach(board => addBoardToResult(board));
    return result;
  };

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]); // 이제 fetchBoards가 의존성으로 올바르게 추가됨

  // 게시판 추가 또는 수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('게시판 이름은 필수입니다.');
      return;
    }
    
    // 순환 참조 검사
    if (editingBoard && formData.parent_id) {
      if (formData.parent_id === editingBoard.id) {
        toast.error('자기 자신을 상위 게시판으로 지정할 수 없습니다.');
        return;
      }
      
      // 자신의 하위 게시판인지 확인
      const isChildBoard = (parentId: string, checkId: string): boolean => {
        const children = boards.filter(b => b.parent_id === checkId);
        return children.some(child => 
          child.id === parentId || isChildBoard(parentId, child.id)
        );
      };
      
      if (isChildBoard(formData.parent_id, editingBoard.id)) {
        toast.error('하위 게시판을 상위 게시판으로 지정할 수 없습니다.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      // 같은 부모 내에서 마지막 순서 계산
      let newDisplayOrder = formData.display_order;
      if (!editingBoard) {
        // 새 게시판 추가 시 해당 부모의 마지막 순서 + 10으로 설정
        const sameParentBoards = boards.filter(b => 
          b.parent_id === (formData.parent_id || null)
        );
        
        if (sameParentBoards.length > 0) {
          const maxOrder = Math.max(...sameParentBoards.map(b => b.display_order));
          newDisplayOrder = maxOrder + 10;
        } else {
          newDisplayOrder = 10; // 첫 게시판인 경우 10부터 시작
        }
      }
      
      const boardData = {
        name: formData.name,
        description: formData.description || null,
        access_level: formData.access_level,
        parent_id: formData.parent_id || null,
        display_order: newDisplayOrder,
        team_id: formData.team_id // 추가
      };
      
      if (editingBoard) {
        // 게시판 수정
        const { error } = await supabase
          .from('boards')
          .update(boardData)
          .eq('id', editingBoard.id);
          
        if (error) throw error;
        toast.success('게시판이 수정되었습니다.');
      } else {
        // 게시판 추가
        const { error } = await supabase
          .from('boards')
          .insert([boardData]);
          
        if (error) throw error;
        toast.success('게시판이 추가되었습니다.');
      }
      
      // 폼 초기화
      setFormData({
        name: '',
        description: '',
        access_level: 'public',
        parent_id: '',
        display_order: 0,
        team_id: null
      });
      setEditingBoard(null);
      
      // 게시판 목록 다시 불러오기
      fetchBoards();
    } catch (error: unknown) {
      console.error('게시판 작업 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '게시판 작업 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 게시판 수정 모드
  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setFormData({
      name: board.name,
      description: board.description || '',
      access_level: board.access_level || 'public',
      parent_id: board.parent_id || '',
      display_order: board.display_order || 0,
      team_id: board.team_id || null // 추가
    });
  };

  // 게시판 삭제
  const handleDelete = async (id: string) => {
    // 하위 게시판이 있는지 확인
    const hasChildren = boards.some(board => board.parent_id === id);
    
    if (hasChildren) {
      toast.error('하위 게시판이 있는 게시판은 삭제할 수 없습니다. 먼저 하위 게시판을 삭제하세요.');
      return;
    }
    
    if (!confirm('정말 이 게시판을 삭제하시겠습니까? 관련된 모든 게시글도 삭제됩니다.')) {
      return;
    }
    
    try {
      // 게시판의 게시글 삭제
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .eq('board_id', id);
        
      if (postsError) throw postsError;
      
      // 게시판 삭제
      const { error: boardError } = await supabase
        .from('boards')
        .delete()
        .eq('id', id);
        
      if (boardError) throw boardError;

      toast.success('게시판이 삭제되었습니다.');
      
      // 게시판 목록 다시 불러오기
      fetchBoards();
    } catch (error: unknown) {
      console.error('게시판 삭제 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '게시판 삭제 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    }
  };

  // 폼 취소 및 초기화
  const handleCancel = () => {
    setEditingBoard(null);
    setFormData({
      name: '',
      description: '',
      access_level: 'public',
      parent_id: '',
      display_order: 0,
      team_id: null
    });
  };

  // 게시판 순서 변경
  const changeOrder = async (board: Board, direction: 'up' | 'down') => {
    try {
      setIsUpdatingOrder(true);
      
      // 같은 부모를 가진 게시판들 찾기
      const siblingBoards = boards.filter(b => b.parent_id === board.parent_id)
        .sort((a, b) => a.display_order - b.display_order);
      
      // 현재 보드의 인덱스
      const currentIndex = siblingBoards.findIndex(b => b.id === board.id);
      if (currentIndex === -1) return;
      
      // 이동할 인덱스 계산
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // 인덱스가 범위를 벗어나면 중단
      if (targetIndex < 0 || targetIndex >= siblingBoards.length) {
        toast.info('더 이상 이동할 수 없습니다.');
        setIsUpdatingOrder(false);
        return;
      }
      
      // 타겟 게시판
      const targetBoard = siblingBoards[targetIndex];
      
      // 현재 게시판과 타겟 게시판의 순서 교환
      const { error: error1 } = await supabase
        .from('boards')
        .update({ display_order: targetBoard.display_order })
        .eq('id', board.id);
        
      if (error1) throw error1;
      
      const { error: error2 } = await supabase
        .from('boards')
        .update({ display_order: board.display_order })
        .eq('id', targetBoard.id);
        
      if (error2) throw error2;
      
      toast.success('게시판 순서가 변경되었습니다.');
      
      // 게시판 목록 새로고침
      fetchBoards();
      
    } catch (error) {
      console.error('순서 변경 오류:', error);
      toast.error('순서 변경에 실패했습니다.');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // 게시판 순서 초기화 - 사용하지 않는 함수는 주석 처리하거나 삭제
  /* const resetBoardOrders = async () => {
    try {
      setIsUpdatingOrder(true);
      
      // 부모 게시판별로 그룹화
      const boardsByParent: Record<string, Board[]> = {};
      
      boards.forEach(board => {
        const parentId = board.parent_id || 'root';
        if (!boardsByParent[parentId]) {
          boardsByParent[parentId] = [];
        }
        boardsByParent[parentId].push(board);
      });
      
      // 각 그룹마다 순서 재설정
      for (const parentId in boardsByParent) {
        const groupBoards = boardsByParent[parentId];
        
        // 이름순으로 정렬
        groupBoards.sort((a, b) => a.name.localeCompare(b.name));
        
        // 순서 업데이트
        for (let i = 0; i < groupBoards.length; i++) {
          const { error } = await supabase
            .from('boards')
            .update({ display_order: i * 10 }) // 10씩 증가하는 값 사용
            .eq('id', groupBoards[i].id);
            
          if (error) {
            console.error('순서 초기화 오류:', error);
          }
        }
      }
      
      toast.success('게시판 순서가 초기화되었습니다.');
      fetchBoards(); // 목록 새로고침
      
    } catch (error) {
      console.error('순서 초기화 오류:', error);
      toast.error('순서 초기화에 실패했습니다.');
    } finally {
      setIsUpdatingOrder(false);
    }
  }; */

  // 계층 표시를 위한 들여쓰기 생성
  const getIndentation = (level: number = 0) => {
    return (
      <div className="flex items-center" style={{ marginLeft: `${level * 16}px` }}>
        {level > 0 && (
          <>
            {level === 1 ? (
              <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
            ) : (
              <ChevronsRight className="h-4 w-4 text-gray-400 mr-1" />
            )}
          </>
        )}
      </div>
    );
  };

  // 게시판 계층 레벨을 계산하는 함수 추가
  const getParentLevel = (boardId: string) => {
    let level = 0;
    let current = boards.find(b => b.id === boardId);
    
    while (current && current.parent_id) {
      level++;
      current = boards.find(b => b.id === current?.parent_id);
    }
    
    return level;
  };

  return (
    <>
      {/* 게시판 추가/수정 폼 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8 p-6">
        <h2 className="text-lg font-medium mb-4">
          {editingBoard ? '게시판 수정' : '새 게시판 추가'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              게시판 이름
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              설명
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="access_level" className="block text-sm font-medium text-gray-700">
              접근 권한
            </label>
            <select
              id="access_level"
              value={formData.access_level}
              onChange={(e) => setFormData(prev => ({ ...prev, access_level: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="public">공개</option>
              <option value="members">회원 전용</option>
              <option value="admin">관리자 전용</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
              상위 게시판 (선택사항)
            </label>
            <select
              id="parent_id"
              value={formData.parent_id || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value || '' }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">없음 (최상위 게시판)</option>
              {boards
                // 자기 자신과 자신의 하위 게시판들만 제외
                .filter(board => {
                  // 수정 중일 때는 자기 자신 제외
                  if (editingBoard && board.id === editingBoard.id) {
                    return false;
                  }
                  
                  // 현재 수정 중인 게시판의 모든 하위 게시판 제외
                  if (editingBoard) {
                    // 재귀적으로 하위 게시판 체크
                    const isChildBoard = (parentId: string): boolean => {
                      const directChildren = boards.filter(b => b.parent_id === parentId);
                      return directChildren.some(child => 
                        child.id === board.id || isChildBoard(child.id)
                      );
                    };
                    
                    if (isChildBoard(editingBoard.id)) {
                      return false;
                    }
                  }
                  
                  return true;
                })
                .map((board) => {
                  // 이름 들여쓰기 계산 (상위/하위 구분을 위해)
                  const level = getParentLevel(board.id);
                  const indent = '　'.repeat(level); // 전각 공백으로 들여쓰기
                  
                  return (
                    <option key={board.id} value={board.id}>
                      {indent}{level > 0 ? '└ ' : ''}{board.name}
                    </option>
                  );
                })
              }
            </select>
          </div>
          
          <div>
            <label htmlFor="team_id" className="block text-sm font-medium text-gray-700">
              팀 ID (선택사항)
            </label>
            <input
              type="number"
              id="team_id"
              value={formData.team_id || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                team_id: e.target.value ? parseInt(e.target.value) : null 
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2
                         focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="예: 40 (리버풀), 33 (맨유)"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            {editingBoard && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                취소
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? '처리 중...' : editingBoard ? '수정하기' : '추가하기'}
            </Button>
          </div>
        </form>
      </div>
      
      {/* 게시판 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            게시판 목록
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            현재 생성된 모든 게시판 목록입니다. 화살표를 클릭하여 순서를 변경할 수 있습니다.
          </p>
        </div>
        
        {isLoading ? (
          <div className="text-center py-6">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : boards.length > 0 ? (
          <div className="border-t border-gray-200">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    순서
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    게시판 이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    권한
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    상위 게시판
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    팀ID
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flattenStructuredBoards(structuredBoards).map(board => {
                  // 상위 게시판 찾기
                  const parentBoard = board.parent_id 
                    ? boards.find(b => b.id === board.parent_id) 
                    : null;
                  
                  // 하위 게시판 여부 확인
                  const hasChildBoards = boards.some(b => b.parent_id === board.id);
                  
                  // 같은 레벨의 게시판들
                  const siblingBoards = boards
                    .filter(b => b.parent_id === board.parent_id)
                    .sort((a, b) => a.display_order - b.display_order);
                  
                  const sameLevelIndex = siblingBoards.findIndex(b => b.id === board.id);
                  const isFirst = sameLevelIndex === 0;
                  const isLast = sameLevelIndex === siblingBoards.length - 1;
                  
                  return (
                    <tr key={board.id} className={board.level && board.level > 0 ? "bg-gray-50" : ""}>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <span>{board.display_order}</span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => changeOrder(board, 'up')}
                              disabled={isUpdatingOrder || isFirst}
                              className={`focus:outline-none ${isFirst ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                              title={isFirst ? '이미 최상위입니다' : '위로 이동'}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() => changeOrder(board, 'down')}
                              disabled={isUpdatingOrder || isLast}
                              className={`focus:outline-none ${isLast ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                              title={isLast ? '이미 최하위입니다' : '아래로 이동'}
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          {getIndentation(board.level || 0)}
                          <span className={`${board.level === 0 ? 'font-semibold' : ''} ${board.level === 1 ? 'text-blue-600' : ''}`}>
                            {board.name}
                          </span>
                          {hasChildBoards && (
                            <span className="ml-1 text-xs text-blue-500">
                              (하위)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {board.access_level === 'public' ? '공개' : 
                         board.access_level === 'members' ? '회원 전용' : '관리자 전용'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {parentBoard ? parentBoard.name : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {board.team_id || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(board)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(board.id)}
                          className={`text-red-600 hover:text-red-900 ${hasChildBoards ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={hasChildBoards}
                          title={hasChildBoards ? '하위 게시판이 있는 게시판은 삭제할 수 없습니다' : ''}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">등록된 게시판이 없습니다.</p>
          </div>
        )}
      </div>
    </>
  );
} 