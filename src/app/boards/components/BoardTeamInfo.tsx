'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PenLine } from 'lucide-react';

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
}

export default function BoardTeamInfo({ teamData, boardId, boardSlug }: BoardTeamInfoProps) {
  // 데이터 유효성 검사
  if (!teamData || !teamData.team || !teamData.venue) {
    return (
      <div className="bg-white border rounded-md shadow-sm p-4">
        <div className="flex justify-between">
          <p>팀 정보를 불러올 수 없습니다.</p>
          <Link href={`/boards/${boardSlug || boardId}/create`}>
            <button className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-md text-sm font-medium border border-slate-700 transition-colors">
              <PenLine className="h-4 w-4" />
              <span>글쓰기</span>
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const { team, venue } = teamData;

  return (
    <div className="bg-white border rounded-md shadow-sm p-4">
      <div className="flex items-center gap-4">
        {/* 팀 로고 */}
        <div className="relative w-20 h-20">
          {team.logo && (
            <Image
              src={team.logo}
              alt={`${team.name} logo`}
              fill
              className="object-contain"
              sizes="80px"
            />
          )}
        </div>

        {/* 팀 정보 */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{team.name}</h2>
              <p className="text-gray-600 text-sm">{team.country}</p>
              <div className="mt-2 text-sm text-gray-500">
                <p>창단: {team.founded}년</p>
                <p>홈구장: {venue.name} ({venue.capacity.toLocaleString()}명)</p>
              </div>
            </div>
            <Link href={`/boards/${boardSlug || boardId}/create`}>
              <button className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-md text-sm font-medium border border-slate-700 transition-colors">
                <PenLine className="h-4 w-4" />
                <span>글쓰기</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 