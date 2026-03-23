'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, animate, AnimatePresence } from 'framer-motion';
import { siteConfig } from '@/shared/config';
import {
  Zap, BarChart3, TrendingUp, Users,
  Tag, MessageCircle, Sparkles, Shield, Trophy, Bell, Globe, Heart,
  Check, ArrowRight, HelpCircle, ChevronRight, ChevronDown,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────
   타입
   ───────────────────────────────────────────── */
export interface DemoImages {
  teamLogos: Record<number, string>;
  leagueLogos: Record<number, string>;
  leagueLogosDark: Record<number, string>;
  playerPhoto: string;
  playerPhotos: Record<number, string>;
}

/* ─────────────────────────────────────────────
   애니메이션 유틸
   ───────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function Section({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] } } }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─────────────────────────────────────────────
   데모 공통 프레임
   ───────────────────────────────────────────── */
function DemoFrame({ children, size = 'default' }: { children: React.ReactNode; size?: 'default' | 'lg' }) {
  return (
    <div className="w-full mx-auto">
      <div className={`relative rounded-2xl border border-black/10 dark:border-white/10 bg-[#F8F8F8] dark:bg-white/5 shadow-sm overflow-hidden ${size === 'lg' ? 'aspect-[9/9]' : 'aspect-[10/7]'}`}>
        <div className="absolute inset-0 overflow-hidden">
          {children}
        </div>
        {/* 하단 페이드 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F8F8F8] dark:from-[#1a1a1a] to-transparent pointer-events-none" />
        {/* 미리보기 라벨 */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 pointer-events-none">
          <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Preview</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   라이브스코어 페이지 데모
   ───────────────────────────────────────────── */
function DemoMatchRow({ home, away, homeLogo, awayLogo, homeScore, awayScore, status, isLast, highlight }: {
  home: string; away: string; homeLogo?: string; awayLogo?: string;
  homeScore: number; awayScore: number;
  status: { type: 'live' | 'ft' | 'ns'; label: string };
  isLast?: boolean; highlight?: boolean;
}) {
  return (
    <motion.div
      animate={highlight ? { backgroundColor: ['rgba(234,179,8,0.08)', 'rgba(234,179,8,0)', 'rgba(234,179,8,0)'] } : {}}
      transition={highlight ? { duration: 1.5 } : {}}
      className={`flex items-center h-12 px-4 ${!isLast ? 'border-b border-black/5 dark:border-white/10' : ''}`}
    >
      <div className="w-14 shrink-0 flex items-center">
        {status.type === 'live' ? (
          <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-1 rounded animate-pulse whitespace-nowrap">{status.label}</span>
        ) : (
          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-[#F5F5F5] dark:bg-[#262626] px-1.5 py-1 rounded whitespace-nowrap">{status.label}</span>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate text-right">{home}</span>
        {homeLogo ? (
          <Image src={homeLogo} alt={home} width={24} height={24} className="w-6 h-6 object-contain shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
        )}
      </div>
      <div className="px-2 shrink-0">
        <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
          {status.type === 'ns' ? '-' : homeScore} - {status.type === 'ns' ? '-' : awayScore}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {awayLogo ? (
          <Image src={awayLogo} alt={away} width={24} height={24} className="w-6 h-6 object-contain shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
        )}
        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">{away}</span>
      </div>
    </motion.div>
  );
}

function LiveScoreDemo({ images }: { images: DemoImages }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timers = [
      setTimeout(() => setPhase(1), 1500),
      setTimeout(() => setPhase(2), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  const t = images.teamLogos;
  const l = images.leagueLogos;
  const ld = images.leagueLogosDark;
  const chelseaScore = phase >= 1 ? 2 : 1;

  const LeagueHeader = ({ leagueId, name, count, collapsed }: { leagueId: number; name: string; count: number; collapsed?: boolean }) => (
    <div className={`w-full flex items-center justify-between h-12 px-4 bg-[#F5F5F5] dark:bg-[#262626] ${collapsed ? '' : 'border-b border-black/5 dark:border-white/10'} shrink-0`}>
      <div className="flex items-center gap-3">
        {l[leagueId] ? (
          <>
            <Image src={l[leagueId]} alt={name} width={20} height={20} className="w-5 h-5 object-contain shrink-0 dark:hidden" />
            <Image src={ld[leagueId] || l[leagueId]} alt={name} width={20} height={20} className="w-5 h-5 object-contain shrink-0 hidden dark:block" />
          </>
        ) : (
          <div className="w-5 h-5 rounded-full bg-gray-400 shrink-0" />
        )}
        <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="bg-white dark:bg-[#1D1D1D] text-gray-700 dark:text-[#F0F0F0] text-xs font-medium px-2.5 py-1 rounded-full min-w-[28px] text-center">{count}</span>
        {collapsed ? <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
      </div>
    </div>
  );

  return (
    <div ref={ref} className="space-y-4 text-left">
      <div className="border border-black/7 dark:border-0 md:rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D]">
        <LeagueHeader leagueId={39} name="프리미어리그" count={3} />
        <DemoMatchRow home="첼시" away="아스널" homeLogo={t[49]} awayLogo={t[42]} homeScore={chelseaScore} awayScore={0} status={{ type: 'live', label: phase >= 1 ? "73'" : "72'" }} highlight={phase === 1} />
        <DemoMatchRow home="맨시티" away="리버풀" homeLogo={t[50]} awayLogo={t[40]} homeScore={2} awayScore={2} status={{ type: 'ft', label: '종료' }} />
        <DemoMatchRow home="토트넘" away="뉴캐슬" homeLogo={t[47]} awayLogo={t[34]} homeScore={0} awayScore={0} status={{ type: 'ns', label: '21:00' }} isLast />
      </div>
      <div className="border border-black/7 dark:border-0 md:rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D]">
        <LeagueHeader leagueId={140} name="라리가" count={2} />
        <DemoMatchRow home="바르셀로나" away="R. 마드리드" homeLogo={t[529]} awayLogo={t[541]} homeScore={1} awayScore={1} status={{ type: 'live', label: "55'" }} />
        <DemoMatchRow home="AT. 마드리드" away="비야레알" homeLogo={t[530]} awayLogo={t[533]} homeScore={0} awayScore={0} status={{ type: 'ns', label: '23:00' }} isLast />
      </div>
      <div className="border border-black/7 dark:border-0 md:rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D]">
        <LeagueHeader leagueId={2} name="챔피언스리그" count={4} collapsed />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AI 예측 데모
   ───────────────────────────────────────────── */
function AIPredictionDemo({ images }: { images: DemoImages }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const t = images.teamLogos;

  const comparisonData = [
    { label: '경기력', home: 62, away: 38 },
    { label: '공격력', home: 55, away: 45 },
    { label: '수비력', home: 48, away: 52 },
    { label: '통계예측', home: 58, away: 42 },
    { label: '상대전적', home: 50, away: 50 },
    { label: '득점력', home: 60, away: 40 },
    { label: '종합', home: 56, away: 44, highlight: true as const },
  ];

  return (
    <div ref={ref} className="border border-black/7 dark:border-0 md:rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D] text-left">
      <div className="p-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center justify-center gap-4 md:gap-8 mb-3">
          <div className="flex items-center gap-1.5 md:gap-3">
            {t[50] && <Image src={t[50]} alt="맨시티" width={36} height={36} className="w-9 h-9 md:w-12 md:h-12 object-contain" />}
            <div className="text-center">
              <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.3, duration: 0.5 }} className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">56%</motion.div>
              <div className="text-sm text-gray-600 dark:text-gray-400">맨시티</div>
            </div>
          </div>
          <div className="text-center">
            <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5, duration: 0.5 }} className="text-xl md:text-2xl font-bold text-gray-400 dark:text-gray-500">22%</motion.div>
            <div className="text-xs text-gray-500 dark:text-gray-400">무승부</div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <div className="text-center">
              <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.7, duration: 0.5 }} className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">22%</motion.div>
              <div className="text-sm text-gray-600 dark:text-gray-400">아스널</div>
            </div>
            {t[42] && <Image src={t[42]} alt="아스널" width={36} height={36} className="w-9 h-9 md:w-12 md:h-12 object-contain" />}
          </div>
        </div>
        <div className="flex justify-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
          <span>승자: <strong className="text-gray-900 dark:text-[#F0F0F0]">맨시티</strong></span>
          <span>총골: <strong className="text-gray-900 dark:text-[#F0F0F0]">O2.5</strong></span>
        </div>
      </div>
      <div className="bg-[#F5F5F5] dark:bg-[#262626] px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/10">상대 비교 지표</div>
      <div className="p-3 space-y-1.5">
        {comparisonData.map((item, idx) => (
          <div key={idx} className={`flex items-center gap-2 text-[11px] ${'highlight' in item && item.highlight ? 'bg-[#F5F5F5] dark:bg-[#262626] py-0.5 px-1 rounded' : ''}`}>
            <span className={`w-8 text-right text-blue-600 dark:text-blue-400 ${'highlight' in item && item.highlight ? 'font-bold' : ''}`}>{item.home}%</span>
            <div className="flex-1 flex h-3 bg-[#EAEAEA] dark:bg-[#333333] rounded overflow-hidden">
              <motion.div className="bg-blue-500" initial={{ width: 0 }} animate={inView ? { width: `${item.home}%` } : {}} transition={{ delay: 0.3 + idx * 0.08, duration: 0.6 }} />
              <motion.div className="bg-green-500" initial={{ width: 0 }} animate={inView ? { width: `${item.away}%` } : {}} transition={{ delay: 0.3 + idx * 0.08, duration: 0.6 }} />
            </div>
            <span className={`w-8 text-green-600 dark:text-green-400 ${'highlight' in item && item.highlight ? 'font-bold' : ''}`}>{item.away}%</span>
            <span className={`w-12 text-gray-500 dark:text-gray-400 ${'highlight' in item && item.highlight ? 'font-medium text-gray-700 dark:text-gray-300' : ''}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   데이터 분석 슬라이딩 데모 (선수/팀/매치)
   ───────────────────────────────────────────── */
function DataAnalysisDemo({ images }: { images: DemoImages }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const tabs = ['선수', '팀', '이벤트', '라인업'];

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => setActiveSlide((prev) => (prev + 1) % 4), 4000);
    return () => clearInterval(interval);
  }, [inView]);

  const t = images.teamLogos;
  const l = images.leagueLogos;
  const ld = images.leagueLogosDark;

  return (
    <div ref={ref} className="text-left">
      {/* 탭 — 프레임 밖 */}
      <div className="flex gap-1.5 mb-3">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveSlide(i)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeSlide === i ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-[#333] text-gray-500 dark:text-gray-400'}`}>{tab}</button>
        ))}
      </div>

      {/* 데모 프레임 */}
      <DemoFrame size="lg">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
          {activeSlide === 0 && (
          <div>
            <div className="p-3 md:p-4 flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-[#333]">
                  {images.playerPhoto && <Image src={images.playerPhoto} alt="M. Salah" width={80} height={80} className="w-full h-full object-cover" />}
                </div>
                {t[40] && <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 rounded-full bg-white p-0.5 shadow-lg"><Image src={t[40]} alt="LIV" width={28} height={28} className="w-full h-full object-contain" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base md:text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">모하메드 살라</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Liverpool</span>
                  <span className="px-2 py-0.5 bg-[#F5F5F5] dark:bg-[#333333] text-xs rounded text-gray-700 dark:text-gray-300">공격수</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">프리미어리그 · 잉글랜드</p>
              </div>
            </div>
            <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-t border-black/5 dark:border-white/10">
              {['키', '몸무게', '생년월일', '나이', '출생지'].map((label) => (
                <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
              ))}
            </div>
            <div className="flex items-center py-3">
              {[{ v: '175cm' }, { v: '71kg' }, { v: '92/06/15' }, { v: '33세' }, { v: 'Egypt' }].map((stat, i, arr) => (
                <div key={i} className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative truncate px-1">
                  {stat.v}
                  {i < arr.length - 1 && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />}
                </div>
              ))}
            </div>
            <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-y border-black/5 dark:border-white/10">
              <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">시즌 통계</span>
            </div>
            <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              {['경기', '골', '어시스트', '평점', '슈팅'].map((h) => (
                <div key={h} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{h}</div>
              ))}
            </div>
            <div className="flex items-center py-3">
              {['30', '19', '13', '7.8', '85'].map((v, i, arr) => (
                <div key={i} className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                  {v}
                  {i < arr.length - 1 && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />}
                </div>
              ))}
            </div>
            {/* 상세 스탯 */}
            <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-y border-black/5 dark:border-white/10">
              <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">상세 스탯</span>
            </div>
            <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              {['슈팅 정확도', '패스 성공률', '드리블 성공', '듀얼 승률', '키패스'].map((h) => (
                <div key={h} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{h}</div>
              ))}
            </div>
            <div className="flex items-center py-3">
              {['68%', '82%', '3.2', '54%', '2.1'].map((v, i, arr) => (
                <div key={i} className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                  {v}
                  {i < arr.length - 1 && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />}
                </div>
              ))}
            </div>
          </div>
          )}
          {activeSlide === 1 && (
          <div>
            <div className="flex items-center p-3 md:p-4">
              <div className="shrink-0 mr-3">
                {t[529] ? <Image src={t[529]} alt="Barcelona" width={48} height={48} className="w-12 h-12 object-contain" /> : <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />}
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">FC Barcelona</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Spain</p>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <p className="text-gray-500 dark:text-gray-400 text-xs">창단: 1899년</p>
                  <span className="inline-block px-1 py-0.5 bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 text-xs font-medium rounded">BAR</span>
                </div>
              </div>
            </div>
            <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-y border-black/5 dark:border-white/10">
              <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">기본 정보</span>
            </div>
            <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <div className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">리그 정보</div>
              <div className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">최근 5경기</div>
            </div>
            <div className="flex items-center py-3">
              <div className="flex-1 flex items-center justify-center gap-2 relative">
                {l[140] && <>
                  <Image src={l[140]} alt="LaLiga" width={24} height={24} className="w-6 h-6 object-contain dark:hidden" />
                  <Image src={ld[140] || l[140]} alt="LaLiga" width={24} height={24} className="w-6 h-6 object-contain hidden dark:block" />
                </>}
                <div className="min-w-0">
                  <p className="font-medium text-xs text-gray-900 dark:text-[#F0F0F0]">라리가</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400"><span>2025</span><span>•</span><span>Spain</span></div>
                </div>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-[#EAEAEA] dark:bg-[#333333]" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                {['W', 'W', 'D', 'W', 'W'].map((r, i) => (
                  <div key={i} className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded mx-0.5 ${r === 'W' ? 'bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-400'}`}>{r}</div>
                ))}
              </div>
            </div>
            <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-y border-black/5 dark:border-white/10">
              <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">시즌 통계</span>
            </div>
            <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              {['경기', '승', '무', '패', '득점', '실점', '클린시트'].map((label) => (
                <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
              ))}
            </div>
            <div className="flex items-center py-3">
              {[{ v: '28', avg: null }, { v: '22', avg: null }, { v: '4', avg: null }, { v: '2', avg: null }, { v: '68', avg: '2.4' }, { v: '18', avg: '0.6' }, { v: '12', avg: null }].map((stat, i, arr) => (
                <div key={i} className="flex-1 text-center relative">
                  <div className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{stat.v}</div>
                  {stat.avg && <div className="text-[9px] text-gray-400 dark:text-gray-500">({stat.avg})</div>}
                  {i < arr.length - 1 && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />}
                </div>
              ))}
            </div>
          </div>
          )}
          {/* 매치 헤더 + 이벤트 */}
          {activeSlide === 2 && (
          <div>
            {/* 매치 헤더 */}
            <div className="h-12 flex items-center justify-between px-4 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2">
                {l[39] && <>
                  <Image src={l[39]} alt="EPL" width={16} height={16} className="w-4 h-4 object-contain dark:hidden" />
                  <Image src={ld[39] || l[39]} alt="EPL" width={16} height={16} className="w-4 h-4 object-contain hidden dark:block" />
                </>}
                <span className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0]">프리미어리그</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  {t[50] && <Image src={t[50]} alt="맨시티" width={40} height={40} className="w-10 h-10 object-contain mx-auto mb-1" />}
                  <p className="text-xs font-bold text-gray-900 dark:text-[#F0F0F0]">맨시티</p>
                </div>
                <div className="text-center px-3">
                  <p className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">2 - 1</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">경기 종료</p>
                </div>
                <div className="flex-1 text-center">
                  {t[42] && <Image src={t[42]} alt="아스널" width={40} height={40} className="w-10 h-10 object-contain mx-auto mb-1" />}
                  <p className="text-xs font-bold text-gray-900 dark:text-[#F0F0F0]">아스널</p>
                </div>
              </div>
            </div>
            {/* 이벤트 */}
            <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-y border-black/5 dark:border-white/10">
              <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">경기 이벤트</span>
            </div>
            <div className="px-4 py-2">
              <div className="space-y-0">
                {[
                  { time: '23', icon: '⚽', team: '맨시티', teamId: 50, text: 'Haaland 골' },
                  { time: '41', icon: '⚽', team: '아스널', teamId: 42, text: 'Saka 골 (Ødegaard 어시스트)' },
                  { time: '67', icon: '⚽', team: '맨시티', teamId: 50, text: 'De Bruyne 골' },
                ].map((e, i) => (
                  <div key={i} className="py-2 border-b border-black/5 dark:border-white/10 last:border-b-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-8 text-right text-sm text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">{e.time}&apos;</span>
                      <span className="text-base shrink-0">{e.icon}</span>
                      {t[e.teamId] && <Image src={t[e.teamId]} alt={e.team} width={20} height={20} className="w-5 h-5 object-contain shrink-0" />}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{e.team}</span>
                    </div>
                    <div className="mt-0.5 pl-2">
                      <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">{e.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
          {/* 라인업 — 실제 Field.tsx SVG */}
          {activeSlide === 3 && (
          <div>
            <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">라인업</span>
            </div>
            <div className="overflow-hidden">
              <svg viewBox="0 0 56 50" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
                {/* 잔디 패턴 — Field.tsx 동일 */}
                <circle cx="28" cy="50" r="58" fill="#3d9735"/><circle cx="28" cy="50" r="54.375" fill="#3b9133"/>
                <circle cx="28" cy="50" r="50.75" fill="#3d9735"/><circle cx="28" cy="50" r="47.125" fill="#3b9133"/>
                <circle cx="28" cy="50" r="43.5" fill="#3d9735"/><circle cx="28" cy="50" r="39.875" fill="#3b9133"/>
                <circle cx="28" cy="50" r="36.25" fill="#3d9735"/><circle cx="28" cy="50" r="32.625" fill="#3b9133"/>
                <circle cx="28" cy="50" r="29" fill="#3d9735"/><circle cx="28" cy="50" r="25.375" fill="#3b9133"/>
                <circle cx="28" cy="50" r="21.75" fill="#3d9735"/><circle cx="28" cy="50" r="18.125" fill="#3b9133"/>
                <circle cx="28" cy="50" r="14.5" fill="#3d9735"/><circle cx="28" cy="50" r="10.875" fill="#3b9133"/>
                <circle cx="28" cy="50" r="7.25" fill="#3d9735"/><circle cx="28" cy="50" r="3.625" fill="#3b9133"/>
                {/* 필드 라인 — Field.tsx 동일 */}
                <rect stroke="white" strokeLinecap="square" fill="transparent" strokeWidth="0.4" x="0.2" y="0.2" width="55.6" height="99.6"/>
                <line stroke="white" strokeLinecap="square" strokeWidth="0.25" x1="0" y1="50" x2="56" y2="50"/>
                <circle stroke="white" strokeLinecap="round" fill="transparent" strokeWidth="0.25" cx="28" cy="50" r="7"/>
                <path stroke="white" strokeLinecap="square" fill="transparent" strokeWidth="0.25" d="M11.2 0 V11.8 H44.8 V0"/>
                <path stroke="white" strokeLinecap="square" fill="transparent" strokeWidth="0.25" d="M11.2 100 V88.2 H44.8 V100"/>
                <path stroke="white" strokeLinecap="square" fill="transparent" strokeWidth="0.25" d="M20 0 V5.6 H36 V0"/>
                <path stroke="white" strokeLinecap="square" fill="transparent" strokeWidth="0.25" d="M20 100 V94.4 H36 V100"/>
                <path stroke="white" strokeLinecap="round" fill="transparent" strokeWidth="0.25" d="M22 11.8 A7,7 0 0 0 34,11.8"/>
                <path stroke="white" strokeLinecap="round" fill="transparent" strokeWidth="0.25" d="M22 88.2 A7,7 0 0 1 34,88.2"/>
                <circle stroke="white" fill="white" strokeWidth="0.25" cx="28" cy="50" r="0.25"/>
                <circle stroke="white" fill="white" strokeWidth="0.25" cx="28" cy="8.4" r="0.25"/>
                <circle stroke="white" fill="white" strokeWidth="0.25" cx="28" cy="91.6" r="0.25"/>
                {/* 코너 아크 */}
                <path stroke="white" strokeLinecap="round" fill="transparent" strokeWidth="0.25" d="M2 0 A2,2 0 0 1 0,2"/>
                <path stroke="white" strokeLinecap="round" fill="transparent" strokeWidth="0.25" d="M54 0 A2,2 0 0 0 56,2"/>
                <path stroke="white" strokeLinecap="round" fill="transparent" strokeWidth="0.25" d="M2 100 A2,2 0 0 0 0,98"/>
                <path stroke="white" strokeLinecap="round" fill="transparent" strokeWidth="0.25" d="M54 100 A2,2 0 0 1 56,98"/>


                {/* 선수 렌더링 — Player.tsx 동일 구조 (이미지 + 평점 + 번호) */}
                {/* 홈팀 맨시티 4-3-3 */}
                {([
                  [28, 4.5, 31, 617, true, 6.8, '에데르송'],
                  [8, 14, 2, 627, false, 7.2, '워커'], [20, 14, 3, 626, false, 7.6, '디아스'], [36, 14, 25, 747, false, 7.0, '아칸지'], [48, 14, 7, 631, false, 6.9, '그바르디올'],
                  [12, 27, 16, 641, false, 8.0, '로드리'], [28, 27, 17, 629, false, 8.5, '더브라위너'], [44, 27, 20, 643, false, 7.4, 'B. 실바'],
                  [12, 40, 47, 19465, false, 7.8, '포든'], [28, 40, 9, 1100, false, 9.1, '홀란드'], [44, 40, 10, 633, false, 7.1, '그릴리쉬'],
                ] as [number, number, number, number, boolean, number, string][]).map(([cx, cy, num, pid, isGK, rating, name]) => {
                  const rColor = rating >= 8.0 ? '#10b981' : rating >= 7.0 ? '#3b82f6' : rating >= 6.0 ? '#eab308' : '#ef4444';
                  const pp = images.playerPhotos;
                  return (
                    <g key={`h-${num}`} transform={`translate(${cx},${cy})`}>
                      <defs><clipPath id={`clip-h-${pid}`}><circle r="2.5"/></clipPath></defs>
                      <circle r="2.5" fill="#f3f4f6" stroke="white" strokeWidth="0.15"/>
                      {pp[pid] ? (
                        <image x="-2.5" y="-2.5" width="5" height="5" href={pp[pid]} clipPath={`url(#clip-h-${pid})`}/>
                      ) : (
                        <circle r="2.5" fill={isGK ? '#f5d000' : '#6ec5e9'} opacity="0.85"/>
                      )}
                      <rect x="-2.1" y="-3.6" width="4.2" height="1.6" rx="0.8" fill={rColor} opacity="0.9"/>
                      <text x="0" y="-2.6" fill="white" fontSize="1.3" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{rating.toFixed(1)}</text>
                      <rect x="-2.5" y="2.8" width="5" height="1.1" rx="0.55" fill="rgba(0,100,0,0.7)"/>
                      <text x="0" y="3.7" fill="white" fontSize="1.1" textAnchor="middle" dominantBaseline="middle">#{num}</text>
                      <rect x="-4" y="4.6" width="8" height="1.1" rx="0.55" fill="rgba(0,100,0,0.7)"/>
                      <text x="0" y="5.2" fill="white" fontSize="1.1" textAnchor="middle" dominantBaseline="middle">{name}</text>
                    </g>
                  );
                })}

                {/* 원정팀 아스널 4-2-3-1 */}
                {([
                  [28, 95.5, 1, 665, true, 7.0, '라야'],
                  [8, 86, 12, 22224, false, 6.5, '팀버'], [20, 86, 6, 1161, false, 7.3, '가브리엘'], [36, 86, 2, 664, false, 7.5, '살리바'], [48, 86, 4, 15799, false, 6.8, '화이트'],
                  [20, 73, 5, 1460, false, 7.2, '파르테이'], [36, 73, 41, 284324, false, 7.8, '라이스'],
                  [8, 63, 7, 19533, false, 8.2, '사카'], [28, 63, 8, 1468, false, 7.6, '외데고르'], [48, 63, 11, 288, false, 6.9, '마르티넬리'],
                  [28, 55, 14, 20552, false, 7.4, '하베르츠'],
                ] as [number, number, number, number, boolean, number, string][]).map(([cx, cy, num, pid, isGK, rating, name]) => {
                  const rColor = rating >= 8.0 ? '#10b981' : rating >= 7.0 ? '#3b82f6' : rating >= 6.0 ? '#eab308' : '#ef4444';
                  const pp = images.playerPhotos;
                  return (
                    <g key={`a-${num}`} transform={`translate(${cx},${cy})`}>
                      <defs><clipPath id={`clip-a-${pid}`}><circle r="2.5"/></clipPath></defs>
                      <circle r="2.5" fill="#f3f4f6" stroke="white" strokeWidth="0.15"/>
                      {pp[pid] ? (
                        <image x="-2.5" y="-2.5" width="5" height="5" href={pp[pid]} clipPath={`url(#clip-a-${pid})`}/>
                      ) : (
                        <circle r="2.5" fill={isGK ? '#f5d000' : '#e74c3c'} opacity="0.85"/>
                      )}
                      <rect x="-2.1" y="-3.6" width="4.2" height="1.6" rx="0.8" fill={rColor} opacity="0.9"/>
                      <text x="0" y="-2.6" fill="white" fontSize="1.3" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{rating.toFixed(1)}</text>
                      <rect x="-2.5" y="2.8" width="5" height="1.1" rx="0.55" fill="rgba(0,100,0,0.7)"/>
                      <text x="0" y="3.7" fill="white" fontSize="1.1" textAnchor="middle" dominantBaseline="middle">#{num}</text>
                      <rect x="-4" y="4.6" width="8" height="1.1" rx="0.55" fill="rgba(0,100,0,0.7)"/>
                      <text x="0" y="5.2" fill="white" fontSize="1.1" textAnchor="middle" dominantBaseline="middle">{name}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          )}
          </motion.div>
        </AnimatePresence>
      </DemoFrame>

      {/* 프로그레스 바 — 프레임 밖 */}
      <div className="flex gap-1 mt-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-gray-200 dark:bg-[#333] overflow-hidden">
            {activeSlide === i && (
              <motion.div className="h-full bg-gray-900 dark:bg-white rounded-full" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 4, ease: 'linear' }} key={`progress-${i}-${activeSlide}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   숫자 카운터
   ───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   커뮤니티 슬라이딩 데모 (응원댓글/게시판)
   ───────────────────────────────────────────── */
function CommunityDemo() {
  const [activeSlide, setActiveSlide] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const tabs = ['응원 댓글', '게시판'];

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => setActiveSlide((prev) => (prev + 1) % 2), 5000);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <div ref={ref} className="text-left">
      {/* 탭 — 프레임 밖 */}
      <div className="flex gap-1.5 mb-3">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveSlide(i)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeSlide === i ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-[#333] text-gray-500 dark:text-gray-400'}`}>{tab}</button>
        ))}
      </div>

      {/* 데모 프레임 */}
      <DemoFrame size="lg">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
        {/* 응원 댓글 */}
        {activeSlide === 0 && (
          <div>
            <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">응원 댓글</span>
            </div>
            {/* 댓글 작성 폼 */}
            <div className="p-4 border-b border-black/5 dark:border-white/10">
              <div className="flex space-x-2 w-full mb-3">
                <span className="flex-1 px-2 py-1 text-xs text-center rounded-lg bg-[#262626] dark:bg-[#3F3F3F] text-white font-medium">맨시티</span>
                <span className="flex-1 px-2 py-1 text-xs text-center rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333333] text-gray-700 dark:text-gray-300">아스널</span>
                <span className="flex-1 px-2 py-1 text-xs text-center rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333333] text-gray-700 dark:text-gray-300">중립</span>
              </div>
              <div className="relative">
                <div className="w-full px-3 py-3 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-400 dark:text-gray-500 rounded-lg text-sm h-[52px]">응원 댓글을 남겨보세요...</div>
                <div className="absolute bottom-2 right-3 text-xs text-gray-500 dark:text-gray-400">0/300</div>
              </div>
            </div>
            {/* 필터 탭 */}
            <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
              <div className="flex space-x-1">
                <span className="px-2 py-1 text-xs rounded-lg bg-[#262626] dark:bg-[#3F3F3F] text-white">전체</span>
                <span className="px-2 py-1 text-xs rounded-lg text-gray-700 dark:text-gray-300">홈</span>
                <span className="px-2 py-1 text-xs rounded-lg text-gray-700 dark:text-gray-300">원정</span>
                <span className="px-2 py-1 text-xs rounded-lg text-gray-700 dark:text-gray-300">중립</span>
              </div>
            </div>
            {/* 댓글 목록 */}
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {[
                { name: '축구좋아', team: '홈', time: '방금', text: '홀란드 해트트릭 가자!!!!' },
                { name: '거너스팬', team: '원정', time: '2분', text: '사카 동점골 ㅋㅋ 아직 안 끝났다' },
                { name: '중립시청자', team: '중립', time: '5분', text: '이 경기 올해의 경기감인데??' },
              ].map((c, i) => (
                <div key={i} className="p-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0]">{c.name}</span>
                    <span className="text-xs">{c.team}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{c.time}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 인기글 사이드바 — TopicTabsServer + TopicPostItem 동일 */}
        {activeSlide === 1 && (
          <div>
            {/* ContainerHeader */}
            <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">인기글</span>
            </div>
            {/* TabList variant="contained" — lucide 아이콘 */}
            <div className="flex border-b border-black/5 dark:border-white/10">
              {[
                { label: 'HOT', icon: <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>, active: true },
                { label: '조회수', icon: <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, active: false },
                { label: '추천수', icon: <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>, active: false },
                { label: '댓글수', icon: <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>, active: false },
              ].map((tab) => (
                <button key={tab.label} className={`flex-1 py-2 px-2 text-xs font-medium whitespace-nowrap flex items-center justify-center transition-colors ${
                  tab.active
                    ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] border-b-2 border-[#262626] dark:border-[#F0F0F0]'
                    : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300'
                }`}>
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            {/* PostList — TopicPostItem 구조 */}
            <ul>
              {[
                { title: '홀란드 ㄹㅇ 사기캐 아니냐 이번시즌 34골ㅋㅋ', views: 2841, likes: 156 },
                { title: '손흥민 어시 보소 ㅋㅋㅋ 아직 안 늙었다', views: 1205, likes: 89 },
                { title: '엄마한테 들켰다 새벽에 축구보다가..', views: 4312, likes: 234 },
                { title: '라리가 보는 사람 나밖에 없냐 여기', views: 567, likes: 41 },
                { title: '이 사이트 뭐임?? 데이터 개쩔는데', views: 1893, likes: 167 },
                { title: '챔스 대진 보고 잠이 안온다 진짜', views: 1567, likes: 112 },
                { title: '아스널 팬인데 올해는 진짜 간다 느낌옴', views: 987, likes: 73 },
                { title: '새벽 3시에 축구보는 사람 여기 다 모여라', views: 1432, likes: 98 },
              ].map((p, i, arr) => (
                <li key={i} className={i < arr.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''}>
                  <div className="block px-3 py-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] overflow-hidden">
                    <div className="flex items-center text-xs gap-1">
                      <div className="relative w-5 h-5 shrink-0">
                        <Image src={siteConfig.logo} alt="" width={20} height={20} className="object-contain w-5 h-5 dark:invert" />
                      </div>
                      <span className="truncate flex-1 min-w-0">{p.title}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-auto shrink-0 flex items-center gap-2">
                        <span className="flex items-center"><svg className="h-3 w-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>{p.views}</span>
                        <span className="flex items-center"><svg className="h-3 w-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>{p.likes}</span>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </DemoFrame>

      {/* 프로그레스 바 — 프레임 밖 */}
      <div className="flex gap-1 mt-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-gray-200 dark:bg-[#333] overflow-hidden">
            {activeSlide === i && (
              <motion.div className="h-full bg-gray-900 dark:bg-white rounded-full" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 5, ease: 'linear' }} key={`cprog-${i}-${activeSlide}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(0, target, {
      duration: 1.8,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [inView, target]);

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────────────────────────
   메인 컴포넌트
   ───────────────────────────────────────────── */
export default function AboutPageClient({ demoImages }: { demoImages: DemoImages }) {
  return (
    <div className="min-h-screen">
      {/* 로고 */}
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="inline-block">
          <Image src={siteConfig.logo} alt="4590 Football" width={124} height={60} className="h-10 sm:h-14 w-auto dark:invert" priority />
        </Link>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden md:rounded-lg border border-black/7 dark:border-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
        <div className="absolute inset-0">
          <Image src="/images/connor-coyne-OgqWLzWRSaI-unsplash.jpg" alt="" fill className="object-cover opacity-15" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="relative px-6 py-20 md:px-12 md:py-32 text-center max-w-3xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-sm md:text-base text-gray-400 mb-6">
            경기 보면서 스탯 찾으려고 탭 3개 열고,<br />혼자 보면서 할 말은 트위터에 쓰고 있죠?
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-3xl md:text-[3.2rem] font-extrabold text-white mb-6 leading-[1.15] tracking-tight">
            데이터와 커뮤니티가<br /><span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">하나로 연결된 축구 플랫폼</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }} className="text-base md:text-lg text-gray-300 leading-relaxed mb-10 max-w-lg mx-auto">
            게시글에 선수를 태그하면 스탯이 바로 뜹니다.<br />경기를 태그하면 스코어가 실시간으로 업데이트됩니다.<br /><span className="text-white font-medium">그게 4590입니다.</span>
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.1 }} className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
            <Link href="/" className="group px-8 py-3.5 bg-white text-gray-900 rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-white/10 transition-all flex items-center justify-center gap-2">둘러보고 시작하기 <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></Link>
            <Link href="/signup" className="px-8 py-3.5 border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-all">팬들과 함께하기</Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
            <ChevronDown className="w-5 h-5 text-gray-500 mx-auto animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* 핵심 USP — 데이터 + 커뮤니티 연결 */}
      <Section className="bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 mt-4 px-6 py-16 md:px-12 md:py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] text-center mb-3">Core Feature</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F0F0F0] text-center mb-3 tracking-tight leading-snug">글을 쓰면서 데이터를 공유한다</h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 text-center mb-12 max-w-lg mx-auto leading-relaxed">
            다른 사이트에서는 데이터를 캡처해서 붙여넣습니다.<br />4590에서는 선수, 팀, 경기를 <span className="text-gray-900 dark:text-white font-medium">태그 한 번</span>이면 끝.
          </p>
          {/* 데모 목업 */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-[#FAFAFA] dark:bg-[#161616] shadow-lg shadow-black/5 dark:shadow-black/30">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#1D1D1D]">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400/80" /><div className="w-3 h-3 rounded-full bg-yellow-400/80" /><div className="w-3 h-3 rounded-full bg-green-400/80" /></div>
              <div className="flex-1 text-center"><span className="text-xs text-gray-400 dark:text-gray-500">게시글 작성</span></div>
            </div>
            <div className="p-5 md:p-8 space-y-5">
              <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
                <motion.p variants={fadeUp} className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">어제 경기 살라 진짜 미쳤다 ㅋㅋ 이번 시즌 폼이 역대급인 듯</motion.p>
                {/* 선수 카드 — 실제 PlayerCard CSS 클래스 (post-content.css 적용) */}
                <motion.div variants={fadeUp}>
                  <div className="player-card">
                    <div className="league-header">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="league-logo-box">
                          <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/md/40.webp" alt="리버풀" width={24} height={24} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                        </div>
                        <span className="league-name">리버풀</span>
                      </div>
                    </div>
                    <div className="player-main">
                      <div className="player-photo">
                        <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/players/md/306.webp" alt="살라" width={48} height={48} />
                      </div>
                      <span className="player-name">모하메드 살라</span>
                    </div>
                    <div className="match-footer">
                      <span className="footer-link">선수 정보 확인</span>
                    </div>
                  </div>
                </motion.div>
                <motion.p variants={fadeUp} className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">이 경기 후반 30분부터 완전 원맨쇼였음. 맞대결 봐봐</motion.p>
                {/* 매치 카드 — 실제 MatchCard CSS 클래스 (post-content.css 적용) */}
                <motion.div variants={fadeUp}>
                  <div className="match-card">
                    <div className="league-header">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="league-logo-box">
                          <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/leagues/md/39.webp" alt="프리미어리그" width={20} height={20} style={{ width: '20px', height: '20px', objectFit: 'contain' }} className="dark:hidden" />
                          <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/leagues/md/39-1.webp" alt="프리미어리그" width={20} height={20} style={{ width: '20px', height: '20px', objectFit: 'contain' }} className="hidden dark:block" />
                        </div>
                        <span className="league-name">프리미어리그</span>
                      </div>
                    </div>
                    <div className="match-main">
                      <div className="team-info">
                        <div className="team-logo-box">
                          <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/md/47.webp" alt="토트넘" width={48} height={48} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                        </div>
                        <span className="team-name">토트넘</span>
                      </div>
                      <div className="score-area">
                        <div className="score">
                          <span className="score-number">3</span>
                          <span className="score-separator">-</span>
                          <span className="score-number">1</span>
                        </div>
                        <div className="match-status">종료</div>
                      </div>
                      <div className="team-info">
                        <div className="team-logo-box">
                          <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/teams/md/33.webp" alt="맨유" width={48} height={48} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                        </div>
                        <span className="team-name">맨유</span>
                      </div>
                    </div>
                    <div className="match-footer">
                      <span className="footer-link">매치 상세 정보</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Search, title: '검색해서 태그', desc: '에디터에서 선수·팀·경기를 검색하고 클릭 한 번으로 삽입' },
              { icon: BarChart3, title: '실시간 데이터', desc: '태그된 카드는 실제 데이터와 연동. 클릭하면 상세 페이지로' },
              { icon: Users, title: '대화가 달라짐', desc: '"그 선수 스탯 좀" 대신 카드 하나로 모두가 같은 데이터를 봄' },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeUp} className="text-center p-4">
                <item.icon className="w-5 h-5 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0] mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* 핵심 기능 — 좌우 교차 + 실제 UI 데모 */}
      <Section className="bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 mt-4">
        <div className="px-6 py-14 md:px-12 md:py-20">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-center mb-3">What We Offer</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F0F0F0] text-center mb-12 tracking-tight">이 모든 게 한 곳에</h2>
        </div>

        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {/* 라이브스코어 */}
          <motion.div variants={fadeUp} className="p-6 md:p-8 border-t border-black/5 dark:border-white/10">
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mb-4"><Zap className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" /><span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">LIVE SCORE</span></div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2 leading-snug tracking-tight">40개 리그의 경기를<br />실시간으로.</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">프리미어리그, 라리가, 챔피언스리그부터 K리그까지. 스코어, 타임라인, 라인업, 통계를 실시간으로 확인하세요.</p>
                <div className="flex flex-wrap gap-2">
                  {['EPL', '라리가', 'UCL', 'K리그', '세리에A'].map((l) => (<span key={l} className="px-2.5 py-1 rounded-md bg-[#F5F5F5] dark:bg-white/5 text-xs font-medium text-gray-600 dark:text-gray-400">{l}</span>))}
                  <span className="px-2.5 py-1 rounded-md bg-[#F5F5F5] dark:bg-white/5 text-xs font-medium text-gray-400">+35개</span>
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden shadow-sm"><LiveScoreDemo images={demoImages} /></div>
            </div>
          </motion.div>

          {/* 데이터 분석 */}
          <motion.div variants={fadeUp} className="p-6 md:p-8 border-t border-black/5 dark:border-white/10">
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4"><BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /><span className="text-xs font-semibold text-blue-700 dark:text-blue-400">DATA ANALYSIS</span></div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2 leading-snug tracking-tight">감이 아니라,<br />데이터로 보는 축구.</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">7,700명 이상의 선수 통계, 1,200개 팀의 시즌 기록, 맞대결 비교 분석, 포메이션, 순위표.</p>
                <div className="grid grid-cols-3 gap-3">
                  {[{ n: '1,200+', l: '팀 데이터' }, { n: '7,700+', l: '선수 프로필' }, { n: '15,000+', l: '경기 기록' }].map((s) => (
                    <div key={s.l} className="text-center p-2.5 rounded-xl bg-[#F5F5F5] dark:bg-white/5"><div className="text-base font-bold text-gray-900 dark:text-white">{s.n}</div><div className="text-[10px] text-gray-500 dark:text-gray-400">{s.l}</div></div>
                  ))}
                </div>
              </div>
              <div className="md:order-1"><DataAnalysisDemo images={demoImages} /></div>
            </div>
          </motion.div>

          {/* AI 예측 */}
          <motion.div variants={fadeUp} className="p-6 md:p-8 border-t border-black/5 dark:border-white/10">
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-4"><TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /><span className="text-xs font-semibold text-purple-700 dark:text-purple-400">AI PREDICTION</span></div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2 leading-snug tracking-tight">킥오프 전에<br />이미 알고 있는 AI.</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">과거 데이터, 팀 폼, 맞대결 기록을 AI가 분석합니다. 승률, 예상 스코어, 핵심 변수까지. 경기 보기 전에 한 발 앞서 준비하세요.</p>
              </div>
              <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden shadow-sm"><AIPredictionDemo images={demoImages} /></div>
            </div>
          </motion.div>

          {/* 커뮤니티 */}
          <motion.div variants={fadeUp} className="p-6 md:p-8 border-t border-black/5 dark:border-white/10">
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 mb-4"><Users className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /><span className="text-xs font-semibold text-green-700 dark:text-green-400">COMMUNITY</span></div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2 leading-snug tracking-tight">혼자 보는 축구는<br />이제 끝.</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">경기 실황 채팅, 분석 토론, 핫딜 공유. 게시글에 선수·팀 데이터를 카드로 태그하고, 실시간 응원 댓글로 함께 뜨거워지세요.</p>
              </div>
              <div className="md:order-1"><CommunityDemo /></div>
            </div>
          </motion.div>
        </motion.div>
      </Section>

      {/* 숫자 + 리그 */}
      <Section className="bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 mt-4 px-6 py-14 md:px-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-center mb-3">Numbers</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F0F0F0] text-center mb-12 tracking-tight">숫자로 보는 4590</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {[{ target: 40, suffix: '+', label: '리그 & 대회' }, { target: 1200, suffix: '+', label: '축구팀 데이터' }, { target: 7700, suffix: '+', label: '선수 프로필' }, { target: 15000, suffix: '+', label: '경기 데이터' }].map((stat) => (
              <div key={stat.label} className="text-center"><div className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-[#F0F0F0] mb-1"><Counter target={stat.target} suffix={stat.suffix} /></div><div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div></div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-12">
            {['매일 업데이트되는 실시간 데이터', '글로벌 축구 API 기반', '빠른 속도 & 안정적인 서비스'].map((text) => (
              <span key={text} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><Check className="w-3.5 h-3.5 text-green-500" />{text}</span>
            ))}
          </div>
          <div className="border-t border-black/5 dark:border-white/5 pt-10">
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-[0.15em] font-medium">지원 리그 & 대회</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {[
                { label: '유럽 5대', items: ['프리미어리그', '라리가', '세리에A', '분데스리가', '리그앙'] },
                { label: '유럽 컵', items: ['챔피언스리그', '유로파리그', '컨퍼런스리그'] },
                { label: '국제 대회', items: ['월드컵 예선', '유로', '네이션스리그'] },
                { label: '기타 유럽', items: ['에레디비시', '프리메이라리가', '챔피언십'] },
                { label: '아시아', items: ['K리그', 'J리그', '사우디 프로리그'] },
                { label: '아메리카', items: ['MLS', '브라질레이로', '리가 MX'] },
              ].map((g) => (
                <div key={g.label} className="text-center"><p className="text-xs font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">{g.label}</p>{g.items.map((name) => (<p key={name} className="text-xs text-gray-500 dark:text-gray-400 leading-loose">{name}</p>))}</div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 왜 4590인가? — 배경 이미지 1 */}
      <Section className="relative overflow-hidden md:rounded-lg border border-black/7 dark:border-0 mt-4">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/about/mockup-overview.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        </div>
        <div className="absolute inset-0 bg-black/85" />
        <div className="relative px-6 py-20 md:px-12 md:py-28">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-3">다른 축구 사이트와 뭐가 다른가?</h2>
          <p className="text-sm text-gray-300 text-center mb-10 max-w-md mx-auto">스코어만 보여주는 사이트는 이미 많습니다.<br />4590은 <span className="text-white font-medium">데이터와 커뮤니티를 연결</span>했습니다.</p>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: <Zap className="w-5 h-5" />, color: 'text-yellow-400', bg: 'bg-yellow-400/10', title: '올인원', desc: '스코어, 분석, 예측, 커뮤니티를 탭 하나로. 여러 앱 왔다갔다할 필요 없습니다.' },
              { icon: <Tag className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-400/10', title: '데이터가 살아있는 커뮤니티', desc: '선수·팀·경기를 태그하면 실시간 데이터가 게시글 안에서 바로 보입니다.' },
              { icon: <Trophy className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-400/10', title: '활동 = 보상', desc: '글, 댓글, 좋아요가 경험치와 포인트로. 레벨업하며 프로필 아이콘과 아이템 획득.' },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeUp} className="p-6 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-colors">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${item.bg} ${item.color} mb-4`}>{item.icon}</div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* 더 특별한 기능들 — 벤토 그리드 */}
      <Section className="bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 mt-4 px-6 py-14 md:px-12 md:py-20">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] text-center mb-3">더 특별한 기능들</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-10">다른 곳에서는 경험할 수 없습니다</p>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
          {[
            { icon: Tag, title: '데이터 카드 태그', desc: '게시글에 선수·팀·경기 데이터를 카드로 삽입', color: 'text-blue-500', bgIcon: 'text-blue-500/10' },
            { icon: MessageCircle, title: '실시간 응원', desc: '홈/원정 진영 선택 후 실시간 응원 댓글', color: 'text-green-500', bgIcon: 'text-green-500/10' },
            { icon: Sparkles, title: '이모티콘 제작', desc: '나만의 이모티콘 팩을 만들어 사용', color: 'text-purple-500', bgIcon: 'text-purple-500/10' },
            { icon: Trophy, title: '이적시장', desc: '실시간 이적 소식, 루머, 공식 발표', color: 'text-orange-500', bgIcon: 'text-orange-500/10' },
            { icon: Bell, title: '실시간 알림', desc: '댓글, 좋아요, 공지 알림을 즉시 수신', color: 'text-red-500', bgIcon: 'text-red-500/10' },
            { icon: Globe, title: '한국어 데이터', desc: '해외 선수·팀명을 한글로 표시', color: 'text-cyan-500', bgIcon: 'text-cyan-500/10' },
            { icon: Heart, title: '핫딜 게시판', desc: '축구 용품, 유니폼 등 핫딜 정보 공유', color: 'text-pink-500', bgIcon: 'text-pink-500/10' },
            { icon: Shield, title: '레벨 시스템', desc: '레벨업 시 고유 프로필 아이콘 해제', color: 'text-yellow-500', bgIcon: 'text-yellow-500/10' },
          ].map((f) => (
            <motion.div key={f.title} variants={fadeUp} className="relative p-5 md:p-6 rounded-xl bg-[#F9FAFB] dark:bg-[#262626] border border-black/5 dark:border-white/5 hover:shadow-md hover:border-black/10 dark:hover:border-white/10 transition-all overflow-hidden">
              {/* 우상단 큰 반투명 아이콘 */}
              <f.icon className={`absolute -top-2 -right-2 w-16 h-16 ${f.bgIcon} pointer-events-none`} />
              <div className="relative">
                <f.icon className={`w-6 h-6 ${f.color} mb-3`} />
                <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0] mb-1.5">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* 보상 시스템 — 스텝 타임라인 */}
      <Section className="relative overflow-hidden md:rounded-lg border border-black/7 dark:border-0 mt-4">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.08)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.08)_0%,_transparent_50%)]" />
        <div className="relative px-6 py-14 md:px-12 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">활동하면 보상이 따라옵니다</h2>
            <p className="text-sm text-gray-300 mb-2">게임처럼 성장하는 축구 커뮤니티</p>
            <p className="text-xs text-gray-500 mb-12">포인트로 교환할 수 있는 아이템과 레벨업 보상은 꾸준히 추가될 예정입니다.</p>
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
              {[
                { step: '01', emoji: '✍️', action: '글 · 댓글', reward: '경험치 획득', color: 'from-blue-500 to-blue-600' },
                { step: '02', emoji: '❤️', action: '좋아요', reward: '포인트 적립', color: 'from-pink-500 to-pink-600' },
                { step: '03', emoji: '🛒', action: '포인트 사용', reward: '아이템 구매', color: 'from-green-500 to-green-600' },
                { step: '04', emoji: '⭐', action: '레벨업', reward: '특별 아이콘 해제', color: 'from-yellow-500 to-yellow-600' },
              ].map((item, i, arr) => (
                <motion.div key={item.action} variants={fadeUp} className="flex items-center">
                  <div className="w-32 sm:w-36 py-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm relative">
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r ${item.color} text-[10px] font-bold text-white`}>STEP {item.step}</div>
                    <span className="text-2xl block mb-2">{item.emoji}</span>
                    <p className="text-xs font-semibold text-white">{item.action}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{item.reward}</p>
                  </div>
                  {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600 mx-1 hidden sm:block" />}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </Section>

      {/* 이런 분들에게 — 2열 그리드 + 아이콘 */}
      <Section className="bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 mt-4 px-6 py-14 md:px-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] text-center mb-3">이런 분들에게 추천합니다</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-10">하나라도 해당되면, 4590이 딱입니다</p>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Search, text: '경기 보면서 스탯 찾으려고 앱 3개 왔다갔다하는 분' },
              { icon: BarChart3, text: '감이 아니라 데이터로 분석하고 싶은 축구 팬' },
              { icon: Users, text: '같이 경기 보면서 떠들 커뮤니티가 필요한 분' },
              { icon: TrendingUp, text: 'AI 예측으로 경기 보는 재미를 올리고 싶은 분' },
              { icon: Trophy, text: '활동하면서 레벨업하고 아이템 모으는 재미를 원하는 분' },
              { icon: Globe, text: '한국어로 해외 축구 데이터를 편하게 보고 싶은 분' },
            ].map((item) => (
              <motion.div key={item.text} variants={fadeUp} className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#262626] border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* 실제 화면 미리보기 — 배경 이미지 2 */}
      <Section className="relative overflow-hidden md:rounded-lg border border-black/7 dark:border-0 mt-4">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/about/mockup-devices.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent dark:from-[#111]/90 dark:via-[#111]/50 dark:to-transparent" />
        <div className="relative px-6 py-28 md:px-12 md:py-40 text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-3">PC · 태블릿 · 모바일</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">어디서든, 같은 경험</h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
            반응형 디자인으로 어떤 기기에서든<br />동일한 데이터와 기능을 사용할 수 있습니다.
          </p>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="bg-[#F5F5F5] dark:bg-[#262626] md:rounded-lg border border-black/7 dark:border-0 mt-4 px-6 py-14 md:px-12 md:py-20">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] text-center mb-10">자주 묻는 질문</h2>
        <div className="max-w-2xl mx-auto space-y-3">
          {[
            { q: '4590이 무슨 뜻인가요?', a: '축구 경기는 전반 45분, 후반 45분으로 이루어집니다. 4590은 그 90분의 모든 순간을 함께한다는 의미입니다.' },
            { q: '무료인가요?', a: '네. 모든 기능을 무료로 이용할 수 있습니다. 가입하면 다른 팬들과 바로 소통할 수 있습니다.' },
            { q: 'AI 예측은 어떻게 작동하나요?', a: '과거 경기 데이터, 팀 폼, 맞대결 기록 등을 AI 모델이 분석하여 승률과 예상 스코어를 제공합니다.' },
            { q: '모바일에서도 사용 가능한가요?', a: '네. 반응형 웹으로 제작되어 모바일, 태블릿, PC 어디서든 최적화된 화면으로 이용할 수 있습니다.' },
            { q: '어떤 리그를 지원하나요?', a: '유럽 5대 리그, 챔피언스리그, K리그, J리그, MLS 등 40개 이상의 리그와 국제 대회를 지원합니다.' },
            { q: '포인트는 어떻게 사용하나요?', a: '게시글 작성, 댓글, 좋아요 등 활동으로 획득한 포인트로 프로필 아이콘, 이모티콘 등 아이템을 구매할 수 있습니다. 포인트로 교환할 수 있는 아이템과 보상은 꾸준히 추가될 예정입니다.' },
          ].map((item) => (
            <details key={item.q} className="group rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1D1D1D] overflow-hidden">
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none select-none"><HelpCircle className="w-4 h-4 text-gray-400 shrink-0" /><span className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0] flex-1">{item.q}</span><ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" /></summary>
              <div className="px-5 pb-5 pl-12"><p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.a}</p></div>
            </details>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="relative overflow-hidden md:rounded-lg border border-black/7 dark:border-0 mt-4 mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.1)_0%,_transparent_60%)]" />
        <div className="relative px-6 py-16 md:px-12 md:py-24 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">같이 볼 사람, 여기 있습니다</h2>
          <p className="text-sm md:text-base text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">댓글 하나가 대화가 되고,<br />대화가 커뮤니티가 됩니다.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="group px-8 py-3.5 bg-white text-gray-900 rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-white/10 transition-all flex items-center justify-center gap-2">팬들과 함께하기 <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></Link>
            <Link href="/" className="px-8 py-3.5 border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-all">조금 더 둘러보기</Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
