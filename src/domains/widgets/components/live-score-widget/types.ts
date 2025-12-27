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
}

// 리그 데이터 타입
export interface League {
  id: string;
  name: string;
  icon?: string;
  logo?: string;
  leagueIdNumber?: number;
  matches: Match[];
}

// 위젯 Props
export interface LiveScoreWidgetV2Props {
  leagues: League[];
}
