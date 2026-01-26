import { buildMetadata } from '@/shared/utils/metadataNew';
import AccountFoundPageClient from './page.client';

export async function generateMetadata() {
  return buildMetadata({
    title: '계정 찾기 완료',
    description: '계정 찾기 결과 안내 페이지입니다.',
    path: '/help/account-found',
    noindex: true,
  });
}

export default function AccountFoundPage() {
  return <AccountFoundPageClient />;
}
