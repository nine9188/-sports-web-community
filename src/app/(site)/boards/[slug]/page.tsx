import { Metadata } from 'next';
import { getBoardPageAllData } from '@/domains/boards/actions/getBoardPageAllData';
import { searchBoardPosts } from '@/domains/boards/actions/posts';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { convertApiPostsToLayoutPosts } from '@/domains/boards/utils/post/postUtils';
import { STATIC_NAV_BOARDS } from '@/domains/layout/constants/staticBoards';
import type { Board } from '@/domains/layout/types/board';

// 동적 렌더링 강제 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 게시판 slug 기반으로 SEO 키워드/설명을 동적 생성
 */
function getBoardSeoData(slug: string, boardName: string) {
  // 축구 소식/뉴스
  if (slug === 'news' || slug === 'foreign-news' || slug === 'domestic-news' || slug === 'official') {
    return {
      title: `${boardName} - 축구 뉴스`,
      desc: `${boardName}을 빠르게 확인하세요. 축구 커뮤니티 4590 Football.`,
      keywords: [boardName, '축구 뉴스', '축구 소식', slug.includes('foreign') || slug === 'news' ? '해외축구 뉴스' : '국내축구 뉴스', '축구 커뮤니티', '4590', '4590football'],
    };
  }

  // 축구 분석
  if (slug.includes('analysis') || slug === 'data-analysis') {
    return {
      title: `${boardName} - 축구 분석 게시판`,
      desc: `${boardName} 게시판. 경기 분석, 전문가 예측, 데이터 기반 분석글을 확인하세요. 축구 커뮤니티 4590 Football.`,
      keywords: [boardName, '축구 분석', '축구 경기 분석', '축구 분석 커뮤니티', '전문가 예상 스코어', '축구 커뮤니티', '4590', '4590football'],
    };
  }

  // 리그 게시판
  if (['premier', 'laliga', 'serie-a', 'bundesliga', 'LIGUE1', 'k-league', 'k-league-1', 'k-league-2'].includes(slug)) {
    return {
      title: `${boardName} - 리그 게시판`,
      desc: `${boardName} 최신 소식, 경기 결과, 순위, 이적 정보를 확인하세요. 축구 커뮤니티 4590 Football.`,
      keywords: [`${boardName} 순위`, `${boardName} 일정`, `${boardName} 소식`, '축구 커뮤니티', '4590', '4590football'],
    };
  }

  // 팀 게시판 (slug에 팀명이 들어감 - 리그/분석/핫딜/마켓/일반 slug가 아닌 나머지)
  const NON_TEAM_SLUGS = ['free', 'free-talk', 'humor', 'issue', 'qna', 'information', 'tips', 'creative', 'creative-video', 'creative-fanart', 'creative-gif', 'notice', 'review', 'review-purchase', 'review-general', 'review-stadium', 'market', 'market-sell', 'market-buy', 'market-exchange', 'market-share', 'market-free', 'market-ali', 'market-deal', 'market-click', 'market-groupbuy', 'market-quiz', 'market-lottery', 'market-review'];
  const isTeamBoard = !slug.startsWith('hotdeal') && !slug.startsWith('foreign-analysis') && !NON_TEAM_SLUGS.includes(slug);

  if (isTeamBoard) {
    return {
      title: `${boardName} 게시판 - 팬 커뮤니티`,
      desc: `${boardName} 최신 소식, 경기 결과, 이적 루머, 라인업 정보를 확인하세요. 축구 커뮤니티 4590 Football.`,
      keywords: [`${boardName} 소식`, `${boardName} 경기`, `${boardName} 이적`, `${boardName} 라인업`, '축구 커뮤니티', '4590', '4590football'],
    };
  }

  // 일반 커뮤니티 게시판 (자유, 유머, 이슈 등)
  return {
    title: `${boardName} - 축구 커뮤니티`,
    desc: `${boardName} 게시판의 최신 글을 확인하세요. 축구 커뮤니티 4590 Football.`,
    keywords: [boardName, '축구 커뮤니티', '4590', '4590football', '축구 게시판'],
  };
}

