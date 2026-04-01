import { Metadata } from 'next';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { buildMetadata } from '@/shared/utils/metadataNew';
import HotdealBoardPage from '../_shared/HotdealBoardPage';

const SLUG = 'hotdeal-sale';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await getSupabaseServer();

  const { data: board } = await supabase
    .from('boards')
    .select('name, description')
    .eq('slug', SLUG)
    .single();

  if (!board) {
    return buildMetadata({
      title: '게시판을 찾을 수 없습니다',
      description: '요청하신 게시판이 존재하지 않습니다.',
      path: `/boards/${SLUG}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: `${board.name} - 세일 정보`,
    description: board.description || `각종 세일, 할인 행사 정보를 확인하세요. 축구 커뮤니티 4590 Football.`,
    path: `/boards/${SLUG}`,
    keywords: ['세일', '할인 행사', '특가 세일', '핫딜', '축구 커뮤니티'],
  });
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  return <HotdealBoardPage slug={SLUG} searchParams={searchParams} />;
}
