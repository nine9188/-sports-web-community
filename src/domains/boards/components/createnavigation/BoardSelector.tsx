'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

interface Board {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  slug: string;
  children?: Board[];
}

interface BoardSelectorProps {
  boards: Board[];
  selectedId?: string;
  onSelect: (id: string) => void;
  currentBoardId?: string;
}

const BoardSelector = React.memo(({ 
  boards = [],
  selectedId, 
  onSelect, 
  currentBoardId,
}: BoardSelectorProps) => {
  // 모든 상태값 초기화
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Board | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 참조값 초기화
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subCategoryDropdownRef = useRef<HTMLDivElement>(null);
  
  // 입력 데이터 유효성 검사
  useEffect(() => {
    if (!boards || boards.length === 0) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [boards]);
  
  // 카테고리(상위게시판)와 하위 게시판 데이터 처리 - 최적화
  const { categories, subCategories } = useMemo(() => {
    // 빈 배열 체크
    if (!boards || boards.length === 0) {
      return {
        categories: [] as Board[],
        subCategories: {} as Record<string, Board[]>
      };
    }

    // 게시판을 parent_id로 그룹화 (한 번만 순회)
    const boardsByParent = new Map<string | null, Board[]>();
    const boardsById = new Map<string, Board>();
    
    for (const board of boards) {
      // ID로 빠른 조회를 위한 맵
      boardsById.set(board.id, board);
      
      // parent_id로 그룹화
      const parentId = board.parent_id;
      if (!boardsByParent.has(parentId)) {
        boardsByParent.set(parentId, []);
      }
      boardsByParent.get(parentId)!.push(board);
    }

    // 정렬 함수 (한 번만 정의)
    const sortBoards = (boardList: Board[]) => {
      return boardList.sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return a.name.localeCompare(b.name);
      });
    };

    // 상위 게시판 찾기 (parent_id가 있는 게시판들만)
    const parentBoards = Array.from(boardsByParent.keys())
      .filter(parentId => parentId !== null)
      .map(parentId => boardsById.get(parentId!))
      .filter((board): board is Board => board !== undefined);

    // 중복 제거 및 정렬
    const uniqueParents = Array.from(new Set(parentBoards.map(b => b.id)))
      .map(id => boardsById.get(id)!)
      .filter(Boolean);

    const categories = sortBoards(uniqueParents);

    // 하위 게시판 매핑
    const subCategories: Record<string, Board[]> = {};
    for (const category of categories) {
      const children = boardsByParent.get(category.id) || [];
      subCategories[category.id] = sortBoards(children);
    }

    return { categories, subCategories };
  }, [boards]);
  
  // 클릭 이벤트 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      
      if (subCategoryDropdownRef.current && !subCategoryDropdownRef.current.contains(event.target as Node)) {
        setShowSubCategoryDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 초기 선택값 설정
  useEffect(() => {
    if (!selectedId) return;
    
    // 카테고리 확인
    const category = categories.find(c => c.id === selectedId);
    if (category) {
      setSelectedCategory(category);
      setSelectedSubCategory(null);
      return;
    }
    
    // 하위 카테고리 확인
    for (const catId in subCategories) {
      const subCategory = subCategories[catId].find(s => s.id === selectedId);
      if (subCategory) {
        const parentCategory = categories.find(c => c.id === catId);
        if (parentCategory) {
          setSelectedCategory(parentCategory);
          setSelectedSubCategory(subCategory);
        }
        return;
      }
    }
  }, [selectedId, categories, subCategories]);
  
  // 카테고리 드롭다운 토글
  const toggleCategoryDropdown = useCallback(() => {
    setShowCategoryDropdown(prev => !prev);
    setShowSubCategoryDropdown(false);
  }, []);
  
  // 하위 카테고리 드롭다운 토글
  const toggleSubCategoryDropdown = useCallback(() => {
    setShowSubCategoryDropdown(prev => !prev);
    setShowCategoryDropdown(false);
  }, []);
  
  // 카테고리 선택
  const handleCategorySelect = useCallback((category: Board) => {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
    setShowCategoryDropdown(false);
    onSelect(category.id);
  }, [onSelect]);
  
  // 하위 카테고리 선택
  const handleSubCategorySelect = useCallback((subCategory: Board) => {
    setSelectedSubCategory(subCategory);
    setShowSubCategoryDropdown(false);
    onSelect(subCategory.id);
  }, [onSelect]);
  
  // 하위 카테고리 선택 건너뛰기
  const handleSkipSubCategory = useCallback(() => {
    if (selectedCategory) {
      setSelectedSubCategory(null);
      setShowSubCategoryDropdown(false);
      onSelect(selectedCategory.id);
    }
  }, [selectedCategory, onSelect]);
  
  // 카테고리 옵션 렌더링
  const renderCategoryOptions = useCallback(() => {
    if (isLoading || !categories || categories.length === 0) {
      return (
        <div className="px-3 py-1.5 text-gray-500">
          {isLoading ? "게시판 데이터를 불러오는 중입니다..." : "게시판이 없습니다. 관리자에게 문의하세요."}
        </div>
      );
    }
    
    return categories.map(category => (
      <div 
        key={category.id}
        className={`px-3 py-1.5 hover:bg-gray-100 cursor-pointer ${
          category.id === selectedCategory?.id ? 'bg-blue-50 text-blue-700' : ''
        } font-medium`}
        onClick={() => handleCategorySelect(category)}
      >
        {category.name}
        {category.id === currentBoardId ? " (현재 게시판)" : ""}
      </div>
    ));
  }, [categories, selectedCategory, currentBoardId, handleCategorySelect, isLoading]);
  
  // 하위 카테고리 옵션 렌더링
  const renderSubCategoryOptions = useCallback(() => {
    const options = [];
    
    // 하위 카테고리 선택 안함 옵션
    options.push(
      <div 
        key="skip-subcategory"
        className={`px-3 py-1.5 hover:bg-gray-100 cursor-pointer ${
          !selectedSubCategory ? 'bg-blue-50 text-blue-700' : ''
        } font-medium border-b border-gray-200`}
        onClick={handleSkipSubCategory}
      >
        하위 게시판 선택 안함
      </div>
    );
    
    // 하위 카테고리가 없는 경우
    if (!selectedCategory) {
      return options;
    }
    
    // 선택된 1차 분류 게시판의 하위 게시판
    if (!subCategories[selectedCategory.id] || subCategories[selectedCategory.id].length === 0) {
      return options;
    }
    
    // 하위 카테고리 옵션들 추가
    subCategories[selectedCategory.id].forEach(subCategory => {
      options.push(
        <div 
          key={subCategory.id}
          className={`px-3 py-1.5 hover:bg-gray-100 cursor-pointer ${
            subCategory.id === selectedSubCategory?.id ? 'bg-blue-50 text-blue-700' : ''
          }`}
          onClick={() => handleSubCategorySelect(subCategory)}
        >
          {subCategory.name}
          {subCategory.id === currentBoardId ? " (현재 게시판)" : ""}
        </div>
      );
    });
    
    return options;
  }, [selectedCategory, selectedSubCategory, currentBoardId, handleSubCategorySelect, handleSkipSubCategory, subCategories]);
  
  // 선택한 카테고리에 하위 게시판이 있는지 확인
  const hasSubCategories = useMemo(() => {
    if (!selectedCategory) return false;
    return subCategories[selectedCategory.id] && subCategories[selectedCategory.id].length > 0;
  }, [selectedCategory, subCategories]);
  
  return (
    <div className="w-full space-y-4">
      {/* 카테고리(상위 게시판) 선택 */}
      <div className="w-full relative" ref={categoryDropdownRef}>
        <div
          className={`w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer flex justify-between items-center ${
            isLoading ? 'bg-gray-100' : ''
          }`}
          onClick={toggleCategoryDropdown}
        >
          <span>
            {isLoading
              ? "게시판 데이터를 불러오는 중..." 
              : selectedCategory 
                ? selectedCategory.name 
                : "게시판을 선택하세요 (필수)"}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
        
        {/* 카테고리 드롭다운 */}
        {showCategoryDropdown && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            <div className="py-1">
              {renderCategoryOptions()}
            </div>
          </div>
        )}
      </div>
      
      {/* 하위 카테고리 선택 - 카테고리가 선택된 경우에만 표시 */}
      {selectedCategory && hasSubCategories && (
        <div className="w-full relative" ref={subCategoryDropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            하위 게시판 선택 <span className="text-sm text-gray-500">(선택사항)</span>
          </label>
          <div
            className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer flex justify-between items-center"
            onClick={toggleSubCategoryDropdown}
          >
            <span>
              {selectedSubCategory 
                ? selectedSubCategory.name 
                : "하위 게시판을 선택하세요 (선택사항)"}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          
          {/* 하위 카테고리 드롭다운 */}
          {showSubCategoryDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <div className="py-1">
                {renderSubCategoryOptions()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

BoardSelector.displayName = 'BoardSelector';

export default BoardSelector; 