// 팀 데이터 타입
export interface Team {
  id: number;
  name: string;
  logo?: string;
}

// 경기 데이터 타입
export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  score: {
    home: number;
    away: number;
  };
  status: string; // 'FT', 'LIVE', 'NS', 'HT' etc
  elapsed?: number; // 경과 시간 (분)
  dateLabel?: 'today' | 'tomorrow'; // 오늘/내일 구분
  kickoffTime?: string; // 경기 시작 시간 (HH:mm)
}

// 리그 데이터 타입
export interface League {
  id: string;
  name: string;
  icon?: string;
  logo?: string;
  logoDark?: string;  // 다크모드 리그 로고
  leagueIdNumber?: number;
  dateLabel?: 'today' | 'tomorrow'; // 오늘/내일 구분
  matches: Match[];
}

// 위젯 Props
export interface LiveScoreWidgetV2Props {
  leagues: League[];
}
