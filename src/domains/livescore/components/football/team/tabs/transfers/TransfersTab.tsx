'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { Container } from '@/shared/components/ui/container';
import { Button } from '@/shared/components/ui';
import { Pagination } from '@/shared/components/ui/pagination';
import { TabList } from '@/shared/components/ui/tabs';
import { TeamTransfersData } from '@/domains/livescore/actions/teams/transfers';
import { getTeamDisplayName } from '@/domains/livescore/constants/teams';
import { PlayerKoreanNames } from '../../TeamPageClient';

const ITEMS_PER_PAGE = 20;

const TRANSFER_TABS = [
  { id: 'in', label: '영입' },
  { id: 'out', label: '방출' },
];

interface TransfersTabProps {
  transfers: TeamTransfersData | undefined;
  playerKoreanNames?: PlayerKoreanNames;
}

/** YYYY-MM-DD → YYYY.MM.DD */
function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

/** 이적 타입 한국어 변환 */
function formatType(type: string): string {
  if (!type || type === 'N/A') return '';
  const lower = type.trim().toLowerCase();
  if (lower === 'free transfer' || lower === 'free') return '자유이적';
  if (lower === 'free agent') return '자유계약';
  if (lower === 'loan') return '임대';
  if (lower === 'return from loan' || lower.includes('return from loan')) return '임대복귀';
  if (lower.includes('end of loan')) return '임대종료';
  if (lower === 'permanent') return '완전이적';
  if (lower === 'transfer') return '이적';
  if (lower === 'return') return '복귀';
  if (lower === 'raise') return '승격';
  // 금액 포함된 경우 (€25M 등) 그대로 표시
  if (type.match(/[€$£]/)) return type.trim();
  return type.trim();
}

/** 팀 한글명 (매핑 없으면 원본 반환) */
function teamName(id: number, fallback: string): string {
  const display = getTeamDisplayName(id);
  return display.startsWith('팀 ') ? fallback : display;
}

export default function TransfersTab({ transfers, playerKoreanNames = {} }: TransfersTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL의 subTab 파라미터에서 초기 탭 가져오기
  const initialTab = searchParams?.get('subTab') || 'in';

  // 탭 상태
  const [activeTab, setActiveTab] = useState(initialTab);

  // 페이지네이션 상태
  const [inPage, setInPage] = useState(1);
  const [outPage, setOutPage] = useState(1);

  // URL의 subTab이 변경되면 activeTab 업데이트
  useEffect(() => {
    const subTab = searchParams?.get('subTab');
    if (subTab && (subTab === 'in' || subTab === 'out')) {
      setActiveTab(subTab);
    }
  }, [searchParams]);

  // 현재 탭에 따른 데이터
  const currentTransfers = activeTab === 'in' ? (transfers?.in || []) : (transfers?.out || []);
  const currentPage = activeTab === 'in' ? inPage : outPage;
  const setCurrentPage = activeTab === 'in' ? setInPage : setOutPage;
  const totalPages = Math.ceil(currentTransfers.length / ITEMS_PER_PAGE);

  // 페이지네이션된 데이터
  const paginatedTransfers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentTransfers.slice(start, start + ITEMS_PER_PAGE);
  }, [currentTransfers, currentPage]);

  // 데이터가 없으면 null 반환
  if (!transfers || (transfers.in.length === 0 && transfers.out.length === 0)) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          이적 정보가 없습니다
        </div>
      </Container>
    );
  }

  const isInTab = activeTab === 'in';

  return (
    <div>
      <Container className="bg-white dark:bg-[#1D1D1D]">
        {/* 탭 (헤더 역할) */}
        <TabList
          tabs={TRANSFER_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="contained"
          className="mb-0 [&_button]:h-12"
        />

        {/* 모바일: 카드 형식 */}
        <div className="md:hidden divide-y divide-black/5 dark:divide-white/10">
          {paginatedTransfers.length > 0 ? paginatedTransfers.map((transfer, index) => {
            const otherTeam = isInTab ? transfer.fromTeam : transfer.toTeam;
            return (
              <div key={`${transfer.player.id}-${index}`} className="px-3 py-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-[#F5F5F5] dark:bg-[#333333] rounded-full overflow-hidden flex-shrink-0">
                    <UnifiedSportsImage
                      imageId={transfer.player.id}
                      imageType={ImageType.Players}
                      alt={transfer.player.name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0] truncate leading-tight">
                        {playerKoreanNames[transfer.player.id] || transfer.player.name}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight flex-shrink-0 max-w-[100px]">
                        {teamName(otherTeam.id, otherTeam.name)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                      <span>{formatDate(transfer.date)}</span>
                      {formatType(transfer.type) && <span>{formatType(transfer.type)}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-xs">
              {isInTab ? '영입 정보가 없습니다' : '방출 정보가 없습니다'}
            </div>
          )}
        </div>

        {/* 데스크톱: 테이블 형식 */}
        <div className="hidden md:block overflow-hidden">
          <table className="w-full">
            <colgroup>
              <col className="w-24" />
              <col />
              <col className="w-48" />
              <col className="w-32" />
            </colgroup>
            <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
              <tr className="h-10">
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">날짜</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">선수</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {isInTab ? '이전 팀' : '이적 팀'}
                </th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">유형</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {paginatedTransfers.length > 0 ? paginatedTransfers.map((transfer, index) => {
                const otherTeam = isInTab ? transfer.fromTeam : transfer.toTeam;
                return (
                  <tr
                    key={`${transfer.player.id}-${index}`}
                    className="hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
                  >
                    <td className="px-6 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(transfer.date)}
                    </td>
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-[#F5F5F5] dark:bg-[#333333] rounded-full overflow-hidden flex-shrink-0">
                          <UnifiedSportsImage
                            imageId={transfer.player.id}
                            imageType={ImageType.Players}
                            alt={transfer.player.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0]">
                          {playerKoreanNames[transfer.player.id] || transfer.player.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex-shrink-0">
                          <UnifiedSportsImage
                            imageId={otherTeam.id}
                            imageType={ImageType.Teams}
                            alt={otherTeam.name}
                            width={20}
                            height={20}
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <span className="text-xs text-gray-900 dark:text-[#F0F0F0] truncate">
                          {teamName(otherTeam.id, otherTeam.name)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatType(transfer.type)}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    {isInTab ? '영입 정보가 없습니다' : '방출 정보가 없습니다'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
          <button
            onClick={() => router.push('/transfers')}
            className="hidden md:flex p-2 px-3 rounded border border-black/7 dark:border-0 text-sm transition-colors bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] items-center gap-1 flex-shrink-0"
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
          </button>
        </div>
      </div>
    </div>
  );
}
