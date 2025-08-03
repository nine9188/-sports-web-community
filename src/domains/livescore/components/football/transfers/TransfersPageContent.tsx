'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { fetchLatestTransfers, TransferMarketData } from '@/domains/livescore/actions/transfers';
import { formatTransferType, getTransferTypeColor } from '@/domains/livescore/types/transfers';
import { TransferFilters } from '@/domains/livescore/components/football/transfers';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { Button } from '@/shared/ui';

// 팀 로고 컴포넌트 - Standings와 동일한 방식으로 메모이제이션
const TeamLogo = memo(({ teamName, teamId, size = 20 }: { teamName: string; teamId?: number; size?: number }) => {
  const sizeClass = size === 20 ? 'w-5 h-5' : size === 24 ? 'w-6 h-6' : `w-${Math.floor(size/4)} h-${Math.floor(size/4)}`;
  
  return (
    <div className={`${sizeClass} flex-shrink-0 relative transform-gpu`}>
      {teamId ? (
        <ApiSportsImage
          imageId={teamId}
          imageType={ImageType.Teams}
          alt={teamName || '팀'}
          width={size}
          height={size}
          className={`object-contain ${sizeClass} rounded`}
        />
      ) : (
        <div className={`${sizeClass} bg-gray-200 flex items-center justify-center text-gray-400 text-xs rounded`}>
          <span style={{ fontSize: `${size * 0.3}px` }}>로고</span>
        </div>
      )}
    </div>
  );
});

TeamLogo.displayName = 'TeamLogo';

// 이적 데이터 메모리 캐시
const transfersCache = new Map<string, TransferMarketData[]>();

// 주요 리그 ID들
const MAJOR_LEAGUES = [39, 140, 135, 78, 61]; // 프리미어리그, 라리가, 세리에A, 분데스리가, 리그1

// 이적 데이터 미리 로딩 함수
const preloadTransfersData = async () => {
  if (transfersCache.size > 0) return; // 이미 로딩된 경우 스킵
  
  console.log('🚀 주요 리그 이적 데이터 미리 로딩 시작...');
  
  try {
    const loadPromises = MAJOR_LEAGUES.map(async (leagueId) => {
      try {
        const cacheKey = `transfers-${leagueId}-all-all-2025-1000`;
        const transfers = await fetchLatestTransfers({ league: leagueId }, 1000);
        transfersCache.set(cacheKey, transfers);
        console.log(`✅ 리그 ${leagueId} 이적 데이터 로딩 완료 (${transfers.length}건)`);
      } catch (error) {
        console.error(`❌ 리그 ${leagueId} 이적 데이터 로딩 실패:`, error);
      }
    });
    
    // 전체 리그 데이터도 미리 로딩
    try {
      const allLeaguesCacheKey = 'transfers-all-all-all-2025-1000';
      const allTransfers = await fetchLatestTransfers({}, 1000);
      transfersCache.set(allLeaguesCacheKey, allTransfers);
      console.log(`✅ 전체 리그 이적 데이터 로딩 완료 (${allTransfers.length}건)`);
    } catch (error) {
      console.error('❌ 전체 리그 이적 데이터 로딩 실패:', error);
    }
    
    await Promise.all(loadPromises);
    console.log('🎉 모든 이적 데이터 미리 로딩 완료!');
  } catch (error) {
    console.error('❌ 이적 데이터 미리 로딩 실패:', error);
  }
};

interface TransfersPageContentProps {
  league?: string;
  team?: string;
  season?: string;
  type?: 'in' | 'out' | 'all';
  page?: string;
}



