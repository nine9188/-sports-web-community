import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import getQueryClient from '@/shared/api/getQueryClient';
import { liveScoreKeys } from '@/shared/constants/queryKeys';
import { fetchMatchesByDateCached } from '@/domains/livescore/actions/footballApi';
import { transformMatches } from '@/domains/livescore/utils/transformMatch';
import LiveScoreView from '@/domains/livescore/components/football/MainView/LiveScoreView';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { buildMetadata } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return buildMetadata({
    title: '라이브스코어',
    description: '실시간 축구 경기 결과와 일정을 확인하세요. 전 세계 주요 리그 경기를 한눈에.',
    path: '/livescore/football',
  });
}

// KST 기준의 현재 날짜(yyyy-MM-dd) 문자열 생성
const getKstDateString = (): string => {
  const nowUtc = new Date();
  const kstNow = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
  return kstNow.toISOString().split('T')[0];
};

// 날짜에서 어제/내일 계산
const getAdjacentDates = (dateStr: string) => {
  const currentDate = new Date(dateStr + 'T00:00:00Z');

  const yesterday = new Date(currentDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const tomorrow = new Date(currentDate);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return { yesterdayStr, tomorrowStr };
};

// 서버 컴포넌트 - HydrationBoundary + prefetchQuery 패턴
export default async function FootballLiveScorePage({
  searchParams: searchParamsPromise
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const searchParams = await searchParamsPromise;
  const dateParam = searchParams?.date ?? getKstDateString();
  const { yesterdayStr, tomorrowStr } = getAdjacentDates(dateParam);

  const queryClient = getQueryClient();

  // 3일치 prefetch (병렬) — prefetchQuery는 에러를 throw하지 않음
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: liveScoreKeys.matches(yesterdayStr),
      queryFn: async () => transformMatches(await fetchMatchesByDateCached(yesterdayStr)),
    }),
    queryClient.prefetchQuery({
      queryKey: liveScoreKeys.matches(dateParam),
      queryFn: async () => transformMatches(await fetchMatchesByDateCached(dateParam)),
    }),
    queryClient.prefetchQuery({
      queryKey: liveScoreKeys.matches(tomorrowStr),
      queryFn: async () => transformMatches(await fetchMatchesByDateCached(tomorrowStr)),
    }),
  ]);

  return (
    <>
      <TrackPageVisit id="livescore" slug="livescore/football" name="라이브스코어" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <LiveScoreView initialDate={dateParam} />
      </HydrationBoundary>
    </>
  );
}
