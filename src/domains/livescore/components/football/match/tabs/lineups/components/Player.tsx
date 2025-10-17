'use client';

import React, { memo, useRef, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/formation.module.css';
import { getSupabaseStorageUrl } from '@/shared/utils/image-proxy';
import { ImageType } from '@/shared/types/image';
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';
import { urlCache } from '@/shared/components/UnifiedSportsImage';


// 미디어 쿼리 커스텀 훅
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// 팀별 선수 데이터 매핑 (필요시 사용)
// const teamPlayersMap: { [key: number]: any[] } = {
//   40: liverpoolPlayers,
//   65: NottinghamForestPlayers,
//   42: Arsenalplayers,
//   34: NewcastleUnitedplayers,
//   49: Chelseaplayers,
//   50: ManchesterCityplayers,
//   66: AstonVillaplayers,
//   35: Bournemouthplayers,
//   36: Fulhamplayers,
//   51: Brightonplayers,
// };

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
  isMobile?: boolean;
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
  const [cachedImageUrl, setCachedImageUrl] = useState<string | null>(null);
  const [isWaitingForCache, setIsWaitingForCache] = useState(true);
  
  const cacheKey = `${ImageType.Players}-${playerId}`;
  
  // 캐시 상태 감지
  useEffect(() => {
    if (!playerId) {
      // playerId가 없으면 photoUrl 사용
      setCachedImageUrl(photoUrl || null);
      setIsWaitingForCache(false);
      return;
    }
    
    // 초기 캐시 확인
    const checkCache = () => {
      const cachedUrl = urlCache?.get?.(cacheKey);
      if (cachedUrl) {
        setCachedImageUrl(cachedUrl);
        setIsWaitingForCache(false);
      } else {
        // 캐시에 없으면 주기적으로 확인 (테이블에서 저장 완료될 때까지)
        const interval = setInterval(() => {
          const url = urlCache?.get?.(cacheKey);
          if (url) {
            setCachedImageUrl(url);
            setIsWaitingForCache(false);
            clearInterval(interval);
          }
        }, 500); // 0.5초마다 확인
        
        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(interval);
          setIsWaitingForCache(false);
        }, 10000);
        
        return () => clearInterval(interval);
      }
    };
    
    checkCache();
  }, [playerId, photoUrl, cacheKey]);
  
  // 로딩 중이면 스피너 표시
  if (isWaitingForCache) {
    return (
      <g>
        {/* 스켈레톤 배경 */}
        <circle
          r="2.5"
          fill="#f3f4f6"
          stroke="#e5e7eb"
          strokeWidth="0.15"
          opacity="0.7"
        />
        {/* 로딩 스피너 */}
        <circle
          r="1"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="0.2"
          strokeDasharray="3.14"
          strokeDashoffset="3.14"
          opacity="0.8"
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
    );
  }
  
  // 캐시된 이미지 URL이 있으면 표시
  if (cachedImageUrl) {
    return (
      <image
        x="-2.5"
        y="-2.5"
        width="5"
        height="5"
        href={cachedImageUrl}
        clipPath={`url(#clip-${teamId}-${playerId})`}
        role="img"
        aria-labelledby={`player-name-${teamId}-${playerId}`}
        onLoad={onImageLoad}
        onError={onImageError}
      />
    );
  }

  return null;
});

