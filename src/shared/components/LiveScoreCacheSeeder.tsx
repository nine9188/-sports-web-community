'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { liveScoreKeys } from '@/shared/constants/queryKeys';
import type { MultiDayMatchesResult } from '@/domains/livescore/actions/footballApi';

/**
 * 서버 데이터 → React Query 캐시 주입 (1회만 실행)
 *
 * HeaderClient와 LiveScoreModal은 layout에 있어서
 * page.tsx에서 props를 직접 전달할 수 없음.
 * 이 컴포넌트가 SSR 데이터를 React Query 캐시에 넣어주면
 * 같은 queryKey를 사용하는 hook들이 캐시에서 꺼내 씀.
 */
export default function LiveScoreCacheSeeder({ data }: { data: MultiDayMatchesResult }) {
  const queryClient = useQueryClient();
  const seeded = useRef(false);

  if (!seeded.current && data) {
    queryClient.setQueryData(liveScoreKeys.multiDay(), data);
    seeded.current = true;
  }

  return null;
}
