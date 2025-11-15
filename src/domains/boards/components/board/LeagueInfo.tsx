'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
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
      <div className={`bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg shadow-sm p-4 ${className}`}>
        <div className="flex justify-between items-center">
          <p className="text-gray-500 dark:text-gray-400">리그 정보를 불러올 수 없습니다.</p>
          {isLoggedIn && (
            <Link
              href={`/boards/${boardSlug || boardId}/create`}
              aria-label="글쓰기"
              title="글쓰기"
              className="p-2 rounded-full hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
            >
              <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg shadow-sm p-4 ${className}`}>
      {/* 모바일: 로고 + 리그 이름 + 글쓰기 아이콘 (한 줄) */}
      <div className="md:hidden flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {/* 리그 로고 (작게) */}
          <div className="relative w-6 h-6">
            <ApiSportsImage
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
            className="p-2 rounded-full hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
          >
            <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
          </Link>
        )}
      </div>

      {/* 데스크톱: 기존 상세 레이아웃 */}
      <div className="hidden md:flex items-center gap-4">
        {/* 리그 로고 */}
        <div className="relative w-20 h-20">
          <ApiSportsImage
            imageId={leagueData.id}
            imageType={ImageType.Leagues}
            alt={`${leagueData.name} logo`}
            width={80}
            height={80}
            className="object-contain w-20 h-20"
          />
        </div>

        {/* 리그 정보 */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">{leagueData.name}</h2>
              {leagueData.country && (
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">국가: {leagueData.country}</p>
              )}
              {leagueData.type && (
                <p className="text-gray-700 dark:text-gray-300 text-sm">형태: {leagueData.type}</p>
              )}
            </div>
            {isLoggedIn && (
              <Link
                href={`/boards/${boardSlug || boardId}/create`}
                aria-label="글쓰기"
                title="글쓰기"
                className="p-2 rounded-full hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
              >
                <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 