'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Trophy, Users, User, Tv, ArrowLeftRight, PenTool,
  ChevronRight, ChevronDown, ArrowDown, BookOpen,
} from 'lucide-react';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import { siteConfig } from '@/shared/config';

/* ─────────────────────────────────────────────
   타입
   ───────────────────────────────────────────── */
export interface GuideDemoImages {
  teamLogos: Record<number, string>;
  leagueLogos: Record<number, string>;
  leagueLogosDark: Record<number, string>;
  playerPhotos: Record<number, string>;
}

/* ─────────────────────────────────────────────
   애니메이션 섹션
   ───────────────────────────────────────────── */
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─────────────────────────────────────────────
   목차
   ───────────────────────────────────────────── */
const TOC_ITEMS = [
  { id: 'league', icon: Trophy, label: '리그·팀 페이지', desc: '리그 선택 → 순위표 → 팀 → 선수' },
  { id: 'match', icon: Tv, label: '라이브스코어·매치', desc: '실시간 스코어, 라인업' },
  { id: 'transfer', icon: ArrowLeftRight, label: '이적시장', desc: '최신 이적 소식' },
  { id: 'editor', icon: PenTool, label: '게시글 카드 삽입', desc: '팀·선수·매치 카드' },
];

/* ─────────────────────────────────────────────
   섹션 헤더
   ───────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, desc, color }: {
  icon: React.ElementType; title: string; desc: string;
  color: 'blue' | 'green' | 'violet' | 'red' | 'amber' | 'cyan';
}) {
  const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    violet: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',
  };
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${colorMap[color].split(' ').slice(0, 2).join(' ')}`}>
        <Icon className={`w-5 h-5 ${colorMap[color].split(' ').slice(2).join(' ')}`} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   동선 화살표
   ───────────────────────────────────────────── */
function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-4">
      <ArrowDown className="w-5 h-5 text-blue-500 dark:text-blue-400" />
      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   안내 박스
   ───────────────────────────────────────────── */
function GuideBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Container className="dark:border dark:border-white/10">
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>
      <ContainerContent>
        {children}
      </ContainerContent>
    </Container>
  );
}

/* ─────────────────────────────────────────────
   데모: 리그 목록
   ───────────────────────────────────────────── */
function LeagueListDemo({ images }: { images: GuideDemoImages }) {
  const [hoverOn, setHoverOn] = useState(false);

  useEffect(() => {
    // 1초 on, 0.5초 off 반복 → 통통 타이밍에 맞춰 호버
    const cycle = () => {
      setHoverOn(true);
      setTimeout(() => setHoverOn(false), 1000);
    };
    cycle();
    const timer = setInterval(cycle, 1500);
    return () => clearInterval(timer);
  }, []);

  const leagues = [
    { id: 39, name: '프리미어리그' },
    { id: 140, name: '라리가' },
    { id: 135, name: '세리에A' },
    { id: 2, name: '챔피언스리그' },
  ];

  return (
    <Container className="overflow-visible dark:border dark:border-white/10">
      <ContainerHeader>
        <ContainerTitle>리그·팀</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="overflow-visible">
        <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">
          리그를 선택하면 각 리그의 순위와 팀 정보를 확인할 수 있습니다.
        </p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">유럽 주요 리그</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {leagues.map((league, i) => (
            <div key={league.id} className={`relative flex flex-col items-center p-2 rounded-md border-b border-dashed border-gray-300 dark:border-gray-600 cursor-pointer transition-colors duration-200 ${i === 0 && hoverOn ? 'bg-gray-100 dark:bg-[#2A2A2A]' : 'hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'}`}>
              {/* 프리미어리그 클릭 - 데스크톱: 위→아래, 모바일: 아래→위 */}
              {i === 0 && (
                <>
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 flex-col items-center pointer-events-none hidden md:flex"
                  >
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                    <span className="text-lg">👇</span>
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex-col items-center pointer-events-none flex md:hidden"
                  >
                    <span className="text-lg">👆</span>
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap">클릭!</span>
                  </motion.div>
                </>
              )}
              {images.leagueLogos[league.id] ? (
                <>
                  <Image src={images.leagueLogos[league.id]} alt={league.name} width={32} height={32} className="w-8 h-8 object-contain dark:hidden" />
                  <Image src={images.leagueLogosDark[league.id] || images.leagueLogos[league.id]} alt={league.name} width={32} height={32} className="w-8 h-8 object-contain hidden dark:block" />
                </>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              )}
              <span className="mt-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 text-center break-keep">{league.name}</span>
            </div>
          ))}
        </div>
      </ContainerContent>
    </Container>
  );
}

/* ─────────────────────────────────────────────
   데모: 순위표
   ───────────────────────────────────────────── */
