import { buildMetadata } from '@/shared/utils/metadataNew';
import SignUpPageClient from './page.client';

export async function generateMetadata() {
  return buildMetadata({
    title: '회원가입',
    description: '4590 Football 회원가입 페이지입니다.',
    path: '/signup',
    noindex: true,
  });
}

export default function SignUpPage() {
  return <SignUpPageClient />;
}
