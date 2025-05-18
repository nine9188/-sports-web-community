import AllPostsWidget from '@/domains/widgets/components/AllPostsWidget'
import LiveScoreWidget from './components/widgets/live-score-widget';
import NewsWidget from './components/widgets/news-widget';
import YouTubeWidget from './components/widgets/youtube-widget/index';
import NavBoardSelector from './components/navigation/NavBoardSelector';
import { fetchCachedMultiDayMatches, MatchData } from './actions/footballApi';

// API 응답 타입 정의
interface MultiDayMatchesResult {
  success: boolean;
  dates?: {
    yesterday: string;
    today: string;
    tomorrow: string;
  };
  meta?: {
    totalMatches: number;
  };
  data?: {
    yesterday: { matches: MatchData[] };
    today: { matches: MatchData[] };
    tomorrow: { matches: MatchData[] };
  };
  error?: string;
}

export const revalidate = 60; // 1분마다 데이터 갱신
export const dynamic = 'force-dynamic'; // 항상 동적으로 렌더링

// 서버 컴포넌트에서 경기 데이터 가져오기
async function fetchLiveScores(): Promise<MatchData[]> {
  try {
    // 서버 액션을 사용하여 경기 데이터 가져오기
    const result = await fetchCachedMultiDayMatches() as MultiDayMatchesResult;
    
    if (result.success && result.data) {
      // 어제, 오늘, 내일 경기 데이터 모두 합치기
      const allMatches = [
        ...((result.data.yesterday?.matches || []).map((match: MatchData) => ({
          ...match,
          displayDate: '어제'
        }))),
        ...((result.data.today?.matches || []).map((match: MatchData) => ({
          ...match,
          displayDate: '오늘'
        }))),
        ...((result.data.tomorrow?.matches || []).map((match: MatchData) => ({
          ...match,
          displayDate: '내일'
        })))
      ];
      
      return allMatches;
    }
    
    return [];
  } catch (error) {
    console.error('라이브스코어 데이터 가져오기 오류:', error);
    return [];
  }
}

export default async function HomePage() {
  try {
    // 경기 데이터 가져오기
    const initialMatches = await fetchLiveScores();
    
    return (
      <main>
        <div className="mb-4 hidden md:block">
          <NavBoardSelector />
        </div>
        <LiveScoreWidget initialMatches={initialMatches} />
        <AllPostsWidget />
        <NewsWidget />
        <YouTubeWidget boardSlug="kbs-sports" />
      </main>
    );
  } catch (error) {
    console.error('홈페이지 로드 오류:', error);
    // 오류 발생 시 폴백 UI 렌더링
    return (
      <main>
        <div className="mb-4 hidden md:block">
          <NavBoardSelector />
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg mb-4 p-4">
          <p className="text-yellow-700">데이터를 불러오는 중 문제가 발생했습니다. 곧 해결될 예정입니다.</p>
        </div>
        <LiveScoreWidget initialMatches={[]} />
        <AllPostsWidget />
        <NewsWidget />
        <YouTubeWidget boardSlug="kbs-sports" />
      </main>
    );
  }
}