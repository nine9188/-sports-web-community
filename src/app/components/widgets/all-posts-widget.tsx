'use client';

import { CardTitle } from '@/app/ui/card';
import PostList from '@/app/components/post/PostList';

// 결합된 게시글 타입 정의
interface CombinedPost {
  id: string;
  title: string;
  created_at: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  author_nickname: string;
  author_id: string;
  views: number;
  likes: number;
  comment_count: number;
  content: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
}

interface AllPostsWidgetProps {
  initialPosts: CombinedPost[];
}

export default function AllPostsWidget({ initialPosts }: AllPostsWidgetProps) {
  // 헤더 컨텐츠 렌더링
  const headerContent = (
    <CardTitle className="text-lg">최신 게시글</CardTitle>
  );

  return (
    <div className="h-full">
      <PostList
        posts={initialPosts}
        loading={false} // 로딩 상태는 항상 false
        emptyMessage="게시글이 없습니다."
        headerContent={headerContent}
        showBoard={true}
        maxHeight="500px"
        currentBoardId="boards" // 또는 적절한 기본값 설정
      />
    </div>
  );
} 