import { GoalValue, CardData } from '@/domains/livescore/types/stats';

/**
 * 시간대별 골 데이터에서 최대값을 찾는 함수
 */
export function findMaxGoalValue(goalMinutes: Record<string, GoalValue> = {}): number {
  const values = Object.entries(goalMinutes)
    .filter(([key]) => key !== '106-120' && key !== '')
    .map(([, data]) => data.total || 0);
  
  return Math.max(...values, 1); // 0으로 나누기 방지를 위해 최소값은 1
}

/**
 * 득점/실점 백분율을 계산하는 함수
 */
export function calculateGoalPercentage(
  value: number,
  maxValue: number
): number {
  return (value / maxValue) * 100;
}

/**
 * 시간대별 카드 데이터에서 최대값을 찾는 함수
 */
export function findMaxCardValue(cardMinutes: Record<string, CardData> = {}): number {
  const values = Object.entries(cardMinutes)
    .filter(([key]) => key !== '106-120' && key !== '' && key)
    .map(([, data]) => data.total);
  
  return Math.max(...values, 1); // 0으로 나누기 방지를 위해 최소값은 1
}

/**
 * 카드 비율을 계산하는 함수
 */
export function calculateCardPercentage(
  cardCount: number,
  maxCards: number
): number {
  return (cardCount / maxCards) * 100;
}

/**
 * 유효한 시간대 필터링 함수
 */
export function filterValidTimeRanges<T>(data: Record<string, T> = {}): Array<[string, T]> {
  return Object.entries(data)
    .filter(([key]) => key !== '106-120' && key !== '' && key);
} 