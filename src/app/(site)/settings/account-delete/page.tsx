import { redirect } from 'next/navigation';
import { AccountDeleteForm } from '@/domains/settings/components';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { Container, ContainerContent } from '@/shared/components/ui';
import { buildMetadata } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return buildMetadata({
    title: '회원 탈퇴',
    description: '계정을 삭제하고 서비스를 탈퇴합니다.',
    path: '/settings/account-delete',
    noindex: true,
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountDeletePage() {
  // Supabase 클라이언트 생성
  const supabase = await getSupabaseServer();

  // 사용자 인증 정보 확인 (getUser 메서드 사용)
  const { data: { user }, error } = await supabase.auth.getUser();

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user || error) {
    redirect('/auth/sign-in?callbackUrl=/settings/account-delete');
  }

  // 사용자 프로필 정보 조회
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('프로필 정보 조회 오류:', profileError);
  }

  const nickname = profile?.nickname || '사용자';
  const email = user.email || '';

  return (
    <div className="space-y-4">
      <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
        <ContainerContent>
          <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-[#F0F0F0]">회원 탈퇴</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            계정을 삭제하고 모든 데이터를 영구적으로 제거합니다.
          </p>

          {/* 회원 탈퇴 주의사항 */}
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400 dark:text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">주의 사항</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.</li>
                    <li>작성한 게시글, 댓글, 개인 정보 등 모든 활동 내역이 사라집니다.</li>
                    <li>한 번 삭제된 계정은 복구할 수 없습니다.</li>
                    <li>계정 삭제 후에도 다시 가입은 가능하지만, 이전 데이터는 복구되지 않습니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 계정 삭제 폼 */}
          <AccountDeleteForm email={email} nickname={nickname} />
        </ContainerContent>
      </Container>
    </div>
  );
}
