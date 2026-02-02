import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export type QuickLinkItem = {
  key: string;
  label: string;
  href: string;
  icon?: string; // emoji or simple text icon
  iconImage?: string; // 이미지 경로 (이모지 대신 이미지 사용 시)
  ariaLabel?: string;
};

export type BoardQuickLinksWidgetProps = {
  items?: QuickLinkItem[];
  className?: string;
};

const DEFAULT_ITEMS: QuickLinkItem[] = [
  { key: 'popular', label: '인기', href: '/boards/popular', iconImage: '/icons/popular.png', ariaLabel: '인기 게시판' },
  { key: 'all', label: '전체', href: '/boards/all', iconImage: '/icons/post.png', ariaLabel: '전체 게시판' },
  { key: 'notice', label: '공지', href: '/boards/notice', iconImage: '/icons/notice.png', ariaLabel: '공지 게시판' },
  { key: 'news', label: '소식', href: '/boards/news', iconImage: '/icons/news.png', ariaLabel: '소식 게시판' },
  { key: 'live', label: '경기 확인', href: '/livescore/football', iconImage: '/icons/livescore.png', ariaLabel: '경기 확인' },
  { key: 'data-center', label: '데이터센터', href: '/livescore/football/leagues', iconImage: '/icons/data.png', ariaLabel: '데이터센터' },
];

function classNames(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

export default function BoardQuickLinksWidget({ items = DEFAULT_ITEMS, className }: BoardQuickLinksWidgetProps) {
  return (
    <nav
      className={classNames(
        // 모바일/데스크탑 공통: 6칸 그리드
        'w-full grid grid-cols-6 gap-2 md:gap-3',
        // 모바일만: 전체 컨테이너 (사각형, 공통 UI Container 스타일)
        'max-md:bg-white max-md:dark:bg-[#1D1D1D] max-md:border max-md:border-black/7 max-md:dark:border-0 max-md:p-3',
        // 데스크탑: 투명 (기본값)
        className
      )}
      aria-label="게시판 바로가기"
    >
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-label={item.ariaLabel ?? item.label}
          className={classNames(
            // 타일 스타일 (모바일: 심플, 데스크탑: 헤더 UI 색상)
            'group text-gray-900 dark:text-[#F0F0F0]',
            'flex flex-col items-center justify-center md:flex-row md:items-center md:justify-center',
            'gap-1 md:gap-0 rounded-lg',
            // 데스크탑에서만 카드 스타일 적용 (헤더/서브 컨테이너 색상, 헤더 높이)
            'md:bg-[#F5F5F5] md:dark:bg-[#262626] md:border md:border-black/7 md:dark:border-0',
            'md:hover:bg-[#EAEAEA] md:dark:hover:bg-[#333333]',
            'md:h-12', // 데스크탑: 헤더 표준 높이 (48px)
            'px-1 py-1 md:px-2', // 데스크탑: 좌우 패딩만
            'transition-all',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60'
          )}
        >
          {/* 모바일: 아이콘 컨테이너 박스 */}
          <span
            className={classNames(
              'inline-flex items-center justify-center shrink-0',
              'w-12 h-12 bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-0 shadow-sm',
              'group-hover:bg-[#EAEAEA] group-hover:dark:bg-[#333333]',
              'group-hover:scale-110 transition-all',
              'md:hidden' // PC에서 숨김
            )}
            style={{ borderRadius: '0.5rem' }}
            aria-hidden
          >
            {item.iconImage ? (
              <Image
                src={item.iconImage}
                alt=""
                width={28}
                height={28}
                className="w-7 h-7 object-contain dark:invert"
                priority
              />
            ) : (
              <span className="text-2xl">{item.icon ?? '📌'}</span>
            )}
          </span>

          {/* PC: 아이콘만 (컨테이너 없음) */}
          <span
            className="hidden md:inline-flex items-center justify-center mr-1"
            aria-hidden
          >
            {item.iconImage ? (
              <Image
                src={item.iconImage}
                alt=""
                width={20}
                height={20}
                className="w-5 h-5 object-contain dark:invert"
                priority
              />
            ) : (
              <span className="text-xl">{item.icon ?? '📌'}</span>
            )}
          </span>

          <span className="w-full md:w-auto text-[10px] md:text-xs font-medium leading-tight md:leading-none text-center md:text-center whitespace-nowrap truncate md:truncate md:ml-0 mt-1 md:mt-0">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}


