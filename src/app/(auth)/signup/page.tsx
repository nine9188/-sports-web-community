﻿import { generatePageMetadataWithDefaults } from '@/shared/utils/metadataNew';
import SignUpPageClient from './page.client';

export async function generateMetadata() {
  return generatePageMetadataWithDefaults('/signup', {
    title: '회원가입 - 4590 Football',
    description: '4590 Football 회원가입 페이지입니다.',
  });
}

export default function SignUpPage() {
  return <SignUpPageClient />;
}
