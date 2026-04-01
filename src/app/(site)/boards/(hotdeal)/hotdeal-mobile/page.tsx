import { Metadata } from 'next';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { buildMetadata } from '@/shared/utils/metadataNew';
import HotdealBoardPage from '../_shared/HotdealBoardPage';

const SLUG = 'hotdeal-mobile';

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
    title: `${board.name} - 모바일 핫딜`,
    description: board.description || `스마트폰, 태블릿, 모바일 기기 핫딜과 최저가 정보를 확인하세요. 축구 커뮤니티 4590 Football.`,
    path: `/boards/${SLUG}`,
    keywords: ['모바일 핫딜', '스마트폰 특가', '태블릿 할인', '핫딜', '축구 커뮤니티', '4590', '4590football'],
  });
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  return <HotdealBoardPage slug={SLUG} searchParams={searchParams} />;
}
