'use client';

import { useRef, useEffect, useState } from 'react';
import styles from '../styles/formation.module.css';
// 프리미어리그 팀 선수 데이터 import
import { liverpoolPlayers, NottinghamForestPlayers, Arsenalplayers, NewcastleUnitedplayers, Chelseaplayers, ManchesterCityplayers, AstonVillaplayers, Bournemouthplayers, Fulhamplayers, Brightonplayers } from '@/domains/livescore/constants/teams/premier-league/premier-teams';
import Image from 'next/image';

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

// 선수 데이터 타입 정의
type PremierLeaguePlayer = 
  | { id: number; name: string; koreanName: string; } 
  | { id?: number; name: string; role?: string; korean_name: string; } 
  | { id: number; english_name: string; korean_name: string; }
  | { id: number; englishName: string; koreanName: string; };

// 선수 이름 매핑 함수
const getPlayerKoreanName = (playerId: number): string | null => {
  if (!playerId) return null;

  // ID 기반으로 선수 찾기 및 한국어 이름 반환 로직
  const findPlayerById = (players: PremierLeaguePlayer[]) => {
    return players.find(player => 'id' in player && player.id === playerId);
  };

  // 각 팀별로 찾기 (ID가 확실한 선수들만)
  const player = 
    findPlayerById(liverpoolPlayers as PremierLeaguePlayer[]) || 
    findPlayerById(Arsenalplayers as PremierLeaguePlayer[]) || 
    findPlayerById(NewcastleUnitedplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Chelseaplayers as PremierLeaguePlayer[]) || 
    findPlayerById(ManchesterCityplayers as PremierLeaguePlayer[]) || 
    findPlayerById(AstonVillaplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Bournemouthplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Fulhamplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Brightonplayers as PremierLeaguePlayer[]) ||
    findPlayerById(NottinghamForestPlayers as PremierLeaguePlayer[]);

  if (!player) return null;

  // 다양한 형태의 한국어 이름 속성 반환
  if ('koreanName' in player && player.koreanName) return player.koreanName;
  if ('korean_name' in player && player.korean_name) return player.korean_name;
  
  // 추가 속성 체크 (영어 이름과 함께 있는 경우)
  if ('english_name' in player && 'korean_name' in player) return player.korean_name;
  if ('englishName' in player && 'koreanName' in player) return player.koreanName;
  
  return null;
};

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
}

