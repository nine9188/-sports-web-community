import { Metadata } from 'next';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { buildMetadata } from '@/shared/utils/metadataNew';
import HotdealBoardPage from '../_shared/HotdealBoardPage';

const SLUG = 'hotdeal-apptech';

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
    title: board.name,
    description: board.description || `${board.name} 게시판의 최신 글을 확인하세요.`,
    path: `/boards/${SLUG}`,
  });
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  return <HotdealBoardPage slug={SLUG} searchParams={searchParams} />;
}
