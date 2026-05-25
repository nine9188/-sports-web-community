import LiveScoreView from '@/domains/livescore/components/football/MainView/LiveScoreView';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { fetchMatchesByDate } from '@/domains/livescore/actions/footballApi';
import { countLiveMatches } from '@/domains/livescore/constants/match-status';
import { transformMatches } from '@/domains/livescore/utils/transformMatch';
import { buildMetadata } from '@/shared/utils/metadataNew';
import DaumWebmasterHints from '@/shared/components/DaumWebmasterHints';
import { siteConfig } from '@/shared/config';

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
      title: '실시간 축구 경기 - 라이브스코어',
      description: '지금 진행 중인 축구 경기를 실시간으로 확인하세요. EPL, 라리가, 세리에A, 분데스리가, 챔피언스리그, K리그 실시간 스코어.',
      path: '/livescore/football',
      keywords: [
        '실시간 축구', '실시간 경기', '라이브 축구', '축구 라이브',
        '실시간 스코어', '라이브스코어', '진행중 축구 경기',
        'EPL 실시간', '챔피언스리그 실시간', 'K리그 실시간',
      ],
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
    title: `${dateLabel} 축구 라이브스코어 - 실시간 경기결과`,
    description: `${dateLabel} 축구 경기결과와 일정을 실시간으로 확인하세요. 어제 축구 스코어, 오늘 축구 경기결과, 내일 경기 일정. EPL, 라리가, 세리에A, 분데스리가, 챔피언스리그, K리그 라이브스코어.`,
    path: dateParam ? `/livescore/football?date=${dateParam}` : '/livescore/football',
    keywords: [
      '라이브스코어', '축구 라이브스코어', '실시간 스코어', '축구 스코어',
      '오늘 축구 경기', '오늘 축구 경기결과', '오늘 축구 스코어',
      '어제 축구 경기결과', '어제 축구 스코어', '어제 해외축구',
      '축구 경기결과', '해외축구 결과', '축구 점수',
      'EPL 경기결과', '프리미어리그 결과', '라리가 경기결과',
      '챔피언스리그 결과', 'K리그 경기결과', '분데스리가 결과',
      '축구 경기 일정', '오늘 프리미어리그', '실시간 축구 결과',
    ],
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

  const pageUrl = `${siteConfig.url}/livescore/football`;

  return (
    <>
      <TrackPageVisit id="livescore" slug="livescore/football" name="라이브스코어" />
      <h1 className="sr-only">오늘 축구 라이브스코어 - 실시간 경기결과</h1>
      <DaumWebmasterHints
        title="축구 라이브스코어 - 실시간 경기 결과"
        content={`${dateParam} 축구 경기 일정, 실시간 스코어, 경기 결과를 확인하세요. 현재 진행 중인 라이브 경기는 ${liveMatchCount}개입니다.`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: '오늘 축구 라이브스코어 - 실시간 경기결과',
            description: '오늘 축구 경기결과와 어제 축구 스코어, 내일 경기 일정을 실시간으로 확인하세요. EPL, 라리가, 세리에A, 분데스리가, 챔피언스리그, K리그 라이브스코어.',
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
    </>
  );
}
