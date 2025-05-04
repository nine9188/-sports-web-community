'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface MatchTeam {
  id?: number | string;
  name: string;
  logo?: string;
  winner?: boolean;
}

interface League {
  id?: number | string;
  name: string;
  logo?: string;
}

interface Goals {
  home?: number | null;
  away?: number | null;
}

interface Status {
  code?: string;
  short?: string;
  elapsed?: number;
}

interface MatchData {
  id?: string | number;
  teams: {
    home: MatchTeam;
    away: MatchTeam;
  };
  goals?: Goals;
  league: League;
  status?: Status;
}

interface MatchCardProps {
  matchId: string;
  matchData: MatchData;
  isEditable?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ matchId, matchData, isEditable = false }) => {
  if (!matchData || !matchData.teams) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-500 rounded">
        경기 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const actualMatchId = matchData.id?.toString() || matchId;

  const { teams, goals, league, status } = matchData;
  const homeTeam = teams.home;
  const awayTeam = teams.away;
  const homeScore = typeof goals?.home === 'number' ? goals.home : '-';
  const awayScore = typeof goals?.away === 'number' ? goals.away : '-';

  let statusText = '경기 결과';
  let statusClass = '';

  if (status) {
    const statusCode = status.code || status.short;

    if (statusCode === 'FT') {
      statusText = '경기 종료';
    } else if (statusCode === 'NS') {
      statusText = '경기 예정';
    } else if (statusCode && ['LIVE', '1H', '2H', 'HT'].includes(statusCode)) {
      if (statusCode === '1H') {
        statusText = `전반전 진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
      } else if (statusCode === '2H') {
        statusText = `후반전 진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
      } else if (statusCode === 'HT') {
        statusText = '하프타임';
      } else {
        statusText = `진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
      }
      statusClass = 'text-green-600 font-medium';
    }
  }

  const CardContent = () => (
    <>
      <div className="py-3 px-3 bg-gray-50 border-b flex items-center h-10">
        <div className="flex items-center">
          <Image 
            src={league.logo || '/placeholder.png'} 
            alt={league.name} 
            width={24}
            height={24}
            className="w-6 h-6 object-contain mr-2"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.png';
            }}
          />
          <span className="text-sm font-medium text-gray-600 truncate">{league.name}</span>
        </div>
      </div>

      <div className="py-3 px-3 flex items-center justify-between">
        <div className="flex flex-col items-center w-[40%]">
          <Image 
            src={homeTeam.logo || '/placeholder.png'} 
            alt={homeTeam.name} 
            width={48}
            height={48}
            className="w-12 h-12 object-contain mb-2"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.png';
            }}
          />
          <span className={`text-sm font-medium text-center line-clamp-2 ${homeTeam.winner ? 'text-blue-600' : ''}`}>
            {homeTeam.name}
          </span>
        </div>

        <div className="text-center flex-shrink-0 w-[20%]">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl font-bold min-w-[1.5rem] text-center">{homeScore}</span>
            <span className="text-gray-400 mx-1">-</span>
            <span className="text-2xl font-bold min-w-[1.5rem] text-center">{awayScore}</span>
          </div>
          <div className={`text-xs ${statusClass}`}>{statusText}</div>
        </div>

        <div className="flex flex-col items-center w-[40%]">
          <Image 
            src={awayTeam.logo || '/placeholder.png'} 
            alt={awayTeam.name} 
            width={48}
            height={48}
            className="w-12 h-12 object-contain mb-2"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.png';
            }}
          />
          <span className={`text-sm font-medium text-center line-clamp-2 ${awayTeam.winner ? 'text-blue-600' : ''}`}>
            {awayTeam.name}
          </span>
        </div>
      </div>

      <div className="py-2 px-3 bg-gray-50 border-t text-center flex items-center justify-center">
        <span className="text-xs text-blue-600 hover:underline">
          매치 상세 정보
        </span>
      </div>
    </>
  );

  return (
    <div className="match-card border rounded-lg overflow-hidden shadow-sm my-3 w-full">
      {isEditable ? (
        <div className="cursor-default">
          <CardContent />
        </div>
      ) : (
        <Link href={`/livescore/football/match/${actualMatchId}`} className="block">
          <CardContent />
        </Link>
      )}
    </div>
  );
};

export default MatchCard;