'use client';

import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react';
import styles from '../styles/formation.module.css';
import { liverpoolPlayers, NottinghamForestPlayers, Arsenalplayers, NewcastleUnitedplayers, Chelseaplayers, ManchesterCityplayers, AstonVillaplayers, Bournemouthplayers, Fulhamplayers, Brightonplayers } from '@/domains/livescore/constants/teams/premier-league/premier-teams';
import { getPlayerImageUrl, convertApiSportsUrl, isApiSportsUrl } from '@/shared/utils/image-proxy';

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

interface PlayerProps {
  homeTeamData: TeamData;
  awayTeamData: TeamData;
}

// SVG 내부에서 사용할 최적화된 선수 이미지 컴포넌트
interface SVGPlayerImageProps {
  playerId: number;
  photoUrl: string;
  teamId: number;
  onImageLoad: () => void;
  onImageError: () => void;
}

const SVGPlayerImage = memo(function SVGPlayerImage({ playerId, photoUrl, teamId, onImageLoad, onImageError }: SVGPlayerImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const onImageLoadRef = useRef(onImageLoad);
  const onImageErrorRef = useRef(onImageError);
  
  // 최신 콜백 함수들을 ref에 저장
  useEffect(() => {
    onImageLoadRef.current = onImageLoad;
    onImageErrorRef.current = onImageError;
  });

  useEffect(() => {
    if (!photoUrl || imageError) return;

    // 프록시 URL 생성
    let imageUrl = photoUrl;
    if (playerId) {
      imageUrl = getPlayerImageUrl(playerId);
    } else if (isApiSportsUrl(photoUrl)) {
      imageUrl = convertApiSportsUrl(photoUrl);
    }

    console.log(`[SVGPlayerImage] 이미지 로딩 시도: ${imageUrl}`);

    const img = new Image();
    img.onload = () => {
      console.log(`[SVGPlayerImage] 이미지 로딩 성공: ${imageUrl}`);
      setImageLoaded(true);
      setImageError(false);
      onImageLoadRef.current();
    };
    img.onerror = () => {
      console.error(`[SVGPlayerImage] 이미지 로딩 실패: ${imageUrl}`);
      if (retryCount < 2) {
        // 최대 2번 재시도
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 1000 * (retryCount + 1));
      } else {
        setImageError(true);
        onImageErrorRef.current();
      }
    };
    img.src = imageUrl;
  }, [photoUrl, retryCount, imageError, playerId]); // playerId 추가

  if (imageError || !photoUrl) {
    return null;
  }

  if (!imageLoaded) return null;

  // 프록시 URL 생성 (렌더링 시에도 동일한 로직 적용)
  let imageUrl = photoUrl;
  if (playerId) {
    imageUrl = getPlayerImageUrl(playerId);
  } else if (isApiSportsUrl(photoUrl)) {
    imageUrl = convertApiSportsUrl(photoUrl);
  }

  return (
    <image
      x="-2.5"
      y="-2.5"
      width="5"
      height="5"
      href={imageUrl}
      clipPath={`url(#clip-${teamId}-${playerId})`}
      role="img"
      aria-labelledby={`player-name-${teamId}-${playerId}`}
    />
  );
});

