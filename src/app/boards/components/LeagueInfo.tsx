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
}

export default function LeagueInfo({ leagueData, boardId, boardSlug, isLoggedIn = false }: LeagueInfoProps) {
  // 데이터가 없으면 기본 UI 반환
  if (!leagueData) {
    return (
      <div className="bg-white border rounded-md shadow-sm p-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-500">리그 정보를 불러올 수 없습니다.</p>
          {isLoggedIn && (
            <Link href={`/boards/${boardSlug || boardId}/create`}>
              <button className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-md text-sm font-medium border border-slate-700 transition-colors">
                <PenLine className="h-4 w-4" />
                <span>글쓰기</span>
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-md shadow-sm p-4">
      <div className="flex items-center gap-4">
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
              <Link href={`/boards/${boardSlug || boardId}/create`}>
                <button className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-md text-sm font-medium border border-slate-700 transition-colors">
                  <PenLine className="h-4 w-4" />
                  <span>글쓰기</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 