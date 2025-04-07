'use client'

import { CATEGORIES } from '@/app/lib/constants'
import Image from 'next/image'

// CATEGORIES 배열의 요소 타입 정의
interface CategoryItem {
  id: string;
  name: string;
  subcategories?: Record<string, SubCategoryItem>;
}

interface SubCategoryItem {
  id: string;
  name: string;
  teams?: TeamItem[];
}

interface TeamItem {
  id: string;
  name: string;
  logo: string;
  slug: string;
}

// TeamHeader 컴포넌트의 props 타입
interface TeamHeaderProps {
  category: string;
  subcategory: string;
  team: string;
  colorMode?: 'dark' | 'light';
}

export default function TeamHeader({ category, subcategory, team, colorMode = 'light' }: TeamHeaderProps) {
  // CATEGORIES는 배열이므로 find로 검색
  const categoryInfo = CATEGORIES.find(cat => cat.id === category) as CategoryItem | undefined;
  
  // categoryInfo가 undefined이거나 구조가 예상과 다를 수 있으므로 타입 가드 사용
  const subcategoryInfo = categoryInfo?.subcategories?.[subcategory];
  
  // 팀 정보 찾기 (teams가 배열인 경우)
  const teamInfo = subcategoryInfo?.teams?.find(t => t.slug === team);

  if (!categoryInfo || !subcategoryInfo || !teamInfo) {
    return (
      <div className={colorMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}>
        <div className="container mx-auto px-4 py-2">
          <h1 className="text-lg font-semibold">팀 정보를 찾을 수 없습니다</h1>
        </div>
      </div>
    );
  }

  // 현재 페이지 레벨에 따라 다른 헤더 표시
  return (
    <div className={colorMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center space-x-2">
          {/* 팀 로고와 이름 */}
          <div className="w-8 h-8 relative">
            <Image 
              src={teamInfo.logo} 
              alt={teamInfo.name}
              width={32}
              height={32}
              className="object-contain w-full h-full"
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold flex items-center">
              <span>{teamInfo.name}</span>
            </h1>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {categoryInfo.name} &gt; {subcategoryInfo.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 