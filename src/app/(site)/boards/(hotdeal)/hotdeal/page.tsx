import { Metadata } from 'next';
import { generateHotdealMetadata } from '../_shared/generateHotdealMetadata';
import HotdealBoardPage from '../_shared/HotdealBoardPage';

const SLUG = 'hotdeal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return generateHotdealMetadata({
    slug: SLUG,
    titleSuffix: '축구 커뮤니티 핫딜',
    fallbackDescription: '최신 핫딜 정보를 확인하세요.',
    keywords: ['핫딜', '할인 정보', '최저가', '특가'],
  });
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  return <HotdealBoardPage slug={SLUG} searchParams={searchParams} />;
}
