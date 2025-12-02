'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

// 팀 데이터 타입 정의
interface Team {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

// 서브카테고리 타입 정의
interface SubCategory {
  id: string;
  name: string;
  icon?: string;
  teams: Team[];
}

// 카테고리 정보 타입 정의
interface CategoryInfo {
  id: string;
  name: string;
  subcategories: Record<string, SubCategory>;
}

interface CategoryNavigationProps {
  category: string;
  categoryInfo: CategoryInfo;
}

export default function CategoryNavigation({ category, categoryInfo }: CategoryNavigationProps) {
  const params = useParams() || {};
  const currentSubcategory = params.subcategory as string;
  const currentTeam = params.team as string;
  const [hoveredLeague, setHoveredLeague] = useState<string | null>(null);
  
  return (
    <div className="space-y-4">
      {/* 경로 네비게이션 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/posts/categories/${category}`} className="hover:text-foreground">
          {categoryInfo.name}
        </Link>
        
        {currentSubcategory && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link 
              href={`/posts/categories/${category}/${currentSubcategory}`}
              className="hover:text-foreground"
            >
              {categoryInfo.subcategories[currentSubcategory].name}
            </Link>
          </>
        )}

        {currentTeam && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">
              {categoryInfo.subcategories[currentSubcategory].teams.find(
                (t: Team) => t.slug === currentTeam
              )?.name}
            </span>
          </>
        )}
      </div>

      {/* 리그 네비게이션 */}
      <div className="border-b">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {Object.entries(categoryInfo.subcategories).map(([subSlug, sub]: [string, SubCategory]) => (
            <div 
              key={subSlug} 
              className="relative"
              onMouseEnter={() => setHoveredLeague(subSlug)}
              onMouseLeave={() => setHoveredLeague(null)}
            >
              <Link 
                href={`/posts/categories/${category}/${subSlug}`}
                className={`inline-flex items-center px-3 py-1.5 text-sm whitespace-nowrap hover:bg-accent/50 rounded-md ${
                  currentSubcategory === subSlug ? 'bg-accent/50' : ''
                }`}
              >
                <span className="mr-1">{sub.icon}</span>
                <span>{sub.name}</span>
              </Link>

              {hoveredLeague === subSlug && (
                <div className="absolute left-0 top-full pt-1 z-50 w-[160px]">
                  <div className="bg-popover border rounded-md shadow-md py-1">
                    {sub.teams.map((team: Team) => (
                      <Link
                        key={team.slug}
                        href={`/posts/categories/${category}/${subSlug}/${team.slug}`}
                        className={`block px-3 py-1.5 text-sm hover:bg-accent ${
                          currentTeam === team.slug ? 'bg-accent' : ''
                        }`}
                      >
                        {team.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 