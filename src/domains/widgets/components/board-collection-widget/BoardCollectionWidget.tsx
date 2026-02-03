import BoardPostItem from './BoardPostItem';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { getSupabaseServer } from '@/shared/lib/supabase/server';

const POSTS_PER_SECTION = 5;

// 고정된 게시판 slug
const FOREIGN_ANALYSIS_SLUG = 'foreign-analysis';
const DOMESTIC_ANALYSIS_SLUG = 'domestic-analysis';

interface BoardPost {
  id: string;
  title: string;
  post_number: number;
  board_slug: string;
  board_name: string;
  comment_count: number;
  team_logo?: string | null;
  league_logo?: string | null;
}

interface SectionData {
  boardName: string;
  boardSlug: string;
  posts: BoardPost[];
}

/**
 * 데이터분석 위젯 데이터를 가져오는 함수
 */
export async function fetchBoardCollectionData(): Promise<{ foreign: SectionData; domestic: SectionData } | null> {
  try {
    const supabase = await getSupabaseServer();

    // 두 게시판 정보 + 게시글 가져오기
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id, name, slug')
      .in('slug', [FOREIGN_ANALYSIS_SLUG, DOMESTIC_ANALYSIS_SLUG]);

    if (boardsError || !boards || boards.length === 0) {
      return null;
    }

    const foreignBoard = boards.find(b => b.slug === FOREIGN_ANALYSIS_SLUG);
    const domesticBoard = boards.find(b => b.slug === DOMESTIC_ANALYSIS_SLUG);

    if (!foreignBoard || !domesticBoard) {
      return null;
    }

    // 각 게시판의 최신 게시글 가져오기
    const [foreignPostsResult, domesticPostsResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id, title, post_number')
        .eq('board_id', foreignBoard.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(POSTS_PER_SECTION),
      supabase
        .from('posts')
        .select('id, title, post_number')
        .eq('board_id', domesticBoard.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(POSTS_PER_SECTION),
    ]);

    // 댓글 수 가져오기
    const allPostIds = [
      ...(foreignPostsResult.data || []).map(p => p.id),
      ...(domesticPostsResult.data || []).map(p => p.id),
    ];

    const { data: commentCounts } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', allPostIds);

    const commentCountMap: Record<string, number> = {};
    (commentCounts || []).forEach(c => {
      commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
    });

    // 포맷팅
    const formatPosts = (posts: { id: string; title: string; post_number: number }[] | null, board: { name: string; slug: string }): BoardPost[] => {
      return (posts || []).map(p => ({
        id: p.id,
        title: p.title,
        post_number: p.post_number,
        board_slug: board.slug,
        board_name: board.name,
        comment_count: commentCountMap[p.id] || 0,
        team_logo: null,
        league_logo: null,
      }));
    };

    return {
      foreign: {
        boardName: foreignBoard.name,
        boardSlug: foreignBoard.slug,
        posts: formatPosts(foreignPostsResult.data, foreignBoard),
      },
      domestic: {
        boardName: domesticBoard.name,
        boardSlug: domesticBoard.slug,
        posts: formatPosts(domesticPostsResult.data, domesticBoard),
      },
    };
  } catch (error) {
    console.error('데이터분석 위젯 데이터 조회 오류:', error);
    return null;
  }
}

interface BoardCollectionWidgetProps {
  initialData?: { foreign: SectionData; domestic: SectionData } | null;
}

/**
 * 빈 게시글 목록 컴포넌트
 */
function EmptyPostList() {
  return (
    <div className="flex justify-center items-center h-24 text-center">
      <p className="text-gray-500 dark:text-gray-400 text-sm">아직 게시글이 없습니다.</p>
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
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#F5F5F5] dark:bg-[#262626] px-4 py-2 border-b border-black/5 dark:border-white/10">
      <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">{title}</h3>
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

  if (!data) {
    return null;
  }

  const { foreign, domestic } = data;

  // 둘 다 게시글이 없으면 렌더링 안 함
  if (foreign.posts.length === 0 && domestic.posts.length === 0) {
    return null;
  }

  return (
    <>
      {/* 데스크톱: 2열 레이아웃 */}
      <Container className="hidden md:block bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>데이터분석</ContainerTitle>
        </ContainerHeader>

        <div className="grid grid-cols-2">
          {/* 왼쪽: 해외축구 분석 */}
          <div className="border-r border-black/5 dark:border-white/10">
            <SectionHeader title={foreign.boardName} />
            <PostList posts={foreign.posts} />
          </div>

          {/* 오른쪽: 국내축구 분석 */}
          <div>
            <SectionHeader title={domestic.boardName} />
            <PostList posts={domestic.posts} />
          </div>
        </div>
      </Container>

      {/* 모바일: 2개 섹션 */}
      <div className="md:hidden space-y-4">
        {/* 해외축구 분석 */}
        <Container className="bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader>
            <ContainerTitle>{foreign.boardName}</ContainerTitle>
          </ContainerHeader>
          <PostList posts={foreign.posts} />
        </Container>

        {/* 국내축구 분석 */}
        <Container className="bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader>
            <ContainerTitle>{domestic.boardName}</ContainerTitle>
          </ContainerHeader>
          <PostList posts={domestic.posts} />
        </Container>
      </div>
    </>
  );
}
