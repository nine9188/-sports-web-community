'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/formation.module.css';

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

const Field = ({ children }: { children?: React.ReactNode }) => {
  // 모바일 여부 확인 (768px 이하면 모바일로 간주)
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 화면 크기에 따라 viewBox 설정
  const viewBox = isMobile ? "0 0 56 100" : "0 0 100 56";
  
  return (
    <div 
      className={`${styles.fieldWrapper} mb-4 bg-white rounded-lg border`}
      style={{ 
        overflow: 'hidden',
        aspectRatio: isMobile ? '9/16' : '16/9' // 모바일과 데스크탑에 따라 비율 변경
      }}
    >
      <div 
        className={styles.fieldContent}
        style={{ borderRadius: '12px', overflow: 'hidden' }}
      >
        <svg 
          viewBox={viewBox}
          className={styles.fieldSvg}
          preserveAspectRatio="xMidYMid meet"
          style={{ borderRadius: '12px' }}
        >
          {isMobile ? (
            // 모바일(세로형) 필드 레이아웃
            <g>
              {/* 잔디 패턴을 위한 동심원들 */}
              <circle cx="28" cy="50" r="58" fill="#3d9735"/>
              <circle cx="28" cy="50" r="54.375" fill="#3b9133"/>
              <circle cx="28" cy="50" r="50.75" fill="#3d9735"/>
              <circle cx="28" cy="50" r="47.125" fill="#3b9133"/>
              <circle cx="28" cy="50" r="43.5" fill="#3d9735"/>
              <circle cx="28" cy="50" r="39.875" fill="#3b9133"/>
              <circle cx="28" cy="50" r="36.25" fill="#3d9735"/>
              <circle cx="28" cy="50" r="32.625" fill="#3b9133"/>
              <circle cx="28" cy="50" r="29" fill="#3d9735"/>
              <circle cx="28" cy="50" r="25.375" fill="#3b9133"/>
              <circle cx="28" cy="50" r="21.75" fill="#3d9735"/>
              <circle cx="28" cy="50" r="18.125" fill="#3b9133"/>
              <circle cx="28" cy="50" r="14.5" fill="#3d9735"/>
              <circle cx="28" cy="50" r="10.875" fill="#3b9133"/>
              <circle cx="28" cy="50" r="7.25" fill="#3d9735"/>
              <circle cx="28" cy="50" r="3.625" fill="#3b9133"/>

              {/* 경기장 외곽선 */}
              <rect 
                stroke="white" 
                strokeLinecap="square"
                fill="transparent" 
                strokeWidth="0.25" 
                x="0" 
                y="0" 
                width="56" 
                height="100"
              />

              {/* 중앙선 */}
              <line
                stroke="white"
                strokeLinecap="square"
                strokeWidth="0.25"
                x1="0"
                y1="50"
                x2="56"
                y2="50"
              />

              {/* 센터 서클 */}
              <circle 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                cx="28" 
                cy="50" 
                r="7"
              />

              {/* 페널티 박스 (상단) */}
              <path 
                stroke="white" 
                strokeLinecap="square"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M11.2 0 V11.8 H44.8 V0"
              />

              {/* 페널티 박스 (하단) */}
              <path 
                stroke="white" 
                strokeLinecap="square"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M11.2 100 V88.2 H44.8 V100"
              />

              {/* 골 박스 (상단) */}
              <path 
                stroke="white" 
                strokeLinecap="square"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M20 0 V5.6 H36 V0"
              />

              {/* 골 박스 (하단) */}
              <path 
                stroke="white" 
                strokeLinecap="square"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M20 100 V94.4 H36 V100"
              />

              {/* 페널티 아크 (상단) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M22 11.8 A7,7 0 0 0 34,11.8"
              />

              {/* 페널티 아크 (하단) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M22 88.2 A7,7 0 0 1 34,88.2"
              />

              {/* 코너킥 아크 (왼쪽 상단) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M2 0 A2,2 0 0 1 0,2"
              />

              {/* 코너킥 아크 (오른쪽 상단) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M54 0 A2,2 0 0 0 56,2"
              />

              {/* 코너킥 아크 (왼쪽 하단) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M0 98 A2,2 0 0 0 2,100"
              />

              {/* 코너킥 아크 (오른쪽 하단) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M56 98 A2,2 0 0 1 54,100"
              />

              {/* 센터 점 */}
              <circle 
                stroke="white" 
                strokeLinecap="round"
                fill="white" 
                strokeWidth="0.25" 
                cx="28" 
                cy="50" 
                r="0.25"
              />

              {/* 페널티 점 (상단, 하단) */}
              <circle 
                stroke="white" 
                strokeLinecap="round"
                fill="white" 
                strokeWidth="0.25" 
                cx="28" 
                cy="8.4" 
                r="0.25"
              />
              <circle 
                stroke="white" 
                strokeLinecap="round"
                fill="white" 
                strokeWidth="0.25" 
                cx="28" 
                cy="91.6" 
                r="0.25"
              />
            </g>
          ) : (
            // 데스크탑(가로형) 필드 레이아웃
            <g>
              {/* 잔디 패턴을 위한 동심원들 */}
              <circle cx="50" cy="28" r="58" fill="#3d9735"/>
              <circle cx="50" cy="28" r="54.375" fill="#3b9133"/>
              <circle cx="50" cy="28" r="50.75" fill="#3d9735"/>
              <circle cx="50" cy="28" r="47.125" fill="#3b9133"/>
              <circle cx="50" cy="28" r="43.5" fill="#3d9735"/>
              <circle cx="50" cy="28" r="39.875" fill="#3b9133"/>
              <circle cx="50" cy="28" r="36.25" fill="#3d9735"/>
              <circle cx="50" cy="28" r="32.625" fill="#3b9133"/>
              <circle cx="50" cy="28" r="29" fill="#3d9735"/>
              <circle cx="50" cy="28" r="25.375" fill="#3b9133"/>
              <circle cx="50" cy="28" r="21.75" fill="#3d9735"/>
              <circle cx="50" cy="28" r="18.125" fill="#3b9133"/>
              <circle cx="50" cy="28" r="14.5" fill="#3d9735"/>
              <circle cx="50" cy="28" r="10.875" fill="#3b9133"/>
              <circle cx="50" cy="28" r="7.25" fill="#3d9735"/>
              <circle cx="50" cy="28" r="3.625" fill="#3b9133"/>

              {/* 경기장 외곽선 */}
              <rect 
                stroke="white" 
                strokeLinecap="square"
                fill="transparent" 
                strokeWidth="0.25" 
                x="0" 
                y="0" 
                width="100" 
                height="56"
              />

              {/* 중앙선 */}
              <line
                stroke="white"
                strokeLinecap="square"
                strokeWidth="0.25"
                x1="50"
                y1="0"
                x2="50"
                y2="56"
              />

              {/* 센터 서클 */}
              <circle
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                cx="50" 
                cy="28" 
                r="7"
              />

              {/* 페널티 박스 (왼쪽) */}
              <path 
                stroke="white" 
                strokeLinecap="square"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M0 11.2 H11.8 V44.8 H0"
              />

              {/* 페널티 박스 (오른쪽) */}
              <path 
                stroke="white" 
                strokeLinecap="square"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M100 11.2 H88.2 V44.8 H100"
              />

              {/* 골 박스 (왼쪽) */}
              <path 
                stroke="white" 
                strokeLinecap="square"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M0 20 H5.6 V36 H0"
              />

              {/* 골 박스 (오른쪽) */}
              <path 
                stroke="white" 
                strokeLinecap="square"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M100 20 H94.4 V36 H100"
              />

              {/* 페널티 아크 (왼쪽) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M11.8 22 A7,7 0 0 1 11.8,34"
              />

              {/* 페널티 아크 (오른쪽) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M88.2 22 A7,7 0 0 0 88.2,34"
              />

              {/* 코너킥 아크 (왼쪽 상단) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M0 2 A2,2 0 0 0 2,0"
              />

              {/* 코너킥 아크 (오른쪽 상단) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M98 0 A2,2 0 0 0 100,2"
              />

              {/* 코너킥 아크 (왼쪽 하단) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M0 54 A2,2 0 0 1 2,56"
              />

              {/* 코너킥 아크 (오른쪽 하단) */}
              <path 
                stroke="white" 
                strokeLinecap="round"
                fill="transparent" 
                strokeWidth="0.25" 
                d="M98 56 A2,2 0 0 1 100,54"
              />

              {/* 센터 점 */}
              <circle 
                stroke="white" 
                strokeLinecap="round"
                fill="white" 
                strokeWidth="0.25" 
                cx="50" 
                cy="28" 
                r="0.25"
              />

              {/* 페널티 점 (왼쪽, 오른쪽) */}
              <circle 
                stroke="white" 
                strokeLinecap="round"
                fill="white" 
                strokeWidth="0.25" 
                cx="8.4" 
                cy="28" 
                r="0.25"
              />
              <circle
                stroke="white" 
                strokeLinecap="round"
                fill="white" 
                strokeWidth="0.25" 
                cx="91.6" 
                cy="28" 
                r="0.25"
              />
            </g>
          )}

          {/* Player 컴포넌트를 여기서 렌더링 */}
          <g className={styles.playersLayer}>
            {children}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default Field; 