const Player = ({ homeTeamData, awayTeamData }: PlayerProps) => {
  const textRefs = useRef<{[key: string]: SVGTextElement | null}>({});
  const rectRefs = useRef<{[key: string]: SVGRectElement | null}>({});
  
  // 모바일 여부 확인 (768px 이하면 모바일로 간주)
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 이미지 로딩 상태를 관리하는 상태 추가
  const [failedImages, setFailedImages] = useState<{[key: string]: boolean}>({});
  
  // 뷰박스 설정 - 모바일과 데스크탑에 따라 다르게 설정
  const viewBox = isMobile ? "0 0 56 100" : "0 0 100 56";
  
  // 포지션 계산 함수 - 모바일과 데스크탑에 따라 다르게 계산
  const getPositionFromGrid = (grid: string | null, isHome: boolean, formation: string) => {
    if (!grid) return isMobile ? { x: 28, y: 50 } : { x: 50, y: 28 };

    const [line, position] = grid.split(':').map(Number);
    const formationArray = formation.split('-').map(Number);
    
    const getPosition = (line: number, isHome: boolean) => {
      if (isMobile) {
        // 모바일(세로형) 환경에서의 위치
        if (isHome) {
          switch(line) {
            case 1: return { x: 28, y: 93 };     // 맨 아래 - GK
            case 2: return { x: 28, y: 84 };     // 95 - 10 - DF
            case 3: return { x: 28, y: 74 };     // 95 - 20 - MF
            case 4: return { x: 28, y: 64 };     // 95 - 30 - AM
            case 5: return { x: 28, y: 54 };     // 95 - 40 - FW
            default: return { x: 28, y: 50 };
          }
        } else {
          switch(line) {
            case 1: return { x: 28, y: 5 };      // 맨 위 - GK
            case 2: return { x: 28, y: 15 };     // 5 + 10 - DF
            case 3: return { x: 28, y: 25 };     // 5 + 20 - MF
            case 4: return { x: 28, y: 35 };     // 5 + 30 - AM
            case 5: return { x: 28, y: 45 };     // 5 + 40 - FW
            default: return { x: 28, y: 50 };
          }
        }
      } else {
        // 데스크탑(가로형) 환경에서의 위치
        if (isHome) {
          switch(line) {
            case 1: return { x: 5, y: 28 };     // 시작점 - GK
            case 2: return { x: 15, y: 28 };    // DF
            case 3: return { x: 25, y: 28 };    // MF
            case 4: return { x: 35, y: 28 };    // AM
            case 5: return { x: 45, y: 28 };    // FW
            default: return { x: 50, y: 28 };
          }
        } else {
          switch(line) {
            case 1: return { x: 95, y: 28 };    // 끝점 - GK
            case 2: return { x: 85, y: 28 };    // DF
            case 3: return { x: 75, y: 28 };    // MF
            case 4: return { x: 65, y: 28 };    // AM
            case 5: return { x: 55, y: 28 };    // FW
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

    // 모바일(세로형)에서는 x축으로, 데스크탑(가로형)에서는 y축으로 offset 적용
    if (isMobile) {
      return {
        x: basePosition.x + offset,
        y: basePosition.y
      };
    } else {
      return {
        x: basePosition.x,
        y: basePosition.y + offset
      };
    }
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
  }, [homeTeamData, awayTeamData, failedImages, isMobile]); // isMobile 상태가 변경될 때도 재실행

  // 이미지 오류 핸들러
  const handleImageError = (e: React.SyntheticEvent<SVGImageElement>, playerData: PlayerData) => {
    // 이미지 로드 실패 시 이미지 교체 대신 상태만 업데이트
    const imageId = `image-${playerData.id}`;
    
    // 실패한 이미지 기록
    setFailedImages(prev => ({...prev, [imageId]: true}));
    
    // 이미지가 로드되지 않았을 때 href 속성을 빈 값으로 설정하여 완전히 숨김
    try {
      if (e && e.currentTarget) {
        (e.currentTarget as SVGImageElement).style.display = 'none';
      }
    } catch {
      // 오류가 발생해도 계속 진행
    }
  };

  const renderTeam = (team: TeamData, isHome: boolean) => {
    return team.startXI.map((player) => {
      const position = getPositionFromGrid(player.grid, isHome, team.formation);
      const isGoalkeeper = player.pos === 'G';
      const colors = isGoalkeeper ? team.team.colors.goalkeeper : team.team.colors.player;
      
      // 고유 ID 생성 - teamId와 playerId를 조합하여 더 안전한 고유 키 생성
      const teamId = team.team.id;
      const playerId = player.id;
      const uniqueKey = `player-${isHome ? 'home' : 'away'}-${teamId}-${playerId}`;
      const numberKey = `number-${teamId}-${playerId}`;
      const nameKey = `name-${isHome ? 'home' : 'away'}-${teamId}-${playerId}`;
      const imageId = `image-${playerId}`;

      // 이미지 URL 처리
      let photoUrl = player.photo;
      if (!photoUrl || !photoUrl.startsWith('http')) {
        photoUrl = `https://media.api-sports.io/football/players/${player.id}.png`;
      }

      // 이미지 여부 확인 (URL이 유효하고, 로딩 실패하지 않았을 때)
      const hasValidImage = Boolean(photoUrl) && !failedImages[imageId];
      
      // 색상 설정 - 이미지가 없거나 로딩 실패한 경우 더 밝은 색상으로 표시
      const circleOpacity = hasValidImage ? "0.9" : "1";
      
      // 한국어 이름 가져오기
      const koreanName = getPlayerKoreanName(player.id);
      const displayName = koreanName || player.name;
      
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
            opacity={circleOpacity}
          />
          
          {/* 선수 이미지를 위한 클리핑 패스 */}
          <defs>
            <clipPath id={`clip-${teamId}-${playerId}`}>
              <circle r="2.5" />
            </clipPath>
          </defs>
          
          {/* 이미지가 없거나 로딩 실패한 경우 선수 번호 표시 */}
          {!hasValidImage && (
            <text
              x="0"
              y="0.4"
              fill={`#${colors.number}`}
              fontSize="2"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {player.number}
            </text>
          )}
          
          {/* 선수 이미지 */}
          {hasValidImage && (
            <image
              x="-2.5"
              y="-2.5"
              width="5"
              height="5"
              href={photoUrl}
              clipPath={`url(#clip-${teamId}-${playerId})`}
              onError={(e) => handleImageError(e, player)}
              role="img"
              aria-labelledby={`player-name-${teamId}-${playerId}`}
            />
          )}
          
          {/* 선수 번호와 이름 - 간격 조정 */}
          <g className={styles.playerNameNumber}>
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
            {/* 이름 텍스트 - 한국어 이름으로 교체 */}
            <text
              ref={(el) => { textRefs.current[nameKey] = el; }}
              id={`player-name-${teamId}-${playerId}`}
              x="0"
              y="5.2"
              fill="white"
              fontSize="1.1"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {displayName.length > 10 ? displayName.substring(0, 10) + '...' : displayName}
              {player.captain ? " (C)" : ""}
            </text>
          </g>
        </g>
      );
    });
  };
  
  return (
    <svg className={styles.formation} viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
      {renderTeam(homeTeamData, true)}
      {renderTeam(awayTeamData, false)}
    </svg>
  );
};

export const PlayerImage = ({ playerId, name, posX, posY, x, y }: { playerId: number; name: string; posX: number; posY: number; x?: number; y?: number }) => {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(`https://media.api-sports.io/football/players/${playerId}.png`);

  const handleImageError = () => {
    setImageError(true);
    // 기본 이미지 사용으로 바로 변경
    setImageUrl('/images/player-placeholder.png');
  };

  return (
    <div
      className={`absolute group-hover:bg-header-dark rounded-[50%] overflow-hidden w-[26px] h-[26px] flex items-center justify-center bg-black/30`}
      style={{
        transform: x !== undefined && y !== undefined 
          ? `translate(${x}px, ${y}px)` 
          : `translate(${posX - 13}px, ${posY - 13}px)`,
        zIndex: 9,
      }}
    >
      {!imageError ? (
        <Image
          src={imageUrl}
          alt={`${name} 선수 이미지`}
          width={26}
          height={26}
          className="object-cover w-full h-full"
          onError={handleImageError}
          unoptimized
        />
      ) : (
        <div 
          className="flex items-center justify-center w-full h-full text-white text-[10px] font-bold" 
          aria-label={`${name} 선수 이니셜: ${name.substring(0, 1)}`}
        >
          {name.substring(0, 1)}
        </div>
      )}
    </div>
  );
};

export default Player; 