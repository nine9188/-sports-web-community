import { buildMetadata } from '@/shared/utils/metadataNew';
import ResetPasswordPageClient from './page.client';

export async function generateMetadata() {
  return buildMetadata({
    title: '비밀번호 재설정',
    description: '비밀번호 재설정 페이지입니다.',
    path: '/help/reset-password',
    noindex: true,
  });
}

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
