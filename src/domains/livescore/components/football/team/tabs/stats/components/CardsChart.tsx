'use client';

import { useMemo } from 'react';
import { CardData, TeamStatsData } from '@/domains/livescore/types/stats';
import { findMaxCardValue, calculateCardPercentage } from '../utils/chartUtils';

interface CardsChartProps {
  stats: TeamStatsData;
}

export default function CardsChart({ stats }: CardsChartProps) {
  // 카드 데이터
  const yellowCards = useMemo(() => {
    return stats.cards?.yellow || {};
  }, [stats.cards]);

  const redCards = useMemo(() => {
    return stats.cards?.red || {};
  }, [stats.cards]);

  // 최대 카드 수 계산
  const maxYellowCards = useMemo(() => findMaxCardValue(yellowCards), [yellowCards]);
  const maxRedCards = useMemo(() => findMaxCardValue(redCards), [redCards]);

  // 시간대 레이블 정의
  const timeRanges = [
    '0-15', '16-30', '31-45', '46-60', '61-75', '76-90', '91-105', '106-120'
  ];

  // 차트 바 렌더링 함수
  const renderBar = (value: CardData | undefined, maxValue: number, type: 'yellow' | 'red') => {
    if (!value) return null;
    
    const percentage = calculateCardPercentage(value.total, maxValue);
    
    return (
      <div className="flex items-center">
        <div 
          className={`h-5 ${type === 'yellow' ? 'bg-yellow-200' : 'bg-red-200'} rounded`}
          style={{ width: `${percentage}%` }}
        />
        <span className={`ml-2 text-xs ${type === 'yellow' ? 'text-yellow-700' : 'text-red-700'}`}>
          {value.total} ({value.percentage || '0%'})
        </span>
      </div>
    );
  };

  // 카드 데이터가 없는 경우 표시하지 않음
  if (Object.keys(yellowCards).length === 0 && Object.keys(redCards).length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden mb-4">
      <h3 className="text-sm font-medium p-3 border-b border-gray-200">시간대별 경고/퇴장</h3>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-8">
          {/* 옐로 카드 */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-yellow-700">옐로 카드</h4>
            <div className="space-y-4">
              {timeRanges.map((range) => (
                <div key={`yellow-${range}`} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">{range}분</span>
                  </div>
                  {renderBar(yellowCards[range], maxYellowCards, 'yellow')}
                </div>
              ))}
            </div>
          </div>

          {/* 레드 카드 */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-red-700">레드 카드</h4>
            <div className="space-y-4">
              {timeRanges.map((range) => (
                <div key={`red-${range}`} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">{range}분</span>
                  </div>
                  {renderBar(redCards[range], maxRedCards, 'red')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 