'use client';

import { useMemo } from 'react';
import { MatchData, MultiDayMatchesResult } from '@/domains/livescore/actions/footballApi';
import { Trophy } from 'lucide-react';
import MatchItem from './MatchItem';

interface LiveScoreContentProps {
  selectedDate: 'yesterday' | 'today' | 'tomorrow';
  onClose: () => void;
  initialData?: MultiDayMatchesResult;
}

// 리그 우선순위 (숫자가 낮을수록 우선)
const getLeaguePriority = (leagueId?: number): number => {
  if (!leagueId) return 999;

  // 메이저 리그 (최우선)
  const majorLeagues = [39, 140, 78, 135, 61]; // 프리미어, 라리가, 분데스, 세리에A, 리그앙
  if (majorLeagues.includes(leagueId)) return 1;

  // 유럽 컵 대회
  const europeanCups = [2, 3, 848]; // 챔피언스, 유로파, 컨퍼런스
  if (europeanCups.includes(leagueId)) return 2;

  // 유럽 2군 리그
  const secondTierLeagues = [40, 179, 88, 94]; // 챔피언십, 스코틀랜드, 에레디비지에, 프리메이라
  if (secondTierLeagues.includes(leagueId)) return 3;

  // 아시아 리그
  const asianLeagues = [292, 98, 307]; // K리그1, J1리그, 사우디
  if (asianLeagues.includes(leagueId)) return 4;

  // 아메리카 리그
  const americanLeagues = [253, 71, 262]; // MLS, 브라질레이로, 리가MX
  if (americanLeagues.includes(leagueId)) return 5;

  // 컵 대회
  const cups = [45, 48, 143, 137, 66, 81, 531]; // FA컵, EFL컵, 코파델레이, 코파이탈리아, 쿠프드프랑스, DFB포칼, UEFA슈퍼컵
  if (cups.includes(leagueId)) return 10;

  return 20; // 기타
};

// 경기 정렬 함수 (상태 우선 -> 리그 우선순위)
function sortByStatus(matches: MatchData[]): MatchData[] {
  return [...matches].sort((a, b) => {
    // 1. 경기 상태 우선순위 (진행중 > 예정 > 종료)
    const codeOf = (m: MatchData) => (m?.status?.code || '').toUpperCase();
    const rankOf = (code: string) => {
      if (code === 'LIVE' || code === '1H' || code === '2H' || code === 'HT') return 0; // 진행중 최우선
      if (code === 'NS' || code === 'TBD') return 1; // 예정
      if (code === 'FT' || code === 'AET' || code === 'PEN') return 2; // 종료
      if (code === 'PST' || code === 'CANC' || code === 'SUSP') return 3; // 연기/취소
      return 2; // 기타 상태
    };
    const ra = rankOf(codeOf(a));
    const rb = rankOf(codeOf(b));
    if (ra !== rb) {
      return ra - rb;
    }

    // 2. 같은 상태 내에서 리그 우선순위
    const leaguePriorityA = getLeaguePriority(a.league?.id);
    const leaguePriorityB = getLeaguePriority(b.league?.id);
    return leaguePriorityA - leaguePriorityB;
  });
}

// 날짜 라벨 변환
const getDateLabel = (date: 'yesterday' | 'today' | 'tomorrow'): string => {
  switch (date) {
    case 'yesterday': return '어제';
    case 'today': return '오늘';
    case 'tomorrow': return '내일';
  }
};

export default function LiveScoreContent({ selectedDate, onClose, initialData }: LiveScoreContentProps) {
  // SSR 3일치 데이터에서 선택된 날짜의 경기 추출 (React Query 불필요)
  const matches = useMemo(() => {
    if (!initialData?.success || !initialData.data) {
      return [];
    }

    const dateLabel = getDateLabel(selectedDate);
    let rawMatches: MatchData[] = [];

    switch (selectedDate) {
      case 'yesterday':
        rawMatches = initialData.data.yesterday?.matches || [];
        break;
      case 'today':
        rawMatches = initialData.data.today?.matches || [];
        break;
      case 'tomorrow':
        rawMatches = initialData.data.tomorrow?.matches || [];
        break;
    }

    // displayDate 추가 후 정렬
    return sortByStatus(rawMatches.map(match => ({ ...match, displayDate: dateLabel })));
  }, [initialData, selectedDate]);

  // 데이터 로드 실패
  if (!initialData?.success) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500">
        <Trophy className="h-8 w-8 mb-2" />
        <p className="text-sm">경기 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  // 경기 없음
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500">
        <Trophy className="h-8 w-8 mb-2" />
        <p className="text-sm">예정된 경기가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {matches.map(match => (
        <MatchItem key={`match-${match.id}`} match={match} onClose={onClose} />
      ))}
    </div>
  );
}
