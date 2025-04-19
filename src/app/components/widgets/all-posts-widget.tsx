import { fetchPosts } from '@/app/actions/posts';
import { CardTitle } from '@/app/ui/card';
import PostList from '@/app/components/post/PostList';

// 서버 컴포넌트로 변경 - 직접 데이터 로드
export default async function AllPostsWidget() {
  // fetchPosts 서버 액션을 사용하여 데이터 직접 가져오기
  const postsData = await fetchPosts({
    limit: 10,
    page: 1,
    // 모든 게시판에서 최신글을 가져오기 위해 boardIds: ['all'] 설정
    boardIds: ['all']
  });

  // 헤더 컨텐츠 렌더링
  const headerContent = (
    <CardTitle className="text-lg">최신 게시글</CardTitle>
  );

  return (
    <div className="h-full">
      <PostList
        posts={postsData.data}
        loading={false} // 로딩 상태는 항상 false (서버 컴포넌트에서 데이터 로드 완료 후 렌더링)
        emptyMessage="게시글이 없습니다."
        headerContent={headerContent}
        showBoard={true}
        maxHeight="500px"
        currentBoardId="root" // 또는 적절한 기본값 설정
      />
    </div>
  );
} 