'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { EmptyState } from '@/domains/livescore/components/common';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { TransferData } from '@/domains/livescore/types/player';
import { getTeamById } from '@/domains/livescore/constants/teams';

// 4590 표준: placeholder 상수
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

interface PlayerTransfersProps {
  playerId: number;
  transfersData?: TransferData[];
  // 4590 표준: 이미지 Storage URL
  teamLogoUrls?: Record<number, string>;
}

// 이적 유형 한글 매핑
const transferTypeMap: { [key: string]: string } = {
  'Loan': '임대',
  'Free': '자유 이적',
  'N/A': '정보 없음',
};

// 4590 표준: 팀 로고 컴포넌트
const TeamLogo = ({ logoUrl, name }: { logoUrl: string; name: string }) => {
  return (
    <div className="w-12 h-12 flex items-center justify-center">
      <UnifiedSportsImageClient
        src={logoUrl}
        alt={name || '팀'}
        width={48}
        height={48}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default function PlayerTransfers({
  transfersData = [],
  teamLogoUrls = {}
}: PlayerTransfersProps) {
  // 4590 표준: URL 헬퍼 함수
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  // 이적료 포맷팅 함수
  const formatTransferType = (type: string) => {
    // 이적 유형이 매핑에 있는 경우 한글로 변환
    if (type in transferTypeMap) {
      return transferTypeMap[type];
    }
    // 그 외의 경우 (이적료가 있는 경우) 금액 표시
    return `${type}`;
  };
  
  if (transfersData.length === 0) {
    return <EmptyState title="이적 기록이 없습니다" message="이 선수의 이적 기록 정보를 찾을 수 없습니다." />;
  }

  return (
    <Container>
      <ContainerHeader>
        <ContainerTitle>이적 기록 ({transfersData.length})</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="!p-3">
        <div className="space-y-3">
          {transfersData.map((transfer, index) => (
            <div key={index} className="bg-[#F5F5F5] dark:bg-[#262626] rounded-lg p-3 border border-black/5 dark:border-white/10">
              {/* 날짜 - 상단에 배치 */}
              <div className="text-center mb-3 pb-2 border-b border-black/5 dark:border-white/10">
                <span className="inline-block px-2.5 py-1 bg-white dark:bg-[#1D1D1D] rounded-full text-xs font-medium text-gray-900 dark:text-[#F0F0F0]">
                  {transfer.date ? format(new Date(transfer.date), 'yy/MM/dd', { locale: ko }) : '날짜 정보 없음'}
                </span>
              </div>

              <div className="flex items-center">
                {/* 이전 팀 */}
                <div className="flex-1 flex flex-col items-center">
                  <Link
                    href={`/livescore/football/team/${transfer.teams.from.id}`}
                    className="flex flex-col items-center transition-opacity hover:opacity-70 outline-none focus:outline-none"
                  >
                    <TeamLogo
                      logoUrl={getTeamLogo(transfer.teams.from.id)}
                      name={transfer.teams.from.name}
                    />
                    <p className="mt-1.5 text-xs font-medium text-center text-gray-900 dark:text-[#F0F0F0] max-w-[100px] truncate">
                      {getTeamById(transfer.teams.from.id)?.name_ko || transfer.teams.from.name || '알 수 없는 팀'}
                    </p>
                  </Link>
                </div>

                {/* 이적 정보 */}
                <div className="flex-1 flex flex-col items-center px-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-[#EAEAEA] dark:bg-[#333333] rounded-full">
                    <svg 
                      className="w-4 h-4 text-gray-700 dark:text-gray-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M17 8l4 4m0 0l-4 4m4-4H3" 
                      />
                    </svg>
                  </div>
                  <div className="mt-1.5 px-2 py-1 bg-white dark:bg-[#1D1D1D] rounded-full text-center">
                    <span className="text-xs font-bold text-gray-900 dark:text-[#F0F0F0]">
                      {formatTransferType(transfer.type)}
                    </span>
                  </div>
                </div>

                {/* 새로운 팀 */}
                <div className="flex-1 flex flex-col items-center">
                  <Link
                    href={`/livescore/football/team/${transfer.teams.to.id}`}
                    className="flex flex-col items-center transition-opacity hover:opacity-70 outline-none focus:outline-none"
                  >
                    <TeamLogo
                      logoUrl={getTeamLogo(transfer.teams.to.id)}
                      name={transfer.teams.to.name}
                    />
                    <p className="mt-1.5 text-xs font-medium text-center text-gray-900 dark:text-[#F0F0F0] max-w-[100px] truncate">
                      {getTeamById(transfer.teams.to.id)?.name_ko || transfer.teams.to.name || '알 수 없는 팀'}
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ContainerContent>
    </Container>
  );
}