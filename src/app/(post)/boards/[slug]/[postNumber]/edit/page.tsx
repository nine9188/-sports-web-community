import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import { getPostEditData } from '@/domains/boards/actions';
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';
import { buildMetadata } from '@/shared/utils/metadataNew';
import Spinner from '@/shared/components/Spinner';

// Dynamic import로 Tiptap 에디터 번들을 lazy load
const PostEditForm = dynamicImport(
  () => import('@/domains/boards/components/post/PostEditForm'),
  {
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }
);

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// 메타데이터
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string; postNumber: string }>
}): Promise<Metadata> {
  const { slug, postNumber } = await params;
  return buildMetadata({
    title: '글 수정',
    description: '게시글을 수정합니다.',
    path: `/boards/${slug}/${postNumber}/edit`,
    noindex: true,
  });
}

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
        <div className="container mx-auto">
          <div className={errorBoxStyles}>
            <h2 className={errorTitleStyles}>오류가 발생했습니다</h2>
            <p className={errorMessageStyles}>{result.error || '게시글 정보를 불러오는 중 오류가 발생했습니다.'}</p>
            <Link href={`/boards/${slug}/${postNumber}`} className={errorLinkStyles}>게시글로 돌아가기</Link>
          </div>
        </div>
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
          initialDealInfo={result.post.deal_info || null}
        />
      </div>
    );
  } catch (error) {
    console.error('EditPostPage 오류:', error);
    return notFound();
  }
}