const Player = memo(function Player({ isMobile: isMobileProp, homeTeamData, awayTeamData }: PlayerProps) {
  const textRefs = useRef<{[key: string]: SVGTextElement | null}>({});
  const rectRefs = useRef<{[key: string]: SVGRectElement | null}>({});
  const isMobileCalculated = useMediaQuery('(max-width: 768px)');
  const isMobile = isMobileProp ?? isMobileCalculated;
  
  // 진입 애니메이션 시작점: 경기장 중앙 하단 (뷰박스 기준)
  const startOrigin = useMemo(() => (
    isMobile 
      ? { x: 28, y: 100 }  // 모바일 viewBox: 0 0 56 100
      : { x: 50, y: 56 }    // 데스크탑 viewBox: 0 0 100 56
  ), [isMobile]);
  
  // viewBox는 상위 Field에서만 사용하므로 제거
  

  // 라인 앵커(주축 좌표) 계산: GK 포함 totalLines만큼 균등 분할
  const computeLineAnchors = (
    isMobileLayout: boolean,
    isHomeTeam: boolean,
    totalLines: number
  ) => {
    // 최소 2줄(GK + 한 줄) 보장, 과도한 라인 수 상한
    const lines = Math.max(2, Math.min(8, totalLines));
    
    if (isMobileLayout) {
      // 모바일: 주축은 y (아래로 증가)
      // 원래 값으로 복원: 겹침 방지 (이전 안정 배치)
      // 홈: 하단 골대 근처(93) → 중앙 쪽(54)
      // 원정: 상단 골대 근처(5)  → 중앙 쪽(45)
      const start = isHomeTeam ? 93 : 5;
      const end = isHomeTeam ? 54 : 45;
      const step = (end - start) / (lines - 1);
      return Array.from({ length: lines }, (_, i) => start + step * i);
    } else {
      // 데스크탑: 주축은 x (오른쪽으로 증가)
      // 홈: 좌측 골대 근처(5) → 중앙 쪽(45)
      // 원정: 우측 골대 근처(95) → 중앙 쪽(55)
      const start = isHomeTeam ? 5 : 95;
      const end = isHomeTeam ? 45 : 55;
      const step = (end - start) / (lines - 1);
      return Array.from({ length: lines }, (_, i) => start + step * i);
    }
  };

  // 포지션 계산 함수
  const getPositionFromGrid = (grid: string | null, isHome: boolean, formation: string) => {
    // 기본 폴백 위치(센터 근처)
    if (!grid) return isMobile ? { x: 28, y: 50 } : { x: 50, y: 28 };

    // grid 파싱과 안전장치
    const parts = grid.split(':');
    const lineRaw = Number(parts[0]);
    const positionRaw = Number(parts[1]);
    const segments = formation?.split?.('-')?.map(Number).filter(n => Number.isFinite(n) && n >= 0) || [];
    const totalLines = 1 + Math.max(segments.length, 1); // GK + 세그먼트(최소 1)

    const line = Math.min(Math.max(1, lineRaw), totalLines);
    const getLinePlayerCount = (lineNum: number) => {
      if (lineNum === 1) return 1; // GK
      const idx = lineNum - 2;
      return Math.max(0, segments[idx] ?? 0);
    };
    const totalInLine = getLinePlayerCount(line) || 1;
    const position = Math.min(Math.max(1, positionRaw || 1), totalInLine);

    // 라인 앵커 계산(주축 좌표들)
    const anchors = computeLineAnchors(isMobile, isHome, totalLines);
    const primary = anchors[Math.min(line - 1, anchors.length - 1)] ?? (isMobile ? 50 : 50);

    // 보조축 오프셋 계산
    const offset = calculateOffset(position, totalInLine);
    const centerX = 28; // 모바일 기준 x 중앙
    const centerY = 28; // 데스크탑 기준 y 중앙

    if (isMobile) {
      // 모바일: y가 라인 앵커, x는 보조축 오프셋
      return { x: centerX + offset, y: primary };
    }
    // 데스크탑: x가 라인 앵커, y는 보조축 오프셋
    return { x: primary, y: centerY + offset };
  };

  const calculateOffset = (position: number, totalInLine: number) => {
    if (totalInLine === 1) return 0;
    
    // 세로 분산(데스크탑 기준) 폭을 추가 확대
    const totalSpace = 62;
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


  const renderTeam = (team: TeamData, isHome: boolean) => {
    return team.startXI.map((player, index) => {
      const position = getPositionFromGrid(player.grid, isHome, team.formation);
      
      const teamId = team.team.id;
      const playerId = player.id;
      const uniqueKey = `player-${isHome ? 'home' : 'away'}-${teamId}-${playerId}`;
      const numberKey = `number-${teamId}-${playerId}`;
      const nameKey = `name-${isHome ? 'home' : 'away'}-${teamId}-${playerId}`;
      
      // 이미지 URL 처리 - 스토리지 URL 생성
      const photoUrl = player.photo || getSupabaseStorageUrl(ImageType.Players, player.id);

      const koreanName = getPlayerKoreanName(player.id);
      const displayName = koreanName || player.name;
      
      // 애니메이션 지연 계산 (포지션별 순차 등장)
      const animationDelay = `${index * 0.1 + (isHome ? 0 : 0.5)}s`;
      
      // 중앙 하단에서 각자의 위치로 대각선 이동하도록 초기 오프셋 계산
      const initialOffset = {
        x: startOrigin.x - position.x,
        y: startOrigin.y - position.y
      };

      return (
        <g
          key={uniqueKey}
          transform={`translate(${position.x},${position.y})`}
        >
          <motion.g
            initial={{ opacity: 0, x: initialOffset.x, y: initialOffset.y, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ 
              delay: parseFloat(animationDelay), 
              type: 'spring', 
              stiffness: 80, 
              damping: 16, 
              mass: 0.8 
            }}
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
          
          
          {/* 선수 이미지 - 항상 렌더링 (내부에서 로딩/캐시 상태 관리) */}
          {playerId && (
            <SVGPlayerImage
              playerId={playerId}
              photoUrl={photoUrl}
              teamId={teamId}
              onImageLoad={() => {}}
              onImageError={() => {}}
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
          </motion.g>
        </g>
      );
    });
  };
  
  return (
    <g className={styles.formation}>
      {renderTeam(homeTeamData, true)}
      {renderTeam(awayTeamData, false)}
    </g>
  );
});

export default Player; 