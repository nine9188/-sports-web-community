import React from 'react';
import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPostPageData } from '@/domains/boards/actions';
import { getCachedBoardBySlug } from '@/domains/boards/actions/getCachedBoards';
import { getCachedPostMeta } from '@/domains/boards/actions/getCachedPostMeta';
import PostDetailLayout from '@/domains/boards/components/layout/PostDetailLayout';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import { siteConfig } from '@/shared/config';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/shared/utils/jsonLd';
import DaumWebmasterHints from '@/shared/components/DaumWebmasterHints';
import { extractSummary } from '@/domains/boards/utils/post/extractSummary';
import { buildPostSeoDescription, buildPostSeoKeywords } from '@/domains/boards/utils/post/buildPostSeoDescription';
import { extractPostSeoEntities, type PostSeoEntities } from '@/domains/boards/utils/post/extractPostSeoEntities';
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

function buildPostImageCandidates(primaryImage?: string | null, contentImage?: string | null): string[] {
  return Array.from(new Set([
    primaryImage || undefined,
    contentImage || undefined,
    siteConfig.defaultOgImage,
    siteConfig.defaultOgImageSquare,
  ].filter((url): url is string => Boolean(url))));
}

function getSourceOrganization(sourceUrl?: string | null): Record<string, unknown> | null {
  if (!sourceUrl) return null;

  try {
    const url = new URL(sourceUrl);
    return {
      '@type': 'Organization',
      name: url.hostname.replace(/^www\./, ''),
      url: url.origin,
    };
  } catch {
    return null;
  }
}

function buildEntityJsonLd({
  entities,
  leagueName,
}: {
  entities?: PostSeoEntities | null;
  leagueName?: string | null;
}) {
  const about: Record<string, unknown>[] = [];
  const mentions: Record<string, unknown>[] = [];

  if (leagueName) {
    about.push({
      '@type': 'SportsOrganization',
      name: leagueName,
    });
  }

  for (const team of entities?.teams ?? []) {
    const teamSchema = {
      '@type': 'SportsTeam',
      name: team,
      sport: 'Soccer',
    };
    about.push(teamSchema);
    mentions.push(teamSchema);
  }

  for (const player of entities?.players ?? []) {
    mentions.push({
      '@type': 'Person',
      name: player,
    });
  }

  for (const match of entities?.matches ?? []) {
    const eventSchema = {
      '@type': 'Thing',
      name: match,
    };
    about.push(eventSchema);
    mentions.push(eventSchema);
  }

  return {
    about: about.length > 0 ? about : undefined,
    mentions: mentions.length > 0 ? mentions : undefined,
  };
}

function getArticleSection(contentType: string, boardName: string, postMeta?: Record<string, unknown> | null) {
  if (contentType === 'article' && postMeta?.prediction_type === 'league_analysis') {
    return '축구 경기 분석';
  }
  if (contentType === 'news') return boardName;
  return boardName;
}

function normalizeLeagueName(value: string): string {
  const normalized = value.trim();
  const leagueMap: Record<string, string> = {
    'Premier League': '프리미어리그',
    'La Liga': '라리가',
    Bundesliga: '분데스리가',
    'Serie A': '세리에A',
    'Ligue 1': '리그앙',
    'UEFA Champions League': 'UEFA 챔피언스리그',
    'UEFA Europa League': 'UEFA 유로파리그',
    'UEFA Europa Conference League': 'UEFA 컨퍼런스리그',
    'K League 1': 'K리그1',
    'K League 2': 'K리그2',
    'FA Cup': 'FA컵',
  };

  return leagueMap[normalized] || normalized;
}

function getLeagueNameForJsonLd(boardName: string, postMeta?: Record<string, unknown> | null) {
  return typeof postMeta?.league_name === 'string' && postMeta.league_name.trim()
    ? normalizeLeagueName(postMeta.league_name)
    : boardName;
}

