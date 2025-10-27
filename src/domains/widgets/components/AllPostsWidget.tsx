import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { fetchPosts } from '@/domains/boards/actions';
import { CardTitle } from '@/shared/ui/card';
import PostList from '@/domains/boards/components/post/PostList';

// 서버 컴포넌트로 변경 - 직접 데이터 로드
export default async function AllPostsWidget() {
  try {
    // fetchPosts 서버 액션을 사용하여 데이터 직접 가져오기
    const postsData = await fetchPosts({
      limit: 10,
      page: 1
      // boardIds를 지정하지 않으면 모든 게시판에서 가져옴
    });

    // 헤더 컨텐츠 렌더링 - 오른쪽에 > 아이콘 추가
    const headerContent = (
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">최신 게시글</CardTitle>
        <Link
          href="/boards/soccer"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="더 많은 게시글 보기"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    );

    return (
      <div className="h-full">
        <PostList
          posts={postsData.data}
          loading={false} // 로딩 상태는 항상 false (서버 컴포넌트에서 데이터 로드 완료 후 렌더링)
          emptyMessage="표시할 게시글이 없습니다."
          headerContent={headerContent}
          showBoard={true}
          // 🔧 높이 제한 완전 제거 - 모든 게시글이 완전히 보이도록
          currentBoardId="all" // 모든 게시판을 의미하는 ID
          className="!mb-2 h-full"
        />
      </div>
    );
  } catch (error) {
    console.error('AllPostsWidget 데이터 로딩 오류:', error);
    
    // 오류 발생 시 기본 UI 표시
    return (
      <div className="h-full bg-white rounded-lg border">
        <div className="px-6 py-4">
          <CardTitle className="text-lg">최신 게시글</CardTitle>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500">게시글을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }
} 