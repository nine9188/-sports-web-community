import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getPostEditData } from '@/domains/boards/actions';
import PostEditForm from '@/domains/boards/components/post/PostEditForm';
import ErrorMessage from '@/shared/ui/error-message';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ slug: string, postNumber: string }> }) {
  try {
    const { slug, postNumber } = await params;
    
    // 서버 액션을 통해 데이터 로드
    const result = await getPostEditData(slug, postNumber);
    
    // 로그인 필요한 경우 리다이렉트
    if (result.redirectToLogin) {
      redirect(`/login?message=로그인이+필요한+기능입니다&redirect=/boards/${slug}/${postNumber}`);
    }
    
    // 권한 없는 경우 리다이렉트
    if (result.redirectToPost) {
      redirect(`/boards/${slug}/${postNumber}?message=본인+작성글만+수정할+수+있습니다`);
    }
    
    // 오류 처리
    if (!result.success || !result.post || !result.board) {
      return (
        <ErrorMessage 
          message={result.error || '게시글 정보를 불러오는 중 오류가 발생했습니다.'} 
          backLink={`/boards/${slug}/${postNumber}`}
          backText="게시글로 돌아가기"
        />
      );
    }
    
    return (
      <div className="container mx-auto">
        <PostEditForm 
          postId={result.post.id}
          boardId={result.board.id}
          _boardSlug={slug}
          _postNumber={postNumber}
          initialTitle={result.post.title}
          initialContent={typeof result.post.content === 'string' ? result.post.content : JSON.stringify(result.post.content)}
          boardName={result.board.name}
          isCreateMode={false}
        />
      </div>
    );
  } catch (error) {
    console.error('EditPostPage 오류:', error);
    return notFound();
  }
} 