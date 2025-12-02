"use client";

import React from 'react';
import Link from 'next/link';

export type QuickLinkItem = {
  key: string;
  label: string;
  href: string;
  icon?: string; // emoji or simple text icon
  ariaLabel?: string;
};

export type BoardQuickLinksWidgetProps = {
  items?: QuickLinkItem[];
  className?: string;
};

const DEFAULT_ITEMS: QuickLinkItem[] = [
  { key: 'popular', label: '인기', href: '/boards', icon: '🔥', ariaLabel: '인기 게시판' },
  { key: 'all', label: '전체', href: '/boards', icon: '💬', ariaLabel: '전체 게시판' },
  { key: 'hotdeal', label: '핫딜', href: '/boards', icon: '🏷️', ariaLabel: '핫딜 게시판' },
  { key: 'build', label: '조립/견적', href: '/boards', icon: '🛠️', ariaLabel: '조립/견적 게시판' },
  { key: 'cpu', label: 'CPU', href: '/boards', icon: '🖥️', ariaLabel: 'CPU 게시판' },
  { key: 'gpu', label: '그래픽카드', href: '/boards', icon: '🎮', ariaLabel: '그래픽카드 게시판' },
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
            // 타일 스타일 (모바일: 심플, 데스크탑: 카드 톤)
            'group text-gray-900 dark:text-[#F0F0F0]',
            'flex flex-col items-center justify-center md:flex-row md:items-center md:justify-center',
            'gap-1 md:gap-0 rounded-lg',
            // 데스크탑에서만 카드 스타일 적용
            'md:bg-white md:dark:bg-[#1D1D1D] md:border md:border-black/7 md:dark:border-0',
            'md:hover:bg-[#EAEAEA] md:dark:hover:bg-[#333333]',
            'px-1 py-1 md:px-1 md:py-2',
            'transition-all',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60'
          )}
        >
          <span
            className={classNames(
              'inline-flex items-center justify-center shrink-0',
              // 모바일: 아이콘을 박스에 담고 (공통 UI ContainerHeader 색상 + 호버), 데스크탑은 심플하게
              'w-12 h-12 bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-0 shadow-sm text-2xl',
              'group-hover:bg-[#EAEAEA] group-hover:dark:bg-[#333333]',
              'md:w-8 md:h-8 md:bg-transparent md:border-0 md:shadow-none md:text-xl md:mr-0',
              'group-hover:scale-110 transition-all'
            )}
            style={{ borderRadius: '0.5rem' }}
            aria-hidden
          >
            {item.icon ?? '📌'}
          </span>
          <span className="w-full md:w-auto text-[10px] md:text-xs font-medium leading-tight md:leading-none text-center md:text-center whitespace-nowrap truncate md:truncate md:ml-0 mt-1 md:mt-0">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}


