
import MatchHeaderClient from './MatchHeaderClient';

// 이벤트 인터페이스 정의
interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id?: number;
    name?: string;
  };
  type: string;
  detail: string;
  comments?: string;
}

interface MatchHeaderProps {
  league: {
    id: number;
    name: string;
    logo: string;
  };
  status: {
    long: string;
    short: string;
    elapsed?: number;
  };
  fixture: {
    date: string;
    time: string;
    timestamp: number;
  };
  teams: {
    home: {
      id: number;
      name: string;
      formation: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      formation: string;
      logo: string;
    };
  };
  score: {
    halftime: { home: string; away: string };
    fulltime: { home: string; away: string };
  };
  goals: {
    home: string;
    away: string;
  };
  events: MatchEvent[];
}

export default function MatchHeader({ 
  league,
  status,
  fixture,
  teams,
  score,
  goals,
  events
}: MatchHeaderProps) {
  return (
    <MatchHeaderClient
      league={league}
      status={status}
      fixture={fixture}
      teams={teams}
      score={score}
      goals={goals}
      events={events}
    />
  );
} 