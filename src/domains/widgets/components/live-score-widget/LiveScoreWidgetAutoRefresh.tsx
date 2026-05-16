'use client';

import { useRouter } from 'next/navigation';
import { useVisibilityActivityRefresh } from '@/shared/hooks/useVisibilityActivityRefresh';

interface LiveScoreWidgetAutoRefreshProps {
  enabled: boolean;
}

export default function LiveScoreWidgetAutoRefresh({ enabled }: LiveScoreWidgetAutoRefreshProps) {
  const router = useRouter();

  useVisibilityActivityRefresh({
    enabled,
    intervalMs: 120_000,
    onRefresh: () => router.refresh(),
  });

  return null;
}
