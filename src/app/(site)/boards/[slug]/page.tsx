import { Metadata } from 'next';
import Link from 'next/link';
import { getBoardPageAllData } from '@/domains/boards/actions/getBoardPageAllData';
import { searchBoardPosts } from '@/domains/boards/actions/posts';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { convertApiPostsToLayoutPosts } from '@/domains/boards/utils/post/postUtils';

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

export default async function BoardDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string; from?: string; store?: string; search?: string; searchType?: string }>
}) {
  try {
    // 1. 파라미터 추출
    const { slug } = await params;
    const { page = '1', from: fromParam, store, search, searchType } = await searchParams;
    const currentPage = isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1
      ? 1
      : parseInt(page, 10);
    const searchQuery = search?.trim() || '';

    // 2. 통합 데이터 fetch (단일 호출)
    const result = await getBoardPageAllData(slug, currentPage, fromParam, store);

    // 3. 에러 처리
    if ('error' in result) {
      if (result.notFound) {
        return (
          <div className="container mx-auto">
            <div className={errorBoxStyles}>
              <h1 className={errorTitleStyles}>게시판을 찾을 수 없습니다</h1>
              <p className={errorMessageStyles}>{result.error}</p>
              <Link href="/" className={errorLinkStyles}>메인페이지로 이동</Link>
            </div>
          </div>
        );
      }
      return (
        <div className="container mx-auto">
          <div className={errorBoxStyles}>
            <h1 className={errorTitleStyles}>오류가 발생했습니다</h1>
            <p className={errorMessageStyles}>{result.error}</p>
            <Link href="/" className={errorLinkStyles}>메인페이지로 이동</Link>
          </div>
        </div>
      );
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
    const boardUrl = `https://4590football.com/boards/${slug}`;
    const boardJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: result.boardData.name,
      description: result.boardData.description || `${result.boardData.name} - 축구 커뮤니티 4590 Football 게시판`,
      url: boardUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: '4590 Football',
        url: 'https://4590football.com',
      },
      ...(childBoards.length > 0 && {
        hasPart: childBoards.map((child, index) => ({
          '@type': 'CollectionPage',
          name: child.name,
          url: `https://4590football.com/boards/${child.slug || ''}`,
          position: index + 1,
        })),
      }),
      ...(result.boardData.team_id && {
        about: {
          '@type': 'SportsTeam',
          name: result.boardData.name,
        },
      }),
      ...(result.boardData.league_id && {
        about: {
          '@type': 'SportsOrganization',
          name: result.boardData.name,
        },
      }),
      provider: {
        '@type': 'Organization',
        name: '4590 Football',
        url: 'https://4590football.com',
      },
    };

    // 6. 레이아웃 렌더링
    return (
      <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(boardJsonLd) }}
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
    return (
      <div className="container mx-auto">
        <div className={errorBoxStyles}>
          <h1 className={errorTitleStyles}>오류가 발생했습니다</h1>
          <p className={errorMessageStyles}>게시판 정보를 불러오는 중 오류가 발생했습니다.</p>
          <Link href="/" className={errorLinkStyles}>메인페이지로 이동</Link>
        </div>
      </div>
    );
  }
}
