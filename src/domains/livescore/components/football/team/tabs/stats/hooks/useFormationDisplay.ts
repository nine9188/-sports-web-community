'use client';

import { useState, useMemo } from 'react';
import { LineupData } from '@/domains/livescore/types/stats';

export function useFormationDisplay(lineups?: LineupData[]) {
  // 포메이션 표시 관련 상태
  const [showAllFormations, setShowAllFormations] = useState(false);
  
  // 정렬된 포메이션 데이터 계산
  const sortedFormations = useMemo(() => {
    if (!lineups || lineups.length === 0) {
      return [];
    }
    
    // 사용 빈도순으로 정렬
    return [...lineups].sort((a, b) => b.played - a.played);
  }, [lineups]);
  
  // 표시할 포메이션 수 계산
  const visibleFormations = useMemo(() => {
    return showAllFormations ? sortedFormations : sortedFormations.slice(0, 5);
  }, [sortedFormations, showAllFormations]);
  
  // 포메이션 토글 함수
  const toggleFormations = () => {
    setShowAllFormations(prev => !prev);
  };
  
  return {
    showAllFormations,
    sortedFormations,
    visibleFormations,
    toggleFormations
  };
} 