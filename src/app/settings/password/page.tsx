import { checkUserAuth } from '@/domains/settings';
import { Metadata } from 'next';
import { PasswordForm } from '@/domains/settings/components';

export const metadata: Metadata = {
  title: '비밀번호 변경 - 설정',
  description: '계정 보안을 위해 비밀번호를 변경합니다.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PasswordSettingsPage() {
  // 사용자 인증 확인 (자동으로 리다이렉트됨)
  const user = await checkUserAuth('/auth/signin');
  
  // OAuth 계정인 경우 비밀번호 변경 불가
  const isOAuthAccount = user.app_metadata?.provider && 
    user.app_metadata.provider !== 'email';
  
  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
      <h2 className="text-xl font-semibold mb-1">비밀번호 변경</h2>
      <p className="text-gray-500 text-sm mb-6">
        계정 보안을 위해 주기적으로 비밀번호를 변경하는 것이 좋습니다.
      </p>
      
      {isOAuthAccount ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-800">
          <p className="text-sm font-medium">소셜 로그인(OAuth) 계정입니다.</p>
          <p className="text-sm mt-1">
            소셜 로그인으로 가입한 계정은 이 페이지에서 비밀번호를 변경할 수 없습니다.
            해당 소셜 계정의 비밀번호를 변경하려면 해당 서비스에서 변경해주세요.
          </p>
        </div>
      ) : (
        <PasswordForm />
      )}
    </div>
  );
} 