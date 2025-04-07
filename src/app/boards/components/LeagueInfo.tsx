'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
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
}

export default function LeagueInfo({ leagueData, boardId, boardSlug }: LeagueInfoProps) {
  // 데이터가 없으면 기본 UI 반환
  if (!leagueData) {
    return (
      <div className="bg-white border rounded-md shadow-sm p-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-500">리그 정보를 불러올 수 없습니다.</p>
          <Link href={`/boards/${boardSlug || boardId}/create`}>
            <Button size="sm" className="flex items-center gap-1">
              <PenLine className="h-4 w-4" />
              <span>글 작성하기</span>
            </Button>
          </Link>
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
            <Link href={`/boards/${boardSlug || boardId}/create`}>
              <Button size="sm" className="flex items-center gap-1">
                <PenLine className="h-4 w-4" />
                <span>글 작성하기</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 