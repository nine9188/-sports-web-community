import React from 'react';
import PostEditForm from '@/domains/boards/components/post/PostEditForm';
import { getCreatePostData } from '@/domains/boards/actions';
import { Metadata } from 'next';
import ErrorMessage from '@/shared/ui/error-message';
import { cache } from 'react';

// 캐시된 데이터 가져오기 함수 - 중복 호출 방지
const getCachedCreatePostData = cache(async (slug: string) => {
  return await getCreatePostData(slug);
});

// 메타데이터 생성 함수 - 간소화
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return {
        title: '새 글 작성',
        description: '게시판에 새 글을 작성합니다.'
      };
    }

    // 캐시된 데이터 사용
    const result = await getCachedCreatePostData(slug);
    if (result.success && result.board) {
      return {
        title: `새 글 작성 - ${result.board.name}`,
        description: `${result.board.name} 게시판에 새 글을 작성합니다.`
      };
    }
  } catch (error) {
    console.error('메타데이터 생성 오류:', error);
  }
  
  return {
    title: '새 글 작성',
    description: '게시판에 새 글을 작성합니다.'
  };
}

// 서버 컴포넌트
export default async function CreatePostPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return (
        <ErrorMessage 
          message="게시판 정보가 올바르지 않습니다." 
          backLink="/boards"
          backText="게시판 목록으로"
        />
      );
    }

    // 캐시된 데이터 사용 - 중복 호출 방지
    const result = await getCachedCreatePostData(slug);
    
    if (!result.success || !result.board) {
      return (
        <ErrorMessage 
          message={result.error || '게시판 정보를 불러오는 중 오류가 발생했습니다.'} 
          backLink="/boards"
          backText="게시판 목록으로"
        />
      );
    }

    return (
      <div className="container mx-auto">
        <div className="bg-white p-0 rounded-md">
          <PostEditForm 
            boardId={result.board.id}
            _boardSlug={result.board.slug || result.board.id}
            initialTitle=""
            initialContent=""
            boardName={result.board.name}
            categoryId={result.board.id}
            allBoardsFlat={(result.allBoards || []).map(board => ({
              ...board,
              slug: board.slug || board.id
            }))}
            isCreateMode={true}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('CreatePostPage 오류:', error);
    return (
      <ErrorMessage 
        title="오류"
        message="게시판 정보를 불러오는 중 오류가 발생했습니다."
        backLink="/boards"
        backText="게시판 목록으로"
      />
    );
  }
} 