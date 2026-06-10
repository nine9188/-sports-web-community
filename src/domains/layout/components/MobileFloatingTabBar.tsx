'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Trophy, Activity, ClipboardList, SquarePen } from 'lucide-react';

const items = [
  { href: '/livescore/football', icon: Activity, label: '경기' },
  { href: '/boards/worldcup', icon: Trophy, label: '월드컵' },
  { href: '/', icon: House, label: '홈', center: true },
  { href: '/boards/all', icon: ClipboardList, label: '게시판' },
  { href: '/boards/all/create', icon: SquarePen, label: '글쓰기' },
];

export default function MobileFloatingTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(env(safe-area-inset-bottom)+12px)] md:hidden pointer-events-none">
      <div className="relative flex h-[64px] w-[92%] max-w-[390px] items-center justify-between rounded-3xl border border-white/70 bg-white/95 px-3 shadow-[0_12px_35px_rgba(15,23,42,0.18)] backdrop-blur-xl pointer-events-auto dark:border-white/10 dark:bg-[#1D1D1D]/95">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href + '/'));

          if (item.center) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="relative -mt-7 flex w-[58px] items-center justify-center text-blue-600"
              >
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_10px_28px_rgba(37,99,235,0.55)] ring-4 ring-white transition active:scale-95 dark:ring-[#1D1D1D]">
                  <span className="absolute inset-0 rounded-full bg-blue-400 blur-md opacity-50" />
                  <Icon className="relative h-5 w-5" />
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex h-12 w-[58px] flex-col items-center justify-center gap-1 rounded-2xl transition active:scale-95 ${
                active
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="text-[10px] font-semibold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}