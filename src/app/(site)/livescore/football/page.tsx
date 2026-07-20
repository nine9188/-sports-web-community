import LiveScoreView from '@/domains/livescore/components/football/MainView/LiveScoreView';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { fetchMatchesByDate } from '@/domains/livescore/actions/footballApi';
import { countLiveMatches } from '@/domains/livescore/constants/match-status';
import { transformMatches } from '@/domains/livescore/utils/transformMatch';
import { buildMetadata } from '@/shared/utils/metadataNew';
import DaumWebmasterHints from '@/shared/components/DaumWebmasterHints';
import { siteConfig } from '@/shared/config';
import SeoSummaryCallout from '@/shared/components/SeoSummaryCallout';
import { buildLiveScoreMainSeoSummary } from '@/domains/livescore/utils/seoSummary';

export async function generateMetadata({
  searchParams: searchParamsPromise
}: {
  searchParams?: Promise<{ date?: string; filter?: string }>
}) {
  const searchParams = await searchParamsPromise;
  const dateParam = searchParams?.date;
  const filterParam = searchParams?.filter;
  const hasQueryState = Boolean(dateParam || filterParam);

  // LIVE 필터
  if (filterParam === 'live') {
    return buildMetadata({
      title: '진행 중인 축구 경기 라이브스코어',
      ogTitle: '실시간 축구 경기 스코어 - 4590',
      description: '지금 진행 중인 축구 경기와 라이브스코어, 실시간 경기 결과를 4590에서 확인하세요.',
      path: '/livescore/football',
      keywords: ['4590', '실시간 축구', '라이브스코어', '축구 경기결과', '4590football'],
      robots: { index: false, follow: true },
    });
  }

  // KST 기준 오늘 날짜
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayStr = nowKst.toISOString().split('T')[0];

  // 날짜 레이블 결정 (오늘/어제/내일/날짜)
  let dateLabel = '오늘';
  if (dateParam && dateParam !== todayStr) {
    const selected = new Date(dateParam + 'T00:00:00Z');
    const today = new Date(todayStr + 'T00:00:00Z');
    const diffDays = Math.round((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === -1) dateLabel = '어제';
    else if (diffDays === 1) dateLabel = '내일';
    else {
      const m = selected.getUTCMonth() + 1;
      const d = selected.getUTCDate();
      dateLabel = `${m}월 ${d}일`;
    }
  }

  return buildMetadata({
    title: hasQueryState ? `${dateLabel} 축구 일정·라이브스코어` : '실시간 축구 라이브스코어',
    ogTitle: '4590 라이브스코어',
    description: '전 세계 축구 경기의 실시간 스코어, 오늘 경기 일정 및 대진표를 4590에서 확인하세요.',
    path: dateParam ? `/livescore/football?date=${dateParam}` : '/livescore/football',
    keywords: ['4590', '축구 라이브스코어', '실시간 스코어', '오늘 축구 경기', '4590football'],
    ...(hasQueryState ? { robots: { index: false, follow: true } } : {}),
  });
}

// KST 기준의 현재 날짜(yyyy-MM-dd) 문자열 생성
const getKstDateString = (): string => {
  const nowUtc = new Date();
  const kstNow = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
  return kstNow.toISOString().split('T')[0];
};

// 서버 컴포넌트 - client query loading 패턴
export default async function FootballLiveScorePage({
  searchParams: searchParamsPromise
}: {
  searchParams?: Promise<{ date?: string; filter?: string }>
}) {
  const searchParams = await searchParamsPromise;
  const dateParam = searchParams?.date ?? getKstDateString();
  const initialShowLiveOnly = searchParams?.filter === 'live';
  const rawMatches = await fetchMatchesByDate(dateParam);
  const initialMatches = await transformMatches(rawMatches);
  const liveMatchCount = countLiveMatches(initialMatches);

  // KST 기준 오늘 날짜
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayStr = nowKst.toISOString().split('T')[0];

  // 날짜 레이블 결정 (오늘/어제/내일/날짜)
  let dateLabel = '오늘';
  if (dateParam && dateParam !== todayStr) {
    const selected = new Date(dateParam + 'T00:00:00Z');
    const today = new Date(todayStr + 'T00:00:00Z');
    const diffDays = Math.round((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === -1) dateLabel = '어제';
    else if (diffDays === 1) dateLabel = '내일';
    else {
      const m = selected.getUTCMonth() + 1;
      const d = selected.getUTCDate();
      dateLabel = `${m}월 ${d}일`;
    }
  }

  const seoSummary = buildLiveScoreMainSeoSummary(dateLabel, initialMatches.length, liveMatchCount);
  const pageUrl = `${siteConfig.url}/livescore/football`;

  return (
    <>
      <TrackPageVisit id="livescore" slug="livescore/football" name="라이브스코어" />
      <h1 className="sr-only">오늘 축구 일정·라이브스코어·경기 결과 - 4590 Football</h1>
      <DaumWebmasterHints
        title="오늘 축구 일정·라이브스코어·경기 결과"
        content={`${dateParam} 축구 일정, 라이브스코어와 경기 결과를 4590 Football에서 확인하세요. 현재 진행 중인 라이브 경기는 ${liveMatchCount}개입니다.`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: '오늘 축구 일정·라이브스코어·경기 결과 - 4590 Football',
            description: '오늘 축구 일정, 라이브스코어와 경기 결과를 4590 Football에서 확인하세요. EPL, 라리가, 세리에A, 분데스리가, 챔피언스리그, K리그 라이브스코어.',
            url: pageUrl,
            isPartOf: { '@id': `${siteConfig.url}#website` },
            publisher: { '@id': `${siteConfig.url}#organization` },
          }),
        }}
      />
      <LiveScoreView
          key={`${dateParam}-${initialShowLiveOnly ? 'live' : 'all'}`}
          initialDate={dateParam}
          initialShowLiveOnly={initialShowLiveOnly}
          initialMatches={initialMatches}
          initialLiveMatchCount={liveMatchCount}
        />
      {seoSummary && (
        <div className="mt-4">
          <SeoSummaryCallout summary={seoSummary} />
        </div>
      )}
    </>
  );
}
