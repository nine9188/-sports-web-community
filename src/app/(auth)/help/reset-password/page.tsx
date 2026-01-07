﻿import { generatePageMetadataWithDefaults } from '@/shared/utils/metadataNew';
import ResetPasswordPageClient from './page.client';

export async function generateMetadata() {
  return generatePageMetadataWithDefaults('/help/reset-password', {
    title: '비밀번호 재설정 - 4590 Football',
    description: '비밀번호 재설정 페이지입니다.',
  });
}

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
