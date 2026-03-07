import { buildMetadata } from '@/shared/utils/metadataNew';
import FindPasswordPageClient from './page.client';

export async function generateMetadata() {
  return buildMetadata({
    title: '비밀번호 찾기',
    description: '아이디를 입력하면 등록된 이메일로 비밀번호 재설정 링크를 보내드립니다.',
    path: '/help/find-password',
    noindex: true,
  });
}

export default function FindPasswordPage() {
  return <FindPasswordPageClient />;
}
