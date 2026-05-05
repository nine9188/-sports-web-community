import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostPageData } from '@/domains/boards/actions';
import { getCachedBoardBySlug } from '@/domains/boards/actions/getCachedBoards';
import { getCachedPostMeta } from '@/domains/boards/actions/getCachedPostMeta';
import PostDetailLayout from '@/domains/boards/components/layout/PostDetailLayout';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import { siteConfig } from '@/shared/config';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/shared/utils/jsonLd';
import '@/styles/post-content.css';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 게시글 본문에서 설명 추출 (HTML 태그 제거)
 */
/**
 * TipTap JSON에서 첫 번째 이미지 URL 추출
 */
function extractFirstImage(content: unknown): string | null {
  if (!content || typeof content !== 'object') return null;
  const doc = content as { content?: unknown[] };
  if (!doc.content || !Array.isArray(doc.content)) return null;

  function traverse(nodes: unknown[]): string | null {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const n = node as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] };
      if (n.type === 'image' && n.attrs?.src) {
        return String(n.attrs.src);
      }
      if (n.content && Array.isArray(n.content)) {
        const found = traverse(n.content);
        if (found) return found;
      }
    }
    return null;
  }

  return traverse(doc.content);
}

// 게시글 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string; postNumber: string }>
}): Promise<Metadata> {
  const { slug, postNumber } = await params;

  // 1. 게시판 정보 조회 (7일 캐시 재사용)
  const board = await getCachedBoardBySlug(slug);
  if (!board) {
    notFound();
  }

  // 2. 게시글 정보 조회 (per-post 캐시 1시간, summary 컬럼으로 description)
  const post = await getCachedPostMeta(board.id, Number(postNumber));
  if (!post) {
    notFound();
  }

  const description = post.summary || `${board.name} 게시판의 게시글입니다. 축구 커뮤니티 4590 Football.`;

  return buildMetadata({
    title: `${post.title} - ${board.name}`,
    description,
    path: `/boards/${slug}/${postNumber}`,
    type: 'article',
    publishedTime: post.created_at ?? undefined,
    modifiedTime: post.updated_at ?? undefined,
    keywords: [board.name, '축구 커뮤니티', '4590', '4590football', '축구 게시판'],
  });
}

