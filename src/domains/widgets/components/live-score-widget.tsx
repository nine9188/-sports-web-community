import React from 'react';
import { fetchMultiDayMatches, MatchData as FootballMatchData } from '@/domains/livescore/actions/footballApi';
import LiveScoreWidgetClient from './live-score-widget-client';

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

// 서버 컴포넌트로 변경 - 데이터를 미리 가져옴
export default async function LiveScoreWidget() {
  try {
    // 서버에서 경기 데이터 미리 가져오기
    const result = await fetchMultiDayMatches() as MultiDayMatchesResponse;
    
    let matches: EnhancedMatchData[] = [];
    
    if (result.success && result.data) {
      // 어제 경기
      const processYesterdayMatches = Array.isArray(result.data.yesterday?.matches) 
        ? result.data.yesterday.matches.map((match: FootballMatchData) => {
            if (!match || !match.id) {
              return null;
            }
            return {
              ...match,
              displayDate: '어제'
            };
          }).filter(Boolean) // null 항목 제거
        : [];
      
      // 오늘 경기
      const processTodayMatches = Array.isArray(result.data.today?.matches)
        ? result.data.today.matches.map((match: FootballMatchData) => {
            if (!match || !match.id) {
              return null;
            }
            return {
              ...match,
              displayDate: '오늘'
            };
          }).filter(Boolean) // null 항목 제거
        : [];
        
      // 내일 경기
      const processTomorrowMatches = Array.isArray(result.data.tomorrow?.matches)
        ? result.data.tomorrow.matches.map((match: FootballMatchData) => {
            if (!match || !match.id) {
              return null;
            }
            return {
              ...match, 
              displayDate: '내일'
            };
          }).filter(Boolean) // null 항목 제거
        : [];
      
      // 모든 경기 데이터 병합 (어제 → 오늘 → 내일 순서로)
      const combinedMatches = [
        ...processYesterdayMatches,
        ...processTodayMatches,
        ...processTomorrowMatches
      ] as EnhancedMatchData[];
      
      // 종료된 경기 필터링 (FT, AET, PEN 상태 제외)
      matches = combinedMatches.filter(match => 
        !['FT', 'AET', 'PEN'].includes(match.status.code)
      );
    }
    
    // 클라이언트 컴포넌트에 데이터 전달
    return <LiveScoreWidgetClient initialMatches={matches} />;
    
  } catch (error) {
    console.error('LiveScoreWidget 서버 데이터 로딩 오류:', error);
    
    // 오류 발생 시 빈 배열로 클라이언트 컴포넌트 렌더링
    return <LiveScoreWidgetClient initialMatches={[]} />;
  }
} 