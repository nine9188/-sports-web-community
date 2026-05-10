import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { ChevronRight } from 'lucide-react';
import BoardPostItem from './BoardPostItem';
import { Container, ContainerContent, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import type { BoardPost } from './types';

const POSTS_PER_SECTION = 5;

// 분석 게시판 slug (링크용)
const FOREIGN_ANALYSIS_SLUG = 'foreign-analysis';
const DOMESTIC_ANALYSIS_SLUG = 'domestic-analysis';

interface SectionData {
  boardName: string;
  boardSlug: string;
  posts: BoardPost[];
}

interface BoardCollectionWidgetProps {
  initialData?: { foreign: SectionData; domestic: SectionData } | null;
}

/**
 * 데이터분석 위젯 DB 조회 로직 (캐시 래퍼 내부용)
 * Admin 클라이언트 사용 (unstable_cache 내부는 cookies() 사용 불가)
 */
async function _fetchBoardCollectionDataImpl(): Promise<{ foreign: SectionData; domestic: SectionData } | null> {
  try {
    const supabase = getSupabaseAdmin();

    // 해외/국내 분석글 직접 조회 (analysis_region 필터 + 실제 board slug 조인)
    const [foreignPostsResult, domesticPostsResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id, title, post_number, boards(slug, name)')
        .eq('meta->>prediction_type', 'league_analysis')
        .eq('meta->>analysis_region', 'foreign')
        .order('created_at', { ascending: false })
        .limit(POSTS_PER_SECTION),
      supabase
        .from('posts')
        .select('id, title, post_number, boards(slug, name)')
        .eq('meta->>prediction_type', 'league_analysis')
        .eq('meta->>analysis_region', 'domestic')
        .order('created_at', { ascending: false })
        .limit(POSTS_PER_SECTION),
    ]);

    // 댓글 수 가져오기
    const allPostIds = [
      ...(foreignPostsResult.data || []).map((p: { id: string }) => p.id),
      ...(domesticPostsResult.data || []).map((p: { id: string }) => p.id),
    ];

    const commentCountMap: Record<string, number> = {};
    if (allPostIds.length > 0) {
      const { data: commentCounts } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', allPostIds);

      (commentCounts || []).forEach((c: { post_id: string | null }) => {
        if (c.post_id) {
          commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
        }
      });
    }

    // 포맷팅 (실제 board slug 사용, fallback으로 기본 slug)
    const formatPosts = (posts: { id: string; title: string; post_number: number; boards: { slug: string | null; name: string } | null }[] | null, fallbackSlug: string, fallbackName: string): BoardPost[] => {
      return (posts || []).map(p => ({
        id: p.id,
        title: p.title,
        post_number: p.post_number,
        board_slug: p.boards?.slug || fallbackSlug,
        board_name: p.boards?.name || fallbackName,
        comment_count: commentCountMap[p.id] || 0,
        team_logo: null,
        league_logo: null,
      }));
    };

    return {
      foreign: {
        boardName: '해외축구 분석',
        boardSlug: FOREIGN_ANALYSIS_SLUG,
        posts: formatPosts(foreignPostsResult.data, FOREIGN_ANALYSIS_SLUG, '해외축구 분석'),
      },
      domestic: {
        boardName: '국내축구 분석',
        boardSlug: DOMESTIC_ANALYSIS_SLUG,
        posts: formatPosts(domesticPostsResult.data, DOMESTIC_ANALYSIS_SLUG, '국내축구 분석'),
      },
    };
  } catch (error) {
    console.error('데이터분석 위젯 데이터 조회 오류:', error);
    return null;
  }
}

/**
 * 데이터분석 위젯 데이터를 가져오는 함수 (unstable_cache 10분)
 * - 해외축구 분석: meta.analysis_region = 'foreign' 분석글
 * - 국내축구 분석: meta.analysis_region = 'domestic' 분석글
 *
 * 메인 페이지에 포함되는 위젯이라 호출 빈도 높음 → 10분 캐시로 DB 부하 대폭 감소.
 * 분석글 작성은 빈도가 낮아 최대 10분 stale 허용 가능.
 */
export const fetchBoardCollectionData = unstable_cache(
  _fetchBoardCollectionDataImpl,
  ['board-collection-widget'],
  { revalidate: 600, tags: ['board-collection', 'analysis-posts'] }
);

/**
 * 빈 게시글 목록 컴포넌트
 */
function EmptyPostList() {
  return (
    <div className="h-12 px-3 flex items-center justify-center text-center">
      <p className="text-gray-500 dark:text-gray-400 text-[13px]">아직 게시글이 없습니다.</p>
    </div>
  );
}

/**
 * 게시글 목록 컴포넌트
 */
function PostList({ posts }: { posts: BoardPost[] }) {
  if (posts.length === 0) {
    return <EmptyPostList />;
  }

  return (
    <div className="flex flex-col">
      {posts.map((post, index) => (
        <BoardPostItem
          key={post.id}
          post={post}
          isLast={index === posts.length - 1}
        />
      ))}
    </div>
  );
}

/**
 * 섹션 헤더 컴포넌트 (탭 스타일)
 */
function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="bg-[#F5F5F5] dark:bg-[#262626] px-4 py-2 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
      <h3 className="text-[13px] font-medium text-gray-700 dark:text-gray-300">{title}</h3>
      <Link
        href={href}
        prefetch={false}
        className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-0.5 flex-shrink-0"
      >
        더보기
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/**
 * 데이터분석 위젯 (서버 컴포넌트)
 *
 * LCP 최적화:
 * - 100% SSR (클라이언트 컴포넌트 없음)
 * - 탭 전환 없이 2열 레이아웃
 * - 하이드레이션 불필요 → LCP 즉시 확정
 */
export default async function BoardCollectionWidget({ initialData }: BoardCollectionWidgetProps = {}) {
  const data = initialData !== undefined ? initialData : await fetchBoardCollectionData();

  const foreign = data?.foreign ?? { boardName: '해외축구 분석', boardSlug: FOREIGN_ANALYSIS_SLUG, posts: [] };
  const domestic = data?.domestic ?? { boardName: '국내축구 분석', boardSlug: DOMESTIC_ANALYSIS_SLUG, posts: [] };
  const sections = [
    { ...foreign, href: `/boards/${FOREIGN_ANALYSIS_SLUG}` },
    { ...domestic, href: `/boards/${DOMESTIC_ANALYSIS_SLUG}` },
  ];

  return (
    <div>
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader className="justify-between">
          <ContainerTitle>데이터분석</ContainerTitle>
        </ContainerHeader>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {sections.map((section, index) => (
            <div
              key={section.boardSlug}
              className={index === 0 ? 'md:border-r border-black/5 dark:border-white/10' : 'border-t md:border-t-0 border-black/5 dark:border-white/10'}
            >
              <SectionHeader title={section.boardName} href={section.href} />
              <PostList posts={section.posts} />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