/** 게시글 데이터 로딩 + 렌더링 async 서버 컴포넌트 (Suspense 스트리밍용) */
async function PostDetailContent({
  slug, postNumber, fromBoardId, pageParam
}: {
  slug: string; postNumber: string; fromBoardId?: string; pageParam: number;
}) {
  try {
    // 서버 액션을 통해 모든 데이터 로드 (page 전달)
    const normalizedFromBoardId = fromBoardId === 'undefined' ? undefined : fromBoardId;
    const result = await getPostPageData(slug, postNumber, normalizedFromBoardId, pageParam);

    if (!result.success) {
      // 모든 실패 케이스 → 404 반환
      notFound();
    }

    // 결과가 성공적이고 모든 필요한 데이터가 있는지 확인
    if (!result.post || !result.board) {
      notFound();
    }

    // 타입 호환을 위한 데이터 변환
    const topLevelBoards = result.topLevelBoards?.map(board => ({
      id: board.id,
      name: board.name,
      display_order: board.display_order || 0,
      slug: board.slug || undefined // null을 undefined로 변환
    })) || [];
    
    // processedChildBoardsMap 변환 - null 값 제거 및 display_order 확인
    const processedChildBoardsMap: Record<string, Array<{
      id: string;
      name: string;
      parent_id: string; // null 허용하지 않음
      display_order: number; // null 허용하지 않음
      slug: string; // 필수 속성으로 변경
      team_id: number | null;
      league_id: number | null;
      description: string | null;
      access_level: string | null;
      logo: string | null;
      views: number | null;
    }>> = {};
    
    if (result.childBoardsMap) {
      Object.keys(result.childBoardsMap).forEach(key => {
        processedChildBoardsMap[key] = result.childBoardsMap[key].map(board => ({
          id: board.id,
          name: board.name,
          parent_id: board.parent_id || '',  // null을 빈 문자열로 변환
          display_order: board.display_order || 0, // null을 0으로 변환
          slug: board.slug || board.id,  // slug가 없는 경우 id를 기본값으로 사용
          team_id: board.team_id,  // null 허용
          league_id: board.league_id,  // null 허용
          description: board.description,  // null 허용
          access_level: board.access_level || null,
          logo: board.logo || null,
          views: board.views || null
        }));
      });
    }
    
    // CommentType 변환을 위한 처리
    const processedComments = (result.comments || []).map((comment: {
      id: string;
      content: string;
      created_at?: string;
      user_id?: string;
      post_id?: string;
      parent_id?: string | null;
      likes?: number;
      dislikes?: number;
      userAction?: 'like' | 'dislike' | null;
      profiles?: {
        nickname?: string;
        public_id?: string;
        icon_id?: number;
        level?: number;
        exp?: number;
        icon_url?: string;
      };
    }) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at || '',
      user_id: comment.user_id || '',
      post_id: comment.post_id || '',
      parent_id: comment.parent_id || null,
      likes: comment.likes || 0,
      dislikes: comment.dislikes || 0,
      userAction: comment.userAction || null,
      profiles: {
        nickname: comment.profiles?.nickname || null,
        public_id: comment.profiles?.public_id || null,
        icon_id: comment.profiles?.icon_id || null,
        level: comment.profiles?.level || null,
        exp: comment.profiles?.exp || null,
        icon_url: comment.profiles?.icon_url || null
      },
      children: []
    }));
    
    // formattedPosts 변환에 게시판 아이콘, 유저 레벨 및 아이콘 정보 추가
    const processedFormattedPosts = (result.formattedPosts || []).map(post => ({
      id: post.id,
      title: post.title,
      board_id: post.boardId,
      board_name: post.boardName,
      board_slug: post.boardSlug,
      post_number: post.postNumber,
      created_at: post.created_at,
      formattedDate: post.formattedDate,
      views: post.views,
      likes: post.likes,
      author_nickname: post.author,
      author_id: post.author_id || '',
      author_public_id: post.author_public_id || null,
      author_level: post.author_level || 1,
      author_exp: post.author_exp,
      author_icon_id: post.author_icon_id,
      author_icon_url: post.author_icon_url || undefined,  // null을 undefined로 변환
      comment_count: post.commentCount,
      content: post.content,
      // 팀/리그 정보 (4590 표준: Storage URL)
      team_id: post.team?.id || null,
      team_name: post.team?.name || null,
      team_logo: post.team?.logo || null,
      league_id: post.league?.id || null,
      league_name: post.league?.name || null,
      league_logo: post.league?.logo || null,
      league_logo_dark: post.league?.logo_dark || null
    }));
    
    // post 데이터에 iconUrl과 icon_id 직접 설정
    const postProfiles =
      result.post.profiles && typeof result.post.profiles === 'object' && !Array.isArray(result.post.profiles)
        ? (result.post.profiles as {
            nickname?: string | null;
            public_id?: string | null;
            icon_id?: number | null;
            level?: number | null;
            exp?: number | null;
            icon_url?: string | null;
          })
        : undefined;

    const postWithIcon = {
      ...result.post,
      content: result.post.content as Record<string, unknown>,
      profiles: {
        ...(postProfiles || {}),
        icon_url: result.iconUrl
      }
    } as unknown;

    // Article 구조화 데이터 생성
    const seoSettings = await getSeoSettings();
    const siteUrl = seoSettings?.site_url || siteConfig.url;
    const postUrl = siteConfig.getCanonical(`/boards/${slug}/${postNumber}`);

    // 본문에서 설명 추출
    let articleDescription = '';
    if (result.post.content) {
      const contentStr = typeof result.post.content === 'string'
        ? result.post.content
        : JSON.stringify(result.post.content);
      articleDescription = contentStr
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200);
    }

    // 게시글 본문에서 첫 번째 이미지 추출 (없으면 OG 이미지 사용)
    const firstImage = extractFirstImage(result.post.content);
    const postImage = firstImage || `${siteUrl}/og-image.png`;
    const contentType = (result.board as { content_type?: string }).content_type || 'community';

    // 공통 author 객체
    const authorSchema = {
      '@type': 'Person' as const,
      name: result.post.profiles?.nickname || '익명',
      ...(result.post.profiles?.public_id && {
        url: `${siteUrl}/user/${result.post.profiles.public_id}`,
      }),
      ...(result.post.profiles?.level && {
        description: `4590 Football 레벨 ${result.post.profiles.level} 회원`,
      }),
      memberOf: {
        '@type': 'Organization',
        '@id': `${siteUrl}#organization`,
        name: '4590 Football',
      },
    };

    // content_type에 따라 스키마 분기
    let postSchema: Record<string, unknown>;

    if (contentType === 'news') {
      // 뉴스: NewsArticle
      postSchema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: result.post.title,
        description: articleDescription || `${result.board.name}의 게시글입니다.`,
        image: postImage,
        author: authorSchema,
        datePublished: result.post.created_at,
        dateModified: result.post.updated_at || result.post.created_at,
        publisher: { '@id': `${siteUrl}#organization` },
        mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
        commentCount: processedComments.length,
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: result.post.likes || 0,
        },
      };
    } else if (contentType === 'article') {
      // 분석글/공지: Article
      postSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: result.post.title,
        description: articleDescription || `${result.board.name}의 게시글입니다.`,
        image: postImage,
        author: authorSchema,
        datePublished: result.post.created_at,
        dateModified: result.post.updated_at || result.post.created_at,
        publisher: { '@id': `${siteUrl}#organization` },
        mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
        commentCount: processedComments.length,
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: result.post.likes || 0,
        },
      };
    } else if (contentType === 'review') {
      // 인증/후기: Review
      postSchema = {
        '@context': 'https://schema.org',
        '@type': 'Review',
        name: result.post.title,
        reviewBody: articleDescription || `${result.board.name}의 게시글입니다.`,
        image: postImage,
        author: authorSchema,
        datePublished: result.post.created_at,
        publisher: { '@id': `${siteUrl}#organization` },
        commentCount: processedComments.length,
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: result.post.likes || 0,
        },
      };
    } else if (contentType === 'deal') {
      // 핫딜/마켓: Product
      postSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: result.post.title,
        description: articleDescription || `${result.board.name}의 게시글입니다.`,
        image: postImage,
        offers: {
          '@type': 'Offer',
          url: postUrl,
          availability: 'https://schema.org/InStock',
          priceCurrency: 'KRW',
        },
        review: {
          '@type': 'Review',
          author: authorSchema,
          datePublished: result.post.created_at,
          reviewBody: articleDescription,
        },
      };
    } else {
      // community (기본값): DiscussionForumPosting
      const topComments = processedComments.slice(0, 3).map((comment: { content?: string; profiles?: { nickname?: string; public_id?: string | null }; created_at?: string }) => ({
        '@type': 'Comment',
        text: typeof comment.content === 'string'
          ? comment.content.replace(/<[^>]*>/g, '').slice(0, 200)
          : '',
        author: {
          '@type': 'Person',
          name: comment.profiles?.nickname || '익명',
          ...(comment.profiles?.public_id && {
            url: `${siteUrl}/user/${comment.profiles.public_id}`,
          }),
        },
        datePublished: comment.created_at,
      }));

      postSchema = {
        '@context': 'https://schema.org',
        '@type': 'DiscussionForumPosting',
        headline: result.post.title,
        text: articleDescription || `${result.board.name}의 게시글입니다.`,
        image: postImage,
        author: authorSchema,
        datePublished: result.post.created_at,
        dateModified: result.post.updated_at || result.post.created_at,
        url: postUrl,
        discussionUrl: postUrl,
        commentCount: processedComments.length,
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: result.post.likes || 0,
        },
        ...(topComments.length > 0 ? { comment: topComments } : {}),
      };
    }

    // BreadcrumbList 구조화 데이터 생성
    // Google 가이드: 마지막 항목에서는 item이 선택사항, 나머지는 필수
    const baseSiteUrl = (seoSettings?.site_url && seoSettings.site_url.trim()) || siteConfig.url;

    const validBreadcrumbs = result.breadcrumbs
      .map((breadcrumb) => {
        const breadcrumbPath =
          breadcrumb.slug && breadcrumb.slug !== '#'
            ? (breadcrumb.slug.startsWith('/') ? breadcrumb.slug : `/boards/${breadcrumb.slug}`)
            : undefined;

        return breadcrumbPath ? {
          name: breadcrumb.name,
          item: `${baseSiteUrl}${breadcrumbPath}`
        } : null;
      })
      .filter((item): item is { name: string; item: string } => item !== null);

    const breadcrumbListItems = [
      // 홈 (item 필수)
      {
        '@type': 'ListItem',
        position: 1,
        name: '홈',
        item: baseSiteUrl
      },
      // 중간 게시판들 (item 필수)
      ...validBreadcrumbs.map((breadcrumb, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: breadcrumb.name,
        item: breadcrumb.item
      })),
      // 마지막: 현재 페이지
      {
        '@type': 'ListItem',
        position: validBreadcrumbs.length + 2,
        name: result.post.title,
        item: postUrl
      }
    ];

    void breadcrumbListItems;

    const breadcrumbSchema = buildBreadcrumbJsonLd({
      name: `${result.post.title || 'Post'} breadcrumb`,
      items: [
        { name: '홈', url: baseSiteUrl },
        ...validBreadcrumbs.map((breadcrumb) => ({
          name: breadcrumb.name,
          url: breadcrumb.item,
        })),
        { name: result.post.title, url: postUrl },
      ],
    });

    // 레이아웃 컴포넌트에 데이터 전달
    return (
      <>
        {/* 게시판 타입별 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(postSchema)
          }}
        />
        {/* BreadcrumbList 구조화 데이터 */}
        <script
          type="application/ld+json"
          {...jsonLdScriptProps(breadcrumbSchema)}
        />
        <TrackPageVisit
          id={result.board.id}
          slug={result.board.slug || result.board.id}
          name={result.board.name}
        />
        <PostDetailLayout
        post={postWithIcon as Parameters<typeof PostDetailLayout>[0]['post']}
        board={result.board as Parameters<typeof PostDetailLayout>[0]['board']}
        breadcrumbs={result.breadcrumbs || []}
        processedHtml={result.processedHtml || ''}
        comments={processedComments}
        isLoggedIn={result.isLoggedIn || false}
        isAuthor={result.isAuthor || false}
        currentUserId={result.currentUserId || null}
        adjacentPosts={result.adjacentPosts || { prevPost: null, nextPost: null }}
        formattedPosts={processedFormattedPosts}
        topLevelBoards={topLevelBoards}
        childBoardsMap={processedChildBoardsMap}
        rootBoardId={result.rootBoardId || ''}
        rootBoardSlug={result.rootBoardSlug || undefined}
        totalPages={result.totalPages || 1}
        currentPage={result.currentPage || 1}
        postUserAction={result.postUserAction || null}
        slug={slug}
        postNumber={postNumber}
      />
      </>
    );
  } catch (error) {
    // notFound() 에러는 그대로 throw
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof error.digest === 'string' &&
      error.digest.includes('NEXT_NOT_FOUND')
    ) {
      throw error;
    }

    // 그 외 일반 오류도 404로 처리 (게시글 페이지 관련 에러는 대부분 찾을 수 없음)
    console.error('게시글 페이지 오류:', error);
    notFound();
  }
}

export default async function PostDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string, postNumber: string }>,
  searchParams: Promise<{ from?: string, page?: string }>
}) {
  const [{ slug, postNumber }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams
  ]);

  const fromBoardId = resolvedSearchParams?.from;
  const pageFromQuery = resolvedSearchParams?.page;
  const parsedPage = pageFromQuery ? Number(pageFromQuery) : undefined;
  const safePage = parsedPage && Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  if (!slug || !postNumber) {
    return notFound();
  }

  return (
    <PostDetailContent
      slug={slug}
      postNumber={postNumber}
      fromBoardId={fromBoardId}
      pageParam={safePage}
    />
  );
}
