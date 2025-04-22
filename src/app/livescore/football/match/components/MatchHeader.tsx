import MatchHeaderClient from './MatchHeaderClient';
import { MatchEvent } from '../types';

// 간소화된 인터페이스
interface MatchHeaderProps {
  matchId: string; // 매치 ID만 필수로 변경 (다른 데이터는 서버 액션으로 가져옴)
  // 초기 데이터는 선택적으로 전달 가능
  league?: {
    id: number;
    name: string;
    logo: string;
    name_ko?: string;  // 추가: 한국어 리그명
  };
  status?: {
    long: string;
    short: string;
    elapsed?: number | null;
  };
  fixture?: {
    date: string;
    time: string;
    timestamp: number;
  };
  teams?: {
    home: {
      id: number;
      name: string;
      formation: string;
      logo: string;
      name_ko?: string;  // 추가: 한국어 팀명
      name_en?: string;  // 추가: 영어 팀명
    };
    away: {
      id: number;
      name: string;
      formation: string;
      logo: string;
      name_ko?: string;  // 추가: 한국어 팀명
      name_en?: string;  // 추가: 영어 팀명
    };
  };
  score?: {
    halftime: { home: string; away: string };
    fulltime: { home: string; away: string };
  };
  goals?: {
    home: string;
    away: string;
  };
  events?: MatchEvent[];
}

export default function MatchHeader({ 
  matchId,
  league,
  status,
  fixture,
  teams,
  score,
  goals,
  events = [] // 기본값 제공
}: MatchHeaderProps) {
  // 기본값 제공 (실제 데이터는 MatchHeaderClient에서 서버 액션으로 가져옴)
  const defaultLeague = league || { id: 0, name: '', logo: '', name_ko: '' };
  const defaultStatus = status || { long: '', short: '', elapsed: null };
  const defaultFixture = fixture || { date: '', time: '', timestamp: 0 };
  const defaultTeams = teams || {
    home: { id: 0, name: '', formation: '', logo: '', name_ko: '', name_en: '' },
    away: { id: 0, name: '', formation: '', logo: '', name_ko: '', name_en: '' }
  };
  const defaultScore = score || { 
    halftime: { home: '0', away: '0' }, 
    fulltime: { home: '0', away: '0' } 
  };
  const defaultGoals = goals || { home: '0', away: '0' };

  return (
    <MatchHeaderClient
      league={defaultLeague}
      status={defaultStatus}
      fixture={defaultFixture}
      teams={defaultTeams}
      score={defaultScore}
      goals={defaultGoals}
      events={events}
      matchId={matchId}
    />
  );
} 