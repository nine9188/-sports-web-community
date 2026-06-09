import Link from 'next/link';
import { CalendarDays, SquarePen, TrendingUp } from 'lucide-react';
import type { ComponentType } from 'react';

export interface HomeLinkItem {
  key: string;
  label: string;
  href: string;
  ariaLabel?: string;
}

interface HomeActionWidgetProps {
  isLoggedIn: boolean;
}

interface HomeLinkWidgetProps {
  items: HomeLinkItem[];
  ariaLabel: string;
}

type HomeActionItem = HomeLinkItem & {
  shortLabel: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  badge: string;
  cardClass: string;
  iconClass: string;
  number: string;
};

const ACTION_LINK_CLASS = [
  'group flex h-10 items-center justify-center rounded-md md:h-12 md:rounded-lg',
  'bg-[#F5F5F5] px-2 text-center text-[12px] font-medium text-gray-900 md:text-[13px]',
  'transition-all hover:bg-[#EAEAEA]',
  'dark:bg-[#262626] dark:text-[#F0F0F0] dark:hover:bg-[#333333]',
  'md:border md:border-black/7 md:dark:border-0',
].join(' ');

export function HomeLinkWidget({ items, ariaLabel }: HomeLinkWidgetProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="w-full grid grid-cols-3 gap-2 md:gap-3 max-md:bg-white max-md:dark:bg-[#1D1D1D] max-md:border max-md:border-black/7 max-md:dark:border-0 max-md:p-2"
    >
      {items.map(item => (
        <Link
          key={item.key}
          href={item.href}
          prefetch={false}
          aria-label={item.ariaLabel ?? item.label}
          className={ACTION_LINK_CLASS}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function HomeActionWidget({ isLoggedIn }: HomeActionWidgetProps) {
  const writeHref = isLoggedIn
    ? '/boards/soccer/create'
    : `/signin?redirect=${encodeURIComponent('/boards/soccer/create')}&message=${encodeURIComponent('로그인이 필요한 기능입니다.')}`;
  const items: HomeActionItem[] = [
    {
      key: 'matches',
      label: '오늘 경기 보기',
      shortLabel: '오늘 경기 보기',
      description: '일정, 스코어, 라인업',
      href: '/livescore/football',
      icon: CalendarDays,
      badge: 'LIVE',
      cardClass: 'bg-[linear-gradient(135deg,#ECFDF5_0%,#FFFFFF_48%,#E0F2FE_100%)] dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.62)_0%,rgba(13,24,22,0.92)_48%,rgba(12,74,110,0.44)_100%)]',
      iconClass: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/14 dark:text-emerald-200',
      number: '01',
    },
    {
      key: 'popular',
      label: '인기글 보기',
      shortLabel: '인기글 보기',
      description: '지금 많이 보는 이야기',
      href: '/boards/popular',
      icon: TrendingUp,
      badge: 'HOT',
      cardClass: 'bg-[linear-gradient(135deg,#FFF7ED_0%,#FFFFFF_48%,#FDF2F8_100%)] dark:bg-[linear-gradient(135deg,rgba(124,45,18,0.46)_0%,rgba(26,21,20,0.94)_48%,rgba(131,24,67,0.34)_100%)]',
      iconClass: 'bg-rose-500/12 text-rose-700 dark:bg-rose-400/14 dark:text-rose-200',
      number: '02',
    },
    {
      key: 'write',
      label: isLoggedIn ? '글쓰기' : '로그인하고 글쓰기',
      shortLabel: isLoggedIn ? '글쓰기' : '글쓰기',
      description: isLoggedIn ? '축구 얘기 바로 남기기' : '로그인 후 참여하기',
      href: writeHref,
      icon: SquarePen,
      badge: isLoggedIn ? 'POST' : 'LOGIN',
      cardClass: 'bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_48%,#F5F3FF_100%)] dark:bg-[linear-gradient(135deg,rgba(30,64,175,0.42)_0%,rgba(18,22,34,0.94)_48%,rgba(91,33,182,0.34)_100%)]',
      iconClass: 'bg-blue-500/12 text-blue-700 dark:bg-blue-400/14 dark:text-blue-200',
      number: '03',
    },
  ];

  return (
    <section
      aria-label="홈 주요 행동"
      className="w-full text-gray-950 dark:text-white"
    >
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {items.map(item => {
          const Icon = item.icon;
          const isLiveCard = item.key === 'matches';

          return (
            <Link
              key={item.key}
              href={item.href}
              prefetch={false}
              aria-label={item.ariaLabel ?? item.label}
              className={`group relative flex min-h-[96px] flex-col justify-between overflow-hidden rounded-none border border-black/7 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-black/12 hover:shadow-md md:min-h-[136px] md:rounded-lg md:p-4 dark:border-white/10 dark:hover:border-white/16 ${item.cardClass}`}
            >
              <span className="pointer-events-none absolute -right-1 bottom-0 text-[48px] font-black leading-none text-black/[0.055] transition duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-110 group-hover:text-black/[0.085] md:-right-1 md:bottom-0 md:text-[64px] dark:text-white/[0.06] dark:group-hover:text-white/[0.10]">
                {item.number}
              </span>
              <Icon className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rotate-[-10deg] stroke-[1.25] text-black/[0.035] transition duration-300 group-hover:-translate-y-[54%] group-hover:rotate-[-4deg] group-hover:text-black/[0.06] md:h-32 md:w-32 dark:text-white/[0.04] dark:group-hover:text-white/[0.07]" />
              <span className="pointer-events-none absolute -bottom-10 -right-8 h-24 w-24 rounded-full bg-white/55 blur-2xl dark:bg-white/[0.05]" />

              <div className="relative flex items-center justify-between gap-2">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md md:h-9 md:w-9 ${item.iconClass}`}>
                  <Icon className="h-4 w-4 stroke-[2] md:h-[18px] md:w-[18px]" />
                </span>
                {isLiveCard ? (
                  <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-700 sm:inline-flex dark:bg-black/24 dark:text-emerald-200 dark:ring-1 dark:ring-emerald-400/18">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-45" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    {item.badge}
                  </span>
                ) : (
                  <span className="hidden rounded-full bg-black/[0.045] px-2 py-1 text-[11px] font-bold text-gray-500 sm:inline-flex dark:bg-white/10 dark:text-white/50">
                    {item.badge}
                  </span>
                )}
              </div>

              <div className="relative space-y-1">
                <p className="whitespace-nowrap text-[13px] font-extrabold leading-tight text-gray-950 md:text-[17px] dark:text-white">
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </p>
                <p className="hidden truncate text-[12px] font-medium leading-4 text-gray-500 md:block dark:text-white/60">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

    </section>
  );
}
