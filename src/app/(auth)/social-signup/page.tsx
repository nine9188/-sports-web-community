﻿import { generatePageMetadataWithDefaults } from '@/shared/utils/metadataNew';
import SocialSignUpPageClient from './page.client';

export async function generateMetadata() {
  return generatePageMetadataWithDefaults('/social-signup', {
    title: '소셜 회원가입 - 4590 Football',
    description: 'SNS 계정으로 회원가입을 진행합니다.',
  });
}

export default function SocialSignUpPage() {
  return <SocialSignUpPageClient />;
}
