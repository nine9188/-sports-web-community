import { buildMetadata } from '@/shared/utils/metadataNew';
import SocialSignUpPageClient from './page.client';

export async function generateMetadata() {
  return buildMetadata({
    title: '소셜 회원가입',
    description: 'SNS 계정으로 회원가입을 진행합니다.',
    path: '/social-signup',
    noindex: true,
  });
}

export default function SocialSignUpPage() {
  return <SocialSignUpPageClient />;
}
