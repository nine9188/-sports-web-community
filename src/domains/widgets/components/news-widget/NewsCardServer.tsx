import Link from 'next/link';
import { formatDate } from '@/shared/utils/dateUtils';
import NewsImageClient from './NewsImageClient';
import type { NewsItem } from './types';

const CARD_STYLES = {
  base: "bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors group touch-manipulation",
  transform: {
    WebkitTapHighlightColor: 'transparent',
    transform: 'translate3d(0,0,0)'
  }
} as const;

interface MainCardProps {
  item: NewsItem;
}

/**
 * 메인 배너 카드 (큰 이미지 + 제목)
 */
export function MainCard({ item }: MainCardProps) {
  return (
    <Link
      href={item.url}
      className="block bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors group touch-manipulation h-full"
      style={CARD_STYLES.transform}
    >
      <div className="flex flex-col h-full">
        <div className="relative w-full h-48 md:h-56 bg-[#F5F5F5] dark:bg-[#262626]">
          <NewsImageClient
            imageUrl={item.imageUrl}
            alt={String(item?.title || '뉴스 이미지')}
            sizes="(max-width: 768px) 100vw, 50vw"
            spinnerSize="lg"
          />
        </div>
        <div className="p-3 bg-white dark:bg-[#1D1D1D] flex-grow">
          <h3 className="text-xs md:text-sm font-semibold line-clamp-2 text-gray-900 dark:text-[#F0F0F0] group-hover:underline transition-colors">
            {String(item?.title || '제목 없음')}
          </h3>
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>{String(item?.source || '출처 없음')}</span>
            <span>{formatDate(item?.publishedAt || '')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface SideCardProps {
  item: NewsItem;
}

/**
 * 사이드 카드 (작은 이미지 + 제목, 가로 레이아웃)
 */
export function SideCard({ item }: SideCardProps) {
  return (
    <Link
      href={item.url}
      className={CARD_STYLES.base}
      style={CARD_STYLES.transform}
    >
      <div className="flex h-full">
        {/* 텍스트 영역 (왼쪽) */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <h4 className="text-xs md:text-sm font-medium line-clamp-2 text-gray-900 dark:text-[#F0F0F0] group-hover:underline transition-colors mb-2">
            {String(item?.title || '제목 없음')}
          </h4>
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span className="truncate max-w-[120px]">{String(item?.source || '출처 없음')}</span>
            <span>{formatDate(item?.publishedAt || '')}</span>
          </div>
        </div>

        {/* 이미지 영역 (오른쪽) */}
        <div className="relative w-24 md:w-28 aspect-[1/1] md:aspect-auto md:h-auto flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] rounded-r-lg overflow-hidden">
          <NewsImageClient
            imageUrl={item.imageUrl}
            alt={String(item?.title || '뉴스 이미지')}
            sizes="(max-width: 768px) 100px, 120px"
            spinnerSize="sm"
          />
        </div>
      </div>
    </Link>
  );
}

interface ListCardProps {
  item: NewsItem;
  isLeftColumn: boolean;
  isLastRow: boolean;
}

/**
 * 리스트 카드 (2열 그리드용)
 */
export function ListCard({ item, isLeftColumn, isLastRow }: ListCardProps) {
  return (
    <Link
      href={item.url}
      className={`${CARD_STYLES.base} w-full md:w-[calc(50%-8px)] ${isLeftColumn ? 'md:mr-4' : ''} ${isLastRow ? 'mb-0' : 'mb-4'}`}
      style={CARD_STYLES.transform}
    >
      <div className="flex h-full">
        {/* 텍스트 영역 (왼쪽) */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <h4 className="text-xs md:text-sm font-medium line-clamp-2 text-gray-900 dark:text-[#F0F0F0] group-hover:underline transition-colors mb-2">
            {String(item?.title || '제목 없음')}
          </h4>
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span className="truncate max-w-[120px]">{String(item?.source || '출처 없음')}</span>
            <span>{formatDate(item?.publishedAt || '')}</span>
          </div>
        </div>

        {/* 이미지 영역 (오른쪽) */}
        <div className="relative w-24 md:w-28 aspect-[1/1] md:aspect-auto md:h-auto flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] rounded-r-lg overflow-hidden">
          <NewsImageClient
            imageUrl={item.imageUrl}
            alt={String(item?.title || '뉴스 이미지')}
            sizes="(max-width: 768px) 100px, 120px"
            spinnerSize="sm"
          />
        </div>
      </div>
    </Link>
  );
}
