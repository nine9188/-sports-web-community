'use client';

import { useMemo } from 'react';
import { CardData, TeamStatsData } from '@/domains/livescore/types/stats';
import { findMaxCardValue, calculateCardPercentage } from '../utils/chartUtils';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui/container';

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

  // 최대 카드 수 계산 (둘 중 큰 값 사용)
  const maxCards = useMemo(() => {
    const maxYellow = findMaxCardValue(yellowCards);
    const maxRed = findMaxCardValue(redCards);
    return Math.max(maxYellow, maxRed);
  }, [yellowCards, redCards]);

  // 시간대 레이블 정의
  const timeRanges = [
    '0-15', '16-30', '31-45', '46-60', '61-75', '76-90', '91-105', '106-120'
  ];

  // 바 퍼센트 계산
  const getBarPercentage = (value: CardData | undefined) => {
    if (!value) return 0;
    return calculateCardPercentage(value.total, maxCards);
  };

  const getCardValue = (value: CardData | undefined) => {
    return value?.total || 0;
  };

  // 카드 데이터가 없는 경우 표시하지 않음
  if (Object.keys(yellowCards).length === 0 && Object.keys(redCards).length === 0) {
    return null;
  }

  return (
    <Container className="mb-4">
      <ContainerHeader>
        <ContainerTitle>시간대별 경고/퇴장</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="!p-0">
        {/* 소제목 */}
        <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
          <div className="flex-1 py-2 px-4 text-right text-[10px] font-medium text-gray-500 dark:text-gray-400">
            옐로카드
          </div>
          <div className="w-16 py-2 px-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">
            시간대
          </div>
          <div className="flex-1 py-2 px-4 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400">
            레드카드
          </div>
        </div>
        {/* 데이터 행들 */}
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {timeRanges.map((range) => {
            const yellowValue = yellowCards[range];
            const redValue = redCards[range];
            const yellowPercent = getBarPercentage(yellowValue);
            const redPercent = getBarPercentage(redValue);
            const yellowCount = getCardValue(yellowValue);
            const redCount = getCardValue(redValue);

            return (
              <div key={range} className="flex items-center h-10">
                {/* 옐로카드 바 (오른쪽에서 왼쪽으로) */}
                <div className="flex-1 flex items-center justify-end px-2 gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{yellowCount}</span>
                  <div className="flex-1 flex justify-end">
                    <div
                      className="h-5 bg-yellow-100 dark:bg-yellow-800/50 rounded-l"
                      style={{ width: `${yellowPercent}%` }}
                    />
                  </div>
                </div>

                {/* 시간대 (중앙) */}
                <div className="w-16 text-center text-xs font-medium text-gray-700 dark:text-gray-300 flex-shrink-0 border-x border-black/5 dark:border-white/10">
                  {range}분
                </div>

                {/* 레드카드 바 (왼쪽에서 오른쪽으로) */}
                <div className="flex-1 flex items-center px-2 gap-2">
                  <div className="flex-1 flex justify-start">
                    <div
                      className="h-5 bg-red-100 dark:bg-red-800/50 rounded-r"
                      style={{ width: `${redPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{redCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ContainerContent>
    </Container>
  );
}
