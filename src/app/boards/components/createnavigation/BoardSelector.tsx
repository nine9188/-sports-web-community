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
      console.error('BoardSelector: boards 데이터가 비어 있습니다');
      setIsLoading(true);
    } else {
      console.log('BoardSelector: 총 게시판 수:', boards.length);
      setIsLoading(false);
    }
  }, [boards]);
  
  // 카테고리(상위게시판)와 하위 게시판 데이터 처리
  const { categories, subCategories } = useMemo(() => {
    // 결과를 담을 객체
    const result = {
      categories: [] as Board[],
      subCategories: {} as Record<string, Board[]>
    };
    
    // 게시판 정렬 함수
    const sortBoards = (boardList: Board[]) => {
      if (!boardList || boardList.length === 0) return [];
      return [...boardList].sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return a.name.localeCompare(b.name);
      });
    };
    
    // 상위 게시판 찾기 (1차 분류)
    const findCategories = () => {
      // 입력 데이터 검증
      if (!boards || boards.length === 0) {
        console.error('게시판 데이터가 없습니다:', boards);
        return [];
      }
      
      // 최상위 게시판 찾기 (해외축구 같은)
      const rootBoards = boards.filter(b => !b.parent_id);
      
      // 리그 게시판 목록 (해외축구 하위의 리그들)
      let leagueBoards: Board[] = [];
      
      // 해외축구 게시판 찾기
      const footballBoard = rootBoards.find(b => 
        b.name === '해외축구' || b.name === '해외 축구' || b.slug === 'football'
      );
      
      // 해외축구 게시판이 있으면 그 하위 게시판(리그들)을 가져옴
      if (footballBoard) {
        const directLeagues = boards.filter(b => b.parent_id === footballBoard.id);
        leagueBoards = directLeagues;
        console.log('찾은 리그 게시판들:', directLeagues.map(b => b.name));
      }
      
      // 해외축구를 제외한 모든 상위 게시판 (직접적인 자식 게시판이 있는 게시판)
      const otherParentBoards = boards.filter(b => 
        b.name !== '해외축구' && 
        b.name !== '해외 축구' && 
        b.slug !== 'football' &&
        boards.some(child => child.parent_id === b.id)
      );
      
      // 중복 제거를 위해 ID 세트 생성
      const idSet = new Set<string>();
      
      // 중복 제거 함수
      const removeDuplicates = (boardList: Board[]) => {
        return boardList.filter(board => {
          if (idSet.has(board.id)) {
            console.warn(`중복 게시판 ID 발견: ${board.id} (${board.name})`);
            return false;
          }
          idSet.add(board.id);
          return true;
        });
      };
      
      // 리그 게시판과 다른 상위 게시판 합치기 (중복 제거)
      const filteredLeagueBoards = removeDuplicates(leagueBoards);
      const filteredOtherBoards = removeDuplicates(otherParentBoards);
      const allParentBoards = [...filteredLeagueBoards, ...filteredOtherBoards];
      
      console.log('1차 분류용 상위 게시판:', allParentBoards.map(b => b.name));
      return sortBoards(allParentBoards);
    };
    
    // 카테고리(1차 분류) 목록 설정 - 상위 게시판
    result.categories = findCategories();
    
    // 각 카테고리별 하위 게시판 설정 - 2차 분류용
    result.categories.forEach(category => {
      // 각 상위 게시판의 직접적인 자식들을 하위 게시판으로 설정
      const childBoards = boards.filter(b => b.parent_id === category.id);
      result.subCategories[category.id] = sortBoards(childBoards);
    });
    
    console.log('최종 카테고리 결과:', {
      카테고리수: result.categories.length,
      카테고리목록: result.categories.map(c => c.name),
      하위카테고리매핑: Object.keys(result.subCategories).map(id => {
        const cat = result.categories.find(c => c.id === id);
        return {
          상위게시판: cat?.name,
          하위게시판수: result.subCategories[id].length,
          하위게시판목록: result.subCategories[id].map(s => s.name)
        };
      })
    });
    
    return result;
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
      console.error('렌더링할 카테고리가 없습니다:', categories);
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
  
  // 디버깅용 콘솔 로그 (실제 배포 시 제거)
  useEffect(() => {
    console.log('카테고리 목록:', categories.map(c => c.name));
  }, [categories]);
  
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