import { buildMetadata } from '@/shared/utils/metadataNew';
import SignInPageClient from './page.client';

export async function generateMetadata() {
  return buildMetadata({
    title: '로그인',
    description: '4590 Football 로그인 페이지입니다.',
    path: '/signin',
    noindex: true,
  });
}

export default function SignInPage() {
  return <SignInPageClient />;
}
