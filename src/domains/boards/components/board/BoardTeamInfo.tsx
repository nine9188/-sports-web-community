'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

// 4590 표준: placeholder 상수
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

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
  // 4590 표준: 이미지 Storage URL
  teamLogoUrl?: string;
}

export default function BoardTeamInfo({ teamData, boardId, boardSlug, isLoggedIn = false, className = '', teamLogoUrl }: BoardTeamInfoProps) {
  // 데이터 유효성 검사
  if (!teamData || !teamData.team || !teamData.venue) {
    return (
      <div className={`h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] ${className}`}>
        <p className="text-sm text-gray-900 dark:text-[#F0F0F0]">팀 정보를 불러올 수 없습니다.</p>
        {isLoggedIn && (
          <Link
            href={`/boards/${boardSlug || boardId}/create`}
            aria-label="글쓰기"
            title="글쓰기"
            className="p-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors flex-shrink-0"
          >
            <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
          </Link>
        )}
      </div>
    );
  }

  const { team, venue } = teamData;

  return (
    <div className={`h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {/* 팀 로고 */}
        <div className="relative w-6 h-6 flex-shrink-0">
          <UnifiedSportsImageClient
            src={teamLogoUrl || TEAM_PLACEHOLDER}
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
          className="p-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors flex-shrink-0"
        >
          <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
        </Link>
      )}
    </div>
  );
} 
