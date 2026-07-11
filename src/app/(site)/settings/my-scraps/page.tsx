import { redirect } from 'next/navigation';
import { getScrappedPosts } from '@/domains/boards/actions/posts/scrap';
import { getSupabaseServer } from '@/shared/lib/supabase/client.server';
import MyScrapsContent from '@/domains/settings/components/my-scraps/MyScrapsContent';
import { Container, ContainerContent, Pagination } from '@/shared/components/ui';
import { buildMetadata } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return buildMetadata({
    title: '스크랩한 글',
    description: '내가 스크랩한 게시글 목록을 확인할 수 있습니다.',
    path: '/settings/my-scraps',
    noindex: true,
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchParams {
  page?: string;
}

export default async function MyScrapsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  try {
    const supabase = await getSupabaseServer();

    // 사용자 인증 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect('/signin?redirect=/settings/my-scraps');
    }

    const resolvedParams = await searchParams;
    const page = resolvedParams.page ? parseInt(resolvedParams.page) : 1;
    const limit = 10;

    // Server Action 호출로 스크랩 목록 획득
    const result = await getScrappedPosts(page, limit);

    if (!result.success) {
      throw new Error(result.error || '스크랩한 글 목록을 가져오는 데 실패했습니다.');
    }

    return (
      <div className="space-y-4">
        <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
          <ContainerContent>
            <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-[#F0F0F0]">스크랩한 글</h2>
            <p className="text-gray-500 dark:text-gray-400 text-[13px]">
              내가 스크랩(북마크)한 게시글 목록을 확인할 수 있습니다.
            </p>
          </ContainerContent>
        </Container>

        <MyScrapsContent
          key={`my-scraps-content-page-${page}`}
          initialPosts={result.posts}
          initialTotalCount={result.totalCount}
        />

        {result.totalPages > 1 && (
          <div className="px-4 sm:px-6">
            <Pagination
              currentPage={page}
              totalPages={result.totalPages}
              mode="url"
              withMargin={false}
            />
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('내 스크랩 게시글 페이지 오류:', error);
    return (
      <div className="p-4 text-center text-red-500 dark:text-red-400">
        스크랩 목록을 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.
      </div>
    );
  }
}
