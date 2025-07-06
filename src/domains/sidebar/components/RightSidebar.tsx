import { getCachedTopicPosts } from '../actions/topicPosts';
import { TopicTabsClient } from './TabsClient';

export default async function RightSidebar() {
  try {
    // 서버에서 데이터 가져오기 (병렬로 모든 탭 데이터 요청)
    const [viewsData, likesData, commentsData] = await Promise.all([
      getCachedTopicPosts('views'),
      getCachedTopicPosts('likes'),
      getCachedTopicPosts('comments')
    ]);

    // 모든 탭 데이터 구성
    const postsData = {
      views: viewsData,
      likes: likesData,
      comments: commentsData
    };
    
    return (
      <aside className="hidden xl:block w-[300px] shrink-0">
        <div className="h-full pt-4">
          <TopicTabsClient postsData={postsData} />
        </div>
      </aside>
    );
  } catch {
    // 에러 발생 시 빈 데이터로 렌더링
    const emptyData = {
      views: [],
      likes: [],
      comments: []
    };
    
    return (
      <aside className="hidden xl:block w-[300px] shrink-0">
        <div className="h-full pt-4">
          <TopicTabsClient postsData={emptyData} />
        </div>
      </aside>
    );
  }
} 