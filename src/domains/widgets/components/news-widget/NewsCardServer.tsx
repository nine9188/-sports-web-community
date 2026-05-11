import Link from 'next/link';
import { formatDate } from '@/shared/utils/dateUtils';
import NewsImageClient from './NewsImageClient';
import type { NewsItem } from './types';

const CARD_STYLES = {
  base: 'bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden md:hover:bg-[#EAEAEA] md:dark:hover:bg-[#333333] transition-colors group touch-manipulation',
  transform: {
    WebkitTapHighlightColor: 'transparent',
    transform: 'translate3d(0,0,0)',
  },
} as const;

interface MainCardProps {
  item: NewsItem;
}

function NewsMeta({ item, compact = false }: { item: NewsItem; compact?: boolean }) {
  const source = String(item?.source || '출처 없음');
  const author = item.authorNickname || '익명';
  const date = formatDate(item?.publishedAt || '');
  const views = item.views ?? 0;
  const likes = item.likes ?? 0;

  return (
    <div className="mt-2 flex w-full min-w-0 items-center justify-between gap-3 text-[11px] leading-none text-gray-500 dark:text-gray-400">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate" title={source}>{source}</span>
        <span className="flex-shrink-0 text-gray-300 dark:text-gray-600">|</span>
        {!compact && (
          <>
            <span className="truncate" title={author}>{author}</span>
            <span className="flex-shrink-0 text-gray-300 dark:text-gray-600">|</span>
          </>
        )}
        <span className="flex-shrink-0">{date}</span>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <span>조회 {views}</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>추천 {likes}</span>
      </div>
    </div>
  );
}

export function MainCard({ item }: MainCardProps) {
  return (
    <Link
      href={item.url}
      prefetch={false}
      className="block bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden md:hover:bg-[#EAEAEA] md:dark:hover:bg-[#333333] transition-colors group touch-manipulation h-[320px]"
      style={CARD_STYLES.transform}
    >
      <div className="flex h-full flex-col">
        <div className="relative w-full flex-1 bg-[#F5F5F5] dark:bg-[#262626]">
          <NewsImageClient
            imageUrl={item.imageUrl}
            alt={String(item?.title || '뉴스 이미지')}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="bg-white p-3 dark:bg-[#1D1D1D]">
          <h3 className="line-clamp-2 text-[13px] font-medium text-gray-900 transition-colors group-hover:underline dark:text-[#F0F0F0]">
            {String(item?.title || '제목 없음')}
          </h3>
          <NewsMeta item={item} />
        </div>
      </div>
    </Link>
  );
}

interface SideCardProps {
  item: NewsItem;
}

export function SideCard({ item }: SideCardProps) {
  return (
    <Link
      href={item.url}
      prefetch={false}
      className={`${CARD_STYLES.base} h-[96px]`}
      style={CARD_STYLES.transform}
    >
      <div className="flex h-full">
        <div className="flex min-w-0 flex-1 flex-col justify-center p-3">
          <h4 className="line-clamp-2 text-[13px] leading-snug text-gray-900 transition-colors group-hover:underline dark:text-[#F0F0F0]">
            {String(item?.title || '제목 없음')}
          </h4>
          <NewsMeta item={item} compact />
        </div>

        <div className="relative h-[96px] w-[96px] flex-shrink-0 overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] md:rounded-r-lg">
          <NewsImageClient
            imageUrl={item.imageUrl}
            alt={String(item?.title || '뉴스 이미지')}
            sizes="96px"
          />
        </div>
      </div>
    </Link>
  );
}
