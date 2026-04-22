import { Metadata } from 'next';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { buildMetadata } from '@/shared/utils/metadataNew';

interface HotdealMetadataConfig {
  slug: string;
  titleSuffix: string;
  fallbackDescription: string;
  keywords: string[];
}

export async function generateHotdealMetadata({
  slug,
  titleSuffix,
  fallbackDescription,
  keywords,
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

  return buildMetadata({
    title: `${board.name} - ${titleSuffix}`,
    description: board.description || `${fallbackDescription} 축구 커뮤니티 4590 Football.`,
    path: `/boards/${slug}`,
    keywords: [...keywords, '축구 커뮤니티', '4590', '4590football'],
  });
}
