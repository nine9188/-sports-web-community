import { Metadata } from 'next';
import { generateHotdealMetadata } from '../_shared/generateHotdealMetadata';
import HotdealBoardPage from '../_shared/HotdealBoardPage';

const SLUG = 'hotdeal-appliance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return generateHotdealMetadata({
    slug: SLUG,
    titleSuffix: '가전 핫딜',
    fallbackDescription: '가전제품 핫딜, 최저가 정보를 확인하세요.',
    keywords: ['가전 핫딜', '가전제품 특가', '가전 최저가', '핫딜'],
  });
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  return <HotdealBoardPage slug={SLUG} searchParams={searchParams} />;
}
