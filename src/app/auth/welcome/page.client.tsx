"use client";

import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/shared/config';
import { Sparkles } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';
import { useTheme } from 'next-themes';

const darkParticles: ISourceOptions = {
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  particles: {
    number: { value: 120, density: { enable: true } },
    color: { value: ['#ffffff', '#60a5fa', '#818cf8', '#c084fc', '#22d3ee'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.15, max: 0.9 },
      animation: { enable: true, speed: 0.6, sync: false },
    },
    size: {
      value: { min: 1, max: 4 },
      animation: { enable: true, speed: 1.2, sync: false },
    },
    move: {
      enable: true,
      speed: 0.3,
      direction: 'none' as const,
      random: true,
      outModes: { default: 'out' as const },
    },
    twinkle: {
      particles: { enable: true, frequency: 0.1, color: { value: '#ffffff' }, opacity: 1 },
    },
    links: {
      enable: true,
      distance: 130,
      color: '#ffffff',
      opacity: 0.07,
      width: 0.8,
    },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: ['grab', 'bubble'] as const },
      onClick: { enable: true, mode: 'push' as const },
    },
    modes: {
      grab: { distance: 160, links: { opacity: 0.15 } },
      bubble: { distance: 200, size: 6, duration: 0.4, opacity: 0.8 },
      push: { quantity: 5 },
    },
  },
};

const lightParticles: ISourceOptions = {
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  particles: {
    number: { value: 120, density: { enable: true } },
    color: { value: ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.2, max: 0.6 },
      animation: { enable: true, speed: 0.5, sync: false },
    },
    size: {
      value: { min: 1.5, max: 5 },
      animation: { enable: true, speed: 1, sync: false },
    },
    move: {
      enable: true,
      speed: 0.4,
      direction: 'none' as const,
      random: true,
      outModes: { default: 'out' as const },
    },
    twinkle: {
      particles: { enable: true, frequency: 0.08, color: { value: '#6366f1' }, opacity: 0.8 },
    },
    links: {
      enable: true,
      distance: 120,
      color: '#6366f1',
      opacity: 0.08,
      width: 0.8,
    },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: ['grab', 'bubble'] as const },
      onClick: { enable: true, mode: 'push' as const },
    },
    modes: {
      grab: { distance: 160, links: { opacity: 0.2 } },
      bubble: { distance: 200, size: 7, duration: 0.4, opacity: 0.6 },
      push: { quantity: 5 },
    },
  },
};

