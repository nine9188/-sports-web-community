import { Metadata } from 'next';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { BoardListSearchParams, getBoardListMetadataState } from '../../_shared/boardListMetadata';

interface HotdealMetadataConfig {
  slug: string;
  titleSuffix: string;
  fallbackDescription: string;
  keywords: string[];
  searchParams?: BoardListSearchParams;
}

export async function generateHotdealMetadata({
  slug,
  titleSuffix,
  fallbackDescription,
  keywords,
  searchParams,
}: HotdealMetadataConfig): Promise<Metadata> {
  const supabase = await getSupabaseServer();

  const { data: board } = await supabase
    .from('boards')
    .select('name, description')
    .eq('slug', slug)
    .single();

  if (!board) {
    return buildMetadata({
      title: '게시판을 찾을 수 없습니다',
      description: '요청하신 게시판이 존재하지 않습니다.',
      path: `/boards/${slug}`,
      noindex: true,
    });
  }

  const metadataState = getBoardListMetadataState(`/boards/${slug}`, searchParams);

  return buildMetadata({
    title: `${board.name} - ${titleSuffix}`,
    description: board.description || `${fallbackDescription} 축구 커뮤니티 4590 Football.`,
    path: metadataState.path,
    keywords: [...keywords, '축구 커뮤니티', '4590', '4590football'],
    ...(metadataState.robots && { robots: metadataState.robots }),
  });
}
