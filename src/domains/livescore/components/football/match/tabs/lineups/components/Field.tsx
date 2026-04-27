'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/formation.module.css';

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

interface FieldProps {
  isMobile?: boolean;
  children?: React.ReactNode;
  captureRef?: React.RefObject<HTMLDivElement>;
}

const Field = ({ isMobile: isMobileProp, children, captureRef }: FieldProps) => {
  const isMobileCalculated = useMediaQuery('(max-width: 768px)');
  const isMobile = isMobileProp ?? isMobileCalculated;

  // 모바일: 56×100 (9:16), 데스크탑: 100×67 (≈3:2)
  // 데스크탑 y좌표는 기존 56 기준에서 67 기준으로 비율 스케일 (×1.196)
  const viewBox = isMobile ? "0 0 56 100" : "0 0 100 67";

  return (
    <div
      ref={captureRef}
      className={styles.fieldWrapper}
      style={{
        overflow: 'hidden',
        aspectRatio: isMobile ? '9/16' : '100/67',
      }}
    >
      <div className={styles.fieldContent} style={{ overflow: 'hidden' }}>
        <svg
          viewBox={viewBox}
          className={styles.fieldSvg}
          preserveAspectRatio="xMidYMid meet"
        >
          {isMobile ? (
            // ── 모바일 (56×100) — 기존 좌표 그대로 ──
            <g>
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

              <rect stroke="white" strokeLinecap="square" fill="transparent"
                strokeWidth="0.4" vectorEffect="non-scaling-stroke"
                x="0.2" y="0.2" width="55.6" height="99.6" />

              <line stroke="white" strokeLinecap="square" strokeWidth="0.25"
                x1="0" y1="50" x2="56" y2="50" />

              <circle stroke="white" fill="transparent" strokeWidth="0.25"
                cx="28" cy="50" r="7" />

              <path stroke="white" strokeLinecap="square" fill="transparent"
                strokeWidth="0.25" d="M11.2 0 V11.8 H44.8 V0" />
              <path stroke="white" strokeLinecap="square" fill="transparent"
                strokeWidth="0.25" d="M11.2 100 V88.2 H44.8 V100" />

              <path stroke="white" strokeLinecap="square" fill="transparent"
                strokeWidth="0.25" d="M20 0 V5.6 H36 V0" />
              <path stroke="white" strokeLinecap="square" fill="transparent"
                strokeWidth="0.25" d="M20 100 V94.4 H36 V100" />

              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M22 11.8 A7,7 0 0 0 34,11.8" />
              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M22 88.2 A7,7 0 0 1 34,88.2" />

              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M2 0 A2,2 0 0 1 0,2" />
              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M54 0 A2,2 0 0 0 56,2" />
              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M2 100 A2,2 0 0 0 0,98" />
              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M54 100 A2,2 0 0 1 56,98" />

              <circle stroke="white" fill="white" strokeWidth="0.25" cx="28" cy="50" r="0.25" />
              <circle stroke="white" fill="white" strokeWidth="0.25" cx="28" cy="8.4" r="0.25" />
              <circle stroke="white" fill="white" strokeWidth="0.25" cx="28" cy="91.6" r="0.25" />
            </g>
          ) : (
            // ── 데스크탑 (100×67) — y좌표 × (67/56 ≈ 1.196) 스케일 ──
            // 중심: cy 28→33.5 / 하단: 56→67 / 페널티 박스: 11.2→13.4, 44.8→53.6
            <g>
              <circle cx="50" cy="33.5" r="58" fill="#3d9735"/>
              <circle cx="50" cy="33.5" r="54.375" fill="#3b9133"/>
              <circle cx="50" cy="33.5" r="50.75" fill="#3d9735"/>
              <circle cx="50" cy="33.5" r="47.125" fill="#3b9133"/>
              <circle cx="50" cy="33.5" r="43.5" fill="#3d9735"/>
              <circle cx="50" cy="33.5" r="39.875" fill="#3b9133"/>
              <circle cx="50" cy="33.5" r="36.25" fill="#3d9735"/>
              <circle cx="50" cy="33.5" r="32.625" fill="#3b9133"/>
              <circle cx="50" cy="33.5" r="29" fill="#3d9735"/>
              <circle cx="50" cy="33.5" r="25.375" fill="#3b9133"/>
              <circle cx="50" cy="33.5" r="21.75" fill="#3d9735"/>
              <circle cx="50" cy="33.5" r="18.125" fill="#3b9133"/>
              <circle cx="50" cy="33.5" r="14.5" fill="#3d9735"/>
              <circle cx="50" cy="33.5" r="10.875" fill="#3b9133"/>
              <circle cx="50" cy="33.5" r="7.25" fill="#3d9735"/>
              <circle cx="50" cy="33.5" r="3.625" fill="#3b9133"/>

              {/* 외곽선: height 55.6→66.6 */}
              <rect stroke="white" strokeLinecap="square" fill="transparent"
                strokeWidth="0.4" vectorEffect="non-scaling-stroke"
                x="0.2" y="0.2" width="99.6" height="66.6" />

              {/* 중앙선: y 0→67 */}
              <line stroke="white" strokeLinecap="square" strokeWidth="0.25"
                x1="50" y1="0" x2="50" y2="67" />

              {/* 센터 서클: cy 28→33.5 */}
              <circle stroke="white" fill="transparent" strokeWidth="0.25"
                cx="50" cy="33.5" r="7" />

              {/* 페널티 박스: y 11.2→13.4, 44.8→53.6 */}
              <path stroke="white" strokeLinecap="square" fill="transparent"
                strokeWidth="0.25" d="M0 13.4 H11.8 V53.6 H0" />
              <path stroke="white" strokeLinecap="square" fill="transparent"
                strokeWidth="0.25" d="M100 13.4 H88.2 V53.6 H100" />

              {/* 골 박스: y 20→23.9, 36→43.1 */}
              <path stroke="white" strokeLinecap="square" fill="transparent"
                strokeWidth="0.25" d="M0 23.9 H5.6 V43.1 H0" />
              <path stroke="white" strokeLinecap="square" fill="transparent"
                strokeWidth="0.25" d="M100 23.9 H94.4 V43.1 H100" />

              {/* 페널티 아크: y 22→26.3, 34→40.7 / ry 7→8.37 */}
              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M11.8 26.3 A7,8.37 0 0 1 11.8,40.7" />
              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M88.2 26.3 A7,8.37 0 0 0 88.2,40.7" />

              {/* 코너킥 아크: y 2→2.4, 54→64.6, 56→67 / ry 2→2.4 */}
              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M0 2.4 A2,2.4 0 0 0 2,0" />
              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M98 0 A2,2.4 0 0 0 100,2.4" />
              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M0 64.6 A2,2.4 0 0 1 2,67" />
              <path stroke="white" strokeLinecap="round" fill="transparent"
                strokeWidth="0.25" d="M98 67 A2,2.4 0 0 1 100,64.6" />

              {/* 센터 점 / 페널티 점: cy 28→33.5 */}
              <circle stroke="white" fill="white" strokeWidth="0.25" cx="50" cy="33.5" r="0.25" />
              <circle stroke="white" fill="white" strokeWidth="0.25" cx="8.4" cy="33.5" r="0.25" />
              <circle stroke="white" fill="white" strokeWidth="0.25" cx="91.6" cy="33.5" r="0.25" />
            </g>
          )}

          <g className={styles.playersLayer}>
            {children}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default Field;
