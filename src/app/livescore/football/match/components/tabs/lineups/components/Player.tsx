'use client';

import { useRef, useEffect } from 'react';
import styles from '../styles/formation.module.css';

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

interface PlayerProps {
  homeTeamData: TeamData;
  awayTeamData: TeamData;
  isMobile: boolean;
}

const getPositionFromGrid = (grid: string | null, isHome: boolean, formation: string, isMobile: boolean) => {
  if (!grid) return isMobile ? { x: 50, y: 28 } : { x: 50, y: 28 };

  const [line, position] = grid.split(':').map(Number);
  const formationArray = formation.split('-').map(Number);
  
  const getPosition = (line: number, isHome: boolean) => {
    if (isMobile) {
      if (isHome) {
        switch(line) {
          case 1: return { x: 72, y: 7 };     // GK  (시작점)
          case 2: return { x: 72, y: 15 };    // DF  (5 + 10)
          case 3: return { x: 72, y: 25 };    // MF  (5 + 20)
          case 4: return { x: 72, y: 35 };    // AM  (5 + 30)
          case 5: return { x: 72, y: 45 };    // FW  (5 + 40)
          default: return { x: 72, y: 50 };
        }
      } else {
        switch(line) {
          case 1: return { x: 72, y: 93 };    // GK  (끝점)
          case 2: return { x: 72, y: 85 };    // DF  (95 - 10)
          case 3: return { x: 72, y: 75 };    // MF  (95 - 20)
          case 4: return { x: 72, y: 65 };    // AM  (95 - 30)
          case 5: return { x: 72, y: 55 };    // FW  (95 - 40)
          default: return { x: 72, y: 50 };
        }
      }
    } else {
      if (isHome) {
        switch(line) {
          case 1: return { x: 5, y: 28 };     // 시작점
          case 2: return { x: 15, y: 28 };    // 5 + 10
          case 3: return { x: 25, y: 28 };    // 5 + 20
          case 4: return { x: 35, y: 28 };    // 5 + 30
          case 5: return { x: 45, y: 28 };    // 5 + 40
          default: return { x: 50, y: 28 };
        }
      } else {
        switch(line) {
          case 1: return { x: 95, y: 28 };    // 끝점
          case 2: return { x: 85, y: 28 };    // 95 - 10
          case 3: return { x: 75, y: 28 };    // 95 - 20
          case 4: return { x: 65, y: 28 };    // 95 - 30
          case 5: return { x: 55, y: 28 };    // 95 - 40
          default: return { x: 50, y: 28 };
        }
      }
    }
  };

  const basePosition = getPosition(line, isHome);
  
  // y축(또는 모바일에서는 x축) 위치 계산
  const getLinePlayerCount = (lineNum: number) => {
    switch(lineNum) {
      case 2: return formationArray[0];  // DF
      case 3: return formationArray[1];  // MF/WB
      case 4: return formationArray[2];  // AM/FW
      case 5: return formationArray[3] || 0;  // FW
      default: return 1;  // GK
    }
  };

  const totalInLine = getLinePlayerCount(line);
  const offset = calculateOffset(position, totalInLine);

  // 모바일에서는 y축으로 offset 적용
  return isMobile ? {
    x: basePosition.x + offset,  // 좌우 간격
    y: basePosition.y           // 상하 위치
  } : {
    x: basePosition.x,
    y: basePosition.y + offset
  };
};

const calculateOffset = (position: number, totalInLine: number) => {
  if (totalInLine === 1) return 0;  // 단일 선수는 중앙
  
  const totalSpace = 52;  // 전체 사용 가능한 공간
  const spacing = totalSpace / (totalInLine + 1);  // 선수들 사이의 간격
  
  // 중앙을 기준으로 위치 계산
  const centerPosition = (totalInLine + 1) / 2;
  const offset = (position - centerPosition) * spacing;
  
  return offset;  // 중앙 기준으로 offset 반환
};

