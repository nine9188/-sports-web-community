import { checkUserAuth } from '@/domains/settings';
import { PasswordForm } from '@/domains/settings/components';
import { Container, ContainerContent } from '@/shared/components/ui';
import { buildMetadata } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return buildMetadata({
    title: '비밀번호 변경',
    description: '계정 보안을 위해 비밀번호를 변경합니다.',
    path: '/settings/password',
    noindex: true,
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PasswordSettingsPage() {
  // 사용자 인증 확인 (자동으로 리다이렉트됨)
  const user = await checkUserAuth('/auth/signin');
  
  // OAuth 계정인 경우 비밀번호 변경 불가
  const provider = user.app_metadata?.provider;
  const isOAuthAccount: boolean = !!provider && provider !== 'email';
  
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerContent>
        <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-[#F0F0F0]">비밀번호 변경</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          계정 보안을 위해 주기적으로 비밀번호를 변경하는 것이 좋습니다.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded p-3 text-blue-700 dark:text-blue-200 text-sm mb-3">
          <p className="font-medium">안전한 비밀번호로 내정보를 보호하세요</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>다른 아이디/사이트에서 사용한 적 없는 비밀번호</li>
            <li>이전에 사용한 적 없는 비밀번호가 안전합니다.</li>
          </ul>
        </div>

        {isOAuthAccount && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded p-4 text-yellow-800 dark:text-yellow-200 mb-4">
            <p className="text-sm font-medium">소셜 로그인(OAuth) 계정입니다.</p>
            <p className="text-sm mt-1">
              소셜 로그인으로 가입한 계정은 비밀번호를 변경할 수 없습니다.
              해당 소셜 계정의 비밀번호를 변경하려면 해당 서비스에서 변경해주세요.
            </p>
          </div>
        )}

        <PasswordForm isOAuthAccount={isOAuthAccount} />
      </ContainerContent>
    </Container>
  );
} 