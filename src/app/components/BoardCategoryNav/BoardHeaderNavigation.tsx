'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase-browser';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function BoardHeaderNavigation() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // 마운트 상태 관리
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // 카테고리 데이터 가져오기
  useEffect(() => {
    async function fetchCategories() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name');
          
        if (error) {
          console.error('카테고리 불러오기 오류:', error);
          return;
        }
        
        setCategories(data || []);
      } catch (error) {
        console.error('카테고리 불러오기 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCategories();
    
    // 네비게이션 바 외부 클릭 감지
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setHoveredCategory(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 호버 시작 처리
  const handleMouseEnter = (categoryId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(categoryId);
    }, 100); // 약간의 지연으로 우연한 호버 방지
  };

  // 호버 종료 처리
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 200); // 메뉴로 마우스 이동 가능하도록 약간의 지연
  };

  // 메뉴 호버 처리
  const handleMenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // 드롭다운 메뉴 렌더링
  const renderDropdownMenu = (category: Category) => {
    if (!mounted || !categoryRefs.current[category.id]) return null;
    
    // 해당 카테고리 요소의 위치 정보 가져오기
    const rect = categoryRefs.current[category.id]?.getBoundingClientRect();
    if (!rect) return null;
    
    // 포털을 사용하여 body에 직접 렌더링
    return ReactDOM.createPortal(
      <div 
        className="fixed bg-white border rounded-md shadow-lg py-1"
        style={{
          top: `${rect.bottom + window.scrollY}px`, // 메뉴를 네비게이션 바 아래로 위치
          left: `${rect.left + window.scrollX}px`,
          width: '240px',
          maxHeight: '70vh',
          overflowY: 'auto',
          zIndex: 50 // z-index 상향 조정
        }}
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 카테고리 링크 */}
        <Link 
          href={`/categories/${category.slug || category.id}`}
          className="block px-3 py-1.5 text-primary text-sm font-medium hover:bg-gray-100 border-b border-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            setHoveredCategory(null); // 클릭 후 드롭다운 닫기
          }}
        >
          <div className="flex items-center">
            <ChevronRight className="h-3.5 w-3.5 mr-1" />
            <span>{category.name} 메인 페이지</span>
          </div>
        </Link>
      </div>,
      document.body
    );
  };

  // 카테고리 링크 렌더링
  const renderCategories = () => {
    return (
      <ul className="flex items-center space-x-1">
        {categories.map(category => (
          <li 
            key={category.id} 
            className="relative"
            ref={(node: HTMLLIElement | null) => {
              categoryRefs.current[category.id] = node;
              return undefined;
            }}
          >
            {/* 카테고리 링크 */}
            <div 
              className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 cursor-pointer"
              onMouseEnter={() => handleMouseEnter(category.id)}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                router.push(`/categories/${category.slug || category.id}`);
              }}
            >
              {category.name}
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
            
            {/* 카테고리 호버 메뉴 */}
            {hoveredCategory === category.id && renderDropdownMenu(category)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div ref={navRef} className="flex items-center space-x-1 overflow-x-auto">
      {loading ? (
        // 로딩 상태
        <div className="px-3 py-1">
          <div className="h-7 bg-gray-100 rounded animate-pulse w-20"></div>
        </div>
      ) : categories.length === 0 ? (
        // 카테고리가 없을 때
        <div className="px-3 py-1 text-sm text-gray-500">
          카테고리가 없습니다
        </div>
      ) : (
        // 카테고리 목록 표시
        renderCategories()
      )}
    </div>
  );
} 