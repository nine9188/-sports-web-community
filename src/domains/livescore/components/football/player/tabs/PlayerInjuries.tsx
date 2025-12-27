'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { EmptyState } from '@/domains/livescore/components/common';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { InjuryData } from '@/domains/livescore/types/player';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';
import { getTeamById } from '@/domains/livescore/constants/teams';

interface PlayerInjuriesProps {
  playerId: number;
  injuriesData?: InjuryData[];
}

export default function PlayerInjuries({
  injuriesData = []
}: PlayerInjuriesProps) {
  if (!injuriesData || injuriesData.length === 0) {
    return <EmptyState title="부상 기록이 없습니다" message="이 선수의 부상 기록 정보를 찾을 수 없습니다." />;
  }
  
  return (
    <Container>
      <ContainerHeader>
        <ContainerTitle>부상 기록 ({injuriesData.length})</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="!p-4">
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-black/5 dark:bg-white/10"></div>
          
          {injuriesData.map((injury, index) => (
            <div key={index} className="relative pl-6 pb-4 last:pb-0">
              <div className="absolute left-2 top-2 w-2.5 h-2.5 rounded-full bg-red-500 dark:bg-red-600 border-2 border-white dark:border-[#1D1D1D]"></div>
              <div className="bg-[#F5F5F5] dark:bg-[#262626] p-3 rounded-lg border border-black/5 dark:border-white/10">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <div className="mr-1">
                    {injury.fixture.date ? format(new Date(injury.fixture.date), 'yy/MM/dd', { locale: ko }) : '날짜 정보 없음'}
                  </div>
                  <div>•</div>
                  <div className="ml-1">{getLeagueKoreanName(injury.league.name) || injury.league.name}</div>
                </div>
                
                <Link
                  href={`/livescore/football/team/${injury.team.id}`}
                  className="flex items-center gap-2 mb-2 transition-opacity hover:opacity-70 outline-none focus:outline-none"
                >
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                    <UnifiedSportsImage
                      imageId={injury.team.id}
                      imageType={ImageType.Teams}
                      alt={injury.team.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
                    {getTeamById(injury.team.id)?.name_ko || injury.team.name}
                  </div>
                </Link>
                
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-md text-xs space-y-1">
                  <div className="font-medium text-red-800 dark:text-red-400">부상 유형: {injury.type}</div>
                  <div className="text-red-700 dark:text-red-300">사유: {injury.reason}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ContainerContent>
    </Container>
  );
} 