import { getAllTopicPosts } from '../actions/getAllTopicPosts';
import { getHotdealBestPosts } from '../actions/getHotdealBestPosts';
import TopicTabsServer from './TopicTabsServer';
import HotdealTabsServer from './HotdealTabsServer';
import ServerLeagueStandings from './league/ServerLeagueStandings';
import ResponsiveKakaoAd from '@/shared/components/ResponsiveKakaoAd';
import { KAKAO } from '@/shared/constants/ad-constants';
import WorldCupSidebarCard from './WorldCupSidebarCard';
import { fetchWorldCupSidebarMatches } from '@/domains/livescore/actions/footballApi';

export default async function RightSidebar() {
  try {
    const [topicData, hotdealData, worldCupSidebarMatches] = await Promise.all([
      getAllTopicPosts(20),
      getHotdealBestPosts(10, 3),
      fetchWorldCupSidebarMatches(),
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
          <div className="mb-4">
            <WorldCupSidebarCard matches={worldCupSidebarMatches} />
          </div>
          <TopicTabsServer postsData={postsData} />
          <div className="my-4">
            {/* adsense-placeholder: former right-sidebar rectangle slot, 300x250. */}
            <ResponsiveKakaoAd adUnit={KAKAO.RIGHT_SIDEBAR} adWidth={300} adHeight={250} minWidth={1280} />
          </div>
          <ServerLeagueStandings initialLeague="worldcup" />
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
          <div className="mb-4">
            <WorldCupSidebarCard />
          </div>
          <TopicTabsServer postsData={emptyData} />
          <div className="my-4">
            {/* adsense-placeholder: former right-sidebar rectangle slot, 300x250. */}
            <ResponsiveKakaoAd adUnit={KAKAO.RIGHT_SIDEBAR} adWidth={300} adHeight={250} minWidth={1280} />
          </div>
          <ServerLeagueStandings initialLeague="worldcup" />
          <HotdealTabsServer postsData={emptyHotdealData} />
        </div>
      </aside>
    );
  }
}
