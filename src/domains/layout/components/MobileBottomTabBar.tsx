'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, FileText, Home, SquarePen, Trophy } from 'lucide-react';
import type { ComponentType } from 'react';

type BottomTabItem = {
  key: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
  emphasis?: boolean;
};

interface MobileBottomTabBarProps {
  isLoggedIn: boolean;
}

export default function MobileBottomTabBar({ isLoggedIn }: MobileBottomTabBarProps) {
  const pathname = usePathname() || '/';
  const writeHref = isLoggedIn
    ? '/boards/soccer/create'
    : `/signin?redirect=${encodeURIComponent('/boards/soccer/create')}&message=${encodeURIComponent('로그인이 필요한 기능입니다.')}`;

  const items: BottomTabItem[] = [
    {
      key: 'matches',
      label: '경기',
      href: '/livescore/football',
      icon: CalendarDays,
      isActive: (current) => current === '/livescore/football',
    },
    {
      key: 'match',
      label: '월드컵',
      href: '/livescore/football/leagues/1/world-cup',
      icon: Trophy,
      isActive: (current) => (
        current.startsWith('/livescore/football/leagues/1') ||
        current.startsWith('/livescore/football/match/')
      ),
    },
    {
      key: 'home',
      label: '홈',
      href: '/',
      icon: Home,
      isActive: (current) => current === '/',
      emphasis: true,
    },
    {
      key: 'all',
      label: '전체글',
      href: '/boards/all',
      icon: FileText,
      isActive: (current) => current === '/boards/all',
    },
    {
      key: 'write',
      label: '글쓰기',
      href: writeHref,
      icon: SquarePen,
      isActive: (current) => current.endsWith('/create'),
    },
  ];

  return (
    <nav
      aria-label="모바일 하단 주요 이동"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] md:hidden"
    >
      <div className="grid h-[64px] w-full max-w-[390px] grid-cols-5 items-center rounded-2xl border border-black/7 bg-white/94 px-2 shadow-[0_14px_38px_rgba(15,23,42,0.20)] backdrop-blur-xl dark:border-white/10 dark:bg-[#1D1D1D]/94 dark:shadow-[0_14px_38px_rgba(0,0,0,0.36)]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname);

          if (item.emphasis) {
            return (
              <Link
                key={item.key}
                href={item.href}
                prefetch={false}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className="group relative flex h-full flex-col items-center justify-end pb-2 text-[10px] font-bold text-gray-500 dark:text-gray-400"
              >
                <span className="absolute -top-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-white shadow-[0_9px_24px_rgba(0,47,167,0.46)] ring-4 ring-white transition-transform group-active:scale-95 dark:bg-brand-primary-dark dark:ring-[#1D1D1D]">
                  <span className="absolute inset-0 rounded-full bg-white/20 blur-[2px]" aria-hidden />
                  <Icon className="relative h-5 w-5 stroke-[2.4]" />
                </span>
                <span className={active ? 'text-brand-primary dark:text-brand-primary-dark' : ''}>{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              prefetch={false}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={`flex h-full flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-colors active:bg-[#EAEAEA] dark:active:bg-[#333333] ${
                active
                  ? 'text-brand-primary dark:text-brand-primary-dark'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="h-[18px] w-[18px] stroke-[2.2]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
