import { Metadata } from 'next';
import { generateHotdealMetadata } from '../_shared/generateHotdealMetadata';
import HotdealBoardPage from '../_shared/HotdealBoardPage';

const SLUG = 'hotdeal-mobile';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}): Promise<Metadata> {
  return generateHotdealMetadata({
    slug: SLUG,
    titleSuffix: '모바일 핫딜',
    fallbackDescription: '스마트폰, 태블릿, 모바일 기기 핫딜과 최저가 정보를 확인하세요.',
    keywords: ['모바일 핫딜', '스마트폰 특가', '태블릿 할인', '핫딜'],
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
