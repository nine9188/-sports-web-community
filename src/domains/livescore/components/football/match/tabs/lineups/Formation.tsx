'use client';

import { useState, useEffect, useMemo } from 'react';
import Field from './components/Field';
import Player from './components/Player';

// 미디어 쿼리 커스텀 훅
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);
    
    updateMatches();
    mediaQuery.addEventListener('change', updateMatches);
    
    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query]);

  return matches;
}

interface PlayerData {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string;
  captain: boolean;
  photo: string;
}

interface TeamData {
  team: {
    id: number;
    name: string;
    colors: {
      player: {
        primary: string;
        number: string;
        border: string;
      };
      goalkeeper: {
        primary: string;
        number: string;
        border: string;
      };
    };
  };
  formation: string;
  startXI: PlayerData[];
}

interface FormationProps {
  homeTeamData: TeamData;
  awayTeamData: TeamData;
}

export default function Formation({ homeTeamData, awayTeamData }: FormationProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 기본 팀 색상
  const defaultColors = useMemo(() => ({
    player: {
      primary: '1a5f35',
      number: 'ffffff',
      border: '1a5f35'
    },
    goalkeeper: {
      primary: 'ffd700',
      number: '000000',
      border: 'ffd700'
    }
  }), []);

  // 팀 데이터 정제 함수 메모이제이션
  const processTeamData = useMemo(() => {
    return (teamData: Partial<TeamData>): TeamData => {
      return {
        team: {
          id: teamData.team?.id || 0,
          name: teamData.team?.name || '',
          colors: teamData.team?.colors || defaultColors
        },
        formation: teamData.formation || '',
        startXI: (teamData.startXI || []).map((player: Partial<PlayerData>) => ({
          id: player.id || 0,
          name: player.name || '',
          number: player.number || 0,
          pos: player.pos || '',
          grid: player.grid || '',
          captain: player.captain || false,
          photo: player.photo || ''
        }))
      };
    };
  }, [defaultColors]);

  const processedHomeTeam = useMemo(() => processTeamData(homeTeamData), [processTeamData, homeTeamData]);
  const processedAwayTeam = useMemo(() => processTeamData(awayTeamData), [processTeamData, awayTeamData]);

  return (
    <div style={{ 
      borderRadius: '12px', 
      overflow: 'hidden', 
      maxWidth: '100%',
      aspectRatio: isMobile ? '9/16' : '16/9',
      margin: '0 auto'
    }}>
      <Field>
        <Player
          homeTeamData={processedHomeTeam}
          awayTeamData={processedAwayTeam}
        />
      </Field>
    </div>
  );
}