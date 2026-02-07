import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { getPostPageData } from '@/domains/boards/actions';
import PostDetailLayout from '@/domains/boards/components/layout/PostDetailLayout';
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import { siteConfig } from '@/shared/config';
import { buildMetadata } from '@/shared/utils/metadataNew';
import '@/styles/post-content.css';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 게시글 본문에서 설명 추출 (HTML 태그 제거)
 */
function extractDescription(content: unknown): string {
  if (!content) return '';
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  return contentStr
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

// 게시글 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string; postNumber: string }>
}): Promise<Metadata> {
  const { slug, postNumber } = await params;
  const supabase = await getSupabaseServer();

  // 1. 게시판 정보 조회
  const { data: board } = await supabase
    .from('boards')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!board) {
    notFound();
  }

  // 2. 게시글 정보 조회
  const { data: post } = await supabase
    .from('posts')
    .select('title, content, created_at, updated_at')
    .eq('board_id', board.id)
    .eq('post_number', Number(postNumber))
    .single();

  if (!post) {
    notFound();
  }

  const description = extractDescription(post.content) || `${board.name} 게시판의 게시글입니다.`;

  return buildMetadata({
    title: `${post.title} - ${board.name}`,
    description,
    path: `/boards/${slug}/${postNumber}`,
    type: 'article',
    publishedTime: post.created_at ?? undefined,
    modifiedTime: post.updated_at ?? undefined,
  });
}

export default async function PostDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string, postNumber: string }>,
  searchParams: Promise<{ from?: string, page?: string }>
}) {
  try {
    // 두 개의 비동기 값을 병렬로 처리
    const [{ slug, postNumber }, resolvedSearchParams] = await Promise.all([
      params,
      searchParams
    ]);
    
    // 이제 resolvedSearchParams에서 from/page 값 추출
    const fromBoardId = resolvedSearchParams?.from;
    const pageFromQuery = resolvedSearchParams?.page;
    const parsedPage = pageFromQuery ? Number(pageFromQuery) : undefined;
    const safePage = parsedPage && Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    
    // 특수 케이스 처리: 'undefined'가 문자열로 전달된 경우
    const normalizedFromBoardId = fromBoardId === 'undefined' ? undefined : fromBoardId;
    
    if (!slug || !postNumber) {
      return notFound();
    }
    
    // 서버 액션을 통해 모든 데이터 로드 (page 전달)
    const result = await getPostPageData(slug, postNumber, normalizedFromBoardId, safePage);

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
    const siteName = seoSettings?.site_name || siteConfig.name;
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

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: result.post.title,
      description: articleDescription || `${result.board.name}의 게시글입니다.`,
      author: {
        '@type': 'Person',
        name: result.post.profiles?.nickname || '익명'
      },
      datePublished: result.post.created_at,
      dateModified: result.post.updated_at || result.post.created_at,
      publisher: {
        '@type': 'Organization',
        name: siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}${siteConfig.logo}`
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': postUrl
      },
      commentCount: processedComments.length,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: result.post.likes || 0
      }
    };

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
      // 마지막: 현재 페이지 (item 선택사항 - Google 권장: 생략)
      {
        '@type': 'ListItem',
        position: validBreadcrumbs.length + 2,
        name: result.post.title
        // item 생략 - 현재 페이지이므로 Google 가이드라인에 따라 불필요
      }
    ];

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbListItems
    };

    // 레이아웃 컴포넌트에 데이터 전달
    return (
      <>
        {/* Article 구조화 데이터 */}
        <Script
          id="article-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleSchema)
          }}
        />
        {/* BreadcrumbList 구조화 데이터 */}
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema)
          }}
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
