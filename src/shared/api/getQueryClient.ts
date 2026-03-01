import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

/**
 * 서버 컴포넌트용 QueryClient 팩토리
 *
 * - React cache()로 래핑 → 같은 렌더 사이클 내 싱글턴
 * - 클라이언트 QueryClient(RootLayoutProvider)와 별개
 * - HydrationBoundary + prefetchQuery 패턴에서 사용
 *
 * @see docs/livescore/architecture.md §6
 */
const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 서버: 60초 (Next.js revalidate과 맞춤)
        },
      },
    })
);

export default getQueryClient;
