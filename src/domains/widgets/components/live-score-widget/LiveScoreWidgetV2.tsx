'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from 'lucide-react';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import type { League, LiveScoreWidgetV2Props } from './types';

export default function LiveScoreWidgetV2({ leagues }: LiveScoreWidgetV2Props) {
  // 첫 번째 리그만 기본으로 펼치기
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(() => {
    // 초기값으로 첫 번째 리그 ID 설정
    if (leagues.length > 0) {
      return new Set([leagues[0].id]);
    }
    return new Set();
  });

  const toggleLeague = (leagueId: string) => {
    setExpandedLeagues(prev => {
      const next = new Set(prev);
      if (next.has(leagueId)) {
        next.delete(leagueId);
      } else {
        next.add(leagueId);
      }
      return next;
    });
  };

  // 전체 펼치기/접기
  const toggleAll = () => {
    if (expandedLeagues.size === leagues.length) {
      // 모두 펼쳐져 있으면 모두 접기
      setExpandedLeagues(new Set());
    } else {
      // 하나라도 접혀있으면 모두 펼치기
      setExpandedLeagues(new Set(leagues.map(l => l.id)));
    }
  };

  const allExpanded = leagues.length > 0 && expandedLeagues.size === leagues.length;

  // 경기가 없을 때
  if (leagues.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden">
        {/* 위젯 헤더 */}
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10">
          <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
            중요 경기
          </span>
          <Link
            href="/livescore/football"
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            전체 경기
          </Link>
        </div>
        {/* Empty State */}
        <div className="h-14 flex items-center justify-center px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            오늘은 중요 경기가 없습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 리그 목록 */}
      {leagues.map((league, index) => {
        const isExpanded = expandedLeagues.has(league.id);
        const isFirst = index === 0;

        return (
          <div
            key={league.id}
            className="bg-white dark:bg-[#1D1D1D] rounded-lg overflow-hidden border border-black/7 dark:border-0"
          >
            {/* 첫 번째 리그일 때만 위젯 헤더 표시 */}
            {isFirst && (
              <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10">
                <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                  중요 경기
                </span>
                <div className="flex items-center gap-3">
                  {/* 전체 펼치기/접기 버튼 */}
                  <button
                    onClick={toggleAll}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                    title={allExpanded ? '모두 접기' : '모두 펼치기'}
                  >
                    {allExpanded ? (
                      <>
                        <ChevronsUp className="w-3.5 h-3.5" />
                        <span>접기</span>
                      </>
                    ) : (
                      <>
                        <ChevronsDown className="w-3.5 h-3.5" />
                        <span>펼치기</span>
                      </>
                    )}
                  </button>
                  <Link
                    href="/livescore/football"
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    전체 경기
                  </Link>
                </div>
              </div>
            )}

            {/* 리그 헤더 */}
            <button
              onClick={() => toggleLeague(league.id)}
              className="w-full h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
            >
              <div className="flex items-center gap-3">
                {league.logo && league.leagueIdNumber ? (
                  <UnifiedSportsImage
                    imageId={league.leagueIdNumber}
                    imageType={ImageType.Leagues}
                    alt={league.name}
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain"
                  />
                ) : league.icon ? (
                  <span className="text-lg">{league.icon}</span>
                ) : null}
                <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                  {league.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-[#F0F0F0] text-xs font-medium px-2.5 py-1 rounded-full min-w-[28px] text-center">
                  {league.matches.length}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </button>

            {/* 경기 목록 */}
            {isExpanded && (
              <div className="bg-white dark:bg-[#1D1D1D]">
                {league.matches.map((match, idx) => (
                  <Link
                    key={match.id}
                    href={`/livescore/football/match/${match.id}`}
                    className={`
                      flex items-center h-14 px-4 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors
                      ${idx !== league.matches.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''}
                    `}
                  >
                    {/* 경기 상태 */}
                    <div className="w-12 flex-shrink-0">
                      {match.status === 'LIVE' || match.status === 'HT' ? (
                        <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded animate-pulse">
                          LIVE
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-[#F5F5F5] dark:bg-[#262626] px-2 py-1 rounded">
                          {match.status}
                        </span>
                      )}
                    </div>

                    {/* 홈팀 정보 */}
                    <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate text-right">
                        {match.homeTeam.name}
                      </span>
                      {match.homeTeam.logo && (
                        <div className="w-6 h-6 flex-shrink-0 relative">
                          <UnifiedSportsImage
                            imageId={match.homeTeam.id}
                            imageType={ImageType.Teams}
                            alt={match.homeTeam.name}
                            width={24}
                            height={24}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {/* 스코어 */}
                    <div className="px-2 flex-shrink-0">
                      <span className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">
                        {match.score.home} - {match.score.away}
                      </span>
                    </div>

                    {/* 원정팀 정보 */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {match.awayTeam.logo && (
                        <div className="w-6 h-6 flex-shrink-0 relative">
                          <UnifiedSportsImage
                            imageId={match.awayTeam.id}
                            imageType={ImageType.Teams}
                            alt={match.awayTeam.name}
                            width={24}
                            height={24}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
                        {match.awayTeam.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
