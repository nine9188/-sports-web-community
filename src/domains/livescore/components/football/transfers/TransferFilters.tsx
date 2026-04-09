'use client';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Container,
  ContainerHeader,
  ContainerTitle,
  NativeSelect,
  Button
} from '@/shared/components/ui';
import { getTeamsByLeagueId, getTeamDisplayName } from '@/domains/livescore/constants/teams';

const LEAGUE_OPTIONS = [
  { value: '', label: '리그를 선택하세요' },
  { value: '39', label: '프리미어리그' },
  { value: '140', label: '라리가' },
  { value: '135', label: '세리에A' },
  { value: '78', label: '분데스리가' },
  { value: '61', label: '리그1' },
  { value: '292', label: 'K리그1' },
  { value: '40', label: '챔피언십' },
  { value: '88', label: '에레디비시' },
  { value: '94', label: '프리메이라리가' },
  { value: '98', label: 'J1리그' },
  { value: '253', label: 'MLS' },
  { value: '307', label: '사우디 프로리그' },
  { value: '71', label: '브라질레이랑' },
  { value: '119', label: '덴마크 수페르리가' },
  { value: '169', label: '중국 슈퍼리그' },
  { value: '262', label: '리가MX' },
  { value: '179', label: '스코틀랜드 프리미어십' },
];

// 유럽식 시즌 기본값 계산
const getDefaultSeason = () => {
  const now = new Date();
  return now.getMonth() + 1 < 7 ? now.getFullYear() - 1 : now.getFullYear();
};

interface TransferFiltersProps {
  currentFilters: {
    league?: number | string;
    team?: number | string;
    season?: number | string;
    type?: 'in' | 'out' | 'all';
  };
}

