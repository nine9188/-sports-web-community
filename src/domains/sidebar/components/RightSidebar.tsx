import { Suspense } from 'react';
import { getAllTopicPosts } from '../actions/getAllTopicPosts';
import { getHotdealBestPosts } from '../actions/getHotdealBestPosts';
import TopicTabsServer from './TopicTabsServer';
import HotdealTabsServer from './HotdealTabsServer';
import SidebarRelatedPosts from './SidebarRelatedPosts';
import ServerLeagueStandings from './league/ServerLeagueStandings';

export default async function RightSidebar() {
  try {
    // 서버에서 데이터 가져오기
    // 최적화: views, likes, comments, hot을 한 번의 쿼리로 통합
    const [topicData, hotdealData] = await Promise.all([
      getAllTopicPosts(20),
      getHotdealBestPosts(10, 3) // 10개, 최근 3일
    ]);

    // 모든 탭 데이터 구성
    const postsData = {
      views: topicData.views,
      likes: topicData.likes,
      comments: topicData.comments,
      hot: topicData.hot,
      windowDays: topicData.windowDays
    };

    return (
      <aside className="hidden xl:block w-[300px] shrink-0">
        <div className="h-full pt-4">
          <TopicTabsServer postsData={postsData} />
          <Suspense fallback={<div className="min-h-[200px]" />}>
            <ServerLeagueStandings initialLeague="premier" />
          </Suspense>
          <SidebarRelatedPosts />
          <HotdealTabsServer postsData={hotdealData} />
        </div>
      </aside>
    );
  } catch (error) {
    // 에러 발생 시 빈 데이터로 렌더링
    console.error('[RightSidebar ERROR]', error);
    const emptyData = {
      views: [],
      likes: [],
      comments: [],
      hot: [],
      windowDays: 1
    };

    const emptyHotdealData = {
      hot: [],
      discount: [],
      likes: [],
      comments: [],
      windowDays: 3
    };

    return (
      <aside className="hidden xl:block w-[300px] shrink-0">
        <div className="h-full pt-4">
          <TopicTabsServer postsData={emptyData} />
          <Suspense fallback={<div className="min-h-[200px]" />}>
            <ServerLeagueStandings initialLeague="premier" />
          </Suspense>
          <SidebarRelatedPosts />
          <HotdealTabsServer postsData={emptyHotdealData} />
        </div>
      </aside>
    );
  }
} 