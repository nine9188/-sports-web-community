import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/shared/api/supabaseServer';
import { getMyComments } from '@/domains/settings/actions/my-comments';
import MyCommentsContent from '@/domains/settings/components/my-comments/MyCommentsContent';
import PostsPagination from '@/domains/settings/components/my-comments/PostsPagination';


export const metadata: Metadata = {
  title: '내가 쓴 댓글 - 설정',
  description: '내가 작성한 댓글 목록을 확인할 수 있습니다.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchParams {
  page?: string;
}

export default async function MyCommentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  try {
    const supabase = await createClient();
    
    // 사용자 인증 확인 (getUser 사용)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('사용자 인증 확인 오류:', userError);
      redirect('/auth/sign-in');
    }
    
    const userId = user.id;
    
    // searchParams가 Promise이므로 await 해야 함
    const resolvedParams = await searchParams;
    const page = resolvedParams.page ? parseInt(resolvedParams.page) : 1;
    
    // 초기 데이터 가져오기
    const { success, data, error, totalCount } = await getMyComments(userId, {
      page,
      limit: 10,
    });
    
    if (!success) {
      console.error('내 댓글을 가져오는 중 오류 발생:', error);
    }
    
    // 총 페이지 수 계산
    const itemsPerPage = 10;
    const totalPages = Math.ceil((totalCount || 0) / itemsPerPage);
    
    return (
      <div className="space-y-4">
        <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
          <h2 className="text-xl font-semibold mb-1">내가 쓴 댓글</h2>
          <p className="text-gray-500 text-sm">
            내가 작성한 댓글 목록을 확인할 수 있습니다.
          </p>
        </div>
        
        <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div></div>}>
          <MyCommentsContent
            key={`my-comments-content-page-${page}`}
            initialComments={data || []}
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
    console.error('페이지 로딩 중 오류 발생:', error);
    return (
      <div className="p-4 text-center text-red-500">
        댓글을 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.
      </div>
    );
  }
} 