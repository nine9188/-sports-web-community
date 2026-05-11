import { Metadata } from 'next';
import { generateHotdealMetadata } from '../_shared/generateHotdealMetadata';
import HotdealBoardPage from '../_shared/HotdealBoardPage';

const SLUG = 'hotdeal-food';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}): Promise<Metadata> {
  return generateHotdealMetadata({
    slug: SLUG,
    titleSuffix: '식품 핫딜',
    fallbackDescription: '식품, 음료 핫딜과 최저가 정보를 확인하세요.',
    keywords: ['식품 핫딜', '식품 특가', '음료 할인', '핫딜'],
    searchParams: await searchParams,
  });
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  return <HotdealBoardPage slug={SLUG} searchParams={searchParams} />;
}
