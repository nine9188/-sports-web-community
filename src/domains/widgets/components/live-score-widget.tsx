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

// 🔧 안전한 경기 데이터 처리 함수
function processMatchData(matches: FootballMatchData[] | undefined, displayDate: string): EnhancedMatchData[] {
  if (!Array.isArray(matches)) return [];
  
  return matches
    .filter(match => match && match.id) // null/undefined 필터링
    .map(match => ({
      ...match,
      displayDate
    }));
}

// 서버 컴포넌트로 변경 - 데이터를 미리 가져옴
export default async function LiveScoreWidget() {
  let matches: EnhancedMatchData[] = [];
  
  try {
    // 서버 액션을 사용하여 경기 데이터 가져오기
    const result = await fetchMultiDayMatches() as MultiDayMatchesResponse;
    
    if (result.success && result.data) {
      // 🔧 안전한 데이터 처리
      const processYesterdayMatches = processMatchData(result.data.yesterday?.matches, '어제');
      const processTodayMatches = processMatchData(result.data.today?.matches, '오늘');
      const processTomorrowMatches = processMatchData(result.data.tomorrow?.matches, '내일');
      
      // 모든 경기 데이터 병합 (어제 → 오늘 → 내일 순서로)
      const combinedMatches = [
        ...processYesterdayMatches,
        ...processTodayMatches,
        ...processTomorrowMatches
      ];
      
      // 종료 경기/연기 경기를 뒤로 보내는 정렬
      matches = combinedMatches.sort((a, b) => {
        const aCode = a.status?.code || '';
        const bCode = b.status?.code || '';
        const isFinished = (code: string) => ['FT', 'AET', 'PEN'].includes(code);
        const aFinished = isFinished(aCode);
        const bFinished = isFinished(bCode);
        if (aFinished !== bFinished) return aFinished ? 1 : -1; // 종료 경기는 뒤로

        const aIsPostponed = aCode === 'PST';
        const bIsPostponed = bCode === 'PST';
        if (aIsPostponed !== bIsPostponed) return aIsPostponed ? 1 : -1; // 연기도 뒤로

        return 0; // 그 외 기존 순서 유지
      });
      
      console.log(`✅ LiveScoreWidget: ${matches.length}개 경기 데이터 로드 완료`);
    } else {
      console.warn('⚠️ LiveScoreWidget: API 응답이 성공하지 않음', result.error);
    }
    
  } catch (error) {
    console.error('❌ LiveScoreWidget 서버 데이터 로딩 오류:', error);
    // 🔧 에러 발생 시에도 빈 배열로 안전하게 처리
    matches = [];
  }
  
  // 🔧 항상 클라이언트 컴포넌트 렌더링 (에러 상황에서도)
  return <LiveScoreWidgetClient initialMatches={matches} />;
} 