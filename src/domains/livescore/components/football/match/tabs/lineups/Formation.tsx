'use client';

import { useState, useEffect } from 'react';
import Field from './components/Field';
import Player from './components/Player';

// 미디어 쿼리를 사용하기 위한 커스텀 훅
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);
    
    // 초기값 설정
    updateMatches();
    
    // 리스너 등록
    mediaQuery.addEventListener('change', updateMatches);
    
    // 클린업
    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query]);

  return matches;
}

// Player 컴포넌트에서 사용하는 타입과 일치시킴
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
  // 모바일 여부 확인 (768px 이하면 모바일로 간주)
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 기본 팀 색상 설정
  const defaultColors = {
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
  };

  // 팀 데이터에 colors 추가 및 데이터 정제
  const processTeamData = (teamData: Partial<TeamData>): TeamData => {
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

  const processedHomeTeam = processTeamData(homeTeamData);
  const processedAwayTeam = processTeamData(awayTeamData);

  return (
    <div style={{ 
      borderRadius: '12px', 
      overflow: 'hidden', 
      maxWidth: '100%',
      aspectRatio: isMobile ? '9/16' : '16/9', // 모바일과 데스크탑에 따라 비율 변경
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