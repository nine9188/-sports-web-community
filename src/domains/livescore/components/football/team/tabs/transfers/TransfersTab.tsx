'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

// 4590 표준: placeholder URLs
const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui/container';
import { Pagination } from '@/shared/components/ui/pagination';
import { TabList } from '@/shared/components/ui/tabs';
import { TeamTransfersData, TransferInRecord, TransferOutRecord } from '@/domains/livescore/actions/teams/transfers';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { formatDateDot } from '@/shared/utils/dateUtils';
import { translateTransferType as formatType } from '@/domains/livescore/utils/transferUtils';
import { PlayerKoreanNames } from '../../TeamPageClient';
import TeamTabEmptyState from '../TeamTabEmptyState';

const ITEMS_PER_PAGE = 20;

const TRANSFER_TABS = [
  { id: 'in', label: '영입' },
  { id: 'out', label: '방출' },
];

interface TransfersTabProps {
  teamId: number;
  transfers: TeamTransfersData | undefined;
  playerKoreanNames?: PlayerKoreanNames;
  // 4590 표준: Storage URL 맵
  playerPhotoUrls?: Record<number, string>;
  teamLogoUrls?: Record<number, string>;
}

function TransfersLoading() {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>이적 내역</ContainerTitle>
      </ContainerHeader>
      <div className="px-3 py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
        불러오는 중...
      </div>
    </Container>
  );
}


