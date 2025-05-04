import React from 'react';
import PostEditForm from '@/domains/boards/components/post/PostEditForm';
import { getCreatePostData } from '@/domains/boards/actions';
import { Metadata } from 'next';
import ErrorMessage from '@/shared/ui/error-message';

// 메타데이터 생성 함수
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  try {
    // 슬러그 가져오기
    const slug = params.slug;
    
    if (!slug) {
      return {
        title: '새 글 작성',
        description: '게시판에 새 글을 작성합니다.'
      };
    }
    
    const result = await getCreatePostData(slug);
    if (result.success && result.board) {
      return {
        title: `새 글 작성 - ${result.board.name}`,
        description: `${result.board.name} 게시판에 새 글을 작성합니다.`
      };
    }
  } catch (error) {
    console.error('메타데이터 생성 오류:', error);
  }
  
  // 오류 발생 시 기본 메타데이터 반환
  return {
    title: '새 글 작성',
    description: '게시판에 새 글을 작성합니다.'
  };
}

// 서버 컴포넌트
export default async function CreatePostPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  try {
    // 슬러그 가져오기
    const slug = params.slug;
    
    if (!slug) {
      return (
        <ErrorMessage 
          message="게시판 정보가 올바르지 않습니다." 
          backLink="/boards"
          backText="게시판 목록으로"
        />
      );
    }
    
    // 서버 액션으로 데이터 가져오기
    const result = await getCreatePostData(slug);
    
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
            allBoardsFlat={result.allBoards || []}
            isCreateMode={true}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('CreatePostPage 오류:', error);
    // 오류 발생시 표시할 UI
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