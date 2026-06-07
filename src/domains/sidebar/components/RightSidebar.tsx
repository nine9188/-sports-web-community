import { getAllTopicPosts } from '../actions/getAllTopicPosts';
import { getHotdealBestPosts } from '../actions/getHotdealBestPosts';
import TopicTabsServer from './TopicTabsServer';
import HotdealTabsServer from './HotdealTabsServer';
import ServerLeagueStandings from './league/ServerLeagueStandings';
import KakaoAd from '@/shared/components/KakaoAd';
import { KAKAO } from '@/shared/constants/ad-constants';

export default async function RightSidebar() {
  try {
    const [topicData, hotdealData] = await Promise.all([
      getAllTopicPosts(20),
      getHotdealBestPosts(10, 3),
    ]);

    const postsData = {
      views: topicData.views,
      likes: topicData.likes,
      comments: topicData.comments,
      hot: topicData.hot,
      windowDays: topicData.windowDays,
    };

    return (
      <aside className="hidden xl:block w-[300px] shrink-0">
        <div className="h-full pt-4">
          <TopicTabsServer postsData={postsData} />
          <div className="my-4">
            {/* adsense-placeholder: former right-sidebar rectangle slot, 300x250. */}
            <KakaoAd adUnit={KAKAO.LEFT_SIDEBAR} adWidth={300} adHeight={250} />
          </div>
          <ServerLeagueStandings initialLeague="premier" />
          <HotdealTabsServer postsData={hotdealData} />
        </div>
      </aside>
    );
  } catch (error) {
    console.error('[RightSidebar ERROR]', error);

    const emptyData = {
      views: [],
      likes: [],
      comments: [],
      hot: [],
      windowDays: 1,
    };

    const emptyHotdealData = {
      hot: [],
      discount: [],
      likes: [],
      comments: [],
      windowDays: 3,
    };

    return (
      <aside className="hidden xl:block w-[300px] shrink-0">
        <div className="h-full pt-4">
          <TopicTabsServer postsData={emptyData} />
          <div className="my-4">
            {/* adsense-placeholder: former right-sidebar rectangle slot, 300x250. */}
            <KakaoAd adUnit={KAKAO.LEFT_SIDEBAR} adWidth={300} adHeight={250} />
          </div>
          <ServerLeagueStandings initialLeague="premier" />
          <HotdealTabsServer postsData={emptyHotdealData} />
        </div>
      </aside>
    );
  }
}
