import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { cache } from 'react';
import PostEditForm from '@/domains/boards/components/post/PostEditForm';
import { getCreatePostData } from '@/domains/boards/actions';
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { authGuard } from '@/shared/guards/auth.guard';
import '@/styles/post-content.css';

const getCachedCreatePostData = cache(async (
  slug: string,
  profile: Awaited<ReturnType<typeof authGuard>>['profile']
) => {
  return getCreatePostData(slug, profile);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return buildMetadata({
    title: '글 작성',
    description: '게시판에 새 글을 작성합니다.',
    path: slug ? `/boards/${slug}/create` : '/boards',
    noindex: true,
  });
}

function buildInitialContent(imageUrl?: string) {
  if (!imageUrl) return '';

  try {
    const url = new URL(imageUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
  } catch {
    return '';
  }

  return JSON.stringify({
    type: 'doc',
    content: [
      { type: 'image', attrs: { src: imageUrl, alt: '첨부 이미지', title: null } },
      { type: 'paragraph' },
    ],
  });
}

export default async function CreatePostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ imageUrl?: string }>;
}) {
  try {
    const { slug } = await params;
    const { imageUrl } = await searchParams;

    if (!slug) {
      return (
        <div className="container mx-auto">
          <div className={errorBoxStyles}>
            <h2 className={errorTitleStyles}>오류가 발생했습니다</h2>
            <p className={errorMessageStyles}>게시판 정보가 올바르지 않습니다.</p>
            <Link href="/boards" className={errorLinkStyles} prefetch={false}>게시판 목록으로</Link>
          </div>
        </div>
      );
    }

    const redirectPath = imageUrl
      ? `/boards/${slug}/create?imageUrl=${encodeURIComponent(imageUrl)}`
      : `/boards/${slug}/create`;

    const { profile } = await authGuard({
      redirectTo: `/signin?redirect=${encodeURIComponent(redirectPath)}&message=${encodeURIComponent('로그인이 필요한 페이지입니다.')}`,
    });

    const result = await getCachedCreatePostData(slug, profile);

    if (!result.success || !result.board) {
      return (
        <div className="container mx-auto">
          <div className={errorBoxStyles}>
            <h2 className={errorTitleStyles}>오류가 발생했습니다</h2>
            <p className={errorMessageStyles}>{result.error || '게시판 정보를 불러오는 중 오류가 발생했습니다.'}</p>
            <Link href="/boards" className={errorLinkStyles} prefetch={false}>게시판 목록으로</Link>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto">
        <PostEditForm
          boardId={result.board.id}
          initialTitle=""
          initialContent={buildInitialContent(imageUrl)}
          boardName={result.board.name}
          categoryId={result.board.id}
          allBoardsFlat={(result.allBoards || []).map(board => ({
            ...board,
            slug: board.slug || board.id,
            team_id: board.team_id ?? null,
            league_id: board.league_id ?? null,
            description: (board as unknown as Record<string, unknown>).description as string || '',
            access_level: (board as unknown as Record<string, unknown>).access_level as string || 'public',
            logo: (board as unknown as Record<string, unknown>).logo as string || null,
            views: (board as unknown as Record<string, unknown>).views as number || 0,
          }))}
          isCreateMode={true}
          isAdmin={Boolean(result.isAdmin)}
        />
      </div>
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    console.error('CreatePostPage error:', error);
    return (
      <div className="container mx-auto">
        <div className={errorBoxStyles}>
          <h2 className={errorTitleStyles}>오류</h2>
          <p className={errorMessageStyles}>게시판 정보를 불러오는 중 오류가 발생했습니다.</p>
          <Link href="/boards" className={errorLinkStyles} prefetch={false}>게시판 목록으로</Link>
        </div>
      </div>
    );
  }
}