// 게시판 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await getSupabaseServer();

  // 게시판 정보 조회
  const { data: board } = await supabase
    .from('boards')
    .select('name, description')
    .eq('slug', slug)
    .single();

  if (!board) {
    return buildMetadata({
      title: '게시판을 찾을 수 없습니다',
      description: '요청하신 게시판이 존재하지 않습니다.',
      path: `/boards/${slug}`,
      noindex: true,
    });
  }

  const seo = getBoardSeoData(slug, board.name);

  return buildMetadata({
    title: seo.title,
    description: board.description ? `${board.description} 축구 커뮤니티 4590 Football.` : seo.desc,
    path: `/boards/${slug}`,
    keywords: seo.keywords,
  });
}

/** 정적 보드 데이터에서 slug로 보드 정보 + 부모 정보 찾기 */
function findStaticBoardInfo(slug: string): { name: string; parent?: Board } {
  for (const board of STATIC_NAV_BOARDS) {
    if (board.slug === slug) return { name: board.name };
    if (board.children) {
      const child = board.children.find(c => c.slug === slug);
      if (child) return { name: child.name, parent: board };
    }
  }
  return { name: slug };
}

/** 에러/notFound 시 정적 레이아웃 — 실제 게시판과 동일한 구조 */
function BoardFallbackLayout({ slug }: { slug: string }) {
  const { name: boardName, parent } = findStaticBoardInfo(slug);
  const topBoards: Array<{ id: string; name: string; display_order: number; slug?: string }> = [];
  const childBoardsMap: Record<string, Array<{ id: string; name: string; display_order: number; slug?: string }>> = {};

  // 브레드크럼: 부모가 있으면 [부모 > 현재]
  const breadcrumbs = parent
    ? [{ id: parent.id, name: parent.name, slug: parent.slug || parent.id }, { id: slug, name: boardName, slug }]
    : [];

  // BoardDetailLayout에 정적 데이터 전달
  const fallbackBoardData = {
    id: slug,
    name: boardName,
    slug,
    description: null,
    parent_id: parent?.id || null,
    team_id: null,
    league_id: null,
    display_order: 0,
    views: 0,
    access_level: null,
    logo: null,
  };

  return (
    <BoardDetailLayout
      boardData={fallbackBoardData}
      breadcrumbs={breadcrumbs}
      teamData={null}
      leagueData={null}
      isLoggedIn={false}
      currentPage={1}
      slug={slug}
      rootBoardId={parent?.id || slug}
      rootBoardSlug={parent?.slug || slug}
      posts={[]}
      topBoards={topBoards}
      hoverChildBoardsMap={childBoardsMap}
      pagination={{ totalItems: 0, itemsPerPage: 20, currentPage: 1 }}
    />
  );
}

