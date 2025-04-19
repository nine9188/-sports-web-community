import { redirect } from 'next/navigation';
import { getMyPosts } from './actions';
import { createClient } from '@/app/lib/supabase.server';
import { Metadata } from 'next';
import MyPostsContent from './components/MyPostsContent';
import PostsPagination from './components/PostsPagination';

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
  const { success, data, error, totalCount } = await getMyPosts(userId, {
    page,
    limit: 10,
  });
  
  if (!success) {
    console.error('내 게시글을 가져오는 중 오류 발생:', error);
  }
  
  // 총 페이지 수 계산
  const itemsPerPage = 10;
  const totalPages = Math.ceil((totalCount || 0) / itemsPerPage);
  
  return (
    <div className="space-y-4">
      <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
        <h2 className="text-xl font-semibold mb-1">내가 쓴 글</h2>
        <p className="text-gray-500 text-sm">
          내가 작성한 게시글 목록을 확인할 수 있습니다.
        </p>
      </div>
      
      <MyPostsContent
        initialPosts={data || []}
        initialTotalCount={totalCount || 0}
      />
      
      <PostsPagination
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}