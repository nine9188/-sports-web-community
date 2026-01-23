import { Metadata } from 'next';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import { siteConfig } from '@/shared/config';
import HotdealBoardPage from '../_shared/HotdealBoardPage';

const SLUG = 'hotdeal-mobile';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = await getSupabaseServer();
    const seoSettings = await getSeoSettings();

    const siteName = seoSettings?.site_name || siteConfig.name;
    const pagePath = `/boards/${SLUG}`;

    const pageOverride = seoSettings?.page_overrides?.[pagePath];

    const { data: board } = await supabase
      .from('boards')
      .select('name, description')
      .eq('slug', SLUG)
      .single();

    if (!board) {
      return {
        title: '게시판을 찾을 수 없습니다',
        description: '요청하신 게시판이 존재하지 않습니다.',
      };
    }

    const title = pageOverride?.title || `${board.name} - ${siteName}`;
    const description = pageOverride?.description || board.description || `${board.name} 게시판의 최신 글을 확인하세요.`;
    const url = siteConfig.getCanonical(pagePath);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        siteName,
        locale: siteConfig.locale,
        images: [siteConfig.getDefaultOgImageObject(title)],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [siteConfig.defaultOgImage],
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error('[HotdealMobilePage generateMetadata] 오류:', error);
    return {
      title: '핫딜 모바일 - 4590 Football',
      description: '모바일 핫딜 정보 게시판',
    };
  }
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  return <HotdealBoardPage slug={SLUG} searchParams={searchParams} />;
}
