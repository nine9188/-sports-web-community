'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Match } from '@/domains/livescore/types/match';
import MatchCard from '../MatchCard';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { Button, Container } from '@/shared/components/ui';
import AdBanner from '@/shared/components/AdBanner';

// 4590 표준: placeholder URL
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface LeagueMatchListProps {
  matches: Match[];
  allExpanded?: boolean;
}

interface LeagueGroup {
  name: string;
  matches: Match[];
  leagueId: number;
  logo: string;  // 4590 표준: 서버에서 이미 Storage URL 설정됨
  logoDark: string;  // 다크모드 리그 로고
}

export default function LeagueMatchList({
  matches,
  allExpanded = true
}: LeagueMatchListProps) {
  // 다크모드 감지
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // 리그별로 경기 그룹화 - useMemo로 메모이제이션
  const leagueGroups = useMemo(() => {
    const groups: LeagueGroup[] = [];
    matches.forEach(match => {
      const existingGroup = groups.find(group => group.leagueId === match.league.id);

      if (existingGroup) {
        existingGroup.matches.push(match);
      } else {
        groups.push({
          name: match.league.name,
          matches: [match],
          leagueId: match.league.id,
          logo: match.league.logo || LEAGUE_PLACEHOLDER,
          logoDark: match.league.logoDark || ''
        });
      }
    });
    return groups;
  }, [matches]);

  // 모든 리그 기본으로 펼치기
  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(() => {
    return new Set(leagueGroups.map((g: LeagueGroup) => g.leagueId));
  });

  // allExpanded prop이 변경될 때마다 모든 리그 열기/닫기
  useEffect(() => {
    if (allExpanded) {
      setExpandedLeagues(new Set(leagueGroups.map((g: LeagueGroup) => g.leagueId)));
    } else {
      setExpandedLeagues(new Set());
    }
  }, [allExpanded, leagueGroups]);

  const toggleLeague = (leagueId: number) => {
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

  if (matches.length === 0) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <div className="h-14 flex items-center justify-center px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            경기 일정이 없습니다.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <div className="space-y-4">
      {leagueGroups.map((group: LeagueGroup, groupIndex: number) => {
        const isExpanded = expandedLeagues.has(group.leagueId);

        return (
          <React.Fragment key={group.leagueId}>
          {groupIndex === 0 && <AdBanner />}
          <Container
            className="bg-white dark:bg-[#1D1D1D]"
          >
            {/* 리그 헤더 */}
            <Button
              variant="header"
              onClick={() => toggleLeague(group.leagueId)}
              className="w-full h-12 px-4 flex items-center justify-between rounded-none"
            >
              <div className="flex items-center gap-3">
                {group.logo && (
                  <UnifiedSportsImageClient
                    src={isDark && group.logoDark ? group.logoDark : group.logo}
                    alt={group.name}
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain"
                  />
                )}
                <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                  {group.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-[#F0F0F0] text-xs font-medium px-2.5 py-1 rounded-full min-w-[28px] text-center">
                  {group.matches.length}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </Button>

            {/* 경기 목록 */}
            {isExpanded && (
              <div className="bg-white dark:bg-[#1D1D1D]">
                {group.matches.map((match: Match, idx: number) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isLast={idx === group.matches.length - 1}
                  />
                ))}
              </div>
            )}
          </Container>
          </React.Fragment>
        );
      })}
    </div>
  );
} 