function buildDealOffer(dealInfo: unknown, postUrl: string, postTitle: string) {
  const deal = dealInfo as {
    price?: unknown;
    store?: unknown;
    deal_url?: unknown;
    is_ended?: unknown;
  } | null;

  const price = typeof deal?.price === 'number' && Number.isFinite(deal.price) && deal.price > 0
    ? deal.price
    : undefined;
  const store = typeof deal?.store === 'string' && deal.store.trim() ? deal.store.trim() : undefined;
  const dealUrl = typeof deal?.deal_url === 'string' && deal.deal_url.trim() ? deal.deal_url.trim() : postUrl;

  return {
    '@type': 'Offer',
    name: postTitle,
    url: dealUrl,
    availability: deal?.is_ended ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    priceCurrency: 'KRW',
    ...(price ? { price } : {}),
    ...(store ? { seller: { '@type': 'Organization', name: store } } : {}),
  };
}

// 게시글 메타데이터 생성
export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ slug: string; postNumber: string }>,
  searchParams: Promise<{ listPage?: string; page?: string; from?: string; sort?: string }>
}): Promise<Metadata> {
  const [{ slug, postNumber }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const hasListState = Boolean(
    resolvedSearchParams?.listPage ||
    resolvedSearchParams?.page ||
    resolvedSearchParams?.from ||
    resolvedSearchParams?.sort
  );

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

  const contentType = (board as { content_type?: string | null }).content_type || 'community';
  const metadataSummary = (post as { content_summary?: string | null }).content_summary || post.summary;
  const seoEntities = (post as { seo_entities?: PostSeoEntities }).seo_entities ?? null;
  const description = buildPostSeoDescription({
    summary: metadataSummary,
    title: post.title,
    boardName: board.name,
    contentType,
    dealInfo: post.deal_info ?? null,
    seoEntities,
    postMeta: (post.meta as Record<string, unknown> | null) ?? null,
  });
  const keywords = buildPostSeoKeywords({
    title: post.title,
    boardName: board.name,
    contentType,
    seoEntities,
  });

  return buildMetadata({
    title: post.title,
    titleOnly: true,
    description,
    path: `/boards/${slug}/${postNumber}`,
    type: 'article',
    image: post.thumbnail_url ?? undefined,
    publishedTime: post.created_at ?? undefined,
    modifiedTime: post.updated_at ?? undefined,
    keywords,
    includeSiteKeywords: false,
    includeDefaultOgFallbacks: false,
    ...(hasListState && { robots: { index: false, follow: true } }),
  });
}

/** 게시글 데이터 로딩 + 렌더링 async 서버 컴포넌트 (Suspense 스트리밍용) */
async function PostDetailContent({
  slug, postNumber, fromBoardId, pageParam, returnHref, detailQueryString
}: {
  slug: string; postNumber: string; fromBoardId?: string; pageParam?: number; returnHref: string; detailQueryString: string;
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

    // 본문에서 설명 추출. TipTap 카드/예측 차트/RSS 보조 UI는 제외하고 실제 본문 텍스트를 우선한다.
    const articleDescription = extractSummary(result.post.content, 200);

    // 게시글 이미지 후보: 썸네일 > 본문 첫 이미지 > 기본 가로형 > 기본 정사각형
    const firstImage = extractFirstImage(result.post.content);
    const postImages = buildPostImageCandidates(
      (result.post as { thumbnail_url?: string | null }).thumbnail_url,
      firstImage,
    );
    const contentType = (result.board as { content_type?: string }).content_type || 'community';
    const postTitle = result.post.title?.trim() || `${result.board.name} 게시글`;
    const boardName = result.board.name?.trim() || '게시판';
    const postMeta = (result.post.meta as Record<string, unknown> | null) ?? null;
    const seoEntities = extractPostSeoEntities(result.post.content);
    const seoDescription = buildPostSeoDescription({
      summary: articleDescription,
      title: postTitle,
      boardName,
      contentType,
      dealInfo: result.post.deal_info ?? null,
      seoEntities,
      postMeta,
    });
    const seoKeywords = buildPostSeoKeywords({
      title: postTitle,
      boardName,
      contentType,
      seoEntities,
    });
    const jsonLdEntities = buildEntityJsonLd({
      entities: seoEntities,
      leagueName: getLeagueNameForJsonLd(boardName, postMeta),
    });
    const sourceUrl = typeof result.post.source_url === 'string' && result.post.source_url.trim()
      ? result.post.source_url.trim()
      : null;
    const sourceOrganization = getSourceOrganization(sourceUrl);
    const articleSection = getArticleSection(contentType, boardName, postMeta);

    // 공통 author 객체
    const authorSchema = {
      '@type': 'Person' as const,
      name: postProfiles?.nickname || '익명',
      ...(postProfiles?.public_id && {
        url: `${siteUrl}/user/${postProfiles.public_id}`,
      }),
      ...(postProfiles?.level && {
        description: `4590 Football 레벨 ${postProfiles.level} 회원`,
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
        name: postTitle,
        headline: postTitle,
        description: seoDescription,
        image: postImages,
        author: authorSchema,
        articleSection,
        keywords: seoKeywords,
        isAccessibleForFree: true,
        ...(sourceUrl ? { isBasedOn: sourceUrl, citation: sourceUrl } : {}),
        ...(sourceOrganization ? { creditText: String(sourceOrganization.name || '') } : {}),
        ...jsonLdEntities,
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
        name: postTitle,
        headline: postTitle,
        description: seoDescription,
        image: postImages,
        author: authorSchema,
        articleSection,
        keywords: seoKeywords,
        ...jsonLdEntities,
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
      // 인증/후기: 리뷰 대상이 없으면 Article이 구조화 데이터상 더 안전하다.
      postSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        name: postTitle,
        headline: postTitle,
        description: seoDescription,
        image: postImages,
        author: authorSchema,
        articleSection,
        keywords: seoKeywords,
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
    } else if (contentType === 'deal') {
      // 핫딜/마켓: Product
      postSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: postTitle,
        description: seoDescription,
        image: postImages,
        category: boardName,
        keywords: seoKeywords,
        offers: buildDealOffer(result.post.deal_info, postUrl, postTitle),
      };
    } else {
      // community (기본값): DiscussionForumPosting
      const topComments = processedComments.slice(0, 3).map((comment: { content?: string; profiles?: { nickname?: string; public_id?: string | null }; created_at?: string }) => ({
        '@type': 'Comment',
        name: '게시글 댓글',
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
        name: postTitle,
        headline: postTitle,
        text: seoDescription,
        image: postImages,
        author: authorSchema,
        articleSection,
        keywords: seoKeywords,
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

        return breadcrumbPath && breadcrumb.name ? {
          name: breadcrumb.name,
          item: `${baseSiteUrl}${breadcrumbPath}`
        } : null;
      })
      .filter((item): item is { name: string; item: string } => item !== null);

    const breadcrumbSchema = buildBreadcrumbJsonLd({
      items: [
        { name: '홈', url: baseSiteUrl },
        ...validBreadcrumbs.map((breadcrumb) => ({
          name: breadcrumb.name,
          url: breadcrumb.item,
        })),
        { name: postTitle, url: postUrl },
      ],
    });

    // 레이아웃 컴포넌트에 데이터 전달
    return (
      <>
        {/* 게시판 타입별 구조화 데이터 */}
        <DaumWebmasterHints
          content={seoDescription}
          datetime={result.post.created_at}
        />
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
        poll={result.poll || null}
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
        returnHref={returnHref}
        detailQueryString={detailQueryString}
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
  searchParams: Promise<{ from?: string, page?: string, listPage?: string, sort?: string }>
}) {
  const [{ slug, postNumber }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams
  ]);

  if (resolvedSearchParams?.from || resolvedSearchParams?.page || resolvedSearchParams?.sort) {
    const listPage = resolvedSearchParams?.listPage;
    const parsedListPage = listPage ? Number(listPage) : undefined;
    const listPageQuery = parsedListPage && Number.isFinite(parsedListPage) && parsedListPage > 1
      ? `?listPage=${Math.floor(parsedListPage)}`
      : '';

    permanentRedirect(`/boards/${slug}/${postNumber}${listPageQuery}`);
  }

  const fromBoardId = resolvedSearchParams?.from;
  const pageFromQuery = resolvedSearchParams?.listPage ?? resolvedSearchParams?.page;
  const parsedPage = pageFromQuery ? Number(pageFromQuery) : undefined;
  const safePage = parsedPage && Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : undefined;
  const detailQueryString = '';
  const returnHref = `/boards/${slug}`;

  if (!slug || !postNumber) {
    return notFound();
  }

  return (
    <PostDetailContent
      slug={slug}
      postNumber={postNumber}
      fromBoardId={fromBoardId}
      pageParam={safePage}
      returnHref={returnHref}
      detailQueryString={detailQueryString}
    />
  );
}
