import { buildMetadata } from '@/shared/utils/metadataNew';
import EmailConfirmedPageClient from './page.client';

export async function generateMetadata() {
  return buildMetadata({
    title: '이메일 인증 완료',
    description: '이메일 인증 완료 안내 페이지입니다.',
    path: '/auth/confirmed',
    noindex: true,
  });
}

export default function EmailConfirmedPage() {
  return <EmailConfirmedPageClient />;
}