function StandingsDemo({ images }: { images: GuideDemoImages }) {
  const [hoverOn, setHoverOn] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setHoverOn(true);
      setTimeout(() => setHoverOn(false), 1000);
    };
    cycle();
    const timer = setInterval(cycle, 1500);
    return () => clearInterval(timer);
  }, []);

  const teams = [
    { id: 42, name: '아스널', pts: 70, played: 31, w: 21, d: 7, l: 3, gf: 61, ga: 22, gd: '+39', form: 'WWWWD', status: 'bg-green-600' },
    { id: 50, name: '맨체스터 시티', pts: 61, played: 30, w: 18, d: 7, l: 5, gf: 60, ga: 28, gd: '+32', form: 'DDWWW', status: 'bg-green-600' },
    { id: 40, name: '리버풀', pts: 49, played: 31, w: 14, d: 7, l: 10, gf: 50, ga: 42, gd: '+8', form: 'LDLWW', status: 'bg-green-600' },
    { id: 49, name: '첼시', pts: 48, played: 31, w: 13, d: 9, l: 9, gf: 53, ga: 38, gd: '+15', form: 'LLWLD', status: 'bg-green-600' },
    { id: 47, name: '토트넘', pts: 30, played: 31, w: 7, d: 9, l: 15, gf: 40, ga: 50, gd: '-10', form: 'LDLLL', status: 'bg-transparent' },
  ];

  const getFormStyle = (r: string) => {
    switch (r) {
      case 'W': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'D': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'L': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default: return '';
    }
  };

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] dark:border dark:border-white/10">
      <ContainerHeader>
        <ContainerTitle>순위표</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="p-0">
        <div className="px-4 py-2.5 bg-white dark:bg-[#1D1D1D]">
          <p className="text-sm text-gray-900 dark:text-gray-100">
            순위표에서 팀을 클릭하면 팀 상세 정보를 확인할 수 있습니다.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full w-full border-collapse">
            <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">순위</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">팀</th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">경기</th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">승</th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">무</th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">패</th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">득점</th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">실점</th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">득실차</th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">승점</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">최근 5경기</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <tr
                  key={team.id}
                  className={`cursor-pointer transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] ${i === 0 && hoverOn ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${i < teams.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''} relative`}
                >
                  <td className="px-3 py-2 whitespace-nowrap text-[13px] text-gray-900 dark:text-gray-100 relative">
                    <div className={`absolute inset-y-0 left-0 w-1 ${team.status}`} />
                    <span className="pl-2">{i + 1}</span>
                    {/* 첫 번째 팀에 손가락 */}
                    {i === 0 && (
                      <motion.div
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-7 left-28 flex flex-col items-center pointer-events-none z-10"
                      >
                        <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                        <span className="text-lg">👇</span>
                      </motion.div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-[13px] text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      {images.teamLogos[team.id] ? (
                        <div className="w-6 h-6 flex-shrink-0">
                          <Image src={images.teamLogos[team.id]} alt={team.name} width={24} height={24} className="object-contain w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                      )}
                      <span className="truncate">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-1 py-2 whitespace-nowrap text-[13px] text-gray-900 dark:text-gray-100 text-center hidden md:table-cell">{team.played}</td>
                  <td className="px-1 py-2 whitespace-nowrap text-[13px] text-gray-900 dark:text-gray-100 text-center">{team.w}</td>
                  <td className="px-1 py-2 whitespace-nowrap text-[13px] text-gray-900 dark:text-gray-100 text-center">{team.d}</td>
                  <td className="px-1 py-2 whitespace-nowrap text-[13px] text-gray-900 dark:text-gray-100 text-center">{team.l}</td>
                  <td className="px-1 py-2 whitespace-nowrap text-[13px] text-gray-900 dark:text-gray-100 text-center hidden md:table-cell">{team.gf}</td>
                  <td className="px-1 py-2 whitespace-nowrap text-[13px] text-gray-900 dark:text-gray-100 text-center hidden md:table-cell">{team.ga}</td>
                  <td className="px-1 py-2 whitespace-nowrap text-[13px] text-gray-900 dark:text-gray-100 text-center hidden md:table-cell">{team.gd}</td>
                  <td className="px-1 py-2 whitespace-nowrap text-[13px] text-gray-900 dark:text-gray-100 text-center font-bold">{team.pts}</td>
                  <td className="px-3 py-2 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center justify-center gap-0.5">
                      {team.form.split('').map((r, fi) => (
                        <span key={fi} className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded ${getFormStyle(r)}`}>{r}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContainerContent>
    </Container>
  );
}

/* ─────────────────────────────────────────────
   데모: 선수 헤더 (실제 UI 동일)
   ───────────────────────────────────────────── */
function PlayerHeaderDemo({ images }: { images: GuideDemoImages }) {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D] dark:border dark:border-white/10">
      {/* 상단: 선수 사진 + 이름 + 팀 + 포지션 */}
      <ContainerContent className="!p-4">
        <div className="flex items-center gap-4">
          {/* 이미지 컨테이너 */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-[#333]">
              {images.playerPhotos[1460] ? (
                <Image src={images.playerPhotos[1460]} alt="부카요 사카" width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
            {/* 팀 로고 뱃지 */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full shadow-lg flex items-center justify-center bg-white">
              {images.teamLogos[42] ? (
                <Image src={images.teamLogos[42]} alt="아스널" width={16} height={16} className="w-4 h-4 object-contain" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
          </div>

          {/* 이름, 팀, 포지션 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold truncate text-gray-900 dark:text-[#F0F0F0]">부카요 사카</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[13px] text-gray-600 dark:text-gray-400 truncate">아스널</p>
              <span className="px-2 py-0.5 bg-[#F5F5F5] dark:bg-[#333333] text-gray-700 dark:text-gray-300 rounded text-xs flex-shrink-0">공격수</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 truncate">프리미어리그 · England</p>
          </div>
        </div>
      </ContainerContent>

      {/* 하단: 정보 테이블 */}
      <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-t border-black/5 dark:border-white/10">
        {['키', '몸무게', '생년월일', '나이', '출생지'].map((label) => (
          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
        ))}
      </div>
      <div className="flex items-center py-3">
        {[
          { value: '178 cm' },
          { value: '72 kg' },
          { value: '01/09/05' },
          { value: '23세' },
          { value: 'England' },
        ].map((item, i, arr) => (
          <div key={i} className="flex-1 text-center text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0] relative">
            {item.value}
            {i < arr.length - 1 && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />
            )}
          </div>
        ))}
      </div>
    </Container>
  );
}

/* ─────────────────────────────────────────────
   데모: 팀 페이지 (탭 + 선수단)
   ───────────────────────────────────────────── */
function TeamDemo({ images }: { images: GuideDemoImages }) {
  const [hoverPlayer, setHoverPlayer] = useState(false);
  const [hoverTab, setHoverTab] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setHoverPlayer(true);
      setHoverTab(true);
      setTimeout(() => { setHoverPlayer(false); setHoverTab(false); }, 1000);
    };
    cycle();
    const timer = setInterval(cycle, 1500);
    return () => clearInterval(timer);
  }, []);

  const tabs = ['개요', '경기', '순위', '선수단', '이적', '통계'];
  const players = [
    { id: 1460, name: '부카요 사카', number: 7, age: '23세', apps: 28, goals: 11, assists: 11 },
    { id: 19533, name: '토마스 파르테이', number: 5, age: '31세', apps: 25, goals: 1, assists: 3 },
    { id: 284324, name: '데클란 라이스', number: 41, age: '26세', apps: 31, goals: 3, assists: 7 },
  ];

  return (
    <div className="space-y-4">
      {/* 팀 헤더 (실제 UI 동일) */}
      <Container className="bg-white dark:bg-[#1D1D1D] dark:border dark:border-white/10">
        <div className="flex flex-col md:flex-row items-stretch md:items-center">
          {/* 팀 로고 및 기본 정보 */}
          <div className="flex items-center p-3 md:p-4 md:w-80 flex-shrink-0">
            <div className="flex-shrink-0 mr-3">
              {images.teamLogos[42] ? (
                <Image src={images.teamLogos[42]} alt="아스널 로고" width={48} height={48} className="object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">Arsenal</h3>
              <p className="text-gray-700 dark:text-gray-300 text-[13px]">England</p>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <p className="text-gray-500 dark:text-gray-400 text-xs">창단: 1886년</p>
                <div className="inline-block px-1 py-0.5 bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 text-xs font-medium rounded">ARS</div>
              </div>
            </div>
          </div>

          {/* 홈구장 정보 */}
          <div className="border-t md:border-t-0 md:border-l border-black/5 dark:border-white/10 p-2 md:p-4 flex-1">
            <div className="flex gap-3">
              <div className="relative w-24 h-16 md:w-36 md:h-24 rounded overflow-hidden flex-shrink-0">
                <Image src="/images/guide-emirates-stadium.webp" alt="Emirates Stadium" width={144} height={96} className="w-24 h-16 md:w-36 md:h-24 object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-base text-gray-900 dark:text-[#F0F0F0]">Emirates Stadium</h4>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="block">London</span>
                  <span className="block">Highbury House, 75 Drayton Park</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs">
                  <div className="whitespace-nowrap">
                    <span className="text-gray-500 dark:text-gray-400">수용 인원: </span>
                    <span className="font-medium">60,260명</span>
                  </div>
                  <div className="whitespace-nowrap">
                    <span className="text-gray-500 dark:text-gray-400">표면: </span>
                    <span className="font-medium">grass</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* 탭 네비게이션 */}
      <div className="bg-[#F5F5F5] dark:bg-[#262626] md:rounded-lg border border-black/7 dark:border-0 overflow-visible flex relative">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`flex-1 h-12 flex items-center justify-center text-xs cursor-pointer transition-colors duration-200 ${
              tab === '선수단'
                ? `text-gray-900 dark:text-[#F0F0F0] font-semibold border-b-2 border-[#262626] dark:border-[#F0F0F0] ${hoverTab ? 'bg-[#EAEAEA] dark:bg-[#333333]' : 'bg-white dark:bg-[#1D1D1D]'}`
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
          >
            {tab}
          </div>
        ))}
        {/* 선수단 탭 위에 손가락 */}
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-7 left-1/2 ml-8 flex flex-col items-center pointer-events-none z-10"
        >
          <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
          <span className="text-lg">👇</span>
        </motion.div>
      </div>

      <FlowArrow label="선수단 탭으로 이동" />

      {/* 선수단 테이블 */}
      <Container className="bg-white dark:bg-[#1D1D1D] dark:border dark:border-white/10">
        <ContainerContent className="p-0">
          <div className="px-4 py-2 bg-white dark:bg-[#1D1D1D]">
            <span className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">공격수</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(3명)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
                <tr>
                  <th className="px-2 sm:px-4 md:px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">사진</th>
                  <th className="px-2 sm:px-4 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">번호</th>
                  <th className="px-2 sm:px-4 md:px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">이름</th>
                  <th className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">나이</th>
                  <th className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">출장</th>
                  <th className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">골</th>
                  <th className="px-1 sm:px-2 md:px-6 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">도움</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, i) => (
                  <tr
                    key={player.id}
                    className={`cursor-pointer transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] ${i === 0 && hoverPlayer ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${i < players.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''} relative`}
                  >
                    <td className="px-2 sm:px-4 md:px-6 py-2 whitespace-nowrap">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-[#F5F5F5] dark:bg-[#333333]">
                        {images.playerPhotos[player.id] ? (
                          <Image src={images.playerPhotos[player.id]} alt={player.name} width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 py-2 text-center text-[13px] text-gray-900 dark:text-gray-100 whitespace-nowrap">{player.number}</td>
                    <td className="px-2 sm:px-4 md:px-6 py-2 text-[13px] text-gray-900 dark:text-gray-100 whitespace-nowrap relative">
                      {player.name}
                      {/* 첫 번째 선수 이름 우측에 손가락 */}
                      {i === 0 && (
                        <motion.div
                          animate={{ y: [0, 5, 0] }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute -top-7 left-20 flex flex-col items-center pointer-events-none z-10"
                        >
                          <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                          <span className="text-lg">👇</span>
                        </motion.div>
                      )}
                    </td>
                    <td className="px-1 sm:px-2 md:px-6 py-2 text-center text-[13px] text-gray-900 dark:text-gray-100 whitespace-nowrap">{player.age}</td>
                    <td className="px-1 sm:px-2 md:px-6 py-2 text-center text-[13px] text-gray-900 dark:text-gray-100 whitespace-nowrap">{player.apps}</td>
                    <td className="px-1 sm:px-2 md:px-6 py-2 text-center text-[13px] text-gray-900 dark:text-gray-100 whitespace-nowrap">{player.goals}</td>
                    <td className="px-1 sm:px-2 md:px-6 py-2 text-center text-[13px] text-gray-900 dark:text-gray-100 whitespace-nowrap">{player.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContainerContent>
      </Container>
    </div>
  );
}

/* ─────────────────────────────────────────────
   데모: 라이브스코어 (실제 UI 동일)
   ───────────────────────────────────────────── */
function LiveScoreDemo({ images }: { images: GuideDemoImages }) {
  const [hoverMatch, setHoverMatch] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setHoverMatch(true);
      setTimeout(() => setHoverMatch(false), 1000);
    };
    cycle();
    const timer = setInterval(cycle, 1500);
    return () => clearInterval(timer);
  }, []);

  const matches = [
    { id: 1, status: 'LIVE', elapsed: '72\'', home: { id: 42, name: '아스널', score: 2 }, away: { id: 49, name: '첼시', score: 1 } },
    { id: 2, status: 'LIVE', elapsed: '전반전', home: { id: 40, name: '리버풀', score: 0 }, away: { id: 50, name: '맨체스터 시티', score: 0 } },
    { id: 3, status: 'FT', elapsed: '종료', home: { id: 47, name: '토트넘', score: 1 }, away: { id: 33, name: '맨체스터 유나이티드', score: 3 } },
  ];

  return (
    <div className="space-y-4">
      {/* NavigationBar */}
      <Container className="bg-white dark:bg-[#1D1D1D] dark:border dark:border-white/10">
        {/* 헤더: 날짜 네비게이션 */}
        <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-4 flex items-center justify-between border-b border-black/5 dark:border-white/10">
          <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
            <ChevronRight className="w-5 h-5 rotate-180 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0] px-2 py-1">오늘</span>
            <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
              <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* 본문: 검색 및 필터 */}
        <div className="p-4">
          <div className="flex items-center gap-2 md:gap-4">
            {/* LIVE 버튼 */}
            <button className="h-10 px-3 md:px-4 font-medium text-[13px] md:text-base bg-gray-900 dark:bg-[#F0F0F0] text-white dark:text-gray-900 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse bg-red-500" />
              LIVE
              <span className="text-[13px] text-red-400">(2)</span>
            </button>

            {/* 검색 */}
            <div className="flex-1">
              <div className="w-full h-10 px-3 md:px-4 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] flex items-center">
                <span className="text-[13px] md:text-base text-gray-500 dark:text-gray-400">경기 찾기</span>
              </div>
            </div>

            {/* 모두 열기/닫기 */}
            <button className="h-10 w-10 flex items-center justify-center bg-[#F5F5F5] dark:bg-[#262626] rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
              <ChevronDown className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </Container>

      {/* 리그별 매치 리스트 */}
      <Container className="bg-white dark:bg-[#1D1D1D] dark:border dark:border-white/10">
        {/* 리그 헤더 */}
        <button className="w-full h-12 px-4 flex items-center justify-between hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
          <div className="flex items-center gap-3">
            {images.leagueLogos[39] && (
              <>
                <Image src={images.leagueLogos[39]} alt="EPL" width={20} height={20} className="w-5 h-5 object-contain dark:hidden" />
                <Image src={images.leagueLogosDark[39] || images.leagueLogos[39]} alt="EPL" width={20} height={20} className="w-5 h-5 object-contain hidden dark:block" />
              </>
            )}
            <span className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">프리미어리그</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-[#F0F0F0] text-xs font-medium px-2.5 py-1 rounded-full min-w-[28px] text-center">3</span>
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 rotate-180" />
          </div>
        </button>

        {/* 매치 카드 리스트 */}
        <div className="bg-white dark:bg-[#1D1D1D]">
          {matches.map((match, i) => (
            <div
              key={match.id}
              className={`flex items-center h-12 px-4 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors relative ${i === 0 && hoverMatch ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${i < matches.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''}`}
            >
              {/* 첫 번째 매치에 클릭 손가락 */}
              {i === 0 && (
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                >
                  <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                  <span className="text-lg">👇</span>
                </motion.div>
              )}
              {/* 경기 상태 */}
              <div className="w-14 flex-shrink-0 flex items-center">
                {match.status === 'LIVE' ? (
                  <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-1 rounded animate-pulse whitespace-nowrap">{match.elapsed}</span>
                ) : (
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-[#F5F5F5] dark:bg-[#262626] px-1.5 py-1 rounded whitespace-nowrap">{match.elapsed}</span>
                )}
              </div>

              {/* 홈팀 */}
              <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                <span className="text-xs sm:text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate text-right">{match.home.name}</span>
                {images.teamLogos[match.home.id] ? (
                  <div className="w-6 h-6 flex-shrink-0">
                    <Image src={images.teamLogos[match.home.id]} alt={match.home.name} width={24} height={24} className="w-6 h-6 object-contain" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                )}
              </div>

              {/* 스코어 */}
              <div className="px-2 flex-shrink-0">
                <span className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">{match.home.score} - {match.away.score}</span>
              </div>

              {/* 어웨이팀 */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {images.teamLogos[match.away.id] ? (
                  <div className="w-6 h-6 flex-shrink-0">
                    <Image src={images.teamLogos[match.away.id]} alt={match.away.name} width={24} height={24} className="w-6 h-6 object-contain" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                )}
                <span className="text-xs sm:text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate">{match.away.name}</span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

/* ─────────────────────────────────────────────
   데모: 에디터 카드 삽입
   ───────────────────────────────────────────── */
function EditorCardDemo({ images }: { images: GuideDemoImages }) {
  const [hoverToolbar, setHoverToolbar] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setHoverToolbar(true);
      setTimeout(() => setHoverToolbar(false), 1000);
    };
    cycle();
    const timer = setInterval(cycle, 1500);
    return () => clearInterval(timer);
  }, []);

  const leagues = [
    { id: 39, name: '프리미어리그' },
    { id: 140, name: '라리가' },
    { id: 135, name: '세리에A' },
    { id: 78, name: '분데스리가' },
    { id: 61, name: '리그1' },
    { id: 292, name: 'K리그' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. 에디터 툴바 (실제 UI 동일) */}
      <div className="border border-black/7 dark:border-white/10 rounded-t-md flex flex-wrap items-center p-2 gap-1 bg-[#F5F5F5] dark:bg-[#262626] relative overflow-visible">
        {/* 텍스트 스타일 */}
        <button className="h-auto w-auto p-1.5 md:p-2 text-gray-900 dark:text-[#F0F0F0] rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333]" title="굵게">
          <BookOpen className="w-[18px] h-[18px] hidden" /><span className="text-sm font-bold leading-none">B</span>
        </button>
        <button className="h-auto w-auto p-1.5 md:p-2 text-gray-900 dark:text-[#F0F0F0] rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333]" title="기울임꼴">
          <span className="text-sm italic leading-none">I</span>
        </button>
        <div className="w-px h-6 bg-black/7 dark:bg-white/10 mx-1" />
        {/* 미디어 (축약) */}
        <button className="h-auto w-auto p-1.5 md:p-2 text-gray-900 dark:text-[#F0F0F0] rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333]" title="이미지">
          <ArrowDown className="w-[18px] h-[18px] hidden" /><span className="text-xs text-gray-400">···</span>
        </button>
        <div className="w-px h-6 bg-black/7 dark:bg-white/10 mx-1" />
        {/* 경기 결과 + 팀/선수 버튼 (각각 클릭 안내) */}
        <div className="relative">
          <button className={`h-auto w-auto p-1.5 md:p-2 rounded transition-colors ${hoverToolbar ? 'bg-[#EAEAEA] dark:bg-[#333333]' : 'text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'}`} title="경기 결과 추가">
            <Image src="/icons/live.png" alt="경기 결과" width={18} height={18} className="dark:invert" />
          </button>
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-8 left-[10px] flex flex-col items-center pointer-events-none z-10"
          >
            <span className="text-lg">👆</span>
            <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap">매치</span>
          </motion.div>
        </div>
        <div className="relative">
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-8 left-[6px] flex flex-col items-center pointer-events-none z-10"
          >
            <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">팀/선수</span>
            <span className="text-lg">👇</span>
          </motion.div>
          <button className={`h-auto w-auto p-1.5 md:p-2 rounded transition-colors ${hoverToolbar ? 'bg-[#EAEAEA] dark:bg-[#333333]' : 'text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'}`} title="팀/선수 추가">
            <Users className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      <div className="border-t border-black/5 dark:border-white/10 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40">
            <Tv className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-[#F0F0F0]">매치 카드 삽입</h3>
        </div>
      </div>

      <FlowArrow label="경기 결과 버튼 클릭" />

      {/* 2-A. 매치 선택 패널 (MatchResultForm 실제 UI 동일) */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg overflow-visible w-full">
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center">
          <h3 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">경기 결과 선택</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* 날짜 선택 버튼 */}
              <div className="relative flex-1">
                <button className="w-full h-9 flex items-center px-3 text-xs justify-start bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md transition-colors text-gray-900 dark:text-[#F0F0F0]">
                  <ChevronDown className="mr-2 h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="whitespace-nowrap">2026년 3월 27일 (목)</span>
                </button>
              </div>
              {/* 검색 입력 필드 */}
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="w-full h-9 pl-8 pr-3 border border-black/7 dark:border-white/10 rounded-md text-xs bg-white dark:bg-[#1D1D1D] flex items-center">
                  <span className="text-gray-500 dark:text-gray-400">리그 또는 팀 검색...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 리그별 경기 목록 */}
        <div className="px-4 overflow-visible">
          <div className="space-y-4">
            {/* EPL */}
            <div className="space-y-1.5">
              <div className="flex items-center px-2 py-1.5 bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-md">
                {images.leagueLogos[39] && (
                  <>
                    <Image src={images.leagueLogos[39]} alt="EPL" width={20} height={20} className="w-5 h-5 object-contain mr-2 dark:hidden" />
                    <Image src={images.leagueLogosDark[39] || images.leagueLogos[39]} alt="EPL" width={20} height={20} className="w-5 h-5 object-contain mr-2 hidden dark:block" />
                  </>
                )}
                <h3 className="font-medium text-xs text-gray-900 dark:text-[#F0F0F0]">프리미어리그</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  { home: { id: 42, name: '아스널' }, away: { id: 49, name: '첼시' }, score: '2 - 1', status: '경기 종료' },
                  { home: { id: 40, name: '리버풀' }, away: { id: 50, name: '맨체스터 시티' }, score: '1 - 1', status: '경기 종료' },
                ].map((m, i) => (
                  <button key={i} className={`w-full block border border-black/7 dark:border-white/10 rounded-md p-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors relative ${i === 0 && hoverToolbar ? 'bg-[#EAEAEA] dark:bg-[#333333]' : 'bg-white dark:bg-[#1D1D1D]'}`}>
                    {i === 0 && (
                      <motion.div
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                      >
                        <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                        <span className="text-lg">👇</span>
                      </motion.div>
                    )}
                    <div className="flex items-center">
                      <div className="flex-1 flex items-center min-w-0">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                          {images.teamLogos[m.home.id] && <Image src={images.teamLogos[m.home.id]} alt={m.home.name} width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />}
                        </div>
                        <span className="text-[11px] sm:text-xs truncate ml-1.5 text-gray-900 dark:text-[#F0F0F0]">{m.home.name}</span>
                      </div>
                      <div className="flex flex-col items-center flex-shrink-0 mx-2">
                        <div className="px-2 sm:px-3 py-0.5 bg-[#EAEAEA] dark:bg-[#333333] rounded text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-[#F0F0F0]">{m.score}</div>
                        <div className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 whitespace-nowrap">{m.status}</div>
                      </div>
                      <div className="flex-1 flex items-center justify-end min-w-0">
                        <span className="text-[11px] sm:text-xs truncate mr-1 text-right text-gray-900 dark:text-[#F0F0F0]">{m.away.name}</span>
                        <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                          {images.teamLogos[m.away.id] && <Image src={images.teamLogos[m.away.id]} alt={m.away.name} width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 라리가 */}
            <div className="space-y-1.5">
              <div className="flex items-center px-2 py-1.5 bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-md">
                {images.leagueLogos[140] && (
                  <>
                    <Image src={images.leagueLogos[140]} alt="라리가" width={20} height={20} className="w-5 h-5 object-contain mr-2 dark:hidden" />
                    <Image src={images.leagueLogosDark[140] || images.leagueLogos[140]} alt="라리가" width={20} height={20} className="w-5 h-5 object-contain mr-2 hidden dark:block" />
                  </>
                )}
                <h3 className="font-medium text-xs text-gray-900 dark:text-[#F0F0F0]">라리가</h3>
              </div>
              <div className="space-y-1.5">
                <button className="w-full block bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-md p-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors">
                  <div className="flex items-center">
                    <div className="flex-1 flex items-center min-w-0">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                        {images.teamLogos[541] && <Image src={images.teamLogos[541]} alt="레알 마드리드" width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />}
                      </div>
                      <span className="text-[11px] sm:text-xs truncate ml-1.5 text-gray-900 dark:text-[#F0F0F0]">레알 마드리드</span>
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0 mx-2">
                      <div className="px-2 sm:px-3 py-0.5 bg-[#EAEAEA] dark:bg-[#333333] rounded text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-[#F0F0F0]">3 - 0</div>
                      <div className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 whitespace-nowrap">경기 종료</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0">
                      <span className="text-[11px] sm:text-xs truncate mr-1 text-right text-gray-900 dark:text-[#F0F0F0]">바르셀로나</span>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                        {images.teamLogos[529] && <Image src={images.teamLogos[529]} alt="바르셀로나" width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 취소 버튼 */}
        <div className="p-4 border-t border-black/7 dark:border-white/10">
          <div className="flex justify-end">
            <button className="px-3 py-1.5 text-xs bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md text-gray-900 dark:text-[#F0F0F0] transition-colors">취소</button>
          </div>
        </div>
      </div>

      {/* 매치 카드 렌더링 결과 */}
      <FlowArrow label="매치 선택 시 삽입되는 카드" />
      <div className="rounded-lg overflow-hidden border border-black/5 dark:border-white/10 bg-white dark:bg-[#1D1D1D] shadow-sm">
        <div className="bg-[#f9fafb] dark:bg-[#262626] px-3 h-10 flex items-center border-b border-black/5 dark:border-white/10">
          {images.leagueLogos[39] && (
            <>
              <Image src={images.leagueLogos[39]} alt="EPL" width={20} height={20} className="w-5 h-5 object-contain mr-2 dark:hidden" />
              <Image src={images.leagueLogosDark[39] || images.leagueLogos[39]} alt="EPL" width={20} height={20} className="w-5 h-5 object-contain mr-2 hidden dark:block" />
            </>
          )}
          <span className="text-xs text-gray-700 dark:text-gray-300">프리미어리그</span>
        </div>
        <div className="flex items-center justify-between px-3 py-3">
          <div className="w-[40%] flex flex-col items-center">
            {images.teamLogos[42] && (
              <Image src={images.teamLogos[42]} alt="아스널" width={48} height={48} className="w-12 h-12 object-contain" />
            )}
            <span className="mt-1 text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">아스널</span>
          </div>
          <div className="w-[20%] text-center flex-shrink-0">
            <div className="flex items-center justify-center mb-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">2</span>
              <span className="text-2xl font-bold text-gray-400 mx-1">-</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">1</span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">경기 종료</span>
          </div>
          <div className="w-[40%] flex flex-col items-center">
            {images.teamLogos[49] && (
              <Image src={images.teamLogos[49]} alt="첼시" width={48} height={48} className="w-12 h-12 object-contain" />
            )}
            <span className="mt-1 text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">첼시</span>
          </div>
        </div>
        <div className="bg-[#f9fafb] dark:bg-[#262626] px-3 py-2 border-t border-black/5 dark:border-white/10 text-center">
          <span className="text-xs text-blue-600 dark:text-blue-400">매치 상세 정보</span>
        </div>
      </div>

      <div className="border-t border-black/5 dark:border-white/10 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-900/40">
            <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-[#F0F0F0]">팀·선수 카드 삽입</h3>
        </div>
      </div>

      <FlowArrow label="팀/선수 추가 버튼 클릭" />

      {/* 2-B. 엔티티 선택 패널 (EntityPickerForm 실제 UI 동일) */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg overflow-visible w-full">
        {/* 헤더 */}
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center justify-between border-b border-black/10 dark:border-white/15">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">팀 선택</h3>
          </div>
        </div>

        {/* 탭 (TabList 스타일) */}
        <div className="flex border-b border-black/5 dark:border-white/10">
          <button className="flex-1 flex items-center justify-center gap-1.5 h-11 text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0] border-b-2 border-gray-900 dark:border-[#F0F0F0] bg-white dark:bg-[#1D1D1D]">
            <Users className="h-3.5 w-3.5" />
            팀
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 h-11 text-[13px] text-gray-500 dark:text-gray-400 bg-[#F5F5F5] dark:bg-[#262626]">
            <User className="h-3.5 w-3.5" />
            선수
          </button>
        </div>

        {/* 리그 선택 그리드 */}
        <div className="p-4 overflow-visible">
          <div className="grid grid-cols-3 gap-2">
            {leagues.map((league, i) => (
              <button
                key={league.id}
                className={`flex flex-col items-center p-2 rounded-lg border border-black/7 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors outline-none relative ${i === 0 && hoverToolbar ? 'bg-[#EAEAEA] dark:bg-[#333333]' : 'bg-[#F5F5F5] dark:bg-[#262626]'}`}
              >
                {i === 0 && (
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                  >
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                    <span className="text-lg">👇</span>
                  </motion.div>
                )}
                {images.leagueLogos[league.id] ? (
                  <>
                    <Image src={images.leagueLogos[league.id]} alt={league.name} width={32} height={32} className="w-8 h-8 object-contain dark:hidden" />
                    <Image src={images.leagueLogosDark[league.id] || images.leagueLogos[league.id]} alt={league.name} width={32} height={32} className="w-8 h-8 object-contain hidden dark:block" />
                  </>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                )}
                <span className="mt-1.5 text-[11px] font-medium text-gray-900 dark:text-[#F0F0F0] text-center leading-tight">{league.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 하단 취소 버튼 */}
        <div className="p-4 border-t border-black/7 dark:border-white/10">
          <div className="flex justify-end">
            <button className="px-3 py-1.5 text-xs bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md text-gray-900 dark:text-[#F0F0F0] transition-colors">취소</button>
          </div>
        </div>
      </div>

      <FlowArrow label="리그 클릭 시 팀 목록" />

      {/* 팀 선택 패널 (리그 선택 후) */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg overflow-visible w-full">
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center justify-between border-b border-black/10 dark:border-white/15">
          <div className="flex items-center gap-2">
            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333]">
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400 rotate-180" />
            </button>
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">팀 선택</h3>
          </div>
        </div>
        {/* 브레드크럼 */}
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-[#FAFAFA] dark:bg-[#232323]">
          <span>프리미어리그</span>
        </div>
        {/* 팀 그리드 */}
        <div className="p-4 overflow-visible">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 42, name: '아스널' },
              { id: 49, name: '첼시' },
              { id: 50, name: '맨체스터 시티' },
              { id: 40, name: '리버풀' },
              { id: 47, name: '토트넘' },
              { id: 33, name: '맨유' },
            ].map((team, i) => (
              <button
                key={team.id}
                className={`flex flex-col items-center p-2 rounded-lg border border-black/7 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors outline-none relative ${i === 0 && hoverToolbar ? 'bg-[#EAEAEA] dark:bg-[#333333]' : 'bg-[#F5F5F5] dark:bg-[#262626]'}`}
              >
                {i === 0 && (
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                  >
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                    <span className="text-lg">👇</span>
                  </motion.div>
                )}
                {images.teamLogos[team.id] ? (
                  <Image src={images.teamLogos[team.id]} alt={team.name} width={32} height={32} className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                )}
                <span className="mt-1.5 text-[11px] font-medium text-gray-900 dark:text-[#F0F0F0] text-center line-clamp-1 leading-tight">{team.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-black/7 dark:border-white/10">
          <div className="flex justify-end">
            <button className="px-3 py-1.5 text-xs bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md text-gray-900 dark:text-[#F0F0F0] transition-colors">취소</button>
          </div>
        </div>
      </div>

      {/* 팀/선수 카드 렌더링 결과 */}
      <FlowArrow label="팀/선수 선택 시 삽입되는 카드" />
      <div className="flex gap-4 justify-center">
        {/* 팀 카드 */}
        <div className="w-1/2 rounded-lg overflow-hidden border border-black/5 dark:border-white/10 bg-white dark:bg-[#1D1D1D] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="bg-[#f9fafb] dark:bg-[#262626] px-3 h-10 flex items-center border-b border-black/5 dark:border-white/10">
            {images.leagueLogos[39] && (
              <>
                <Image src={images.leagueLogos[39]} alt="EPL" width={24} height={24} className="w-6 h-6 object-contain mr-2 dark:hidden" />
                <Image src={images.leagueLogosDark[39] || images.leagueLogos[39]} alt="EPL" width={24} height={24} className="w-6 h-6 object-contain mr-2 hidden dark:block" />
              </>
            )}
            <span className="text-xs text-gray-700 dark:text-gray-300">Premier League</span>
          </div>
          <div className="flex flex-col items-center py-3 min-h-[5.5rem]">
            {images.teamLogos[42] && (
              <Image src={images.teamLogos[42]} alt="아스널" width={48} height={48} className="w-12 h-12 object-contain" />
            )}
            <span className="mt-2 text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">아스널</span>
          </div>
          <div className="bg-[#f9fafb] dark:bg-[#262626] px-3 py-2 border-t border-black/5 dark:border-white/10 text-center">
            <span className="text-xs text-blue-600 dark:text-blue-400">팀 정보 확인</span>
          </div>
        </div>

        {/* 선수 카드 */}
        <div className="w-1/2 rounded-lg overflow-hidden border border-black/5 dark:border-white/10 bg-white dark:bg-[#1D1D1D] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="bg-[#f9fafb] dark:bg-[#262626] px-3 h-10 flex items-center border-b border-black/5 dark:border-white/10">
            {images.teamLogos[42] && (
              <Image src={images.teamLogos[42]} alt="아스널" width={24} height={24} className="w-6 h-6 object-contain mr-2" />
            )}
            <span className="text-xs text-gray-700 dark:text-gray-300">아스널</span>
          </div>
          <div className="flex flex-col items-center py-3 min-h-[5.5rem]">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-[#333]">
              {images.playerPhotos[1460] && (
                <Image src={images.playerPhotos[1460]} alt="부카요 사카" width={48} height={48} className="w-12 h-12 object-cover" />
              )}
            </div>
            <span className="mt-2 text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">부카요 사카</span>
          </div>
          <div className="bg-[#f9fafb] dark:bg-[#262626] px-3 py-2 border-t border-black/5 dark:border-white/10 text-center">
            <span className="text-xs text-blue-600 dark:text-blue-400">선수 정보 확인</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   데모: 선수 스탯 모달 (실제 UI 동일)
   ───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   데모: 이적시장 (티커 + 필터 + 리스트)
   ───────────────────────────────────────────── */
function TransferDemo({ images }: { images: GuideDemoImages }) {
  const [hoverFilter, setHoverFilter] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setHoverFilter(true);
      setTimeout(() => setHoverFilter(false), 1000);
    };
    cycle();
    const timer = setInterval(cycle, 1500);
    return () => clearInterval(timer);
  }, []);

  const transfers = [
    { player: '엘링 홀란', playerId: 1100, fromName: '맨체스터 시티', fromId: 50, toName: '첼시', toId: 49, type: '€150M', date: '2026-03-15' },
    { player: '모하메드 살라', playerId: 306, fromName: '리버풀', fromId: 40, toName: '맨체스터 시티', toId: 50, type: '자유 이적', date: '2026-03-10' },
    { player: '부카요 사카', playerId: 1460, fromName: '아스널', fromId: 42, toName: '토트넘', toId: 47, type: '임대', date: '2026-03-08' },
  ];

  return (
    <div className="space-y-4">
      <GuideBox title="이적 티커">
        <p className="text-[13px] text-gray-700 dark:text-gray-300">
          페이지 상단에 <strong className="text-gray-900 dark:text-gray-100">최신 이적 정보</strong>가 자동으로 흐릅니다.<br />
          각 항목에는 <strong className="text-gray-900 dark:text-gray-100">선수 이름</strong>, <strong className="text-gray-900 dark:text-gray-100">이전 팀 로고 → 이동 팀 로고</strong>, <strong className="text-gray-900 dark:text-gray-100">이적 유형</strong>(이적료, 자유 이적, 임대 등)이 표시됩니다.
        </p>
      </GuideBox>

      {/* 이적 티커 (실제 UI 동일) */}
      <style>{`
        @keyframes guideTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10 rounded-lg">
        <div className="w-full px-4 flex items-center gap-2 py-2 min-h-[44px]">
          <div className="flex-1 flex items-center overflow-hidden relative">
            {/* 우측 페이드 */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F5F5F5] dark:from-[#262626] to-transparent z-10 pointer-events-none" />

            <div
              className="flex items-center gap-3"
              style={{ animation: 'guideTicker 15s linear infinite' }}
            >
              {[...transfers, ...transfers].map((t, i) => (
                <div key={i} className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 shrink-0">
                  <span className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors whitespace-nowrap cursor-pointer">{t.player}</span>
                  {images.teamLogos[t.fromId] ? (
                    <div className="w-[14px] h-[14px] flex-shrink-0">
                      <Image src={images.teamLogos[t.fromId]} alt={t.fromName} width={14} height={14} className="object-contain w-[14px] h-[14px]" />
                    </div>
                  ) : (
                    <div className="w-[14px] h-[14px] rounded bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  )}
                  <span className="text-gray-400 dark:text-gray-500">→</span>
                  {images.teamLogos[t.toId] ? (
                    <div className="w-[14px] h-[14px] flex-shrink-0">
                      <Image src={images.teamLogos[t.toId]} alt={t.toName} width={14} height={14} className="object-contain w-[14px] h-[14px]" />
                    </div>
                  ) : (
                    <div className="w-[14px] h-[14px] rounded bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  )}
                  <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 필터 (실제 UI 동일) */}
      <Container className="overflow-visible dark:border dark:border-white/10">
        <ContainerHeader>
          <div className="flex items-center justify-between w-full">
            <ContainerTitle>필터</ContainerTitle>
            <span className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">전체 초기화</span>
          </div>
        </ContainerHeader>
        <div className="bg-white dark:bg-[#1D1D1D] px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 overflow-visible">
            {/* 리그 선택 */}
            <div className="relative">
              <label className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
                리그 <span className="text-red-500">*</span>
              </label>
              <button className={`flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-[13px] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors ${hoverFilter ? 'bg-[#EAEAEA] dark:bg-[#333333]' : 'bg-[#F5F5F5] dark:bg-[#262626]'}`}>
                <span className="truncate text-gray-900 dark:text-[#F0F0F0]">프리미어리그</span>
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
              {/* 클릭 안내 */}
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
              >
                <span className="text-lg">👆</span>
                <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap">클릭!</span>
              </motion.div>
            </div>
            {/* 팀 선택 */}
            <div>
              <label className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">팀</label>
              <button className="flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-[13px] bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                <span className="truncate text-gray-900 dark:text-[#F0F0F0]">전체 팀</span>
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            {/* 이적 유형 */}
            <div>
              <label className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">이적 유형</label>
              <button className="flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-[13px] bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                <span className="truncate text-gray-900 dark:text-[#F0F0F0]">전체</span>
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* 활성 필터 태그 */}
          <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-[13px] text-gray-700 dark:text-gray-300">활성 필터:</span>
              <span className="inline-flex items-center px-3 py-1 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-[13px] rounded-full">
                프리미어리그 <span className="ml-2 text-base text-gray-400 cursor-pointer">×</span>
              </span>
            </div>
          </div>
        </div>
      </Container>

      {/* 이적 목록 (실제 UI 동일) */}
      <Container className="dark:border dark:border-white/10">
        <ContainerHeader>
          <div className="flex items-center justify-between w-full">
            <ContainerTitle>이적 목록</ContainerTitle>
            <span className="text-xs text-gray-700 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626] px-2 py-1 rounded">총 3건</span>
          </div>
        </ContainerHeader>

        {/* 데스크탑 테이블 */}
        <div className="hidden md:block bg-white dark:bg-[#1D1D1D]">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[38%]" />
              <col className="w-[16%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">선수</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">이적 경로</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">이적료/타입</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">날짜</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1D1D1D] divide-y divide-black/5 dark:divide-white/10">
              {transfers.map((t, i) => (
                <tr key={i} className="hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 w-9 h-9">
                        {images.playerPhotos[t.playerId] ? (
                          <Image src={images.playerPhotos[t.playerId]} alt={t.player} width={36} height={36} className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 bg-gray-50" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate block">{t.player}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center space-x-1.5">
                      <div className="flex items-center space-x-1 min-w-0 flex-1">
                        {images.teamLogos[t.fromId] ? (
                          <div className="w-5 h-5 flex-shrink-0">
                            <Image src={images.teamLogos[t.fromId]} alt={t.fromName} width={20} height={20} className="object-contain w-5 h-5 rounded" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
                        )}
                        <span className="text-[13px] text-gray-700 dark:text-gray-300 truncate">{t.fromName}</span>
                      </div>
                      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div className="flex items-center space-x-1 min-w-0 flex-1">
                        {images.teamLogos[t.toId] ? (
                          <div className="w-5 h-5 flex-shrink-0">
                            <Image src={images.teamLogos[t.toId]} alt={t.toName} width={20} height={20} className="object-contain w-5 h-5 rounded" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
                        )}
                        <span className="text-[13px] text-gray-900 dark:text-[#F0F0F0] truncate font-medium">{t.toName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">
                      {t.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-gray-700 dark:text-gray-300">
                    {t.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 레이아웃 */}
        <div className="block md:hidden divide-y divide-black/5 dark:divide-white/10 bg-white dark:bg-[#1D1D1D]">
          {transfers.map((t, i) => (
            <div key={i} className="p-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
              {/* 1줄: 선수 사진 + 이름 | 날짜 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8">
                    {images.playerPhotos[t.playerId] ? (
                      <Image src={images.playerPhotos[t.playerId]} alt={t.player} width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-gray-200 bg-gray-50" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                    )}
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0] truncate">{t.player}</span>
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300 flex-shrink-0">
                  {t.date.slice(5).replace('-', '/')}
                </div>
              </div>
              {/* 2줄: from팀 → to팀 | 이적타입 */}
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-7 gap-1 items-center flex-1">
                  <div className="col-span-3 flex items-center space-x-1 min-w-0">
                    {images.teamLogos[t.fromId] ? (
                      <div className="w-4 h-4 flex-shrink-0">
                        <Image src={images.teamLogos[t.fromId]} alt={t.fromName} width={16} height={16} className="object-contain w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
                    )}
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{t.fromName}</span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="col-span-3 flex items-center space-x-1 min-w-0">
                    {images.teamLogos[t.toId] ? (
                      <div className="w-4 h-4 flex-shrink-0">
                        <Image src={images.teamLogos[t.toId]} alt={t.toName} width={16} height={16} className="object-contain w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
                    )}
                    <span className="text-xs text-gray-900 dark:text-[#F0F0F0] truncate">{t.toName}</span>
                  </div>
                </div>
                <div className="text-xs flex-shrink-0 ml-2 w-16 flex justify-end">
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">
                    {t.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

/* ─────────────────────────────────────────────
   데모: 라인업 테이블 (실제 UI 동일)
   ───────────────────────────────────────────── */
function LineupDemo({ images }: { images: GuideDemoImages }) {
  const hoverPlayer = true;

  const homePlayers = [
    { id: 1460, name: '부카요 사카', number: 7, pos: 'F', captain: true },
    { id: 37127, name: '마르틴 외데가르드', number: 8, pos: 'M', captain: false },
    { id: 284324, name: '데클란 라이스', number: 41, pos: 'M', captain: false },
  ];

  const awayPlayers = [
    { id: 152982, name: '콜 파머', number: 20, pos: 'F', captain: false },
    { id: 5996, name: '엔소 페르난데스', number: 8, pos: 'M', captain: true },
    { id: 116117, name: '모이세스 카이세도', number: 25, pos: 'M', captain: false },
  ];

  const PlayerRow = ({ player, showClick }: { player: typeof homePlayers[0]; showClick?: boolean }) => (
    <div className={`flex items-center gap-3 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors py-2 px-4 relative ${showClick && hoverPlayer ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}>
      <div className="relative">
        {images.playerPhotos[player.id] ? (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-[#333]">
            <Image src={images.playerPhotos[player.id]} alt={player.name} width={40} height={40} className="w-10 h-10 object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-[13px] bg-[#F5F5F5] dark:bg-[#262626] rounded-full">
            {player.number}
          </div>
        )}
        {player.captain && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">C</span>
        )}
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-900 dark:text-gray-100">
          {player.name}
          {player.captain && <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">(주장)</span>}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{player.pos} {player.number}</div>
      </div>
      {showClick && (
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
        >
          <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
          <span className="text-lg">👇</span>
        </motion.div>
      )}
    </div>
  );

  return (
    <>
      {/* 데스크톱: 2열 테이블 */}
      <div className="hidden md:block">
        <Container className="bg-white dark:bg-[#1D1D1D] dark:border dark:border-white/10">
          <ContainerHeader>
            <ContainerTitle>선발 라인업</ContainerTitle>
          </ContainerHeader>
          <ContainerContent className="p-0">
            <table className="min-w-full">
              <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
                <tr>
                  <th className="w-1/2 py-3 px-4 text-left text-[13px] font-medium border-r border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      {images.teamLogos[42] && (
                        <Image src={images.teamLogos[42]} alt="아스널" width={20} height={20} className="w-5 h-5 object-contain" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-gray-100">아스널</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">4-3-3</span>
                    </div>
                  </th>
                  <th className="w-1/2 py-3 px-4 text-left text-[13px] font-medium">
                    <div className="flex items-center gap-2">
                      {images.teamLogos[49] && (
                        <Image src={images.teamLogos[49]} alt="첼시" width={20} height={20} className="w-5 h-5 object-contain" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-gray-100">첼시</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">4-2-3-1</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {homePlayers.map((home, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-[#1D1D1D]' : 'bg-[#F5F5F5] dark:bg-[#2D2D2D]'}>
                    <td className="border-r border-black/5 dark:border-white/10">
                      <PlayerRow player={home} showClick={i === 0} />
                    </td>
                    <td>
                      <PlayerRow player={awayPlayers[i]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ContainerContent>
        </Container>
      </div>

      {/* 모바일: 팀별 세로 리스트 */}
      <div className="md:hidden">
        <Container className="bg-white dark:bg-[#1D1D1D] dark:border dark:border-white/10">
          <ContainerHeader>
            <div className="flex items-center justify-between w-full">
              <ContainerTitle>선발 라인업</ContainerTitle>
              <div className="flex items-center gap-2">
                {images.teamLogos[42] && (
                  <Image src={images.teamLogos[42]} alt="아스널" width={20} height={20} className="w-5 h-5 object-contain" />
                )}
                <div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">아스널</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">4-3-3</div>
                </div>
              </div>
            </div>
          </ContainerHeader>
          <ContainerContent className="p-0">
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {homePlayers.map((player, i) => (
                <PlayerRow key={player.id} player={player} showClick={i === 0} />
              ))}
            </div>
          </ContainerContent>
        </Container>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   데모: 선수 스탯 모달 (실제 UI 동일)
   ───────────────────────────────────────────── */
function PlayerStatsModalDemo({ images }: { images: GuideDemoImages }) {
  const statSections = [
    {
      title: '기본 정보',
      rows: [
        { label: '평점', value: '7.8' },
        { label: '출전시간', value: '72\'' },
      ],
    },
    {
      title: '공격',
      rows: [
        { label: '득점', value: '1' },
        { label: '도움', value: '1' },
        { label: '슈팅', value: '4' },
        { label: '유효슈팅', value: '2' },
      ],
    },
    {
      title: '드리블 & 듀얼',
      rows: [
        { label: '드리블 시도', value: '5' },
        { label: '드리블 성공', value: '3' },
        { label: '듀얼 시도', value: '12' },
        { label: '듀얼 성공', value: '7' },
      ],
    },
    {
      title: '패스',
      rows: [
        { label: '총 패스', value: '38' },
        { label: '키패스', value: '3' },
        { label: '패스 성공률', value: '87%' },
      ],
    },
    {
      title: '파울 & 카드',
      rows: [
        { label: '파울 얻음', value: '2' },
        { label: '파울 범함', value: '1' },
        { label: '옐로카드', value: '0' },
        { label: '레드카드', value: '0' },
      ],
    },
  ];

  return (
    <div className="max-w-md mx-auto">
      <Container className="bg-white dark:bg-[#1D1D1D] dark:border dark:border-white/10">
        {/* 헤더 */}
        <div className="relative text-center pt-4 pb-3 px-4 border-b border-black/5 dark:border-white/10">
          {/* 좌우 네비게이션 */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2D2D2D] flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 rotate-180" />
            </div>
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2D2D2D] flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          {/* 선수 이미지 */}
          <div className="relative w-20 h-20 mx-auto mb-2">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white dark:border-[#1D1D1D] shadow-lg bg-gray-100 dark:bg-[#333]">
              {images.playerPhotos[1460] ? (
                <Image src={images.playerPhotos[1460]} alt="부카요 사카" width={80} height={80} className="w-20 h-20 object-cover" />
              ) : (
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
            {/* 팀 로고 뱃지 */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow bg-white flex items-center justify-center">
              {images.teamLogos[42] ? (
                <Image src={images.teamLogos[42]} alt="아스널" width={20} height={20} className="w-5 h-5 object-contain" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-200" />
              )}
            </div>
          </div>

          {/* 선수 정보 */}
          <h3 className="text-base font-bold mb-1 text-gray-900 dark:text-[#F0F0F0]">부카요 사카</h3>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-700 dark:text-gray-300">
            <span>#7</span>
            <span>공격수</span>
            <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">주장</span>
          </div>
        </div>

        {/* 스탯 섹션들 */}
        <div className="px-4 py-4">
          {statSections.map((section) => (
            <Container key={section.title} className="mb-4 dark:border dark:border-white/10">
              <ContainerHeader>
                <ContainerTitle>{section.title}</ContainerTitle>
              </ContainerHeader>
              <ContainerContent className="p-0">
                <table className="w-full border-collapse">
                  <tbody>
                    {section.rows.map((row, i) => (
                      <tr key={row.label} className={i < section.rows.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''}>
                        <td className="px-4 py-2 text-[13px] text-gray-700 dark:text-gray-300">{row.label}</td>
                        <td className="px-4 py-2 text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] text-right">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ContainerContent>
            </Container>
          ))}

          {/* 선수 정보 더보기 버튼 */}
          <div className="mt-4">
            <div className="block w-full py-2.5 px-3 bg-[#262626] dark:bg-[#3F3F3F] text-white font-medium rounded-lg shadow text-[13px] text-center">
              선수 정보 더보기
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

/* ─────────────────────────────────────────────
   데모: 매치 헤더 (실제 UI 동일)
   ───────────────────────────────────────────── */
function MatchHeaderDemo({ images }: { images: GuideDemoImages }) {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D] dark:border dark:border-white/10">
      {/* 리그 정보 및 경기 상태 */}
      <div className="h-12 flex items-center justify-between border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] px-4">
        {/* 리그 */}
        <div className="flex items-center gap-1.5 md:gap-2 md:w-1/3 md:border-r md:border-r-black/5 md:dark:border-r-white/10 md:pr-4">
          {images.leagueLogos[39] && (
            <>
              <Image src={images.leagueLogos[39]} alt="EPL" width={24} height={24} className="w-4 h-4 md:w-6 md:h-6 object-contain dark:hidden" />
              <Image src={images.leagueLogosDark[39] || images.leagueLogos[39]} alt="EPL" width={24} height={24} className="w-4 h-4 md:w-6 md:h-6 object-contain hidden dark:block" />
            </>
          )}
          <span className="text-xs md:text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate">프리미어리그</span>
        </div>
        {/* 날짜 & 라운드 */}
        <div className="w-1/3 md:w-1/3 flex flex-col items-center justify-center md:border-r md:border-r-black/5 md:dark:border-r-white/10 md:px-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">2026년 3월 27일</div>
          <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">30라운드</div>
        </div>
        {/* 경기장 (데스크톱) */}
        <div className="hidden md:flex md:w-1/3 md:pl-4 items-center justify-center text-center">
          <div className="text-xs text-gray-700 dark:text-gray-300">Emirates Stadium - London</div>
        </div>
      </div>

      <div className="px-2 py-3 md:px-4 md:py-4">
        {/* 팀 정보 & 스코어 */}
        <div className="flex items-center justify-between">
          {/* 홈팀 */}
          <div className="w-1/3 md:w-1/3 text-center">
            <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2 flex items-center justify-center">
              {images.teamLogos[42] ? (
                <Image src={images.teamLogos[42]} alt="아스널" width={48} height={48} className="object-contain w-full h-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
            <div className="font-bold text-[13px] md:text-base text-gray-900 dark:text-[#F0F0F0]">아스널</div>
          </div>

          {/* 스코어 */}
          <div className="w-1/3 text-center">
            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F0F0F0]">2 - 1</div>
            <div className="text-xs md:text-[13px] text-gray-500 dark:text-gray-400 mt-1">후반전 72&apos;</div>
          </div>

          {/* 어웨이팀 */}
          <div className="w-1/3 md:w-1/3 text-center">
            <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2 flex items-center justify-center">
              {images.teamLogos[49] ? (
                <Image src={images.teamLogos[49]} alt="첼시" width={48} height={48} className="object-contain w-full h-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
            <div className="font-bold text-[13px] md:text-base text-gray-900 dark:text-[#F0F0F0]">첼시</div>
          </div>
        </div>

        {/* 득점자 목록 */}
        <div className="flex flex-col md:flex-row mt-4 md:mt-6 border-t border-black/5 dark:border-white/10 pt-4">
          {/* 홈팀 득점자 */}
          <div className="w-full md:w-1/3 relative pl-2 md:px-2 mb-4 md:mb-0 md:text-center">
            <div className="md:hidden py-1 font-semibold mb-2 text-[13px] flex items-center text-gray-900 dark:text-[#F0F0F0]">
              {images.teamLogos[42] && (
                <Image src={images.teamLogos[42]} alt="아스널" width={16} height={16} className="w-4 h-4 object-contain mr-2" />
              )}
              아스널
            </div>
            <div className="space-y-1">
              <div className="text-[13px] text-gray-700 dark:text-gray-300">
                <span className="font-medium">부카요 사카</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">23&apos;</span>
              </div>
              <div className="text-[13px] text-gray-700 dark:text-gray-300">
                <span className="font-medium">마르틴 외데고르</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">58&apos;</span>
                <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">어시스트: 부카요 사카</div>
              </div>
            </div>
          </div>

          {/* 중앙 구분 */}
          <div className="hidden md:flex md:w-1/3 items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400 font-medium">득점자</div>
          </div>

          {/* 어웨이팀 득점자 */}
          <div className="w-full md:w-1/3 relative pl-2 md:px-2 md:text-center">
            <div className="md:hidden py-1 font-semibold mb-2 text-[13px] flex items-center text-gray-900 dark:text-[#F0F0F0]">
              {images.teamLogos[49] && (
                <Image src={images.teamLogos[49]} alt="첼시" width={16} height={16} className="w-4 h-4 object-contain mr-2" />
              )}
              첼시
            </div>
            <div className="space-y-1">
              <div className="text-[13px] text-gray-700 dark:text-gray-300">
                <span className="font-medium">콜 파머</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">67&apos;</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

/* ─────────────────────────────────────────────
   메인 컴포넌트
   ───────────────────────────────────────────── */
export default function GuidePageClient({ demoImages }: { demoImages: GuideDemoImages }) {
  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] dark:bg-[#111111]">
      {/* 로고 */}
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="inline-block">
          <Image src={siteConfig.logo} alt="4590 Football" width={124} height={60} className="h-10 sm:h-14 w-auto dark:invert" priority />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8 space-y-8">

        {/* 히어로 */}
        <Section>
          <Container className="dark:border dark:border-white/10">
            <ContainerHeader>
              <ContainerTitle>이용 가이드</ContainerTitle>
            </ContainerHeader>
            <ContainerContent className="text-center py-6">
              <BookOpen className="w-10 h-10 text-blue-500 dark:text-blue-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                4590 Football의 주요 기능과 사용법을 안내합니다.<br />
                아래 항목을 클릭하면 해당 섹션으로 이동합니다.
              </p>
            </ContainerContent>
          </Container>
        </Section>

        {/* 목차 */}
        <Section>
          <Container className="dark:border dark:border-white/10">
            <ContainerHeader>
              <ContainerTitle>목차</ContainerTitle>
            </ContainerHeader>
            <ContainerContent className="px-0 py-0">
              {TOC_ITEMS.map(({ id, icon: Icon, label, desc }, i) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors ${i < TOC_ITEMS.length - 1 ? 'border-b border-gray-50 dark:border-gray-800/50' : ''}`}
                >
                  <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{label}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-2">{desc}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                </a>
              ))}
            </ContainerContent>
          </Container>
        </Section>

        {/* ───── 1. 리그·팀 ───── */}
        <Section id="league" className="scroll-mt-20 space-y-4 bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-white/10 px-4 py-6 md:px-6">
          <SectionHeader icon={Trophy} title="리그·팀 페이지" desc="리그를 선택해 순위표와 팀 정보를 확인하세요" color="blue" />

          <GuideBox title="사용 방법">
            <ol className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
              <li>상단 메뉴 또는 사이드바에서 <strong className="text-gray-900 dark:text-gray-100">리그·팀</strong>을 클릭</li>
              <li>원하는 리그를 선택하면 <strong className="text-gray-900 dark:text-gray-100">팀 순위표</strong>와 <strong className="text-gray-900 dark:text-gray-100">선수 득점/도움 순위</strong>를 확인</li>
              <li>순위표에서 팀 이름을 클릭하면 <strong className="text-gray-900 dark:text-gray-100">팀 상세 페이지</strong>로 이동</li>
              <li>팀 페이지에서 <strong className="text-gray-900 dark:text-gray-100">선수단</strong> 탭으로 이동하면 소속 선수 목록을 확인</li>
              <li>선수단에서 선수를 클릭하면 <strong className="text-gray-900 dark:text-gray-100">선수 상세 페이지</strong>로 이동</li>
            </ol>
          </GuideBox>

          <LeagueListDemo images={demoImages} />

          <FlowArrow label="리그에서 팀 클릭" />
          <StandingsDemo images={demoImages} />

          <FlowArrow label="순위표에서 팀 클릭" />
          <TeamDemo images={demoImages} />

          <GuideBox title="팀 페이지에서 확인할 수 있는 정보">
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
              <li><strong className="text-gray-900 dark:text-gray-100">개요</strong> — 기본 정보, 시즌 통계, 최근 경기</li>
              <li><strong className="text-gray-900 dark:text-gray-100">경기</strong> — 최근 및 예정 경기 목록</li>
              <li><strong className="text-gray-900 dark:text-gray-100">순위</strong> — 소속 리그 순위표</li>
              <li><strong className="text-gray-900 dark:text-gray-100">선수단</strong> — 전체 선수 목록, 포지션, 등번호, 스탯</li>
              <li><strong className="text-gray-900 dark:text-gray-100">이적</strong> — 영입/방출 내역</li>
              <li><strong className="text-gray-900 dark:text-gray-100">통계</strong> — 팀 상세 통계</li>
            </ul>
          </GuideBox>

          <FlowArrow label="선수단에서 선수 클릭" />
          <PlayerHeaderDemo images={demoImages} />

          <GuideBox title="선수 페이지에서 확인할 수 있는 정보">
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
              <li><strong className="text-gray-900 dark:text-gray-100">선수 통계</strong> — 포지션, 출전, 득점, 도움, 슈팅, 패스, 태클, 카드 등 시즌 상세 스탯</li>
              <li><strong className="text-gray-900 dark:text-gray-100">경기별 통계</strong> — 각 경기에서의 평점, 출전 시간, 득점, 도움, 슈팅, 패스 기록</li>
              <li><strong className="text-gray-900 dark:text-gray-100">순위</strong> — 득점, 도움, 출전, 카드 등 리그 내 선수 순위</li>
              <li><strong className="text-gray-900 dark:text-gray-100">이적 기록</strong> — 이적 날짜, 이전/이후 소속팀, 이적 유형(자유 이적, 임대, 이적료)</li>
              <li><strong className="text-gray-900 dark:text-gray-100">부상 기록</strong> — 부상 날짜, 유형, 사유, 기간</li>
              <li><strong className="text-gray-900 dark:text-gray-100">트로피</strong> — 우승, 준우승 등 수상 이력</li>
            </ul>
          </GuideBox>
        </Section>

        {/* ───── 4. 라이브스코어·매치 ───── */}
        <Section id="match" className="scroll-mt-20 space-y-4 bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-white/10 px-4 py-6 md:px-6">
          <SectionHeader icon={Tv} title="라이브스코어 · 매치 페이지" desc="실시간 스코어, 라인업, 경기 통계" color="red" />

          <GuideBox title="사용 방법">
            <ol className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
              <li>상단 메뉴에서 <strong className="text-gray-900 dark:text-gray-100">라이브스코어</strong>를 클릭</li>
              <li>날짜별로 경기 목록을 확인하고, 경기를 클릭하면 상세 페이지로 이동</li>
              <li>매치 상세 페이지에서 다양한 탭으로 경기 정보를 확인</li>
            </ol>
          </GuideBox>

          <LiveScoreDemo images={demoImages} />

          <FlowArrow label="라이브스코어에서 매치 클릭" />
          <MatchHeaderDemo images={demoImages} />

          <GuideBox title="매치 상세 페이지에서 확인할 수 있는 정보">
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
              <li><strong className="text-gray-900 dark:text-gray-100">응원</strong> — 경기 예측 투표, 응원 댓글, 관련 게시글</li>
              <li><strong className="text-gray-900 dark:text-gray-100">전력</strong> — 팀 전력 분석, 상대 전적(H2H)</li>
              <li><strong className="text-gray-900 dark:text-gray-100">이벤트</strong> — 득점, 교체, 카드 등 경기 타임라인</li>
              <li><strong className="text-gray-900 dark:text-gray-100">라인업</strong> — 선발 라인업, 포메이션, 선수 클릭 시 상세 스탯 모달</li>
              <li><strong className="text-gray-900 dark:text-gray-100">통계</strong> — 팀 경기 통계, 개인 선수 통계</li>
              <li><strong className="text-gray-900 dark:text-gray-100">순위</strong> — 소속 리그 순위표</li>
            </ul>
          </GuideBox>

          <FlowArrow label="라인업 탭으로 이동" />
          <LineupDemo images={demoImages} />

          <FlowArrow label="라인업에서 선수 클릭" />
          <PlayerStatsModalDemo images={demoImages} />
        </Section>

        {/* ───── 5. 이적시장 ───── */}
        <Section id="transfer" className="scroll-mt-20 space-y-4 bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-white/10 px-4 py-6 md:px-6">
          <SectionHeader icon={ArrowLeftRight} title="이적시장" desc="최신 이적, 임대, 자유계약 소식" color="amber" />

          <GuideBox title="사용 방법">
            <ol className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
              <li>상단 이적 티커에서 최신 이적 소식을 확인 (5대 리그 + K리그 + MLS)</li>
              <li><strong className="text-gray-900 dark:text-gray-100">이적시장</strong> 페이지에서 리그, 팀, 이적 유형별로 필터링</li>
              <li>선수를 클릭하면 <strong className="text-gray-900 dark:text-gray-100">선수 상세 페이지</strong>로 이동</li>
            </ol>
          </GuideBox>

          <GuideBox title="지원 리그">
            <div className="text-[13px] text-gray-700 dark:text-gray-300 space-y-3">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2.5 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500 text-sm">&#9733;</span>
                  <p className="font-bold text-amber-800 dark:text-amber-300 text-[13px]">이적 정보는 1주일에 한 번 업데이트됩니다</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">자동 업데이트 (13개 리그)</p>
                <p>프리미어리그 · 라리가 · 세리에A · 분데스리가 · 리그1 · K리그1 · 챔피언십 · 에레디비시 · 프리메이라리가 · J1리그 · MLS · 사우디 프로리그 · 브라질레이랑</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">리그 선택 시 조회 (4개 리그)</p>
                <p>덴마크 수페르리가 · 중국 슈퍼리그 · 리가MX · 스코틀랜드 프리미어십</p>
              </div>
            </div>
          </GuideBox>

          <TransferDemo images={demoImages} />
        </Section>

        {/* ───── 6. 게시글 카드 삽입 ───── */}
        <Section id="editor" className="scroll-mt-20 space-y-4 bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-white/10 px-4 py-6 md:px-6">
          <SectionHeader icon={PenTool} title="게시글에 카드 삽입하기" desc="팀, 선수, 매치 카드를 게시글에 삽입" color="cyan" />

          <GuideBox title="카드 삽입 방법">
            <ol className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
              <li>게시글 작성 중 에디터 툴바에서 <strong className="text-gray-900 dark:text-gray-100">경기 결과</strong> 또는 <strong className="text-gray-900 dark:text-gray-100">팀/선수 추가</strong> 버튼을 클릭</li>
              <li><strong className="text-gray-900 dark:text-gray-100">경기 결과</strong> — 날짜별 경기를 선택하면 매치 카드가 삽입됩니다</li>
              <li><strong className="text-gray-900 dark:text-gray-100">팀/선수</strong> — 리그 → 팀 (→ 선수) 순서로 선택하면 카드가 삽입됩니다</li>
            </ol>
          </GuideBox>

          <EditorCardDemo images={demoImages} />

        </Section>

        {/* 하단 CTA */}
        <Section>
          <Container className="dark:border dark:border-white/10">
            <ContainerContent className="text-center py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                궁금한 점이 있으시면 공지사항을 확인하거나 문의해주세요.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-[#F0F0F0] dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  홈으로
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/boards/notice"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333] transition-colors"
                >
                  공지사항
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333] transition-colors"
                >
                  문의하기
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </ContainerContent>
          </Container>
        </Section>

      </div>
    </div>
  );
}
