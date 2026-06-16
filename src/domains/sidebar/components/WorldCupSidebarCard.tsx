"use client";

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { WorldCupSidebarMatch } from '@/domains/livescore/actions/footballApi';

const MATCH_DISPLAY_AFTER_MS = 2.5 * 60 * 60 * 1000;
const INITIAL_RENDER_TIME = 0;

const FALLBACK_WORLD_CUP_MATCHES: WorldCupSidebarMatch[] = [
  {
    label: '멕시코 vs 남아공',
    kickoffKst: '2026-06-12T11:00:00+09:00',
  },
  {
    label: '대한민국 vs 체코',
    kickoffKst: '2026-06-12T11:00:00+09:00',
  },
  {
    label: '캐나다 vs 보스니아',
    kickoffKst: '2026-06-13T04:00:00+09:00',
  },
  {
    label: '미국 vs 파라과이',
    kickoffKst: '2026-06-13T10:00:00+09:00',
  },
];

type RemainingTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getActiveMatch(matches: WorldCupSidebarMatch[], now: number) {
  return matches.find((match) => {
    const kickoff = new Date(match.kickoffKst).getTime();
    return now < kickoff + MATCH_DISPLAY_AFTER_MS;
  }) ?? matches[matches.length - 1] ?? FALLBACK_WORLD_CUP_MATCHES[FALLBACK_WORLD_CUP_MATCHES.length - 1];
}

function getRemaining(targetTime: number, now: number): RemainingTime {
  const diff = Math.max(0, targetTime - now);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function formatKickoff(kickoffKst: string) {
  const date = new Date(kickoffKst);
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const hours = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minutes = parts.find((part) => part.type === 'minute')?.value ?? '00';

  return `${month}.${day} ${hours}:${minutes}`;
}

function CountdownNumber({ value, label, showBorder = true }: { value: number; label: string; showBorder?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 px-2 ${showBorder ? 'border-e border-white/20' : 'border-e border-transparent transition-colors duration-300 group-hover:border-white/20'}`}>
      <span className="inline-flex min-w-[2ch] justify-center text-base leading-none font-bold text-white tabular-nums">
        <span className="relative flex h-[1em] min-w-[2ch] items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
      <span className="text-[8px] leading-none font-medium text-white capitalize">
        {label}
      </span>
    </div>
  );
}

interface WorldCupSidebarCardProps {
  matches?: WorldCupSidebarMatch[];
}

export default function WorldCupSidebarCard({ matches = FALLBACK_WORLD_CUP_MATCHES }: WorldCupSidebarCardProps) {
  const [now, setNow] = useState(INITIAL_RENDER_TIME);
  const displayMatches = matches.length > 0 ? matches : FALLBACK_WORLD_CUP_MATCHES;

  useEffect(() => {
    setNow(Date.now());

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const activeMatch = useMemo(() => getActiveMatch(displayMatches, now), [displayMatches, now]);
  const kickoffTime = useMemo(() => new Date(activeMatch.kickoffKst).getTime(), [activeMatch.kickoffKst]);
  const remaining = getRemaining(kickoffTime, now);
  const isHydrated = now !== INITIAL_RENDER_TIME;
  const isLive = now >= kickoffTime && now < kickoffTime + MATCH_DISPLAY_AFTER_MS;

  return (
    <Link
      href="/livescore/football/leagues/1/world-cup"
      prefetch={false}
      aria-label={`월드컵 ${activeMatch.label} 경기 일정 보기`}
      className="group relative flex h-16 items-center justify-between overflow-hidden rounded-none border border-black/7 bg-[#111827] md:rounded-lg dark:border-0"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/logo/world-cup-sidebar-bg-v1.webp")' }}
          animate={{
            scale: [1.04, 1.1, 1.04],
            x: [0, -8, 0],
            y: [0, -3, 0],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,11,31,0.84)_0%,rgba(4,11,31,0.48)_48%,rgba(4,11,31,0.12)_100%)]" />
        <motion.div
          className="absolute inset-y-0 -right-10 w-40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.24),rgba(255,255,255,0)_62%)]"
          animate={{ x: [18, -18, 18], opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_42%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0)_58%,rgba(255,255,255,0)_100%)]"
          animate={{ x: ['-120%', '120%'] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2.2 }}
        />
        <motion.div
          className="absolute -left-20 top-0 h-full w-20 -skew-x-[28deg] bg-white/18"
          animate={{ x: [-40, 360] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2.4 }}
        />
      </div>

      <div className="relative z-10 flex min-w-0 items-center gap-2 ps-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-[14px] bg-black/20">
          <span className="text-[10px] font-black leading-none text-white">WC</span>
        </div>
        <div className="min-w-0">
          <span className="block truncate text-[13px] leading-tight font-bold text-white">
            월드컵
          </span>
          <span className="mt-0.5 block max-w-[188px] text-[11px] leading-tight font-semibold text-white/85 sm:max-w-[240px] xl:max-w-[142px]">
            {isLive ? (
              <span className="block truncate">
                {activeMatch.label}
              </span>
            ) : (
              <>
                <span className="block truncate xl:hidden">
                  {formatKickoff(activeMatch.kickoffKst)} {activeMatch.label}
                </span>
                <span className="hidden whitespace-nowrap xl:block">{formatKickoff(activeMatch.kickoffKst)}</span>
                <span className="hidden whitespace-normal break-keep xl:block">{activeMatch.label}</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className={`relative z-10 flex shrink-0 items-center justify-end pe-1 transition-opacity duration-150 ${isHydrated ? 'opacity-100' : 'opacity-0'}`}>
        {isLive ? (
          <div className="flex flex-col items-center justify-center gap-1 px-2.5">
            <span className="rounded bg-red-500 px-1.5 py-1 text-[10px] font-black leading-none text-white">
              LIVE
            </span>
            <span className="text-[10px] leading-none font-bold text-white">
              진행중
            </span>
          </div>
        ) : (
          <>
            <CountdownNumber value={remaining.days} label="일" />
            <CountdownNumber value={remaining.hours} label="시간" />
            <CountdownNumber value={remaining.minutes} label="분" />
            <div className="grid grid-cols-[1fr] opacity-100 transition-all duration-300 ease-out xl:grid-cols-[0fr] xl:opacity-0 xl:group-hover:grid-cols-[1fr] xl:group-hover:opacity-100" aria-hidden="true">
              <div className="overflow-hidden">
                <CountdownNumber value={remaining.seconds} label="초" showBorder={false} />
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
