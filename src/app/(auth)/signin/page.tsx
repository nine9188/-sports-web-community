﻿import { generatePageMetadataWithDefaults } from '@/shared/utils/metadataNew';
import SignInPageClient from './page.client';

export async function generateMetadata() {
  return generatePageMetadataWithDefaults('/signin', {
    title: '로그인 - 4590 Football',
    description: '4590 Football 로그인 페이지입니다.',
  });
}

export default function SignInPage() {
  return <SignInPageClient />;
}
