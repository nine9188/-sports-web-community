﻿import { generatePageMetadataWithDefaults } from '@/shared/utils/metadataNew';
import AccountRecoveryPageClient from './page.client';

export async function generateMetadata() {
  return generatePageMetadataWithDefaults('/help/account-recovery', {
    title: '계정 찾기 - 4590 Football',
    description: '아이디/비밀번호 찾기 페이지입니다.',
  });
}

export default function AccountRecoveryPage() {
  return <AccountRecoveryPageClient />;
}
