import { buildMetadata } from '@/shared/utils/metadataNew';
import FindIdPageClient from './page.client';

export async function generateMetadata() {
  return buildMetadata({
    title: '아이디 찾기',
    description: '가입시 사용한 이메일로 아이디를 찾을 수 있습니다.',
    path: '/help/find-id',
    noindex: true,
  });
}

export default function FindIdPage() {
  return <FindIdPageClient />;
}
