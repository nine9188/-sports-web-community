import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getMyPosts } from '@/domains/settings/actions/my-posts';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import MyPostsContent from '@/domains/settings/components/my-posts/MyPostsContent';
import PostsPagination from '@/domains/settings/components/my-posts/PostsPagination';

export const metadata: Metadata = {
  title: '내가 쓴 글 - 설정',
  description: '내가 작성한 게시글 목록을 확인할 수 있습니다.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchParams {
  page?: string;
}

export default async function MyPostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  try {
    const supabase = await getSupabaseServer();

    // 사용자 인증 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect('/auth/sign-in');
    }

    const userId = user.id;

    // searchParams가 Promise이므로 await 해야 함
    const resolvedParams = await searchParams;
    const page = resolvedParams.page ? parseInt(resolvedParams.page) : 1;

    // 데이터 가져오기
    const { data, totalCount } = await getMyPosts(userId, {
      page,
      limit: 10,
    });

    // 총 페이지 수 계산
    const itemsPerPage = 10;
    const totalPages = Math.ceil((totalCount || 0) / itemsPerPage);

    return (
      <div className="space-y-4">
        <div className="mb-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden p-4">
          <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-[#F0F0F0]">내가 쓴 글</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            내가 작성한 게시글 목록을 확인할 수 있습니다.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-800 dark:border-white"></div>
          </div>
        }>
          <MyPostsContent
            key={`my-posts-content-page-${page}`}
            initialPosts={data || []}
            initialTotalCount={totalCount || 0}
          />
        </Suspense>

        <PostsPagination
          currentPage={page}
          totalPages={totalPages}
        />
      </div>
    );
  } catch (error) {
    console.error('내 게시글 페이지 오류:', error);
    return (
      <div className="p-4 text-center text-red-500 dark:text-red-400">
        게시글을 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.
      </div>
    );
  }
}