const Player = memo(function Player({ homeTeamData, awayTeamData }: PlayerProps) {
  const textRefs = useRef<{[key: string]: SVGTextElement | null}>({});
  const rectRefs = useRef<{[key: string]: SVGRectElement | null}>({});
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  const viewBox = isMobile ? "0 0 56 100" : "0 0 100 56";
  
  // 한국어 이름 매핑 메모이제이션
  const koreanNameMap = useMemo(() => {
    const map = new Map<number, string>();
    const allPlayers = [
      ...liverpoolPlayers, ...NottinghamForestPlayers, ...Arsenalplayers,
      ...NewcastleUnitedplayers, ...Chelseaplayers, ...ManchesterCityplayers,
      ...AstonVillaplayers, ...Bournemouthplayers, ...Fulhamplayers, ...Brightonplayers
    ];
    
    allPlayers.forEach(player => {
      if ('id' in player && player.id) {
        let koreanName = '';
        if ('koreanName' in player && player.koreanName) koreanName = player.koreanName;
        else if ('korean_name' in player && player.korean_name) koreanName = player.korean_name;
        
        if (koreanName) {
          map.set(player.id, koreanName);
        }
      }
    });
    
    return map;
  }, []);

  // 포지션 계산 함수
  const getPositionFromGrid = (grid: string | null, isHome: boolean, formation: string) => {
    if (!grid) return isMobile ? { x: 28, y: 50 } : { x: 50, y: 28 };

    const [line, position] = grid.split(':').map(Number);
    const formationArray = formation.split('-').map(Number);
    
    const getPosition = (line: number, isHome: boolean) => {
      if (isMobile) {
        if (isHome) {
          switch(line) {
            case 1: return { x: 28, y: 93 };
            case 2: return { x: 28, y: 84 };
            case 3: return { x: 28, y: 74 };
            case 4: return { x: 28, y: 64 };
            case 5: return { x: 28, y: 54 };
            default: return { x: 28, y: 50 };
          }
        } else {
          switch(line) {
            case 1: return { x: 28, y: 5 };
            case 2: return { x: 28, y: 15 };
            case 3: return { x: 28, y: 25 };
            case 4: return { x: 28, y: 35 };
            case 5: return { x: 28, y: 45 };
            default: return { x: 28, y: 50 };
          }
        }
      } else {
        if (isHome) {
          switch(line) {
            case 1: return { x: 5, y: 28 };
            case 2: return { x: 15, y: 28 };
            case 3: return { x: 25, y: 28 };
            case 4: return { x: 35, y: 28 };
            case 5: return { x: 45, y: 28 };
            default: return { x: 50, y: 28 };
          }
        } else {
          switch(line) {
            case 1: return { x: 95, y: 28 };
            case 2: return { x: 85, y: 28 };
            case 3: return { x: 75, y: 28 };
            case 4: return { x: 65, y: 28 };
            case 5: return { x: 55, y: 28 };
            default: return { x: 50, y: 28 };
          }
        }
      }
    };

    const basePosition = getPosition(line, isHome);
    const getLinePlayerCount = (lineNum: number) => {
      switch(lineNum) {
        case 2: return formationArray[0];
        case 3: return formationArray[1];
        case 4: return formationArray[2];
        case 5: return formationArray[3] || 0;
        default: return 1;
      }
    };

    const totalInLine = getLinePlayerCount(line);
    const offset = calculateOffset(position, totalInLine);

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
    if (totalInLine === 1) return 0;
    
    const totalSpace = 52;
    const spacing = totalSpace / (totalInLine + 1);
    const centerPosition = (totalInLine + 1) / 2;
    const offset = (position - centerPosition) * spacing;
    
    return offset;
  };
  
  // 텍스트 크기에 맞게 배경 조정
  useEffect(() => {
    Object.keys(textRefs.current).forEach(key => {
      const textElement = textRefs.current[key];
      const rectElement = rectRefs.current[key];
      
      if (textElement && rectElement) {
        const bbox = textElement.getBBox();
        const padding = 0.8;
        rectElement.setAttribute('width', `${bbox.width + padding * 2}`);
        rectElement.setAttribute('height', `${bbox.height}`);
        rectElement.setAttribute('x', `${bbox.x - padding}`);
        rectElement.setAttribute('y', `${bbox.y}`);
      }
    });
  }, [homeTeamData, awayTeamData, isMobile]);

  // 이미지 로드 성공 핸들러
  const handleImageLoad = useCallback((playerId: number) => {
    setLoadedImages(prev => new Set(prev).add(`${playerId}`));
  }, []);

  // 이미지 오류 핸들러
  const handleImageError = useCallback((playerId: number) => {
    setFailedImages(prev => new Set(prev).add(`${playerId}`));
  }, []);

  const renderTeam = (team: TeamData, isHome: boolean) => {
    return team.startXI.map((player) => {
      const position = getPositionFromGrid(player.grid, isHome, team.formation);
      
      const teamId = team.team.id;
      const playerId = player.id;
      const uniqueKey = `player-${isHome ? 'home' : 'away'}-${teamId}-${playerId}`;
      const numberKey = `number-${teamId}-${playerId}`;
      const nameKey = `name-${isHome ? 'home' : 'away'}-${teamId}-${playerId}`;
      
      // 이미지 URL 처리 - 우선순위 로딩 적용
      const photoUrl = player.photo || getPlayerImageUrl(player.id);
      const hasValidImage = Boolean(photoUrl) && !failedImages.has(`${playerId}`);
      const imageLoaded = loadedImages.has(`${playerId}`);
      
      const koreanName = koreanNameMap.get(player.id);
      const displayName = koreanName || player.name;
      
      return (
        <g
          key={uniqueKey}
          transform={`translate(${position.x},${position.y})`}
        >
          {/* 배경 원 - 회색으로 통일 */}
          <circle
            r="2.5"
            fill="#f3f4f6"
            stroke="white"
            strokeWidth="0.15"
            opacity="1"
          />
          
          {/* 선수 이미지를 위한 클리핑 패스 */}
          <defs>
            <clipPath id={`clip-${teamId}-${playerId}`}>
              <circle r="2.5" />
            </clipPath>
          </defs>
          
          {/* 로딩 중일 때 스피너 표시 */}
          {hasValidImage && !imageLoaded && (
            <g>
              {/* 스피너 배경 */}
              <circle
                r="1"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="0.2"
              />
              {/* 스피너 */}
              <circle
                r="1"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.2"
                strokeDasharray="3.14"
                strokeDashoffset="3.14"
                transform="rotate(0)"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0;360"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}
          
          {/* 이미지가 없거나 로딩 실패한 경우 선수 번호 표시 */}
          {(!hasValidImage || (!imageLoaded && !hasValidImage)) && (
            <text
              x="0"
              y="0.4"
              fill="#374151"
              fontSize="2"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {player.number}
            </text>
          )}
          
          {/* 선수 이미지 - 지연 로딩 적용 */}
          {hasValidImage && (
            <SVGPlayerImage
              playerId={playerId}
              photoUrl={photoUrl}
              teamId={teamId}
              onImageLoad={() => handleImageLoad(playerId)}
              onImageError={() => handleImageError(playerId)}
            />
          )}
          
          {/* 선수 번호와 이름 */}
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
            {/* 이름 텍스트 */}
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
});

export default Player; 