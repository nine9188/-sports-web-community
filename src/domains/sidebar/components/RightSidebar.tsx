import { getCachedTopicPosts } from '../actions/topicPosts';
import { getHotPosts } from '../actions/getHotPosts';
import { getHotdealBestPosts } from '../actions/getHotdealBestPosts';
import { TopicTabsClient } from './TabsClient';
import { HotdealTabsClient } from './HotdealTabsClient';
import SidebarRelatedPosts from './SidebarRelatedPosts';

export default async function RightSidebar() {
  try {
    // 서버에서 데이터 가져오기 (병렬로 모든 탭 데이터 요청)
    const [viewsData, likesData, commentsData, hotData, hotdealData] = await Promise.all([
      getCachedTopicPosts('views'),
      getCachedTopicPosts('likes'),
      getCachedTopicPosts('comments'),
      getHotPosts({ limit: 20 }),
      getHotdealBestPosts(10, 3) // 10개, 최근 3일
    ]);

    // 모든 탭 데이터 구성 (hot 탭에 windowDays 포함)
    const postsData = {
      views: viewsData,
      likes: likesData,
      comments: commentsData,
      hot: hotData.posts,
      windowDays: hotData.windowDays
    };

    return (
      <aside className="hidden xl:block w-[300px] shrink-0">
        <div className="h-full pt-4">
          <TopicTabsClient postsData={postsData} />
          <SidebarRelatedPosts />
          <HotdealTabsClient postsData={hotdealData} />
        </div>
      </aside>
    );
  } catch {
    // 에러 발생 시 빈 데이터로 렌더링
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
          <TopicTabsClient postsData={emptyData} />
          <SidebarRelatedPosts />
          <HotdealTabsClient postsData={emptyHotdealData} />
        </div>
      </aside>
    );
  }
} 