export default function TransfersTab({ teamId, transfers, playerKoreanNames = {}, playerPhotoUrls = {}, teamLogoUrls = {} }: TransfersTabProps) {
  const { getTeamDisplayName } = useTeamLeague();
  /** 팀 한글명 (매핑 없으면 원본 반환) */
  const teamName = (id: number, fallback: string): string => {
    const display = getTeamDisplayName(id);
    return display.startsWith('팀 ') ? fallback : display;
  };
  // 4590 표준: URL 조회 헬퍼
  const displayTransfers = transfers;
  const displayPlayerKoreanNames = playerKoreanNames;
  const displayPlayerPhotoUrls = playerPhotoUrls;
  const displayTeamLogoUrls = teamLogoUrls;

  const getPlayerPhoto = (id: number) => displayPlayerPhotoUrls[id] || PLAYER_PLACEHOLDER;
  const getTeamLogo = (id: number, fallback?: string) => displayTeamLogoUrls[id] || fallback || TEAM_PLACEHOLDER;
  const searchParams = useSearchParams();

  // URL의 subTab 파라미터에서 초기 탭 가져오기
  const initialTab = searchParams?.get('subTab') === 'out' ? 'out' : 'in';

  // 탭 상태
  const [activeTab, setActiveTab] = useState(initialTab);

  // 페이지네이션 상태
  const [inPage, setInPage] = useState(1);
  const [outPage, setOutPage] = useState(1);

  useEffect(() => {
    setInPage(1);
    setOutPage(1);
  }, [teamId]);

  // URL의 subTab이 변경되면 activeTab 업데이트
  useEffect(() => {
    const subTab = searchParams?.get('subTab');
    if (subTab && (subTab === 'in' || subTab === 'out')) {
      setActiveTab(subTab);
    }
  }, [searchParams]);

  // 현재 탭에 따른 데이터
  const currentTransfers: (TransferInRecord | TransferOutRecord)[] = useMemo(() => {
    return activeTab === 'in' ? (displayTransfers?.in || []) : (displayTransfers?.out || []);
  }, [activeTab, displayTransfers]);
  const currentPage = activeTab === 'in' ? inPage : outPage;
  const setCurrentPage = activeTab === 'in' ? setInPage : setOutPage;
  const totalPages = Math.ceil(currentTransfers.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, setCurrentPage, totalPages]);

  // 페이지네이션된 데이터
  const paginatedTransfers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentTransfers.slice(start, start + ITEMS_PER_PAGE);
  }, [currentTransfers, currentPage]);

  // 데이터가 없으면 null 반환
  if (!displayTransfers || (displayTransfers.in.length === 0 && displayTransfers.out.length === 0)) {
    return <TeamTabEmptyState title="이적 내역" message="이적 정보가 없습니다." />;
  }

  const isInTab = activeTab === 'in';

  return (
    <div>
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>이적 내역</ContainerTitle>
        </ContainerHeader>
        <TabList
          tabs={TRANSFER_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="contained"
          className="mb-0 [&_button]:h-12"
        />

        <div className="hidden grid-cols-[6rem_minmax(0,1fr)_12rem_8rem] bg-[#F5F5F5] dark:bg-[#262626] md:grid">
          <div className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">날짜</div>
          <div className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">선수</div>
          <div className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {isInTab ? '이전 팀' : '이적 팀'}
          </div>
          <div className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">유형</div>
        </div>

        <div className="divide-y divide-black/5 dark:divide-white/10">
          {paginatedTransfers.length > 0 ? paginatedTransfers.map((transfer, index) => {
            const otherTeam = isInTab ? (transfer as TransferInRecord).fromTeam : (transfer as TransferOutRecord).toTeam;
            return (
              <div
                key={`${transfer.player.id}-${index}`}
                className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,100px)] items-center gap-x-2 gap-y-0.5 px-3 py-2 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] md:grid-cols-[6rem_minmax(0,1fr)_12rem_8rem] md:gap-y-0 md:px-6"
              >
                <div className="order-1 row-span-2 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#F5F5F5] dark:bg-[#333333] md:hidden">
                  <UnifiedSportsImageClient
                    src={getPlayerPhoto(transfer.player.id)}
                    alt={transfer.player.name}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="order-4 col-start-2 text-[10px] text-gray-400 dark:text-gray-500 leading-tight md:order-none md:col-auto md:text-xs md:text-gray-500 md:dark:text-gray-400">
                  {formatDateDot(transfer.date)}
                </div>

                <div className="order-2 col-start-2 flex min-w-0 items-center gap-2 md:order-none md:col-auto">
                  <div className="hidden h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#F5F5F5] dark:bg-[#333333] md:block">
                    <UnifiedSportsImageClient
                      src={getPlayerPhoto(transfer.player.id)}
                      alt={transfer.player.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0] truncate leading-tight">
                    {displayPlayerKoreanNames[transfer.player.id] || transfer.player.name}
                  </span>
                </div>

                <div className="order-3 col-start-3 flex min-w-0 items-center justify-end gap-1 md:order-none md:col-auto md:justify-start">
                  <div className="hidden w-5 h-5 flex-shrink-0 md:block">
                    <UnifiedSportsImageClient
                      src={getTeamLogo(otherTeam.id, otherTeam.logo)}
                      alt={otherTeam.name}
                      width={20}
                      height={20}
                      fit="contain"
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight md:text-gray-900 md:dark:text-[#F0F0F0]">
                    {teamName(otherTeam.id, otherTeam.name)}
                  </span>
                </div>

                <div className="order-5 col-start-3 text-right text-[10px] text-gray-400 dark:text-gray-500 leading-tight md:order-none md:col-auto md:text-left md:text-xs md:text-gray-500 md:dark:text-gray-400">
                  {formatType(transfer.type)}
                </div>
              </div>
            );
          }) : (
            <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
              {isInTab ? '영입 정보가 없습니다' : '방출 정보가 없습니다'}
            </div>
          )}
        </div>
      </Container>

      {/* 페이지네이션 및 이적센터 버튼 */}
      <div className="mt-4">
        <div className={`flex items-center gap-3 ${totalPages > 1 ? 'justify-center md:justify-between' : 'md:justify-end'}`}>
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center md:flex-1">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                mode="button"
                withMargin={false}
              />
            </div>
          )}

          {/* 이적센터 버튼 - 데스크톱만 표시 */}
          <Link
            href="/transfers"
            className="hidden md:flex p-2 px-3 rounded border border-black/7 dark:border-0 text-[13px] transition-colors bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] items-center gap-1 flex-shrink-0"
          prefetch={false}
          >
            이적센터
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