/** 게시판 데이터 로딩 + 렌더링 async 서버 컴포넌트 */
async function BoardDetailContent({
  slug, page, fromParam, store, search, searchType
}: {
  slug: string; page: string; fromParam?: string; store?: string; search?: string; searchType?: string;
}) {
  try {
    const currentPage = isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1
      ? 1
      : parseInt(page, 10);
    const searchQuery = search?.trim() || '';

    // 2. 통합 데이터 fetch (단일 호출)
    const result = await getBoardPageAllData(slug, currentPage, fromParam, store);

    // 3. 에러 처리
    if ('error' in result) {
      return <BoardFallbackLayout slug={slug} />;
    }

    // 4. 검색 모드인 경우 검색 결과로 대체
    let posts = result.posts;
    let pagination = result.pagination;

    if (searchQuery) {
      const validSearchTypes = ['title_content', 'title', 'content', 'comment', 'nickname'] as const;
      type ValidSearchType = (typeof validSearchTypes)[number];
      const isValidSearchType = (value: string | undefined): value is ValidSearchType =>
        typeof value === 'string' && (validSearchTypes as readonly string[]).includes(value);
      const searchTypeValue: ValidSearchType = isValidSearchType(searchType)
        ? searchType
        : 'title_content';

      const searchResult = await searchBoardPosts({
        boardIds: result.filteredBoardIds,
        query: searchQuery,
        searchType: searchTypeValue,
        page: currentPage,
        limit: 30,
      });

      posts = convertApiPostsToLayoutPosts(searchResult.data);
      pagination = {
        totalItems: searchResult.meta.totalItems,
        itemsPerPage: searchResult.meta.itemsPerPage,
        currentPage: searchResult.meta.currentPage,
      };
    }

    // 5. 게시판 JSON-LD 구조화 데이터 (AI/검색엔진용)
    const childBoards = result.hoverChildBoardsMap[result.boardData.id] || [];
    const namedChildBoards = childBoards.filter((child) => Boolean(child.name?.trim()));
    const boardUrl = `https://4590football.com/boards/${slug}`;
    const boardName = result.boardData.name?.trim() || slug;
    const boardJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: boardName,
      description: result.boardData.description || `${boardName} - 축구 커뮤니티 4590 Football 게시판`,
      url: boardUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: '4590 Football',
        url: 'https://4590football.com',
      },
      ...(namedChildBoards.length > 0 && {
        hasPart: namedChildBoards.map((child, index) => ({
          '@type': 'CollectionPage',
          name: child.name,
          url: `https://4590football.com/boards/${child.slug || ''}`,
          position: index + 1,
        })),
      }),
      ...(result.boardData.team_id && {
        about: {
          '@type': 'SportsTeam',
          name: boardName,
        },
      }),
      ...(result.boardData.league_id && {
        about: {
          '@type': 'SportsOrganization',
          name: boardName,
        },
      }),
      provider: {
        '@type': 'Organization',
        name: '4590 Football',
        url: 'https://4590football.com',
      },
    };

    // 6. BreadcrumbList JSON-LD 구조화 데이터
    const validBreadcrumbs = result.breadcrumbs
      .map((crumb) => {
        const crumbPath = crumb.slug && crumb.slug !== '#'
          ? (crumb.slug.startsWith('/') ? crumb.slug : `/boards/${crumb.slug}`)
          : undefined;
        return crumbPath && crumb.name ? { name: crumb.name, item: `https://4590football.com${crumbPath}` } : null;
      })
      .filter((item): item is { name: string; item: string } => item !== null);

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://4590football.com' },
        ...validBreadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 2,
          name: crumb.name,
          item: crumb.item,
        })),
      ],
    };

    // 7. 레이아웃 렌더링
    return (
      <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(boardJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BoardDetailLayout
        boardData={{
          ...result.boardData,
          slug: result.boardData.slug || ''
        }}
        breadcrumbs={result.breadcrumbs}
        teamData={result.teamData}
        leagueData={result.leagueData ? {
          ...result.leagueData,
          type: 'league'
        } : null}
        isLoggedIn={result.isLoggedIn}
        isAdmin={result.isAdmin}
        currentPage={currentPage}
        slug={slug}
        rootBoardId={result.rootBoardId}
        rootBoardSlug={result.rootBoardSlug}
        viewType={result.viewType}
        posts={posts}
        topBoards={result.topBoards}
        hoverChildBoardsMap={result.hoverChildBoardsMap}
        pagination={pagination}
        popularPosts={searchQuery ? undefined : result.popularPosts}
        notices={searchQuery ? undefined : result.notices}
        searchQuery={searchQuery}
        teamLogoUrl={result.teamLogoUrl}
        leagueLogoUrl={result.leagueLogoUrl}
        leagueLogoUrlDark={result.leagueLogoUrlDark}
      />
      </>
    );
  } catch (error) {
    console.error("BoardDetailPage Error:", error);
    return <BoardFallbackLayout slug={slug} />;
  }
}

export default async function BoardDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string; from?: string; store?: string; search?: string; searchType?: string }>
}) {
  const { slug } = await params;
  const { page = '1', from: fromParam, store, search, searchType } = await searchParams;

  return (
    <BoardDetailContent
      slug={slug}
      page={page}
      fromParam={fromParam}
      store={store}
      search={search}
      searchType={searchType}
    />
  );
}
