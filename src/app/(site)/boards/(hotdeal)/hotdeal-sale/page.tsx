import { Metadata } from 'next';
import { generateHotdealMetadata } from '../_shared/generateHotdealMetadata';
import HotdealBoardPage from '../_shared/HotdealBoardPage';

const SLUG = 'hotdeal-sale';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return generateHotdealMetadata({
    slug: SLUG,
    titleSuffix: '세일 정보',
    fallbackDescription: '각종 세일, 할인 행사 정보를 확인하세요.',
    keywords: ['세일', '할인 행사', '특가 세일', '핫딜'],
  });
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  return <HotdealBoardPage slug={SLUG} searchParams={searchParams} />;
}
