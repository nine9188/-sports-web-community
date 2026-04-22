import { Metadata } from 'next';
import { generateHotdealMetadata } from '../_shared/generateHotdealMetadata';
import HotdealBoardPage from '../_shared/HotdealBoardPage';

const SLUG = 'hotdeal-beauty';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return generateHotdealMetadata({
    slug: SLUG,
    titleSuffix: '뷰티 핫딜',
    fallbackDescription: '화장품, 뷰티 제품 핫딜과 최저가 정보를 확인하세요.',
    keywords: ['뷰티 핫딜', '화장품 특가', '뷰티 최저가', '핫딜'],
  });
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  return <HotdealBoardPage slug={SLUG} searchParams={searchParams} />;
}
