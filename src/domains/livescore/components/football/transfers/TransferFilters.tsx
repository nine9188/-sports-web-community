'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Container,
  ContainerHeader,
  ContainerTitle,
  NativeSelect,
} from '@/shared/components/ui';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { TRANSFER_LEAGUE_OPTIONS } from '@/domains/livescore/constants/transferLeagues';
import { getTeamSlugFromName } from '@/domains/livescore/utils/slugs';
import { transferTeamUrl } from '@/domains/livescore/utils/urls';

const LEAGUE_OPTIONS = [
  { value: '', label: '리그를 선택하세요' },
  ...TRANSFER_LEAGUE_OPTIONS,
];

interface TransferFiltersProps {
  currentFilters: {
    league?: number | string;
    team?: number | string;
    season?: number | string;
    type?: 'in' | 'out' | 'all';
  };
  leagueTeamGroups?: Array<{
    leagueId: number;
    teams: Array<{
      id: number;
      name_ko: string;
      name_en: string;
      slug?: string | null;
    }>;
  }>;
}

export default function TransferFilters({ currentFilters, leagueTeamGroups }: TransferFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { getTeamsByLeagueId } = useTeamLeague();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOpen(window.innerWidth >= 728);
    }
  }, []);

  const availableTeams = useMemo(() => {
    if (!currentFilters.league) return [];
    const leagueId = typeof currentFilters.league === 'string'
      ? parseInt(currentFilters.league, 10)
      : currentFilters.league;

    const serverGroup = leagueTeamGroups?.find((group) => group.leagueId === leagueId);
    if (serverGroup) return serverGroup.teams;

    return [...getTeamsByLeagueId(leagueId)]
      .filter((team) => team.is_active === true && Boolean(team.slug))
      .sort((a, b) => (a.name_ko || a.name_en).localeCompare(b.name_ko || b.name_en, 'ko'));
  }, [currentFilters.league, getTeamsByLeagueId, leagueTeamGroups]);

  const teamOptions = useMemo(
    () => availableTeams.map((team) => ({
      value: team.id.toString(),
      label: team.name_ko || team.name_en,
    })),
    [availableTeams]
  );

  const typeOptions = useMemo(() => [
    { value: 'all', label: '전체' },
    { value: 'in', label: '영입' },
    { value: 'out', label: '방출' },
  ], []);

  const pushTeamUrl = (team: { id: number; name_ko: string; name_en: string; slug?: string | null }) => {
    router.push(transferTeamUrl(team.id, team.slug || getTeamSlugFromName(team.name_en || team.name_ko)));
  };

  const updateFilter = (key: string, value: string) => {
    if (key === 'league') {
      const leagueId = parseInt(value, 10);
      const serverGroup = Number.isFinite(leagueId)
        ? leagueTeamGroups?.find((group) => group.leagueId === leagueId)
        : null;
      const firstTeam = serverGroup?.teams[0] || (
        Number.isFinite(leagueId)
          ? [...getTeamsByLeagueId(leagueId)]
              .filter((team) => team.is_active === true && Boolean(team.slug))
              .sort((a, b) => (a.name_ko || a.name_en).localeCompare(b.name_ko || b.name_en, 'ko'))[0]
          : null
      );

      if (firstTeam) pushTeamUrl(firstTeam);
      else router.push('/transfers');
      return;
    }

    if (key === 'team') {
      const teamId = parseInt(value, 10);
      const selectedTeam = Number.isFinite(teamId)
        ? availableTeams.find((team) => team.id === teamId)
        : null;

      if (selectedTeam) pushTeamUrl(selectedTeam);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') params.delete(key);
    else params.set(key, value);
    params.delete('page');

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <Container className="overflow-visible">
      <ContainerHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <ContainerTitle>필터</ContainerTitle>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen((prev) => !prev)}
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
            onClick={() => router.push('/transfers')}
            className="text-xs h-auto px-2 py-1"
          >
            전체 보기
          </Button>
        </div>
      </ContainerHeader>

      <div id="transfer-filters-body" className={`${isOpen ? 'block' : 'hidden'} md:block bg-white dark:bg-[#1D1D1D] px-4 py-3 md:rounded-b-lg overflow-visible`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 overflow-visible">
          <div>
            <label className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
              리그 <span className="text-red-500">*</span>
            </label>
            <NativeSelect
              value={currentFilters.league?.toString() || ''}
              onValueChange={(value) => updateFilter('league', value)}
              options={LEAGUE_OPTIONS}
              placeholder="리그 선택"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
              팀
            </label>
            <NativeSelect
              value={currentFilters.team?.toString() || ''}
              onValueChange={(value) => updateFilter('team', value)}
              disabled={!currentFilters.league}
              options={teamOptions}
              placeholder="팀 선택"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
              이적 유형
            </label>
            <NativeSelect
              value={currentFilters.type || 'all'}
              onValueChange={(value) => updateFilter('type', value)}
              disabled={!currentFilters.team}
              options={typeOptions}
              placeholder="전체"
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
