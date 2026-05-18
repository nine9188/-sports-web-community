import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import PostEditForm from '@/domains/boards/components/post/PostEditForm';
import { getPostEditData } from '@/domains/boards/actions';
import type { DealInfo } from '@/domains/boards/types/hotdeal';
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';
import { buildMetadata } from '@/shared/utils/metadataNew';
import '@/styles/post-content.css';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; postNumber: string }>;
}): Promise<Metadata> {
  const { slug, postNumber } = await params;
  return buildMetadata({
    title: '글 수정',
    description: '게시글을 수정합니다.',
    path: `/boards/${slug}/${postNumber}/edit`,
    noindex: true,
  });
}

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string; postNumber: string }>;
}) {
  try {
    const { slug, postNumber } = await params;
    const result = await getPostEditData(slug, postNumber);

    if (result.redirectToLogin) {
      redirect(`/signin?redirect=${encodeURIComponent(`/boards/${slug}/${postNumber}/edit`)}&message=${encodeURIComponent('로그인이 필요한 기능입니다.')}`);
    }

    if (result.redirectToPost) {
      redirect(`/boards/${slug}/${postNumber}?message=${encodeURIComponent('본인이 작성한 글만 수정할 수 있습니다.')}`);
    }

    if (!result.success || !result.post || !result.board) {
      return (
        <div className="container mx-auto">
          <div className={errorBoxStyles}>
            <h2 className={errorTitleStyles}>오류가 발생했습니다</h2>
            <p className={errorMessageStyles}>{result.error || '게시글 정보를 불러오는 중 오류가 발생했습니다.'}</p>
            <Link href={`/boards/${slug}/${postNumber}`} className={errorLinkStyles} prefetch={false}>게시글로 돌아가기</Link>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto">
        <PostEditForm
          postId={result.post.id}
          boardId={result.board.id}
          initialTitle={result.post.title}
          initialContent={typeof result.post.content === 'string' ? result.post.content : JSON.stringify(result.post.content)}
          boardName={result.board.name}
          isCreateMode={false}
          initialDealInfo={(result.post.deal_info as unknown as DealInfo) || null}
        />
      </div>
    );
  } catch (error) {
    console.error('EditPostPage error:', error);
    return notFound();
  }
}
