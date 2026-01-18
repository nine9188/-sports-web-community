import { Metadata } from 'next';
import { getBoardPageAllData } from '@/domains/boards/actions/getBoardPageAllData';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import ErrorMessage from '@/shared/components/ui/error-message';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';

// 동적 렌더링 강제 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 게시판 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await getSupabaseServer();
    const seoSettings = await getSeoSettings();

    const siteUrl = seoSettings?.site_url || 'https://4590.co.kr';
    const siteName = seoSettings?.site_name || '4590 Football';
    const pagePath = `/boards/${slug}`;

    // page_overrides 확인 (관리자 설정 우선)
    const pageOverride = seoSettings?.page_overrides?.[pagePath];

    // 게시판 정보 조회
    const { data: board } = await supabase
      .from('boards')
      .select('name, description')
      .eq('slug', slug)
      .single();

    if (!board) {
      return {
        title: '게시판을 찾을 수 없습니다',
        description: '요청하신 게시판이 존재하지 않습니다.',
      };
    }

    // 관리자 설정 우선, 없으면 기본값 사용
    const title = pageOverride?.title || `${board.name} - ${siteName}`;
    const description = pageOverride?.description || board.description || `${board.name} 게시판의 최신 글을 확인하세요.`;
    const url = `${siteUrl}/boards/${slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        siteName,
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error('[BoardPage generateMetadata] 오류:', error);
    return {
      title: '게시판 - 4590 Football',
      description: '축구 커뮤니티 게시판',
    };
  }
}

export default async function BoardDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  try {
    // 1. 파라미터 추출
    const { slug } = await params;
    const { page = '1', from: fromParam, store } = await searchParams;
    const currentPage = isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1
      ? 1
      : parseInt(page, 10);

    // 2. 통합 데이터 fetch (단일 호출)
    const result = await getBoardPageAllData(slug, currentPage, fromParam, store);

    // 3. 에러 처리
    if ('error' in result) {
      if (result.notFound) {
        return (
          <ErrorMessage
            title="게시판을 찾을 수 없습니다"
            message={result.error}
          />
        );
      }
      return <ErrorMessage message={result.error} />;
    }

    // 4. 레이아웃 렌더링
    return (
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
        currentPage={currentPage}
        slug={slug}
        rootBoardId={result.rootBoardId}
        rootBoardSlug={result.rootBoardSlug}
        viewType={result.viewType}
        posts={result.posts}
        topBoards={result.topBoards}
        hoverChildBoardsMap={result.hoverChildBoardsMap}
        pagination={result.pagination}
        popularPosts={result.popularPosts}
        notices={result.notices}
      />
    );
  } catch (error) {
    console.error("BoardDetailPage Error:", error);
    return (
      <ErrorMessage message="게시판 정보를 불러오는 중 오류가 발생했습니다." />
    );
  }
}