export default function TransfersPageContent({
  league,
  team,
  season,
  type = 'all',
  page = '1'
}: TransfersPageContentProps) {
  const [transfers, setTransfers] = useState<TransferMarketData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // URL 파라미터를 필터 객체로 변환 (useMemo로 최적화)
  const filters = useMemo(() => ({
    league: league ? parseInt(league) : undefined,
    team: team ? parseInt(team) : undefined,
    season: season ? parseInt(season) : undefined,
    type: type !== 'all' ? type : undefined
  }), [league, team, season, type]);

  const currentPage = parseInt(page);
  const itemsPerPage = 20;

  // 페이지 링크 생성 함수
  const getPageLink = useCallback((page: number) => {
    const params = new URLSearchParams();
    if (filters.league) params.set('league', filters.league.toString());
    if (filters.team) params.set('team', filters.team.toString());
    if (filters.season) params.set('season', filters.season.toString());
    if (filters.type) params.set('type', filters.type);
    params.set('page', page.toString());
    
    return `/transfers?${params.toString()}`;
  }, [filters]);



  // 날짜 형식 검증 함수
  const isValidDateFormat = useCallback((dateString: string): boolean => {
    if (!dateString) return false;
    
    // YYYY-MM-DD 형식 정규식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    // 실제 날짜 유효성 검증
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // 합리적인 범위 검증 (1990년 ~ 2030년)
    const year = date.getFullYear();
    if (year < 1990 || year > 2030) {
      return false;
    }
    
    return true;
  }, []);

  // 클라이언트 사이드 필터링 함수 (useCallback으로 최적화)
     const filterTransfers = useCallback((transfers: TransferMarketData[]) => {
     const seen = new Set<string>();
     
     return transfers.filter(transfer => {
       // 1. 기본 데이터 검증
       if (!transfer.player?.id || transfer.player.id <= 0 || !transfer.player?.name) {
         return false;
       }

       // 2. 이적 정보 필수 검증
       if (!transfer.transfers?.[0] || !transfer.transfers[0].date) {
         return false;
       }

       const transferData = transfer.transfers[0];

       // 3. 날짜 형식 검증 - YYYY-MM-DD 형식이 아니면 제외
       if (!isValidDateFormat(transferData.date)) {
         console.log(`❌ 클라이언트: 날짜 형식 불량으로 제외: ${transfer.player.name} - ${transferData.date}`);
         return false;
       }

       // 4. 팀 정보 검증
       if (!transferData.teams?.in?.id || !transferData.teams?.out?.id) {
         return false;
       }

       // 5. 팀 이름 검증
       const teamInName = transferData.teams.in.name;
       const teamOutName = transferData.teams.out.name;
       
       if (!teamInName || !teamOutName) {
         return false;
       }

       // 6. 비정상적인 팀 이름 필터링
       // 팀 이름이 숫자로만 이루어져 있는 경우 제외
       if (/^[0-9]+$/.test(teamInName.trim()) || /^[0-9]+$/.test(teamOutName.trim())) {
         return false;
       }

       // 팀 이름이 "0"으로 시작하는 경우 제외
       if (teamInName.trim().startsWith('0') || teamOutName.trim().startsWith('0')) {
         return false;
       }

       // 팀 이름에 "0 " 또는 "==0" 포함된 경우 제외
       if (teamInName.includes('0 ') || teamOutName.includes('0 ') || 
           teamInName.includes('==0') || teamOutName.includes('==0')) {
         return false;
       }

       // 팀 이름이 너무 짧은 경우 제외
       if (teamInName.trim().length < 2 || teamOutName.trim().length < 2) {
         return false;
       }

       // 팀 ID가 0이거나 음수인 경우 제외
       if (transferData.teams.in.id <= 0 || transferData.teams.out.id <= 0) {
         return false;
       }

       // 7. 중복 제거 (선수 ID + 날짜 + 팀 조합으로 고유성 확인)
       const uniqueKey = `${transfer.player.id}-${transferData.date}-${transferData.teams.in.id}-${transferData.teams.out.id}`;
       if (seen.has(uniqueKey)) {
         return false;
       }
       seen.add(uniqueKey);

       return true;
     });
   }, [isValidDateFormat]);

  // 이적 데이터 로드 (캐싱 적용)
  const loadTransfers = useCallback(async () => {
    try {
      setError(null);
      
      // 서버에서 기본 필터링된 데이터 가져오기 (리그, 팀, 시즌, 타입)
      const serverFilters = {
        league: filters.league,
        team: filters.team,
        season: filters.season,
        type: filters.type
      };
      
      // 전체 리그의 경우 더 많은 데이터 로드, 특정 팀의 경우 적당한 양
      let loadLimit;
      if (filters.team) {
        // 특정 팀 선택 시: 해당 팀의 모든 이적 데이터
        loadLimit = 1000;
      } else {
        // 전체 리그의 경우: 페이지에 따라 동적으로 증가 + 충분한 여유분
        loadLimit = Math.max(1000, currentPage * itemsPerPage + 500);
      }
      
      // 캐시 키 생성
      const cacheKey = `transfers-${filters.league || 'all'}-${filters.team || 'all'}-${filters.type || 'all'}-${filters.season || 2025}-${loadLimit}`;
      
      console.log(`📄 페이지 ${currentPage}: ${loadLimit}개 데이터 로드 요청`);
      console.log(`🔍 필터 정보:`, serverFilters);
      console.log(`🔑 캐시 키: ${cacheKey}`);
      
      let data: TransferMarketData[];
      
      // 캐시에서 먼저 확인
      if (transfersCache.has(cacheKey)) {
        console.log(`⚡ 캐시에서 즉시 이적 데이터 로드`);
        data = transfersCache.get(cacheKey)!;
      } else {
        console.log(`📡 API에서 이적 데이터 로드`);
        const startTime = performance.now();
        data = await fetchLatestTransfers(serverFilters, loadLimit);
        const endTime = performance.now();
        
        // 캐시에 저장 (주요 데이터만)
        if (!filters.team && loadLimit >= 1000) {
          transfersCache.set(cacheKey, data);
          console.log(`💾 이적 데이터 캐시 저장 완료`);
        }
        
        console.log(`⏱️ 데이터 로드 시간: ${(endTime - startTime).toFixed(2)}ms`);
      }
      
      console.log(`📊 받은 데이터 수: ${data.length}건`);
      
      // 클라이언트 사이드에서 추가 필터링 (검색, 포지션, 국적)
      const filteredData = filterTransfers(data);
      
      setTransfers(filteredData);
      setTotalCount(filteredData.length);
    } catch {
      setError('이적 정보를 불러오는데 실패했습니다.');
    }
  }, [filters, itemsPerPage, filterTransfers, currentPage]);

  // 컴포넌트 마운트 시 이적 데이터 미리 로딩
  useEffect(() => {
    preloadTransfersData();
  }, []);

  useEffect(() => {
    loadTransfers();
  }, [league, team, season, type, page, loadTransfers]);

  // 페이지네이션용 데이터 슬라이싱
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransfers = transfers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // 페이지 번호 배열 생성 (현재 페이지 주변의 5개 페이지만 표시)
  const generatePageNumbers = useCallback(() => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // 페이지가 적은 경우 시작 페이지 조정
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  }, [currentPage, totalPages]);



  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">오류가 발생했습니다</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadTransfers}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 섹션 */}
      <TransferFilters 
        currentFilters={filters}
        onFiltersChange={loadTransfers}
      />

      {/* 이적 목록 */}
      {transfers.length === 0 ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">이적 목록</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              0건
            </span>
          </div>
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              이적 정보를 찾을 수 없습니다
            </div>
            <div className="text-gray-400 text-sm">
              필터를 조정하여 다시 시도해보세요
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">이적 목록</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                총 {totalCount}건
              </span>
            </div>
          </div>

          {/* 데스크탑 테이블 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    선수
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이적 경로
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이적료/타입
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
          {paginatedTransfers.map((transfer, index) => (
                  <tr 
              key={`${transfer.player.id}-${index}`}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    {/* 선수 정보 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 relative">
                          {transfer.player.id && transfer.player.id > 0 ? (
                            <div className="relative w-10 h-10">
                              <ApiSportsImage
                                imageId={transfer.player.id}
                                imageType={ImageType.Players}
                                alt={`${transfer.player.name} 사진`}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 bg-gray-50"
                              />
                              {/* 선수 사진이 로드되지 않을 경우 fallback */}
                              <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-2 border-gray-200 -z-10">
                                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300">
                              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transfer.player.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transfer.player.nationality}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 이적 경로 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {/* 이전팀 */}
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <TeamLogo
                            teamName={transfer.transfers[0]?.teams?.out?.name || 'Unknown'}
                            teamId={transfer.transfers[0]?.teams?.out?.id}
                            size={20}
                          />
                          <span className="text-sm text-gray-600 truncate">
                            {transfer.transfers[0]?.teams?.out?.name || 'Unknown'}
                          </span>
                        </div>

                        {/* 화살표 */}
                        <div className="flex-shrink-0">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>

                        {/* 이후팀 */}
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <TeamLogo
                            teamName={transfer.transfers[0]?.teams?.in?.name || 'Unknown'}
                            teamId={transfer.transfers[0]?.teams?.in?.id}
                            size={20}
                          />
                          <span className="text-sm text-gray-900 truncate font-medium">
                            {transfer.transfers[0]?.teams?.in?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 이적료/타입 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {transfer.transfers[0]?.type && (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          getTransferTypeColor(transfer.transfers[0].type)
                        }`}>
                          {formatTransferType(transfer.transfers[0].type)}
                        </span>
                      )}
                    </td>

                    {/* 날짜 */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transfer.transfers[0]?.date || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 2줄 레이아웃 */}
          <div className="block md:hidden divide-y divide-gray-200">
            {paginatedTransfers.map((transfer, index) => {
              const latestTransfer = transfer.transfers[0];
              const transferDate = new Date(latestTransfer.date);
              
              return (
                <div 
                  key={`${transfer.player.id}-${index}`}
                  className="p-3 hover:bg-gray-50 transition-colors duration-200"
                >
                  {/* 첫 번째 줄: 이름, 날짜 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {/* 선수 이미지 */}
                      <div className="flex-shrink-0 w-8 h-8 relative">
                        {transfer.player.id && transfer.player.id > 0 ? (
                          <div className="relative w-8 h-8">
                            <ApiSportsImage
                              imageId={transfer.player.id}
                              imageType={ImageType.Players}
                              alt={`${transfer.player.name} 사진`}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 bg-gray-50"
                            />
                            {/* 선수 사진이 로드되지 않을 경우 fallback */}
                            <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border border-gray-200 -z-10">
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* 선수 이름 */}
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {transfer.player.name}
                      </span>
                      
                      {/* 국적 */}
                      {transfer.player.nationality && (
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {transfer.player.nationality}
                        </span>
                      )}
                    </div>
                    
                    {/* 날짜 */}
                    <div className="text-xs text-gray-600 flex-shrink-0">
                      {format(transferDate, 'MM/dd', { locale: ko })}
                    </div>
                  </div>

                  {/* 두 번째 줄: 팀 > 팀 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* 이전 팀 */}
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <TeamLogo
                          teamName={latestTransfer.teams.out.name}
                          teamId={latestTransfer.teams.out.id}
                          size={16}
                        />
                        <span className="text-xs text-gray-700 truncate">
                          {latestTransfer.teams.out.name}
                        </span>
                      </div>

                      {/* 화살표 */}
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>

                      {/* 새 팀 */}
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <TeamLogo
                          teamName={latestTransfer.teams.in.name}
                          teamId={latestTransfer.teams.in.id}
                          size={16}
                        />
                        <span className="text-xs text-gray-700 truncate">
                          {latestTransfer.teams.in.name}
                        </span>
                      </div>
                    </div>

                    {/* 이적 타입 */}
                    <div className="text-xs flex-shrink-0">
                      {latestTransfer.type && latestTransfer.type !== 'N/A' && (
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          getTransferTypeColor(latestTransfer.type)
                        }`}>
                          {formatTransferType(latestTransfer.type)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 my-4">
          {/* 처음 페이지 버튼 */}
          {currentPage > 1 && (
            <Link href={getPageLink(1)} passHref>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                &lt;&lt;
              </Button>
            </Link>
          )}
          
          {/* 이전 페이지 버튼 */}
          {currentPage > 1 && (
            <Link href={getPageLink(currentPage - 1)} passHref>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                &lt;
              </Button>
            </Link>
          )}
          
          {/* 페이지 번호 */}
          {generatePageNumbers().map((page) => (
            <Link key={page} href={getPageLink(page)} passHref>
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 p-0 ${
                  currentPage === page
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : ""
                }`}
              >
                {page}
              </Button>
            </Link>
          ))}
          
          {/* 다음 페이지 버튼 */}
          {currentPage < totalPages && (
            <Link href={getPageLink(currentPage + 1)} passHref>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                &gt;
              </Button>
            </Link>
          )}
          
          {/* 마지막 페이지 버튼 */}
          {currentPage < totalPages && (
            <Link href={getPageLink(totalPages)} passHref>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                &gt;&gt;
              </Button>
            </Link>
          )}
        </div>
      )}

    </div>
  );
}