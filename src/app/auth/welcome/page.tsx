import { buildMetadata } from '@/shared/utils/metadataNew';
import WelcomePageClient from './page.client';

export async function generateMetadata() {
  return buildMetadata({
    title: '회원가입 완료',
    description: '4590 Football 회원가입이 완료되었습니다.',
    path: '/auth/welcome',
    noindex: true,
  });
}

export default function WelcomePage() {
  return <WelcomePageClient />;
}
