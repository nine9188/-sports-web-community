import React from 'react';
import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import { getCreatePostData } from '@/domains/boards/actions';
import { Metadata } from 'next';
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';
import { cache } from 'react';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { authGuard } from '@/shared/guards/auth.guard';
import '@/styles/post-content.css';

// Dynamic import로 Tiptap 에디터 번들을 lazy load
const PostEditForm = dynamicImport(
  () => import('@/domains/boards/components/post/PostEditForm'),
  {
    loading: () => (
      <div className="py-20 text-center text-[13px] text-gray-500 dark:text-gray-400">
        불러오는 중...
      </div>
    )
  }
);

// 캐시된 데이터 가져오기 함수 - 중복 호출 방지
const getCachedCreatePostData = cache(async (slug: string) => {
  return await getCreatePostData(slug);
});

// 메타데이터 생성 함수
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  try {
    const { slug } = await params;

    if (slug) {
      const result = await getCachedCreatePostData(slug);
      if (result.success && result.board) {
        return buildMetadata({
          title: `새 글 작성 - ${result.board.name}`,
          description: `${result.board.name} 게시판에 새 글을 작성합니다.`,
          path: `/boards/${slug}/create`,
          noindex: true,
        });
      }
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    console.error('메타데이터 생성 오류:', error);
  }

  return buildMetadata({
    title: '새 글 작성',
    description: '게시판에 새 글을 작성합니다.',
    path: '/boards/create',
    noindex: true,
  });
}

// 서버 컴포넌트
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
    const redirectPath = imageUrl
      ? `/boards/${slug}/create?imageUrl=${encodeURIComponent(imageUrl)}`
      : `/boards/${slug}/create`;

    await authGuard({
      redirectTo: `/signin?redirect=${encodeURIComponent(redirectPath)}&message=${encodeURIComponent('로그인이 필요한 페이지입니다')}`,
    });

    // 라인업 이미지가 있으면 에디터 초기 콘텐츠로 삽입
    const initialContent = imageUrl
      ? JSON.stringify({
          type: 'doc',
          content: [
            { type: 'image', attrs: { src: imageUrl, alt: '라인업', title: null } },
            { type: 'paragraph' },
          ],
        })
      : '';

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

    // 캐시된 데이터 사용 - 중복 호출 방지
    const result = await getCachedCreatePostData(slug);

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
          initialContent={initialContent}
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
        />
      </div>
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    console.error('CreatePostPage 오류:', error);
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
