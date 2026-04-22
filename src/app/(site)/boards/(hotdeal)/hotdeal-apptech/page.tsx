import { Metadata } from 'next';
import { generateHotdealMetadata } from '../_shared/generateHotdealMetadata';
import HotdealBoardPage from '../_shared/HotdealBoardPage';

const SLUG = 'hotdeal-apptech';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return generateHotdealMetadata({
    slug: SLUG,
    titleSuffix: '앱테크 핫딜',
    fallbackDescription: '앱테크, 포인트 적립, 리워드 정보를 확인하세요.',
    keywords: ['앱테크', '포인트 적립', '리워드', '핫딜'],
  });
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  return <HotdealBoardPage slug={SLUG} searchParams={searchParams} />;
}
