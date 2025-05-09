'use client';

import React from 'react';
import Image from 'next/image';
import { MatchEvent } from '@/domains/livescore/types/match';
import { TeamLineup } from '@/domains/livescore/actions/match/lineupData';
import LineupRow from './LineupRow';
import CoachRow from './CoachRow';

interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid?: string | null;
  captain?: boolean;
  photo?: string;
}

interface LineupTableProps {
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  homeLineup: TeamLineup;
  awayLineup: TeamLineup;
  events: MatchEvent[];
  onPlayerClick: (player: Player, teamId: number, teamName: string) => void;
}

export default function LineupTable({
  homeTeam,
  awayTeam,
  homeLineup,
  awayLineup,
  events,
  onPlayerClick
}: LineupTableProps) {
  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="w-1/2 py-3 px-4 text-left text-sm font-medium text-gray-500 border-r border-gray-200">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-6 h-6 relative flex-shrink-0 overflow-hidden">
                  <Image
                    src={homeTeam.logo}
                    alt={`${homeTeam.name} 로고`}
                    width={24}
                    height={24}
                    className="w-full h-full object-contain"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/team-placeholder.png'; 
                    }}
                  />
                </div>
                <span className="font-medium">{homeTeam.name}</span>
              </div>
              <div className="text-xs text-gray-500">포메이션: {homeLineup.formation}</div>
            </th>
            <th scope="col" className="w-1/2 py-3 px-4 text-left text-sm font-medium text-gray-500">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-6 h-6 relative flex-shrink-0 overflow-hidden">
                  <Image
                    src={awayTeam.logo}
                    alt={`${awayTeam.name} 로고`}
                    width={24}
                    height={24}
                    className="w-full h-full object-contain"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/team-placeholder.png';
                    }}
                  />
                </div>
                <span className="font-medium">{awayTeam.name}</span>
              </div>
              <div className="text-xs text-gray-500">포메이션: {awayLineup.formation}</div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {/* 섹션 제목: 선발 라인업 */}
          <tr>
            <td colSpan={2} className="py-2 px-4 bg-gray-100 text-gray-700 font-bold">
              선발 라인업
            </td>
          </tr>
          
          {/* 선발 라인업 행 생성 */}
          {Array.from({ length: Math.max(
            homeLineup.startXI?.length || 0, 
            awayLineup.startXI?.length || 0
          ) }).map((_, index) => (
            <tr key={`startXI-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="py-2 px-4 border-r border-gray-200">
                {homeLineup.startXI && index < homeLineup.startXI.length && (
                  <LineupRow
                    player={homeLineup.startXI[index].player}
                    teamId={homeTeam.id}
                    teamName={homeTeam.name}
                    events={events}
                    onClick={onPlayerClick}
                  />
                )}
              </td>
              <td className="py-2 px-4">
                {awayLineup.startXI && index < awayLineup.startXI.length && (
                  <LineupRow
                    player={awayLineup.startXI[index].player}
                    teamId={awayTeam.id}
                    teamName={awayTeam.name}
                    events={events}
                    onClick={onPlayerClick}
                  />
                )}
              </td>
            </tr>
          ))}
          
          {/* 섹션 제목: 교체 선수 */}
          <tr>
            <td colSpan={2} className="py-2 px-4 bg-gray-100 text-gray-700 font-bold">
              교체 선수
            </td>
          </tr>
          
          {/* 교체 선수 행 생성 */}
          {Array.from({ length: Math.max(
            homeLineup.substitutes?.length || 0, 
            awayLineup.substitutes?.length || 0
          ) }).map((_, index) => (
            <tr key={`subs-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="py-2 px-4 border-r border-gray-200">
                {homeLineup.substitutes && index < homeLineup.substitutes.length && (
                  <LineupRow
                    player={homeLineup.substitutes[index].player}
                    teamId={homeTeam.id}
                    teamName={homeTeam.name}
                    events={events}
                    onClick={onPlayerClick}
                  />
                )}
              </td>
              <td className="py-2 px-4">
                {awayLineup.substitutes && index < awayLineup.substitutes.length && (
                  <LineupRow
                    player={awayLineup.substitutes[index].player}
                    teamId={awayTeam.id}
                    teamName={awayTeam.name}
                    events={events}
                    onClick={onPlayerClick}
                  />
                )}
              </td>
            </tr>
          ))}
          
          {/* 감독 섹션 */}
          {homeLineup.coach && awayLineup.coach && 
           homeLineup.coach.id && homeLineup.coach.name && 
           awayLineup.coach.id && awayLineup.coach.name && (
            <>
              <tr>
                <td colSpan={2} className="py-2 px-4 bg-gray-100 text-gray-700 font-bold">
                  감독
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-r border-gray-200">
                  <CoachRow coach={homeLineup.coach} />
                </td>
                <td className="py-2 px-4">
                  <CoachRow coach={awayLineup.coach} />
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
} 