import Link from 'next/link';

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

const ACTION_LINK_CLASS = [
  'group flex h-12 items-center justify-center rounded-lg',
  'bg-[#F5F5F5] px-2 text-center text-[13px] font-medium text-gray-900',
  'transition-all hover:bg-[#EAEAEA]',
  'dark:bg-[#262626] dark:text-[#F0F0F0] dark:hover:bg-[#333333]',
  'md:border md:border-black/7 md:dark:border-0',
].join(' ');

export function HomeLinkWidget({ items, ariaLabel }: HomeLinkWidgetProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="w-full grid grid-cols-3 gap-2 md:gap-3 max-md:bg-white max-md:dark:bg-[#1D1D1D] max-md:border max-md:border-black/7 max-md:dark:border-0 max-md:p-3"
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
  const items: HomeLinkItem[] = [
    { key: 'matches', label: '오늘 경기 보기', href: '/livescore/football' },
    { key: 'popular', label: '인기글 보기', href: '/boards/popular' },
    { key: 'write', label: isLoggedIn ? '글쓰기' : '로그인하고 글쓰기', href: writeHref },
  ];

  return <HomeLinkWidget items={items} ariaLabel="홈 주요 행동" />;
}