export default function WelcomePageClient() {
  const [mounted, setMounted] = useState(false);
  const [particlesReady, setParticlesReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const fireConfetti = useCallback(() => {
    const mobile = window.innerWidth < 768;
    const duration = mobile ? 1500 : 3000;
    const end = Date.now() + duration;
    const count = mobile ? 2 : 3;
    const frame = () => {
      confetti({
        particleCount: count,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#60a5fa', '#818cf8', '#c084fc', '#22d3ee', '#34d399'],
      });
      confetti({
        particleCount: count,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#60a5fa', '#818cf8', '#c084fc', '#22d3ee', '#34d399'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  useEffect(() => {
    setMounted(true);
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);

    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesReady(true));

    const timer = setTimeout(() => fireConfetti(), 600);
    return () => clearTimeout(timer);
  }, [fireConfetti]);

  const memoizedOptions = useMemo(() => {
    const base = isDark ? darkParticles : lightParticles;
    if (!isMobile) return base;
    return {
      ...base,
      particles: {
        ...base.particles,
        number: { value: 50, density: { enable: true } },
      },
      interactivity: {},
    };
  }, [isDark, isMobile]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 배경 — 라이트/다크 */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-indigo-50/80 to-violet-50 dark:from-[#070b1a] dark:via-[#0c1240] dark:to-[#1a0a2e]" />

      {/* 오로라 — PC: 2개, 모바일: 1개 */}
      <motion.div
        className="hidden md:block absolute top-0 left-1/4 w-[800px] h-[400px] bg-gradient-to-r from-blue-400/35 via-cyan-300/30 to-purple-400/35 dark:from-blue-600/40 dark:via-cyan-400/35 dark:to-purple-600/40 blur-[130px]"
        animate={{ x: [-80, 80, -80], rotate: [-5, 5, -5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="hidden md:block absolute bottom-0 right-0 w-[600px] h-[300px] bg-gradient-to-l from-indigo-400/35 via-violet-300/30 to-fuchsia-400/35 dark:from-indigo-500/40 dark:via-violet-400/35 dark:to-fuchsia-500/40 blur-[100px]"
        animate={{ x: [40, -60, 40], rotate: [3, -3, 3] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 플로팅 오브 — PC: 3개, 모바일: 1개 */}
      <motion.div
        className="hidden md:block absolute w-44 h-44 rounded-full bg-blue-400/30 dark:bg-blue-500/35 blur-[80px]"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: '12%', right: '18%' }}
      />
      <motion.div
        className="hidden md:block absolute w-56 h-56 rounded-full bg-violet-400/30 dark:bg-violet-500/35 blur-[90px]"
        animate={{ x: [0, -35, 0], y: [0, 25, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ bottom: '18%', left: '8%' }}
      />
      <motion.div
        className="hidden md:block absolute w-36 h-36 rounded-full bg-cyan-300/30 dark:bg-cyan-400/35 blur-[60px]"
        animate={{ x: [0, 25, 0], y: [0, -40, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{ top: '50%', left: '65%' }}
      />

      {/* tsParticles */}
      {particlesReady && mounted && (
        <Particles
          key={`${isDark ? 'dark' : 'light'}-${isMobile ? 'mobile' : 'desktop'}`}
          className="absolute inset-0 z-[1]"
          options={memoizedOptions}
        />
      )}

      {/* 콘텐츠 */}
      <div className="relative z-10 min-h-screen">
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          {/* 로고 */}
          <motion.div
            className="mb-4 sm:mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="inline-block" prefetch={false}>
              <div className="flex items-center gap-2">
                <Image
                  src={siteConfig.logo}
                  alt="로고"
                  width={340}
                  height={148}
                  priority
                  unoptimized
                  className="h-10 sm:h-14 w-auto dark:invert"
                />
                <span className="ml-1 px-2 py-1 bg-gray-100 dark:bg-white/10 backdrop-blur-sm text-gray-700 dark:text-white/80 text-xs font-semibold rounded border border-black/7 dark:border-white/10">Member</span>
              </div>
            </Link>
          </motion.div>

          <div className="flex flex-col justify-center items-center min-h-0 sm:min-h-[calc(100vh-120px)]">
            {/* 배너 이미지 */}
            <motion.div
              className="w-full max-w-3xl mb-6 sm:mb-10 relative"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* 글로우 효과 */}
              <motion.div
                className="absolute -inset-6 bg-gradient-to-r from-blue-500/40 via-indigo-500/50 to-violet-500/40 dark:from-cyan-400/35 dark:via-blue-500/45 dark:to-purple-500/35 rounded-3xl blur-3xl -z-10"
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.97, 1.03, 0.97],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              <Image
                src="/logo/2.png"
                alt="회원가입을 진심으로 환영합니다"
                width={800}
                height={400}
                priority
                className="w-full h-auto dark:hidden"
              />
              <Image
                src="/logo/1.png"
                alt="회원가입을 진심으로 환영합니다"
                width={800}
                height={400}
                priority
                className="w-full h-auto hidden dark:block"
              />
            </motion.div>

            {/* 축하 메시지 */}
            <motion.div
              className="text-center mb-6 sm:mb-10"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-white/[0.06] backdrop-blur-md border border-indigo-100 dark:border-white/10 mb-6"
                animate={{ boxShadow: ['0 0 10px rgba(99,102,241,0.05)', '0 0 30px rgba(99,102,241,0.15)', '0 0 10px rgba(99,102,241,0.05)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-300" />
                <span className="text-xs text-indigo-600 dark:text-white/60 font-medium tracking-wider">Welcome to 4590 Football</span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-300" />
              </motion.div>
              <motion.h1
                className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-cyan-200 dark:via-white dark:to-violet-200 bg-clip-text text-transparent bg-[length:200%_200%]"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              >
                회원가입을 축하합니다!
              </motion.h1>
              <p className="text-lg sm:text-xl text-gray-500 dark:text-white/40 font-light mb-3">
                축구에 진심인 사람들의 집합소, 4590
              </p>
              <p className="text-sm text-gray-400 dark:text-white/25">
                실시간 스코어, 커뮤니티, 승부예측까지<br />
                모든 축구를 한곳에서
              </p>
            </motion.div>

            <div className="w-full max-w-md px-2 sm:px-0">

              {/* 버튼 */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
              >
                <Link href="/" className="block" prefetch={false}>
                  <motion.button
                    className="w-full py-3 px-4 h-auto rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-300/30 dark:shadow-indigo-500/20"
                    whileHover={{ scale: 1.02, boxShadow: '0 10px 40px rgba(99,102,241,0.35)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    시작하기
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
