'use client';

import { useState, useEffect } from 'react';
import ClientLeagueStandings from './LeagueStandings';

// 타입 정의
interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
}

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
}

interface StandingsData {
  league: League;
  standings: Standing[];
}

// 클라이언트 컴포넌트로 변경 (use client 추가)
export default function ServerLeagueStandings() {
  const [initialStandings, setInitialStandings] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLeague = 'premier'; // 기본 리그는 프리미어리그
  
  // 컴포넌트 마운트 시 데이터 한 번 가져오기
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const apiUrl = `/api/livescore/football/leagues/standings?league=${initialLeague}`;
        const response = await fetch(apiUrl, {
          headers: {
            'x-from-server': '1'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setInitialStandings(data.data);
        }
      } catch (error) {
        console.error("초기 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // 로딩 중이면 스켈레톤 UI 표시
  if (loading) {
    return (
      <div className="border rounded-md overflow-hidden animate-pulse">
        <div className="bg-slate-800 h-9"></div>
        <div className="flex border-b">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 h-7 bg-gray-200"></div>
          ))}
        </div>
        <div className="p-3 space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-5 w-full bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // 클라이언트 컴포넌트에 초기 데이터 전달
  return (
    <ClientLeagueStandings 
      initialLeague={initialLeague} 
      initialStandings={initialStandings} 
    />
  );
} 