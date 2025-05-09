'use client';

import { TeamLineup } from '@/domains/livescore/actions/match/lineupData';

// Player 타입을 Formation 컴포넌트의 PlayerData와 일치시킴
interface FormationPlayerData {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string;
  captain: boolean;
  photo: string; // undefined를 허용하지 않도록 변경
}

export interface FormationData {
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
  startXI: FormationPlayerData[];
}

// 포메이션 데이터를 가공하는 함수
export function prepareFormationData(teamLineup: TeamLineup): FormationData | null {
  if (!teamLineup || !teamLineup.startXI) return null;
  
  return {
    team: {
      id: teamLineup.team.id,
      name: teamLineup.team.name,
      colors: teamLineup.team.colors || {
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
      }
    },
    formation: teamLineup.formation,
    startXI: teamLineup.startXI.map(item => {
      const playerData = 'player' in item ? item.player : item;
      return {
        id: playerData.id,
        name: playerData.name,
        number: playerData.number,
        pos: playerData.pos,
        grid: playerData.grid || '',
        captain: playerData.captain || false,
        photo: playerData.photo || '' // photo가 없는 경우 빈 문자열 사용
      };
    })
  };
}

// 선수 이름 매핑 함수
export function getPlayerKoreanName(/* playerId: number */): string | null {
  // liverpoolPlayers 등 필요시 프리미어리그 팀 선수 데이터 import
  // 현재는 구현 생략
  return null;
} 