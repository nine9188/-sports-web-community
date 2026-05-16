'use client';

import { useRouter } from 'next/navigation';
import { useVisibilityActivityRefresh } from '@/shared/hooks/useVisibilityActivityRefresh';

const LIVE_STATUS_CODES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP']);
const PENDING_STATUS_CODES = new Set(['NS', 'TBD']);

interface MatchAutoRefreshProps {
  statusCode?: string;
  startDate?: string;
}

function shouldAutoRefresh(statusCode?: string, startDate?: string): boolean {
  if (statusCode && LIVE_STATUS_CODES.has(statusCode)) return true;

  if (!statusCode || !PENDING_STATUS_CODES.has(statusCode) || !startDate) {
    return false;
  }

  const startTime = new Date(startDate).getTime();
  if (Number.isNaN(startTime)) return false;

  const now = Date.now();
  const fiveMinutesBeforeKickoff = startTime - 5 * 60 * 1000;
  const threeHoursAfterKickoff = startTime + 3 * 60 * 60 * 1000;

  return now >= fiveMinutesBeforeKickoff && now <= threeHoursAfterKickoff;
}

export default function MatchAutoRefresh({ statusCode, startDate }: MatchAutoRefreshProps) {
  const router = useRouter();
  const enabled = shouldAutoRefresh(statusCode, startDate);

  useVisibilityActivityRefresh({
    enabled,
    intervalMs: 30_000,
    onRefresh: () => router.refresh(),
  });

  return null;
}
