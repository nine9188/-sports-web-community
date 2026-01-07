﻿import { generatePageMetadataWithDefaults } from '@/shared/utils/metadataNew';
import EmailConfirmedPageClient from './page.client';

export async function generateMetadata() {
  const metadata = await generatePageMetadataWithDefaults('/auth/confirmed', {
    title: '이메일 인증 완료 - 4590 Football',
    description: '이메일 인증 완료 안내 페이지입니다.',
  });
  return {
    ...metadata,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export default function EmailConfirmedPage() {
  return <EmailConfirmedPageClient />;
}