const Player = ({ homeTeamData, awayTeamData, isMobile }: PlayerProps) => {
  const textRefs = useRef<{[key: string]: SVGTextElement | null}>({});
  const rectRefs = useRef<{[key: string]: SVGRectElement | null}>({});
  
  // 텍스트 크기에 맞게 배경 조정하는 함수
  useEffect(() => {
    // DOM이 렌더링된 후 실행
    Object.keys(textRefs.current).forEach(key => {
      const textElement = textRefs.current[key];
      const rectElement = rectRefs.current[key];
      
      if (textElement && rectElement) {
        const bbox = textElement.getBBox();
        // 텍스트 크기에 맞게 배경 크기 조정 (좌우 패딩 추가)
        const padding = 0.8; // 좌우 패딩 감소
        const heightPadding = 0; // 높이 패딩 감소
        rectElement.setAttribute('width', `${bbox.width + padding * 2}`);
        rectElement.setAttribute('height', `${bbox.height + heightPadding}`); // 높이 감소
        rectElement.setAttribute('x', `${bbox.x - padding}`);
        rectElement.setAttribute('y', `${bbox.y - heightPadding * 0.5}`); // y 위치 조정
      }
    });
  }, [homeTeamData, awayTeamData]); // 데이터가 변경될 때마다 실행

  const renderTeam = (team: TeamData, isHome: boolean) => {
    return team.startXI.map((player) => {
      const position = getPositionFromGrid(player.grid, isHome, team.formation, isMobile);
      const isGoalkeeper = player.pos === 'G';
      const colors = isGoalkeeper ? team.team.colors.goalkeeper : team.team.colors.player;
      
      // 고유 ID 생성 - teamId와 playerId를 조합하여 더 안전한 고유 키 생성
      const teamId = team.team.id;
      const playerId = player.id;
      const uniqueKey = `player-${isHome ? 'home' : 'away'}-${teamId}-${playerId}`;
      const numberKey = `number-${teamId}-${playerId}`;
      const nameKey = `name-${isHome ? 'home' : 'away'}-${teamId}-${playerId}`;

      return (
        <g
          key={uniqueKey}
          transform={`translate(${position.x},${position.y})`}
        >
          {/* 배경 원 */}
          <circle
            r="2.5"
            fill={`#${colors.primary}`}
            stroke="white"
            strokeWidth="0.15"
            opacity="0.9"
          />
          
          {/* 선수 이미지를 위한 클리핑 패스 */}
          <defs>
            <clipPath id={`clip-${teamId}-${playerId}`}>
              <circle r="2.5" />
            </clipPath>
          </defs>
          
          {/* 선수 이미지 - aria-label 속성 사용하여 접근성 추가 */}
          {player.photo && (
            <image
              href={player.photo}
              width="5"
              height="5"
              x="-2.5"
              y="-2.5"
              clipPath={`url(#clip-${teamId}-${playerId})`}
              preserveAspectRatio="xMidYMid slice"
              aria-label={`${player.name} 선수 사진`}
            />
          )}
          
          {/* 선수 번호와 이름 - 간격 조정 */}
          <g>
            {/* 번호 배경 */}
            <rect
              ref={(el) => { rectRefs.current[numberKey] = el; }}
              x="-2.5"
              y={isMobile ? "3" : "2.8"}
              width="5"
              height="1.1"
              rx="0.55"
              ry="0.55"
              fill="rgba(0, 100, 0, 0.7)"
            />
            {/* 번호 텍스트 */}
            <text
              ref={(el) => { textRefs.current[numberKey] = el; }}
              x="0"
              y={isMobile ? "4" : "3.7"}
              fill="white"
              fontSize="1.1"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              #{player.number}
            </text>
            
            {/* 이름 배경 */}
            <rect
              ref={(el) => { rectRefs.current[nameKey] = el; }}
              x="-4"
              y={isMobile ? "4.7" : "4.6"}
              width="8"
              height="1.1"
              rx="0.55"
              ry="0.55"
              fill="rgba(0, 100, 0, 0.7)"
            />
            {/* 이름 텍스트 */}
            <text
              ref={(el) => { textRefs.current[nameKey] = el; }}
              x="0"
              y={isMobile ? "5.5" : "5.2"}
              fill="white"
              fontSize="1.1"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {player.name.length > 10 ? player.name.substring(0, 10) + '...' : player.name}
              {player.captain ? " (C)" : ""}
            </text>
          </g>
          
          {/* 주장 표시 */}
          {player.captain && (
            <text
              x="3.2"
              y="-2.5"
              fill="#FFC107"
              fontSize="2"
              textAnchor="middle"
              fontWeight="bold"
            >
              C
            </text>
          )}
        </g>
      );
    });
  };

  // SVG 좌표계 설정
  const viewBox = isMobile ? "0 0 144 100" : "0 0 100 56";
  
  return (
    <svg className={styles.formation} viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
      {renderTeam(homeTeamData, true)}
      {renderTeam(awayTeamData, false)}
    </svg>
  );
};

export default Player; 