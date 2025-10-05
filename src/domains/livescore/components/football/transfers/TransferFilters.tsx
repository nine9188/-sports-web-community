'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchLeagueTeams, LeagueTeam } from '@/domains/livescore/actions/footballApi';

// 팀 데이터 메모리 캐시 (컴포넌트 외부에 위치)
const teamsCache = new Map<string, LeagueTeam[]>();

// 주요 리그 ID들
const MAJOR_LEAGUES = [39, 140, 135, 78, 61]; // 프리미어리그, 라리가, 세리에A, 분데스리가, 리그1

// 팀 데이터 미리 로딩 함수
const preloadTeamsData = async () => {
  if (teamsCache.size > 0) return; // 이미 로딩된 경우 스킵
  

  
  try {
    const loadPromises = MAJOR_LEAGUES.map(async (leagueId) => {
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
    type?: 'in' | 'out';
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
      const isMobile = window.innerWidth < 768;
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">필터</h3>
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className="md:hidden inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
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
          </button>
        </div>
        <button
          onClick={clearAllFilters}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          전체 초기화
        </button>
      </div>

      <div id="transfer-filters-body" className={`${isOpen ? 'block' : 'hidden'} md:block`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 리그 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            리그 <span className="text-red-500">*</span>
          </label>
          <select
            value={currentFilters.league || 'all'}
            onChange={(e) => updateFilter('league', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체 리그</option>
            <option value="39">프리미어리그</option>
            <option value="140">라리가</option>
            <option value="135">세리에A</option>
            <option value="78">분데스리가</option>
            <option value="61">리그1</option>
          </select>
        </div>

        {/* 팀 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            팀
          </label>
          <select
            value={currentFilters.team || 'all'}
            onChange={(e) => updateFilter('team', e.target.value)}
            disabled={!currentFilters.league || currentFilters.league === 'all'}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !currentFilters.league || currentFilters.league === 'all' 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : ''
            }`}
          >
            <option value="all">
              {!currentFilters.league || currentFilters.league === 'all' 
                ? '먼저 리그를 선택하세요' 
                : loadingTeams ? '팀 목록 로딩 중...' : '전체 팀'}
            </option>
            {currentFilters.league && currentFilters.league !== 'all' && !loadingTeams && 
              availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                  {team.isWinner && ' 🏆'}
                </option>
              ))
            }
          </select>
        </div>

        {/* 이적 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이적 유형
          </label>
          <select
            value={currentFilters.type || 'all'}
            onChange={(e) => updateFilter('type', e.target.value)}
            disabled={!currentFilters.league || currentFilters.league === 'all'}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !currentFilters.league || currentFilters.league === 'all' 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : ''
            }`}
          >
            <option value="all">
              {!currentFilters.league || currentFilters.league === 'all' 
                ? '먼저 리그를 선택하세요' 
                : '전체'}
            </option>
            {currentFilters.league && currentFilters.league !== 'all' && (
              <>
                <option value="in">영입</option>
                <option value="out">방출</option>
              </>
            )}
          </select>
        </div>

        {/* 활성 필터 표시 */}
        {(currentFilters.league || currentFilters.team || currentFilters.type || currentFilters.season !== 2025) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm text-gray-500">활성 필터:</span>
              {currentFilters.league && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {currentFilters.league?.toString() === '39' ? '프리미어리그' :
                   currentFilters.league?.toString() === '140' ? '라리가' :
                   currentFilters.league?.toString() === '135' ? '세리에A' :
                   currentFilters.league?.toString() === '78' ? '분데스리가' :
                   currentFilters.league?.toString() === '61' ? '리그1' : '선택된 리그'}
                  <button
                    onClick={() => updateFilter('league', 'all')}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              )}
              {currentFilters.team && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {availableTeams.find(t => t.id === parseInt(currentFilters.team?.toString() || '0'))?.name || '선택된 팀'}
                  <button
                    onClick={() => updateFilter('team', 'all')}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              )}
              {currentFilters.type && currentFilters.league && currentFilters.league !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {currentFilters.type === 'in' ? '영입' : '방출'}
                  <button
                    onClick={() => updateFilter('type', 'all')}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              )}
              {currentFilters.season && currentFilters.season !== 2025 && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {currentFilters.season}
                  <button
                    onClick={() => updateFilter('season', '2025')}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}