export default function TransferFilters({ currentFilters }: TransferFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(true);

  // 모바일에서는 접힌 상태로 시작, 데스크탑에서는 펼친 상태로 시작
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 728;
      setIsOpen(!isMobile);
    }
  }, []);

  // 상수에서 팀 목록 즉시 가져오기 (API 호출 없음)
  const availableTeams = useMemo(() => {
    if (!currentFilters.league) return [];
    const leagueId = typeof currentFilters.league === 'string'
      ? parseInt(currentFilters.league)
      : currentFilters.league;
    return getTeamsByLeagueId(leagueId);
  }, [currentFilters.league]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // 리그가 변경되는 경우 팀과 이적 유형 선택을 초기화
    if (key === 'league') {
      params.delete('team');
      params.delete('type'); // 리그 변경 시 이적 유형도 초기화
    }
    
    if (value && value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // 페이지는 1로 리셋
    params.delete('page');
    
    const queryString = params.toString();
    const newUrl = queryString ? `/transfers?${queryString}` : '/transfers';
    
    router.push(newUrl);
  };

  const clearAllFilters = () => {
    router.push('/transfers');
  };

  // 팀 옵션 생성
  const teamOptions = useMemo(() => {
    const options = [];
    options.push({
      value: 'all',
      label: currentFilters.league ? '전체 팀' : '먼저 리그를 선택하세요'
    });

    [...availableTeams]
      .sort((a, b) => (a.name_ko || a.name_en).localeCompare(b.name_ko || b.name_en, 'ko'))
      .forEach((team) => {
        options.push({
          value: team.id.toString(),
          label: team.name_ko || team.name_en,
        });
      });

    return options;
  }, [currentFilters.league, availableTeams]);

  // 이적 유형 옵션
  const typeOptions = useMemo(() => {
    const options = [{ value: 'all', label: currentFilters.league ? '전체' : '먼저 리그를 선택하세요' }];
    if (currentFilters.league) {
      options.push({ value: 'in', label: '영입' });
      options.push({ value: 'out', label: '방출' });
    }
    return options;
  }, [currentFilters.league]);

  return (
    <Container className="overflow-visible">
      <ContainerHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <ContainerTitle>필터</ContainerTitle>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(prev => !prev)}
              className="md:hidden inline-flex items-center text-xs h-auto px-1 py-0"
              aria-expanded={isOpen}
              aria-controls="transfer-filters-body"
            >
              <svg
                className={`w-4 h-4 mr-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.108l3.71-3.878a.75.75 0 111.08 1.04l-4.25 4.44a.75.75 0 01-1.08 0l-4.25-4.44a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
              {isOpen ? '접기' : '펼치기'}
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="text-xs h-auto px-2 py-1"
          >
            전체 초기화
          </Button>
        </div>
      </ContainerHeader>

      <div id="transfer-filters-body" className={`${isOpen ? 'block' : 'hidden'} md:block bg-white dark:bg-[#1D1D1D] px-4 py-3 md:rounded-b-lg overflow-visible`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 overflow-visible">
        {/* 리그 선택 */}
        <div>
          <label className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
            리그 <span className="text-red-500">*</span>
          </label>
          <NativeSelect
            value={currentFilters.league?.toString() || ''}
            onValueChange={(value) => updateFilter('league', value)}
            options={LEAGUE_OPTIONS}
            placeholder="전체 리그"
          />
        </div>

        {/* 팀 선택 */}
        <div>
          <label className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
            팀
          </label>
          <NativeSelect
            value={currentFilters.team?.toString() || 'all'}
            onValueChange={(value) => updateFilter('team', value)}
            disabled={!currentFilters.league}
            options={teamOptions}
            placeholder="전체 팀"
          />
        </div>

        {/* 이적 유형 */}
        <div>
          <label className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
            이적 유형
          </label>
          <NativeSelect
            value={currentFilters.type || 'all'}
            onValueChange={(value) => updateFilter('type', value)}
            disabled={!currentFilters.league}
            options={typeOptions}
            placeholder="전체"
          />
        </div>
        </div>

        {/* 활성 필터 표시 */}
        {(currentFilters.league || currentFilters.team || currentFilters.type || currentFilters.season !== getDefaultSeason()) && (
          <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10">
            <span className="text-[13px] text-gray-700 dark:text-gray-300 mb-2 block md:hidden">활성 필터</span>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-[13px] text-gray-700 dark:text-gray-300 hidden md:inline">활성 필터:</span>
              {currentFilters.league && (
                <span className="inline-flex items-center px-3 py-1 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-[13px] rounded-full">
                  {LEAGUE_OPTIONS.find(o => o.value === currentFilters.league?.toString())?.label || '선택된 리그'}
                  <Button
                    variant="ghost"
                    onClick={() => updateFilter('league', '')}
                    className="ml-2 h-auto p-0 text-base"
                  >
                    ×
                  </Button>
                </span>
              )}
              {currentFilters.team && (
                <span className="inline-flex items-center px-3 py-1 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-[13px] rounded-full">
                  {(() => {
                    const teamId = parseInt(currentFilters.team?.toString() || '0');
                    const team = availableTeams.find(t => t.id === teamId);
                    return team?.name_ko || team?.name_en || '선택된 팀';
                  })()}
                  <Button
                    variant="ghost"
                    onClick={() => updateFilter('team', 'all')}
                    className="ml-2 h-auto p-0 text-base"
                  >
                    ×
                  </Button>
                </span>
              )}
              {currentFilters.type && currentFilters.league && (
                <span className="inline-flex items-center px-3 py-1 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-[13px] rounded-full">
                  {currentFilters.type === 'in' ? '영입' : '방출'}
                  <Button
                    variant="ghost"
                    onClick={() => updateFilter('type', 'all')}
                    className="ml-2 h-auto p-0 text-base"
                  >
                    ×
                  </Button>
                </span>
              )}
              {currentFilters.season && currentFilters.season !== getDefaultSeason() && (
                <span className="inline-flex items-center px-3 py-1 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-[13px] rounded-full">
                  {currentFilters.season}
                  <Button
                    variant="ghost"
                    onClick={() => updateFilter('season', String(getDefaultSeason()))}
                    className="ml-2 h-auto p-0 text-base"
                  >
                    ×
                  </Button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}