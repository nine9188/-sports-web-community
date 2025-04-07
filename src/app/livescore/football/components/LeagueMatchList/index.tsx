'use client';

import { Match } from '../../types';
import MatchCard from '../MatchCard';
import React from 'react';
import Image from 'next/image';

interface LeagueMatchListProps {
  matches: Match[];
}

interface LeagueGroup {
  name: string;
  country: string;
  matches: Match[];
  leagueId: number;
  logo: string | null; // 로고 URL (null일 수 있음)
  flag: string | null; // 국가 플래그 URL (null일 수 있음)
}

export default function LeagueMatchList({ matches }: LeagueMatchListProps) {
  // 리그별로 경기 그룹화
  const leagueGroups: LeagueGroup[] = [];
  matches.forEach(match => {
    const existingGroup = leagueGroups.find(group => group.leagueId === match.league.id);
    
    if (existingGroup) {
      existingGroup.matches.push(match);
    } else {
      // API 응답 구조에 맞게 로고와 플래그 필드 처리
      leagueGroups.push({
        name: match.league.name,
        country: match.league.country || match.league.country_name || '',
        matches: [match],
        leagueId: match.league.id,
        // 새 API 필드(logo)와 기존 필드(country_flag) 모두 체크
        logo: (match.league.logo && match.league.logo.trim() !== '') 
          ? match.league.logo 
          : null,
        // 새 API 필드(flag)와 기존 필드(country_flag) 모두 체크
        flag: (match.league.flag && match.league.flag.trim() !== '')
          ? match.league.flag
          : (match.league.country_flag && match.league.country_flag.trim() !== '')
            ? match.league.country_flag
            : null
      });
    }
  });

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        경기 일정이 없습니다.
      </div>
    );
  }

  // 기본 플레이스홀더 이미지 경로
  const DEFAULT_LOGO = '/placeholder-league.png'; // 기본 리그 로고 이미지 경로

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-[40px]"/>
          <col className="w-[100px]"/>
          <col className="w-[40px]"/>
          <col className="w-[100px]"/>
          <col style={{ width: '40px' }}/>
        </colgroup>
        <tbody>
          {leagueGroups.map((group, groupIndex) => (
            <React.Fragment key={`group-${group.leagueId}`}>
              {/* 리그 헤더 */}
              <tr className="bg-gray-50 border-b">
                <td colSpan={5} className="p-2">
                  <div className="flex items-center">
                    <div className="relative w-6 h-6 mr-2">
                      {/* 우선순위: 1. 리그 로고, 2. 국가 플래그, 3. 기본 이미지 */}
                      <Image 
                        src={group.logo || group.flag || DEFAULT_LOGO}
                        alt={group.name}
                        fill
                        sizes="24px"
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm">{group.name}</h2>
                    </div>
                  </div>
                </td>
              </tr>
              
              {/* 매치 목록 */}
              {group.matches.map((match, index) => (
                <tr 
                  key={`match-${match.id}`} 
                  className={
                    (index < group.matches.length - 1 || groupIndex < leagueGroups.length - 1) 
                      ? "border-b border-gray-100" 
                      : ""
                  }
                >
                  <td colSpan={5} className="p-0">
                    <MatchCard match={match} />
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
} 