'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';

interface TeamData {
  team: {
    id: number;
    name: string;
    country: string;
    founded: number;
    logo: string;
  };
  venue: {
    name: string;
    city: string;
    capacity: number;
  };
}

interface BoardTeamInfoProps {
  teamData: TeamData;
  boardId: string;
  boardSlug?: string;
  isLoggedIn?: boolean;
  className?: string;
}

export default function BoardTeamInfo({ teamData, boardId, boardSlug, isLoggedIn = false, className = '' }: BoardTeamInfoProps) {
  // 데이터 유효성 검사
  if (!teamData || !teamData.team || !teamData.venue) {
    return (
      <div className={`bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg shadow-sm p-4 ${className}`}>
        <div className="flex justify-between">
          <p className="text-gray-900 dark:text-[#F0F0F0]">팀 정보를 불러올 수 없습니다.</p>
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

  const { team, venue } = teamData;

  return (
    <div className={`bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg shadow-sm p-4 ${className}`}>
      {/* 모바일: 로고 + 팀 이름 + 글쓰기 아이콘 (한 줄) */}
      <div className="md:hidden flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {/* 팀 로고 (작게) */}
          <div className="relative w-6 h-6">
            <ApiSportsImage
              imageId={team.id}
              imageType={ImageType.Teams}
              alt={`${team.name} logo`}
              width={24}
              height={24}
              className="object-contain w-6 h-6"
            />
          </div>
          <span className="text-sm font-semibold truncate text-gray-900 dark:text-[#F0F0F0]">{team.name}</span>
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
        {/* 팀 로고 */}
        <div className="relative w-20 h-20">
          <ApiSportsImage
            imageId={team.id}
            imageType={ImageType.Teams}
            alt={`${team.name} logo`}
            width={80}
            height={80}
            className="object-contain w-20 h-20"
          />
        </div>

        {/* 팀 정보 */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">{team.name}</h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{team.country}</p>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p>창단: {team.founded}년</p>
                <p>홈구장: {venue.name} ({venue.capacity.toLocaleString()}명)</p>
              </div>
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