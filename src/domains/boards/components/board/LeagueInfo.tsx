'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

interface LeagueData {
  id: number;
  name: string;
  country: string;
  logo: string;
  type?: string;
}

interface LeagueInfoProps {
  leagueData: LeagueData | null;
  boardId: string;
  boardSlug?: string;
  isLoggedIn?: boolean;
  className?: string;
}

export default function LeagueInfo({ leagueData, boardId, boardSlug, isLoggedIn = false, className = '' }: LeagueInfoProps) {
  // 데이터가 없으면 기본 UI 반환
  if (!leagueData) {
    return (
      <div className={`h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">리그 정보를 불러올 수 없습니다.</p>
        {isLoggedIn && (
          <Link
            href={`/boards/${boardSlug || boardId}/create`}
            aria-label="글쓰기"
            title="글쓰기"
            className="p-2 rounded-full hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors flex-shrink-0"
          >
            <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {/* 리그 로고 */}
        <div className="relative w-6 h-6 flex-shrink-0">
          <UnifiedSportsImage
            imageId={leagueData.id}
            imageType={ImageType.Leagues}
            alt={`${leagueData.name} logo`}
            width={24}
            height={24}
            className="object-contain w-6 h-6"
          />
        </div>
        <span className="text-sm font-semibold truncate text-gray-900 dark:text-[#F0F0F0]">{leagueData.name}</span>
      </div>
      {isLoggedIn && (
        <Link
          href={`/boards/${boardSlug || boardId}/create`}
          aria-label="글쓰기"
          title="글쓰기"
          className="p-2 rounded-full hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors flex-shrink-0"
        >
          <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
        </Link>
      )}
    </div>
  );
} 