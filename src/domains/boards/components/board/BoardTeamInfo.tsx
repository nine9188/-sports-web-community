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
      <div className={`bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg shadow-sm overflow-hidden ${className}`}>
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
          <p className="text-sm text-gray-900 dark:text-[#F0F0F0]">팀 정보를 불러올 수 없습니다.</p>
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
      </div>
    );
  }

  const { team, venue } = teamData;

  return (
    <div className={`bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* 통합 레이아웃: 로고 + 팀 이름 + 글쓰기 아이콘 */}
      <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
        <div className="flex items-center gap-2 min-w-0">
          {/* 팀 로고 */}
          <div className="relative w-6 h-6 flex-shrink-0">
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
            className="p-2 rounded-full hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors flex-shrink-0"
          >
            <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
          </Link>
        )}
      </div>
    </div>
  );
} 