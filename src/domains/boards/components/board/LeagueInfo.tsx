'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PenLine } from 'lucide-react';

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
      <div className={`bg-white border rounded-md shadow-sm p-4 ${className}`}>
        <div className="flex justify-between items-center">
          <p className="text-gray-500">리그 정보를 불러올 수 없습니다.</p>
          {isLoggedIn && (
            <Link
              href={`/boards/${boardSlug || boardId}/create`}
              aria-label="글쓰기"
              title="글쓰기"
              className="p-2 rounded-full hover:bg-slate-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <PenLine className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-md shadow-sm p-4 ${className}`}>
      {/* 모바일: 로고 + 리그 이름 + 글쓰기 아이콘 (한 줄) */}
      <div className="md:hidden flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {/* 리그 로고 (작게) */}
          <div className="relative w-6 h-6">
            {leagueData.logo && (
              <Image
                src={leagueData.logo}
                alt={`${leagueData.name} logo`}
                fill
                className="object-contain"
                sizes="24px"
              />
            )}
          </div>
          <span className="text-sm font-semibold truncate">{leagueData.name}</span>
        </div>
        {isLoggedIn && (
          <Link
            href={`/boards/${boardSlug || boardId}/create`}
            aria-label="글쓰기"
            title="글쓰기"
            className="p-2 rounded-full hover:bg-slate-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <PenLine className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* 데스크톱: 기존 상세 레이아웃 */}
      <div className="hidden md:flex items-center gap-4">
        {/* 리그 로고 */}
        <div className="relative w-20 h-20">
          {leagueData.logo && (
            <Image
              src={leagueData.logo}
              alt={`${leagueData.name} logo`}
              fill
              className="object-contain"
              sizes="80px"
            />
          )}
        </div>

        {/* 리그 정보 */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{leagueData.name}</h2>
              {leagueData.country && (
                <p className="text-gray-600 text-sm mt-1">국가: {leagueData.country}</p>
              )}
              {leagueData.type && (
                <p className="text-gray-600 text-sm">형태: {leagueData.type}</p>
              )}
            </div>
            {isLoggedIn && (
              <Link
                href={`/boards/${boardSlug || boardId}/create`}
                aria-label="글쓰기"
                title="글쓰기"
                className="p-2 rounded-full hover:bg-slate-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <PenLine className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 