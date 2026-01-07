﻿import { generatePageMetadataWithDefaults } from '@/shared/utils/metadataNew';
import AccountFoundPageClient from './page.client';

export async function generateMetadata() {
  return generatePageMetadataWithDefaults('/help/account-found', {
    title: '계정 찾기 완료 - 4590 Football',
    description: '계정 찾기 결과 안내 페이지입니다.',
  });
}

export default function AccountFoundPage() {
  return <AccountFoundPageClient />;
}
