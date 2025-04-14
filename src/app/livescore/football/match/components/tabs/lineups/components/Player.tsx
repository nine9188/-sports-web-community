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
  if (!grid) return { x: 50, y: 28 };

  const [line, position] = grid.split(':').map(Number);
  const formationArray = formation.split('-').map(Number);
  
  const getPosition = (line: number, isHome: boolean) => {
    // 모바일과 PC에서 다른 위치 값 사용
    if (isMobile) {
      // 모바일 환경에서의 위치
      if (isHome) {
        switch(line) {
          case 1: return { x: 5, y: 28 };     // 시작점 - GK
          case 2: return { x: 15, y: 28 };     // DF
          case 3: return { x: 25, y: 28 };     // MF
          case 4: return { x: 35, y: 28 };     // AM
          case 5: return { x: 45, y: 28 };     // FW
          default: return { x: 50, y: 28 };
        }
      } else {
        switch(line) {
          case 1: return { x: 93, y: 28 };     // 끝점 - GK
          case 2: return { x: 84, y: 28 };     // DF
          case 3: return { x: 74, y: 28 };     // MF
          case 4: return { x: 64, y: 28 };     // AM
          case 5: return { x: 54, y: 28 };     // FW
          default: return { x: 50, y: 28 };
        }
      }
    } else {
      // PC 환경에서의 위치 (기존 코드)
      if (isHome) {
        switch(line) {
          case 1: return { x: 5, y: 28 };     // 시작점 - GK
          case 2: return { x: 15, y: 28 };    // 5 + 10 - DF
          case 3: return { x: 25, y: 28 };    // 5 + 20 - MF
          case 4: return { x: 35, y: 28 };    // 5 + 30 - AM
          case 5: return { x: 45, y: 28 };    // 5 + 40 - FW
          default: return { x: 50, y: 28 };
        }
      } else {
        switch(line) {
          case 1: return { x: 95, y: 28 };    // 끝점 - GK
          case 2: return { x: 85, y: 28 };    // 95 - 10 - DF
          case 3: return { x: 75, y: 28 };    // 95 - 20 - MF
          case 4: return { x: 65, y: 28 };    // 95 - 30 - AM
          case 5: return { x: 55, y: 28 };    // 95 - 40 - FW
          default: return { x: 50, y: 28 };
        }
      }
    }
  };

  const basePosition = getPosition(line, isHome);
  
  // 라인에 따른 선수 수 계산
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

  // y축으로 offset 적용
  return {
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

      // 모바일 세로 모드일 때 회전 적용 (-90도로 변경)
      const imageRotation = isMobile ? 'rotate(-90)' : '';
      
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
            <g transform={imageRotation}>
              <image
                className={styles.playerImage}
                href={player.photo}
                width="5"
                height="5"
                x="-2.5"
                y="-2.5"
                clipPath={`url(#clip-${teamId}-${playerId})`}
                preserveAspectRatio="xMidYMid slice"
                aria-label={`${player.name} 선수 사진`}
              />
            </g>
          )}
          
          {/* 선수 번호와 이름 - 간격 조정 */}
          <g className={styles.playerNameNumber} transform={imageRotation}>
            {/* 번호 배경 */}
            <rect
              ref={(el) => { rectRefs.current[numberKey] = el; }}
              x="-2.5"
              y="2.8"
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
              y="3.7"
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
              y="4.6"
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
              y="5.2"
              fill="white"
              fontSize="1.1"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {player.name.length > 10 ? player.name.substring(0, 10) + '...' : player.name}
              {player.captain ? " (C)" : ""}
            </text>
          </g>
        </g>
      );
    });
  };

  // SVG 좌표계 설정
  const viewBox = "0 0 100 56";
  
  return (
    <svg className={styles.formation} viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
      {renderTeam(homeTeamData, true)}
      {renderTeam(awayTeamData, false)}
    </svg>
  );
};

export default Player; 