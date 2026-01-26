import { buildMetadata } from '@/shared/utils/metadataNew';
import AccountRecoveryPageClient from './page.client';

export async function generateMetadata() {
  return buildMetadata({
    title: '계정 찾기',
    description: '아이디/비밀번호 찾기 페이지입니다.',
    path: '/help/account-recovery',
    noindex: true,
  });
}

export default function AccountRecoveryPage() {
  return <AccountRecoveryPageClient />;
}
