'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchMultiDayMatches, MatchData as FootballMatchData } from '@/domains/livescore/actions/footballApi';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';

// 타입 확장 (displayDate 포함)
interface EnhancedMatchData extends FootballMatchData {
  displayDate: string;
}

// API 응답 타입 정의
interface MultiDayMatchesResponse {
  success: boolean;
  dates?: {
    yesterday: string;
    today: string;
    tomorrow: string;
  };
  meta?: {
    totalMatches: number;
  };
  data?: {
    yesterday: { matches: FootballMatchData[] };
    today: { matches: FootballMatchData[] };
    tomorrow: { matches: FootballMatchData[] };
  };
  error?: string;
}

interface LiveScoreWidgetClientProps {
  initialMatches: EnhancedMatchData[];
}

export default function LiveScoreWidgetClient({ initialMatches }: LiveScoreWidgetClientProps) {
  const [matches, setMatches] = useState<EnhancedMatchData[]>(initialMatches);
  const [error, setError] = useState<string | null>(null);
  
  // API 호출 추적을 위한 ref
  const fetchingRef = useRef<boolean>(false);

  useEffect(() => {
    // 5분마다 데이터 갱신
    const fetchLiveScores = async () => {
      if (fetchingRef.current) return;
      
      try {
        fetchingRef.current = true;
        
        const result = await fetchMultiDayMatches() as MultiDayMatchesResponse;
        
        if (result.success && result.data) {
          // 어제 경기
          const processYesterdayMatches = Array.isArray(result.data.yesterday?.matches) 
            ? result.data.yesterday.matches.map((match: FootballMatchData) => {
                if (!match || !match.id) return null;
                return { ...match, displayDate: '어제' };
              }).filter(Boolean)
            : [];
          
          // 오늘 경기
          const processTodayMatches = Array.isArray(result.data.today?.matches)
            ? result.data.today.matches.map((match: FootballMatchData) => {
                if (!match || !match.id) return null;
                return { ...match, displayDate: '오늘' };
              }).filter(Boolean)
            : [];
            
          // 내일 경기
          const processTomorrowMatches = Array.isArray(result.data.tomorrow?.matches)
            ? result.data.tomorrow.matches.map((match: FootballMatchData) => {
                if (!match || !match.id) return null;
                return { ...match, displayDate: '내일' };
              }).filter(Boolean)
            : [];
          
          // 모든 경기 데이터 병합
          const combinedMatches = [
            ...processYesterdayMatches,
            ...processTodayMatches,
            ...processTomorrowMatches
          ] as EnhancedMatchData[];
          
          // 종료된 경기 필터링
          const filteredMatches = combinedMatches.filter(match => 
            !['FT', 'AET', 'PEN'].includes(match.status.code)
          );
          
          setMatches(filteredMatches);
          setError(null);
        }
      } catch (err) {
        console.error('경기 데이터 처리 중 오류:', err);
      } finally {
        fetchingRef.current = false;
      }
    };
    
    // 5분마다 데이터 갱신
    const interval = setInterval(fetchLiveScores, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 경기 시간 포맷팅 함수
  const formatMatchTime = (match: FootballMatchData) => {
    if (!match || !match.id || !match.status || !match.time) {
      return '-';
    }
    
    try {
      const statusCode = match.status.code || '';
      
      if (statusCode === 'NS') {
        if (!match.time.date) return '-';
        
        const matchTime = new Date(match.time.date);
        if (isNaN(matchTime.getTime())) return '-';
        
        const hours = matchTime.getHours();
        const minutes = matchTime.getMinutes();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } 
      else if (statusCode === 'HT') {
        return 'HT';
      } 
      else if (statusCode === 'FT' || statusCode === 'AET' || statusCode === 'PEN') {
        return statusCode;
      } 
      else if (statusCode === 'CANC' || statusCode === 'PST' || statusCode === 'SUSP') {
        return statusCode === 'CANC' ? '취소됨' : statusCode === 'PST' ? '연기됨' : '중단됨';
      }
      else if (match.status.elapsed !== undefined && match.status.elapsed !== null) {
        return `${match.status.elapsed}'`;
      }
      
      return statusCode || '-';
    } catch {
      return '-';
    }
  };

  return (
    <div className="w-full mb-4 mt-4 md:mt-0">
      {error ? (
        <div className="flex flex-col justify-center items-center h-40 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-red-500">{error}</p>
          <p className="text-xs mt-1 text-gray-500">새로고침하거나 잠시 후 다시 시도해주세요</p>
        </div>
      ) : (
        <div className="w-full">
          {/* 🔧 단순한 반응형 그리드 - CSS로만 처리 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            {matches.slice(0, 8).map((match, index) => {
              const leagueInfo = match.league?.id ? getLeagueById(match.league.id) : null;
              const homeTeamInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
              const awayTeamInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;
              
              const homeTeamNameKo = String(homeTeamInfo?.name_ko || match.teams?.home?.name || '홈팀');
              const awayTeamNameKo = String(awayTeamInfo?.name_ko || match.teams?.away?.name || '원정팀');
              const leagueNameKo = String(leagueInfo?.nameKo || match.league?.name || '리그 정보 없음');
              
              return (
                <Link 
                  key={`match-${match.id || index}`} 
                  href={match.id ? `/livescore/football/match/${match.id}` : '#'}
                  className="border rounded-lg p-2 transition-all h-[140px] shadow-sm cursor-pointer hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 bg-white border-gray-200"
                >
                  <div className="flex items-center gap-0.5 mb-1 text-gray-700">
                    {match.league?.logo && (
                      <Image 
                        src={match.league.logo} 
                        alt={String(leagueNameKo)} 
                        width={16} 
                        height={16}
                        style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                        className="rounded-full flex-shrink-0"
                        unoptimized
                      />
                    )}
                    <span className="text-xs font-medium truncate">{leagueNameKo}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1 h-[110px]">
                    {/* 홈팀 */}
                    <div className="flex flex-col items-center justify-center gap-0">
                      {match.teams?.home?.logo && (
                        <Image 
                          src={match.teams.home.logo} 
                          alt={String(homeTeamNameKo)} 
                          width={40} 
                          height={40}
                          style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                          className="mb-0.5"
                          unoptimized
                        />
                      )}
                      <span className="text-[10px] text-center truncate w-full">{homeTeamNameKo}</span>
                    </div>
                    
                    {/* 중앙 (vs 및 시간) */}
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="font-bold text-base text-center">{match.status?.code !== 'NS' ? `${match.goals?.home ?? 0} - ${match.goals?.away ?? 0}` : 'vs'}</span>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium">{formatMatchTime(match)}</span>
                        {match.status?.code === 'NS' && match.displayDate && (
                          <span className="text-[9px] text-gray-500 mt-0.5">{String(match.displayDate)}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* 원정팀 */}
                    <div className="flex flex-col items-center justify-center gap-0">
                      {match.teams?.away?.logo && (
                        <Image 
                          src={match.teams.away.logo} 
                          alt={String(awayTeamNameKo)} 
                          width={40} 
                          height={40}
                          style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                          className="mb-0.5"
                          unoptimized
                        />
                      )}
                      <span className="text-[10px] text-center truncate w-full">{awayTeamNameKo}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 