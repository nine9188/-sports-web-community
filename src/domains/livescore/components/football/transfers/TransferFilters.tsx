'use client';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchLeagueTeams, LeagueTeam } from '@/domains/livescore/actions/footballApi';
import {
  Container,
  ContainerHeader,
  ContainerTitle,
  NativeSelect,
  Button
} from '@/shared/components/ui';

const LEAGUE_OPTIONS = [
  { value: 'all', label: '전체 리그 (13개 리그)' },
  // Tier 1: 5대 리그
  { value: '39', label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 프리미어리그' },
  { value: '140', label: '🇪🇸 라리가' },
  { value: '135', label: '🇮🇹 세리에A' },
  { value: '78', label: '🇩🇪 분데스리가' },
  { value: '61', label: '🇫🇷 리그1' },
  // Tier 2
  { value: '292', label: '🇰🇷 K리그1' },
  { value: '40', label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 챔피언십' },
  { value: '88', label: '🇳🇱 에레디비시' },
  { value: '94', label: '🇵🇹 프리메이라리가' },
  // Tier 3
  { value: '98', label: '🇯🇵 J1리그' },
  { value: '253', label: '🇺🇸 MLS' },
  { value: '307', label: '🇸🇦 사우디 프로리그' },
  { value: '71', label: '🇧🇷 브라질레이랑' },
  // Tier 4
  { value: '119', label: '🇩🇰 덴마크 수페르리가' },
  { value: '169', label: '🇨🇳 중국 슈퍼리그' },
  { value: '262', label: '🇲🇽 리가MX' },
  { value: '179', label: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 스코틀랜드 프리미어십' },
];

// 팀 데이터 메모리 캐시 (컴포넌트 외부에 위치)
const teamsCache = new Map<string, LeagueTeam[]>();

// 팀 데이터 미리 로딩할 리그 (5대 리그만, rate limit 방지)
const PRELOAD_LEAGUES = [39, 140, 135, 78, 61];

// 유럽식 시즌 기본값 계산 (이적 필터 기본 리그가 유럽 리그이므로)
const getDefaultSeason = () => {
  const now = new Date();
  return now.getMonth() + 1 < 7 ? now.getFullYear() - 1 : now.getFullYear();
};

// 팀 데이터 미리 로딩 함수
const preloadTeamsData = async () => {
  if (teamsCache.size > 0) return; // 이미 로딩된 경우 스킵
  

  
  try {
    const loadPromises = PRELOAD_LEAGUES.map(async (leagueId) => {
      try {
        const teams = await fetchLeagueTeams(leagueId.toString());
        teamsCache.set(leagueId.toString(), teams);

      } catch {
        // 개별 리그 로딩 실패 시 무시하고 계속 진행
      }
    });
    
    await Promise.all(loadPromises);
  } catch {
    // 전체 로딩 실패 시 무시하고 계속 진행
  }
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
  const [availableTeams, setAvailableTeams] = useState<LeagueTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // 컴포넌트 마운트 시 주요 리그들의 팀 데이터 미리 로딩
  useEffect(() => {
    preloadTeamsData();
  }, []);

  // 모바일에서는 접힌 상태로 시작, 데스크탑에서는 펼친 상태로 시작
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 728;
      setIsOpen(!isMobile);
    }
  }, []);

  // 선택된 리그에 따라 팀 목록 로드 (미리 로딩된 캐시 사용)
  useEffect(() => {
    const loadTeamsForLeague = async () => {
      if (!currentFilters.league || currentFilters.league === 'all') {
        setAvailableTeams([]);
        setLoadingTeams(false);
        return;
      }

      const leagueId = currentFilters.league.toString();
      
      // 캐시에서 먼저 확인 (대부분 이미 로딩되어 있을 것)
      if (teamsCache.has(leagueId)) {
        setAvailableTeams(teamsCache.get(leagueId)!);
        setLoadingTeams(false);
        return;
      }

      // 캐시에 없는 경우에만 API 호출 (마이너 리그)
      setLoadingTeams(true);
      try {
        const teams = await fetchLeagueTeams(leagueId);
        teamsCache.set(leagueId, teams);
        setAvailableTeams(teams);
      } catch {
        // 팀 목록 로딩 실패 시 빈 배열 표시
        setAvailableTeams([]);
      } finally {
        setLoadingTeams(false);
      }
    };

    loadTeamsForLeague();
  }, [currentFilters.league]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // 리그가 변경되는 경우 팀과 이적 유형 선택을 초기화
    if (key === 'league') {
      params.delete('team');
      params.delete('type'); // 리그 변경 시 이적 유형도 초기화
    }
    
    if (value && value !== 'all') {
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
    const placeholder = !currentFilters.league || currentFilters.league === 'all'
      ? '먼저 리그를 선택하세요'
      : loadingTeams ? '팀 목록 로딩 중...' : '전체 팀';

    options.push({ value: 'all', label: placeholder });

    if (currentFilters.league && currentFilters.league !== 'all' && !loadingTeams) {
      availableTeams.forEach((team) => {
        options.push({
          value: team.id.toString(),
          label: `${team.name}${team.isWinner ? ' 🏆' : ''}`
        });
      });
    }

    return options;
  }, [currentFilters.league, loadingTeams, availableTeams]);

  // 이적 유형 옵션
  const typeOptions = useMemo(() => {
    const placeholder = !currentFilters.league || currentFilters.league === 'all'
      ? '먼저 리그를 선택하세요'
      : '전체';

    const options = [{ value: 'all', label: placeholder }];

    if (currentFilters.league && currentFilters.league !== 'all') {
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
            value={currentFilters.league?.toString() || 'all'}
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
            disabled={!currentFilters.league || currentFilters.league === 'all'}
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
            disabled={!currentFilters.league || currentFilters.league === 'all'}
            options={typeOptions}
            placeholder="전체"
          />
        </div>

        {/* 활성 필터 표시 */}
        {(currentFilters.league || currentFilters.team || currentFilters.type || currentFilters.season !== getDefaultSeason()) && (
          <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-[13px] text-gray-700 dark:text-gray-300">활성 필터:</span>
              {currentFilters.league && (
                <span className="inline-flex items-center px-3 py-1 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-[13px] rounded-full">
                  {LEAGUE_OPTIONS.find(o => o.value === currentFilters.league?.toString())?.label || '선택된 리그'}
                  <Button
                    variant="ghost"
                    onClick={() => updateFilter('league', 'all')}
                    className="ml-2 h-auto p-0 text-base"
                  >
                    ×
                  </Button>
                </span>
              )}
              {currentFilters.team && (
                <span className="inline-flex items-center px-3 py-1 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-[13px] rounded-full">
                  {availableTeams.find(t => t.id === parseInt(currentFilters.team?.toString() || '0'))?.name || '선택된 팀'}
                  <Button
                    variant="ghost"
                    onClick={() => updateFilter('team', 'all')}
                    className="ml-2 h-auto p-0 text-base"
                  >
                    ×
                  </Button>
                </span>
              )}
              {currentFilters.type && currentFilters.league && currentFilters.league !== 'all' && (
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
      </div>
    </Container>
  );
}