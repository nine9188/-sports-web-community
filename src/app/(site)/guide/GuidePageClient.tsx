'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Trophy, Users, User, Tv, ArrowLeftRight, PenTool,
  ChevronRight, ChevronDown, ArrowDown, BookOpen,
  ShoppingBag, Palette, Bot, Bell, Search,
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
  { id: 'shop', icon: ShoppingBag, label: '상점', desc: '팀 아이콘, 이모티콘 팩 구매' },
  { id: 'emoticon-studio', icon: Palette, label: '이모티콘 스튜디오', desc: '나만의 이모티콘 제작' },
  { id: 'chatbot', icon: Bot, label: '고객센터 문의', desc: '이용문의, 신고, 의견 제출' },
  { id: 'notification', icon: Bell, label: '알림', desc: '댓글, 추천, 멘션 알림' },
  { id: 'search', icon: Search, label: '검색', desc: '게시글, 팀, 선수 통합 검색' },
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
   데모: 상점
   ───────────────────────────────────────────── */
function ShopDemo({ images }: { images: GuideDemoImages }) {
  const [activeTab, setActiveTab] = useState('프리미어리그');
  const [purchasedIds, setPurchasedIds] = useState<Set<number>>(new Set());
  const [selectedItem, setSelectedItem] = useState<{ id: number; name: string; price: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hoverOn, setHoverOn] = useState(false);
  const userPoints = 12500;

  useEffect(() => {
    const cycle = () => {
      setHoverOn(true);
      setTimeout(() => setHoverOn(false), 1000);
    };
    cycle();
    const timer = setInterval(cycle, 1500);
    return () => clearInterval(timer);
  }, []);

  const categories = ['전체', '프리미어리그', '라리가', '세리에A', 'K리그', '이모티콘'];

  const teamItems = [
    { id: 42, name: '아스널', price: 3000 },
    { id: 49, name: '첼시', price: 3000 },
    { id: 50, name: '맨시티', price: 3000 },
    { id: 40, name: '리버풀', price: 3000 },
  ];

  const handlePurchase = () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    setTimeout(() => {
      setPurchasedIds((prev) => new Set(prev).add(selectedItem.id));
      setIsProcessing(false);
      setSelectedItem(null);
    }, 800);
  };

  return (
    <>
    <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg overflow-hidden">
      {/* 상점 헤더 */}
      <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center rounded-t-lg">
        <h3 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">포인트 상점</h3>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[13px]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-gray-700 dark:text-gray-300 hidden sm:inline">보유 포인트</span>
          <span className="font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">{userPoints.toLocaleString()} P</span>
        </div>
      </div>

      <div className="p-4">
        {/* 카테고리 탭 */}
        <div className="flex gap-1 sm:gap-1.5 mb-4 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-md whitespace-nowrap transition-colors flex-shrink-0 ${
                activeTab === cat
                  ? 'bg-[#262626] dark:bg-[#F0F0F0] text-white dark:text-[#1D1D1D] font-medium'
                  : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-600 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 아이템 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {teamItems.map((item) => {
            const isOwned = item.id === 42 || purchasedIds.has(item.id);
            const isTarget = item.id === 49 && !isOwned;

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={isOwned ? -1 : 0}
                onClick={() => { if (!isOwned) setSelectedItem(item); }}
                className={`relative border border-black/7 dark:border-0 rounded-md overflow-hidden bg-white dark:bg-[#1D1D1D] shadow-sm flex flex-col transition-all ${
                  isOwned ? 'cursor-default' : 'cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
                } ${isTarget && hoverOn ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
              >
                {/* 구매 버튼 위에 클릭 유도 — 첼시만 */}
                <div className="py-5 flex justify-center bg-[#F5F5F5] dark:bg-[#262626]">
                  <div className="h-8 w-8 flex items-center justify-center">
                    {images.teamLogos[item.id] ? (
                      <Image src={images.teamLogos[item.id]} alt={item.name} width={32} height={32} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                  </div>
                </div>
                <div className="border-t border-black/7 dark:border-white/10" />
                <div className="p-2 sm:p-3 mt-auto">
                  <h3 className="text-[11px] sm:text-[13px] font-medium text-center leading-4 sm:leading-5 line-clamp-2 min-h-[32px] sm:min-h-[40px] text-gray-900 dark:text-[#F0F0F0]">{item.name}</h3>
                  <div className="mt-1.5 sm:mt-2 flex items-center justify-between gap-1 sm:gap-2">
                    <span className="text-[10px] sm:text-[11px] whitespace-nowrap tabular-nums text-gray-700 dark:text-gray-300">{item.price.toLocaleString()} P</span>
                    {isOwned ? (
                      <span className="h-6 sm:h-8 px-1.5 sm:px-2 text-[10px] sm:text-[11px] bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] rounded whitespace-nowrap inline-flex items-center justify-center border border-black/7 dark:border-0">
                        보유 중
                      </span>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        {isTarget && (
                          <motion.div
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                            className="flex items-center gap-0.5 pointer-events-none"
                          >
                            <span className="text-[9px] sm:text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap">클릭!</span>
                            <span className="text-sm sm:text-lg">👉</span>
                          </motion.div>
                        )}
                        <span className={`h-6 sm:h-8 px-1.5 sm:px-2 text-[10px] sm:text-[12px] font-medium rounded whitespace-nowrap inline-flex items-center justify-center border border-black/7 dark:border-0 transition-colors cursor-pointer ${
                          isTarget && hoverOn
                            ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]'
                            : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
                        }`}>
                          구매
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-3">
          아이템을 클릭하면 아래 구매 확인 화면이 변경됩니다
        </p>
      </div>

    </div>

    {/* 구매 확인 모달 데모 */}
    <FlowArrow label="구매 클릭" />

    {/* 데스크톱: 센터 모달 */}
    <div className="hidden md:block">
      <div className="max-w-md mx-auto w-full border border-black/7 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D] shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/7 dark:border-white/10">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-[#F0F0F0]">구매 확인</h3>
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 flex-shrink-0">
              {images.teamLogos[selectedItem?.id ?? 49] ? (
                <Image src={images.teamLogos[selectedItem?.id ?? 49]} alt={selectedItem?.name ?? '첼시'} width={20} height={20} className="w-full h-full object-contain" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-[13px] text-gray-900 dark:text-[#F0F0F0]">{selectedItem?.name ?? '첼시'}</p>
              <p className="text-xs tabular-nums text-gray-700 dark:text-gray-300">{(selectedItem?.price ?? 3000).toLocaleString()} 포인트</p>
            </div>
          </div>
          <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-gray-700 dark:text-gray-300">보유한 내 포인트</span>
              <span className="text-base font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">{userPoints.toLocaleString()} P</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-gray-700 dark:text-gray-300">상품 가격</span>
              <span className="text-base font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">- {(selectedItem?.price ?? 3000).toLocaleString()} P</span>
            </div>
            <div className="border-t border-black/5 dark:border-white/10 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">남는 포인트</span>
                <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-[#F0F0F0]">
                  {(userPoints - (selectedItem?.price ?? 3000)).toLocaleString()} P
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-black/7 dark:border-white/10">
          <div className="text-[13px] text-gray-700 dark:text-gray-300 mb-3">
            <p className="font-medium text-gray-900 dark:text-[#F0F0F0]">이 아이템을 구매하시겠습니까?</p>
            <p className="mt-1">구매 후에는 환불이 불가능합니다.</p>
          </div>
          <div className="relative">
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
            >
              <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
              <span className="text-lg">👇</span>
            </motion.div>
          </div>
          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className={`w-full h-12 text-base font-medium rounded-lg active:scale-[0.98] transition disabled:opacity-50 ${
              hoverOn
                ? 'bg-[#3F3F3F] dark:bg-gray-200 text-white dark:text-[#1D1D1D]'
                : 'bg-[#262626] dark:bg-[#F0F0F0] text-white dark:text-[#1D1D1D] hover:bg-[#3F3F3F] dark:hover:bg-gray-200'
            }`}
          >
            {isProcessing ? '처리 중...' : '구매하기'}
          </button>
        </div>
      </div>
    </div>

    {/* 모바일: 바텀시트 */}
    <div className="md:hidden">
      <div className="w-full rounded-t-2xl overflow-hidden bg-white dark:bg-[#1D1D1D] shadow-lg">
        {/* 헤더 — 실제 DialogHeader 스타일 */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] rounded-t-2xl">
          <h3 className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">구매 확인</h3>
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 flex-shrink-0">
              {images.teamLogos[selectedItem?.id ?? 49] ? (
                <Image src={images.teamLogos[selectedItem?.id ?? 49]} alt={selectedItem?.name ?? '첼시'} width={20} height={20} className="w-full h-full object-contain" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-[13px] text-gray-900 dark:text-[#F0F0F0]">{selectedItem?.name ?? '첼시'}</p>
              <p className="text-xs tabular-nums text-gray-700 dark:text-gray-300">{(selectedItem?.price ?? 3000).toLocaleString()} 포인트</p>
            </div>
          </div>
          <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-gray-700 dark:text-gray-300">보유한 내 포인트</span>
              <span className="text-base font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">{userPoints.toLocaleString()} P</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-gray-700 dark:text-gray-300">상품 가격</span>
              <span className="text-base font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">- {(selectedItem?.price ?? 3000).toLocaleString()} P</span>
            </div>
            <div className="border-t border-black/5 dark:border-white/10 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">남는 포인트</span>
                <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-[#F0F0F0]">
                  {(userPoints - (selectedItem?.price ?? 3000)).toLocaleString()} P
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-4 border-t border-black/7 dark:border-white/10">
          <div className="text-[13px] text-gray-700 dark:text-gray-300 mb-3">
            <p className="font-medium text-gray-900 dark:text-[#F0F0F0]">이 아이템을 구매하시겠습니까?</p>
            <p className="mt-1">구매 후에는 환불이 불가능합니다.</p>
          </div>
          <div className="relative overflow-visible">
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-8 left-[55%] -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
            >
              <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
              <span className="text-lg">👇</span>
            </motion.div>
            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className={`w-full h-12 text-base font-medium rounded-lg active:scale-[0.98] transition disabled:opacity-50 ${
                hoverOn
                  ? 'bg-[#3F3F3F] dark:bg-gray-200 text-white dark:text-[#1D1D1D]'
                  : 'bg-[#262626] dark:bg-[#F0F0F0] text-white dark:text-[#1D1D1D]'
              }`}
            >
              {isProcessing ? '처리 중...' : '구매하기'}
            </button>
          </div>
          {/* safe area */}
          <div className="h-4" />
        </div>
      </div>
    </div>

      {/* 프로필 아이콘 변경 데모 */}
      <FlowArrow label="구매 후 프로필에서 아이콘 변경" />
      <ProfileIconDemo images={images} />
    </>
  );
}

/* ─────────────────────────────────────────────
   데모: 프로필 아이콘 선택
   ───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   데모: 댓글 이모티콘 피커
   ───────────────────────────────────────────── */
function EmoticonPickerDemo() {
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

  const emoticons = ['⚽', '🥅', '🏟️', '👟', '🧤', '🏃', '🎽', '📣', '🔔', '🏆', '🥇', '⭐'];

  return (
    <>
      {/* ① 댓글 입력창 */}
      <Container className="bg-white dark:bg-[#1D1D1D] overflow-visible">
        <ContainerHeader>
          <ContainerTitle>댓글</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="overflow-visible">
          <div className="space-y-3">
            <textarea
              className="w-full px-3 py-3 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg text-base sm:text-[13px] placeholder-gray-500 dark:placeholder-gray-500 resize-none"
              rows={3}
              placeholder="댓글을 작성해주세요..."
              readOnly
            />
            <div className="flex justify-between w-full overflow-visible">
              <div className="relative overflow-visible">
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                >
                  <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                  <span className="text-lg">👇</span>
                </motion.div>
                <button className={`h-[40px] px-3 text-[13px] font-medium rounded-md border border-black/7 dark:border-white/10 transition-colors ${
                  hoverOn ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]' : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300'
                }`}>
                  이모티콘
                </button>
              </div>
              <div className="flex gap-2">
                <button className="h-[40px] px-3 text-[13px] font-medium rounded-md bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 border border-black/7 dark:border-white/10">
                  등록
                </button>
                <button className="h-[40px] px-3 text-[13px] font-medium rounded-md bg-[#262626] dark:bg-[#3F3F3F] text-white">
                  등록+추천
                </button>
              </div>
            </div>
          </div>
        </ContainerContent>
      </Container>

      <FlowArrow label="이모티콘 버튼 클릭" />

      {/* ② 이모티콘 피커 — 데스크톱 */}
      <div className="hidden md:block">
        <div className="max-w-[692px] mx-auto w-full border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#1D1D1D] shadow-lg overflow-visible">
          <div className="flex items-center justify-between px-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11 rounded-t-lg">
            <span className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">이모티콘</span>
            <button className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex items-center border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11 px-2 gap-1">
            <button className="w-9 h-9 flex items-center justify-center rounded-md bg-white dark:bg-[#1D1D1D] border border-black/10 dark:border-white/15"><span className="text-lg">⚽</span></button>
            <button className="w-9 h-9 flex items-center justify-center rounded-md"><span className="text-lg">🎉</span></button>
            <div className="flex-1" />
            <button className="w-9 h-9 flex items-center justify-center rounded-md text-gray-400" title="상점">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" /></svg>
            </button>
          </div>
          <div className="px-4 py-4 overflow-visible">
            <div className="grid grid-cols-6 gap-2.5">
              {emoticons.map((emoji, i) => {
                const isTarget = i === 0;
                return (
                  <div key={i} className="relative overflow-visible">
                    {isTarget && (
                      <motion.div
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                      >
                        <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                        <span className="text-lg">👇</span>
                      </motion.div>
                    )}
                    <button className={`w-full aspect-square flex items-center justify-center p-1 rounded border border-transparent transition-colors group ${
                      isTarget && hoverOn ? 'bg-[#F5F5F5] dark:bg-[#262626] border-black/5 dark:border-white/10' : 'hover:bg-[#F5F5F5] dark:hover:bg-[#262626] hover:border-black/5 dark:hover:border-white/10'
                    }`}>
                      <span className="text-[48px] group-hover:scale-105 transition-transform">{emoji}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-center border-t border-black/5 dark:border-white/10 h-[64px] rounded-b-lg">
            <span className="text-xs text-gray-400 dark:text-gray-500">1 / 1</span>
          </div>
        </div>
      </div>

      {/* ② 이모티콘 피커 — 모바일 바텀시트 */}
      <div className="md:hidden">
        <div className="w-full rounded-t-2xl bg-white dark:bg-[#1D1D1D] shadow-lg overflow-visible">
          {/* 드래그 핸들 + 헤더 — 실제 EmoticonPicker 모바일 */}
          <div className="flex flex-col items-center pt-2 pb-1 border-b border-black/5 dark:border-white/10 flex-shrink-0 rounded-t-2xl">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mb-2" />
            <div className="flex items-center justify-between w-full px-4 pb-1">
              <span className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">이모티콘</span>
              <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          {/* PackageTabs — 실제: < [팩 썸네일들] > [상점] [설정] */}
          <div className="flex items-center border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11 flex-shrink-0">
            <button className="flex items-center justify-center w-8 h-full text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1 flex h-full">
              <button className="flex-shrink-0 flex items-center justify-center w-12 h-full border-r border-[#EAEAEA] dark:border-[#333333] bg-white dark:bg-[#1D1D1D] border-t-2 border-t-[#262626] dark:border-t-[#F0F0F0]">
                <span className="text-lg">⚽</span>
              </button>
              <button className="flex-shrink-0 flex items-center justify-center w-12 h-full border-r border-[#EAEAEA] dark:border-[#333333] border-t-2 border-t-transparent opacity-60">
                <span className="text-lg">🎉</span>
              </button>
            </div>
            <button className="flex items-center justify-center w-8 h-full border-l border-r border-black/5 dark:border-white/10 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="flex h-full bg-[#EAEAEA] dark:bg-[#333333]">
              <button className="flex items-center justify-center w-10 h-full text-gray-500" title="상점">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" /></svg>
              </button>
              <button className="flex items-center justify-center w-10 h-full text-gray-500 border-l border-black/5 dark:border-white/10" title="설정">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
          </div>
          {/* 이모티콘 그리드 — 모바일 6열 스크롤 */}
          <div className="px-3 py-3 overflow-visible">
            <div className="grid grid-cols-6 gap-1.5">
              {emoticons.map((emoji, i) => {
                const isTarget = i === 0;
                return (
                  <div key={i} className="relative overflow-visible">
                    {isTarget && (
                      <motion.div
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-8 left-0 flex flex-col items-center pointer-events-none z-10"
                      >
                        <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                        <span className="text-lg">👇</span>
                      </motion.div>
                    )}
                    <button className={`w-full aspect-square flex items-center justify-center p-1 rounded border border-transparent transition-colors ${
                      isTarget && hoverOn ? 'bg-[#F5F5F5] dark:bg-[#262626] border-black/5 dark:border-white/10' : ''
                    }`}>
                      <span className="text-[36px]">{emoji}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {/* 하단 safe area */}
          <div className="h-16 flex-shrink-0 border-t border-black/5 dark:border-white/10" />
        </div>
      </div>

      <FlowArrow label="이모티콘 선택" />

      <GuideBox title="참고">
        <p className="text-[13px] text-gray-700 dark:text-gray-300">
          이모티콘을 선택하면 댓글 입력창에 <strong className="text-gray-900 dark:text-gray-100 font-mono">:코드:</strong> 형태의 텍스트로 삽입됩니다.<br />
          등록 버튼을 누르면 코드가 실제 이모티콘 이미지로 변환되어 표시됩니다.
        </p>
      </GuideBox>

      {/* ③ 선택 후 — textarea에 코드로 삽입된 상태 */}
      <Container className="bg-white dark:bg-[#1D1D1D] overflow-visible">
        <ContainerHeader>
          <ContainerTitle>댓글</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="overflow-visible">
          <div className="space-y-3">
            <textarea
              className="w-full px-3 py-3 border border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] rounded-lg text-base sm:text-[13px] resize-none"
              rows={3}
              value=":soccer_ball:"
              readOnly
            />
            <div className="flex justify-between w-full overflow-visible">
              <button className="h-[40px] px-3 text-[13px] font-medium rounded-md bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 border border-black/7 dark:border-white/10">
                이모티콘
              </button>
              <div className="flex gap-2 overflow-visible">
                <div className="relative overflow-visible">
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                  >
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                    <span className="text-lg">👇</span>
                  </motion.div>
                  <button className={`h-[40px] px-3 text-[13px] font-medium rounded-md border border-black/7 dark:border-white/10 transition-colors ${
                    hoverOn ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]' : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300'
                  }`}>
                    등록
                  </button>
                </div>
                <button className="h-[40px] px-3 text-[13px] font-medium rounded-md bg-[#262626] dark:bg-[#3F3F3F] text-white">
                  등록+추천
                </button>
              </div>
            </div>
          </div>
        </ContainerContent>
      </Container>

      <FlowArrow label="등록 클릭" />

      {/* ④ 등록된 댓글 — 실제 Comment UI */}
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>댓글 1개</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
          <div className="pb-4">
            {/* 작성자 */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] flex-shrink-0">
                  <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/level-2.png" alt="레벨 아이콘" width={20} height={20} className="w-full h-full object-contain" />
                </div>
                <span className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">축구팬123</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">방금</span>
            </div>

            {/* 이모티콘 — 60px 이미지 */}
            <div className="text-[13px] text-gray-800 dark:text-gray-200 mb-2 break-words leading-relaxed whitespace-pre-wrap">
              <span className="inline-block w-[60px] h-[60px] text-[52px] leading-none m-1">⚽</span>
            </div>

            {/* 액션 — 좌: 좋아요/싫어요/답글, 우: 수정/삭제 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  <span>0</span>
                </button>
                <button className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 11v-9m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                  </svg>
                  <span>0</span>
                </button>
                <button className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  답글
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">수정</span>
                <span className="text-xs text-red-500 dark:text-red-400">삭제</span>
              </div>
            </div>
          </div>
        </ContainerContent>
      </Container>
    </>
  );
}

/* ─────────────────────────────────────────────
   데모: 고객센터 문의 챗봇
   ───────────────────────────────────────────── */
function ChatbotDemo() {
  const chipButtons = [
    '커뮤니티 이용문의',
    '약관 및 정보처리방침',
    '회원신고',
    '의견제출',
    '게시글/댓글 삭제요청',
    '버그신고',
  ];

  return (
    <>
      {/* 푸터 데모 */}
      <Container className="bg-white dark:bg-[#1D1D1D] overflow-visible">
        <ContainerHeader>
          <ContainerTitle>푸터에서 문의하기</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="overflow-visible">
          <div className="border-t border-black/7 dark:border-white/10 pt-4">
            <div className="flex items-center justify-center gap-3 text-[13px] text-gray-500 dark:text-gray-400 flex-wrap overflow-visible">
              <span>소개</span>
              <span>이용가이드</span>
              <span>제휴/광고</span>
              <div className="relative overflow-visible">
                <motion.div
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                >
                  <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                  <span className="text-lg">👇</span>
                </motion.div>
                <span className="text-gray-900 dark:text-[#F0F0F0] font-medium cursor-pointer">문의하기</span>
              </div>
              <span>개인정보처리방침</span>
              <span>이용약관</span>
            </div>
          </div>
        </ContainerContent>
      </Container>

      {/* 데스크톱: 헤더 + 프로필 드롭다운 데모 */}
      <div className="hidden md:block">
      <Container className="bg-white dark:bg-[#1D1D1D] overflow-visible">
        <ContainerHeader>
          <ContainerTitle>헤더 프로필에서 문의하기</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="overflow-visible">
          {/* 헤더 바 */}
          <div className="flex items-center h-14 px-4 border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#1D1D1D]">
            <span className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">4590</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              {/* 다크모드 */}
              <div className="w-10 h-10 flex items-center justify-center rounded-md">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              {/* 알림 */}
              <div className="w-10 h-10 flex items-center justify-center rounded-md">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              {/* 프로필 아이콘 — 클릭 유도 */}
              <div className="relative overflow-visible">
                <motion.div
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                >
                  <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                  <span className="text-lg">👇</span>
                </motion.div>
                <div className="flex items-center space-x-1 h-10 px-3 cursor-pointer">
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/level-2.png" alt="프로필" width={20} height={20} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[13px] text-gray-900 dark:text-[#F0F0F0]">축구팬123</span>
                  <svg className="h-3 w-3 text-gray-900 dark:text-[#F0F0F0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>

          <FlowArrow label="프로필 아이콘 클릭" />

          {/* 프로필 드롭다운 — 실제 w-64 (256px) + rounded-xl */}
          <div className="w-64 mx-auto border border-black/7 dark:border-white/10 rounded-xl bg-white dark:bg-[#1D1D1D] shadow-xl overflow-visible">
            {/* 유저 정보 */}
            <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full overflow-hidden">
                  <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/level-2.png" alt="프로필" width={20} height={20} className="w-full h-full object-cover" />
                </div>
                <span className="font-semibold text-[13px] text-gray-900 dark:text-[#F0F0F0]">축구팬123</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Lv.5</span>
              </div>
            </div>

            {/* 메뉴 항목 */}
            {/* 글쓰기 */}
            <div className="flex items-center px-4 py-2.5">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#333333] flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="flex-1 ml-3 text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">글쓰기</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
            {/* 프로필 설정 */}
            <div className="flex items-center px-4 py-2.5">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#333333] flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="flex-1 ml-3 text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">프로필 설정</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
            {/* 문의하기 — 클릭 유도 */}
            <div className="relative overflow-visible">
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 -translate-y-1/2 -left-14 flex items-center gap-0.5 pointer-events-none z-10"
              >
                <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap">클릭!</span>
                <span className="text-lg">👉</span>
              </motion.div>
              <div className="flex items-center px-4 py-2.5 bg-[#EAEAEA] dark:bg-[#333333] cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#333333] flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="flex-1 ml-3 text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">문의하기</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
            {/* 로그아웃 */}
            <div className="flex items-center px-4 py-2.5">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#333333] flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="flex-1 ml-3 text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">로그아웃</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </ContainerContent>
      </Container>
      </div>


      <FlowArrow label="문의하기 클릭" />

      {/* 플로팅 버튼 + 채팅 모달 */}
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>채팅 버튼</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 rounded-full bg-[#262626] dark:bg-[#3F3F3F] flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center sm:text-left">문의하기 클릭 시 우하단에 나타나며, 이후 채팅창을 열고 닫을 수 있습니다</p>
          </div>
        </ContainerContent>
      </Container>

      <FlowArrow label="채팅 버튼 클릭" />

      {/* 채팅 모달 데모 — 실제 ChatModal + ChatHeader + ChatMessageBubble */}
      <div className="max-w-sm mx-auto w-full border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#1D1D1D] shadow-lg overflow-hidden">
        {/* 헤더 — 실제 ChatHeader: bg-[#F5F5F5] + MessageCircle + "고객센터" */}
        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">고객센터</h2>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="px-4 py-4 space-y-4">
          {/* 봇 메시지 — Bot 아바타 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="max-w-xs">
              <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] border border-black/7 dark:border-white/0 shadow-sm">
                <p className="text-[13px]">안녕하세요! 무엇을 도와드릴까요?</p>
              </div>
            </div>
          </div>

          {/* 칩 버튼들 — Bot 아바타 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="max-w-xs">
              <div className="flex flex-wrap gap-2">
                {chipButtons.map((label) => (
                  <button
                    key={label}
                    className="px-4 py-2 text-[13px] bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] border border-black/7 dark:border-white/10 hover:shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 사용자 메시지 — User 아바타 */}
          <div className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#262626] dark:bg-[#3F3F3F] flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-xs">
              <div className="px-4 py-3 bg-[#262626] dark:bg-[#3F3F3F] text-white border border-black/7 dark:border-white/0 shadow-sm">
                <p className="text-[13px]">버그신고</p>
              </div>
            </div>
          </div>

          {/* 봇 응답 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="max-w-xs">
              <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] border border-black/7 dark:border-white/0 shadow-sm">
                <p className="text-[13px]">발견하신 버그를 신고해주시면 빠르게 수정하겠습니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 입력 영역 */}
        <div className="px-4 py-3 border-t border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 px-3 py-2 text-[13px] bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] rounded-md border border-black/7 dark:border-white/10 placeholder-gray-500"
              placeholder="메시지를 입력하세요..."
              readOnly
            />
            <button className="w-9 h-9 flex items-center justify-center rounded-md bg-[#262626] dark:bg-[#3F3F3F] text-white flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   데모: 알림
   ───────────────────────────────────────────── */
function NotificationDemo() {
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

  const notifications = [
    { type: 'comment', title: '축구팬456님이 댓글을 남겼습니다', message: '좋은 분석이네요!', time: '2분 전', unread: true },
    { type: 'post_like', title: '게시글이 추천되었습니다', message: '프리미어리그 분석글', time: '15분 전', unread: true },
    { type: 'hot_post', title: '내 게시글이 인기글에 선정되었습니다', message: null, time: '1시간 전', unread: false },
    { type: 'level_up', title: '레벨 6으로 올랐습니다!', message: null, time: '3시간 전', unread: false },
  ];

  const typeIcons: Record<string, React.ReactNode> = {
    comment: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    post_like: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>,
    hot_post: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>,
    level_up: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  };

  // 알림 목록 공통 렌더
  const renderNotificationList = () => (
    <div className="divide-y divide-black/5 dark:divide-white/10">
      {notifications.map((notif, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer ${
            notif.unread
              ? 'bg-[#EAEAEA] dark:bg-[#333333]'
              : 'bg-white dark:bg-[#1D1D1D] hover:bg-[#F5F5F5] dark:hover:bg-[#262626]'
          }`}
        >
          <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${notif.unread ? 'bg-[#262626] dark:bg-[#F0F0F0]' : 'bg-transparent'}`} />
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center text-gray-700 dark:text-gray-300">
            {typeIcons[notif.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] line-clamp-2">{notif.title}</p>
            {notif.message && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{notif.message}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{notif.time}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* 데스크톱: 헤더 바 */}
      <div className="hidden md:block">
          <div className="flex items-center h-14 px-4 border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#1D1D1D]">
              <span className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">4590</span>
              <div className="flex-1" />
              <div className="flex items-center gap-1">
                <div className="w-10 h-10 flex items-center justify-center rounded-md">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div className="relative overflow-visible">
                  <motion.div
                    animate={{ y: [0, 3, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                  >
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                    <span className="text-lg">👇</span>
                  </motion.div>
                  <div className={`relative w-10 h-10 flex items-center justify-center rounded-md cursor-pointer transition-colors ${hoverOn ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}>
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full px-1">2</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 h-10 px-3">
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/level-2.png" alt="프로필" width={20} height={20} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[13px] text-gray-900 dark:text-[#F0F0F0]">축구팬123</span>
                </div>
              </div>
            </div>

        <FlowArrow label="알림 아이콘 클릭" />

        {/* 데스크톱: 드롭다운 */}
        <div className="max-w-sm mx-auto w-full border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#1D1D1D] shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            <span className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">알림 (2)</span>
            <button className="text-xs text-gray-500 dark:text-gray-400">전체 읽음</button>
          </div>
          {renderNotificationList()}
          <div className="border-t border-black/5 dark:border-white/10 px-4 py-3 text-center">
            <span className="text-[13px] text-gray-500 dark:text-gray-400">전체 알림 보기</span>
          </div>
        </div>
      </div>

      {/* 모바일: 헤더 바 */}
      <div className="md:hidden">
            <div className="flex items-center h-16 px-4 border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#1D1D1D]">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">4590</span>
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg">
                  <span className="inline-flex rounded-full h-2 w-2 bg-green-500 animate-pulse" />
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">경기일정</span>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-end space-x-1">
                <div className="w-10 h-10 flex items-center justify-center rounded-md">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                {/* 알림 벨 — 클릭 유도 */}
                <div className="relative overflow-visible">
                  <motion.div
                    animate={{ y: [0, 3, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-10 left-0 -translate-x-2 flex flex-col items-center pointer-events-none z-10"
                  >
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                    <span className="text-lg">👇</span>
                  </motion.div>
                  <div className={`relative w-10 h-10 flex items-center justify-center rounded-md cursor-pointer transition-colors ${hoverOn ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}>
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full px-1">2</div>
                  </div>
                </div>
                <div className="w-10 h-10 flex items-center justify-center rounded-md">
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/level-2.png" alt="프로필" width={20} height={20} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="w-10 h-10 flex items-center justify-center rounded-md">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </div>
              </div>
            </div>

        <FlowArrow label="알림 아이콘 클릭" />

        {/* 모바일: 우측 슬라이드 모달 — 실제 MobileNotificationModal */}
        <div className="w-full bg-white dark:bg-[#1D1D1D] shadow-lg overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
            <h2 className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
              알림 <span className="text-gray-500 dark:text-gray-400">(2)</span>
            </h2>
            <div className="flex items-center gap-2">
              <button className="text-xs text-gray-700 dark:text-gray-300 px-2 py-1">전체 읽음</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          {/* 알림 목록 */}
          {renderNotificationList()}
          {/* 푸터 */}
          <div className="border-t border-black/5 dark:border-white/10 p-4">
            <div className="w-full py-3 text-center text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
              전체 알림 보기
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   데모: 검색
   ───────────────────────────────────────────── */
function SearchDemo({ images }: { images: GuideDemoImages }) {
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

  const tabs = [
    { id: 'all', label: '전체', count: 28 },
    { id: 'teams', label: '팀', count: 3 },
    { id: 'posts', label: '게시글', count: 20 },
    { id: 'comments', label: '댓글', count: 5 },
  ];

  return (
    <>
      {/* 데스크톱: 헤더 + 네비게이션 검색바 */}
      <div className="hidden md:block">
        <div className="border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#1D1D1D] overflow-visible">
          <div className="flex items-center h-14 px-4 border-b border-black/5 dark:border-white/10">
            <span className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">4590</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <div className="w-10 h-10 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div className="w-10 h-10 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <div className="flex items-center space-x-1 h-10 px-3">
                <div className="w-5 h-5 rounded-full overflow-hidden">
                  <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/level-2.png" alt="프로필" width={20} height={20} className="w-full h-full object-cover" />
                </div>
                <span className="text-[13px] text-gray-900 dark:text-[#F0F0F0]">축구팬123</span>
              </div>
            </div>
          </div>
          <div className="flex items-center h-12 px-4 overflow-visible">
            <div className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-gray-300 flex-1">
              <span className="font-medium">전체/인기</span>
              <span>스포츠</span>
              <span>커뮤니티</span>
              <span>공지사항</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center gap-0.5 pointer-events-none"
              >
                <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap">클릭!</span>
                <span className="text-lg">👉</span>
              </motion.div>
              <div className={`relative w-64`}>
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <div className={`w-full pl-10 pr-4 py-2 text-[13px] rounded-full border border-black/5 dark:border-white/10 transition-colors ${hoverOn ? 'bg-[#EAEAEA] dark:bg-[#333333]' : 'bg-[#F5F5F5] dark:bg-[#262626]'}`}>
                  <span className="text-gray-500 dark:text-gray-400">게시글, 뉴스, 팀 검색...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일: 헤더 + 검색 아이콘 */}
      <div className="md:hidden">
        <div className="flex items-center h-16 px-4 border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#1D1D1D] overflow-visible">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">4590</span>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg">
              <span className="inline-flex rounded-full h-2 w-2 bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">경기일정</span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-1">
            {/* 검색 아이콘 — 클릭 유도 */}
            <div className="relative overflow-visible">
              <motion.div
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-10 left-0 -translate-x-2 flex flex-col items-center pointer-events-none z-10"
              >
                <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                <span className="text-lg">👇</span>
              </motion.div>
              <div className={`w-10 h-10 flex items-center justify-center rounded-md cursor-pointer transition-colors ${hoverOn ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}>
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-md">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-md">
              <div className="w-5 h-5 rounded-full overflow-hidden">
                <Image src="https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/level-2.png" alt="프로필" width={20} height={20} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-md">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </div>
          </div>
        </div>
      </div>

      <FlowArrow label="검색어 입력 후 검색" />

      {/* 검색 결과 페이지 */}
      <div className="space-y-4">
        {/* 검색 헤더 */}
        <Container className="bg-white dark:bg-[#1D1D1D]">
          <ContainerContent>
            <h2 className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">&ldquo;아스널&rdquo; 에 대한 검색결과</h2>
          </ContainerContent>
        </Container>

        {/* 탭 — 실제 TabList default variant */}
        <div className="bg-[#F5F5F5] dark:bg-[#262626] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden flex">
          {tabs.map((tab) => {
            const isActive = tab.id === 'all';
            return (
              <button
                key={tab.id}
                className={`flex-1 h-12 px-3 flex items-center justify-center text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-semibold border-b-2 border-[#262626] dark:border-[#F0F0F0]'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* 팀 검색 결과 — 실제 TeamSearchResults 테이블 */}
        <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 md:rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10">
            <h3 className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">팀 (1개)</h3>
          </div>
          <table className="w-full table-fixed">
            <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-full sm:w-auto">팀 정보</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28 md:w-36">리그</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">국가</th>
                <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">홈구장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              <tr className="bg-[#F5F5F5] dark:bg-[#262626] transition-colors cursor-pointer">
                <td className="px-2 sm:px-4 py-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {images.teamLogos[42] ? (
                      <Image src={images.teamLogos[42]} alt="아스널" width={28} height={28} className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-900 dark:text-[#F0F0F0] text-xs sm:text-[13px]">
                        <span className="bg-yellow-100 dark:bg-yellow-900/30">아스널</span>
                      </span>
                      <div className="sm:hidden mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">프리미어리그 · 잉글랜드</span>
                      </div>
                    </div>
                    {/* 드롭다운 토글 — 클릭 유도 + 호버 */}
                    <div className="flex items-center ml-1 sm:ml-2 flex-shrink-0 gap-1">
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                        className="flex items-center gap-0.5 pointer-events-none"
                      >
                        <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap">클릭!</span>
                        <span className="text-lg">👉</span>
                      </motion.div>
                      <div className={`p-1.5 rounded-md text-gray-700 dark:text-gray-300 transition-colors ${hoverOn ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}>
                        <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-4 py-4 text-[13px] text-gray-900 dark:text-[#F0F0F0]">프리미어리그</td>
                <td className="hidden md:table-cell px-4 py-4 text-[13px] text-gray-900 dark:text-[#F0F0F0]">잉글랜드</td>
                <td className="hidden lg:table-cell px-4 py-4 text-[13px] text-gray-900 dark:text-[#F0F0F0] text-right">Emirates Stadium</td>
              </tr>

              {/* 최근 경기 — 항상 열린 상태 */}
              <tr>
                  <td colSpan={4} className="px-4 py-4 bg-[#F5F5F5] dark:bg-[#262626] border-t border-black/5 dark:border-white/10">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-[#F0F0F0] text-[13px]">최근 경기</h4>
                      <div className="space-y-2">
                        {[
                          { opponent: '첼시', opponentId: 49, league: '프리미어리그', date: '3월 28일 (금)', score: '2 - 1', status: 'FT' },
                          { opponent: '리버풀', opponentId: 40, league: '프리미어리그', date: '3월 21일 (금)', score: '1 - 1', status: 'FT' },
                          { opponent: '맨체스터 시티', opponentId: 50, league: '프리미어리그', date: '3월 14일 (금)', score: '3 - 0', status: 'FT' },
                          { opponent: '토트넘', opponentId: 47, league: 'FA컵', date: '4월 5일 (토)', score: null, status: 'NS' },
                        ].map((match, i) => (
                          <div key={i} className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
                            <div className="flex items-center justify-between p-3 text-[13px]">
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                {images.teamLogos[match.opponentId] ? (
                                  <Image src={images.teamLogos[match.opponentId]} alt={match.opponent} width={20} height={20} className="w-5 h-5 object-contain flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900 dark:text-[#F0F0F0] truncate">vs {match.opponent}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{match.league} • {match.date}</div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3">
                                {match.status === 'FT' ? (
                                  <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{match.score}</span>
                                ) : (
                                  <span className="text-[13px] text-gray-700 dark:text-gray-300">예정</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
            </tbody>
          </table>
        </div>

        {/* 게시글 검색 결과 */}
        <Container className="bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader className="bg-[#F5F5F5] dark:bg-[#262626]">
            <ContainerTitle>게시글 (20개)</ContainerTitle>
          </ContainerHeader>
          <ContainerContent className="p-0">
            {[
              { title: '아스널 vs 첼시 경기 분석', board: '해외 축구', author: '분석가', views: 342, likes: 15, date: '2시간 전' },
              { title: '아스널 이번 시즌 우승 가능성은?', board: '해외 축구', author: '축구팬456', views: 128, likes: 8, date: '5시간 전' },
              { title: '아스널 새 영입 선수 평가', board: '프리미어리그', author: '이적전문가', views: 89, likes: 4, date: '1일 전' },
            ].map((post, i) => (
              <div key={i} className="px-4 py-3 border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors cursor-pointer">
                <p className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] line-clamp-1">
                  <span className="bg-yellow-100 dark:bg-yellow-900/30">아스널</span>{post.title.replace('아스널', '')}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{post.author}</span>
                  <span>·</span>
                  <span>{post.board}</span>
                  <span>·</span>
                  <span>조회 {post.views}</span>
                  <span>·</span>
                  <span>추천 {post.likes}</span>
                  <span>·</span>
                  <span>{post.date}</span>
                </div>
              </div>
            ))}
            <div className="px-4 py-3 text-center">
              <span className="text-[13px] text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">게시글 더보기 →</span>
            </div>
          </ContainerContent>
        </Container>

        {/* 댓글 검색 결과 */}
        <Container className="bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader className="bg-[#F5F5F5] dark:bg-[#262626]">
            <ContainerTitle>댓글 (5개)</ContainerTitle>
          </ContainerHeader>
          <ContainerContent className="p-0">
            {[
              { content: '아스널 이번 시즌 진짜 잘하네요', post: '프리미어리그 순위 예측', author: '축구팬789', date: '3시간 전' },
              { content: '아스널 수비 안정감이 좋아졌어요', post: '아스널 vs 첼시 경기 분석', author: '분석러', date: '6시간 전' },
            ].map((comment, i) => (
              <div key={i} className="px-4 py-3 border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors cursor-pointer">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-[#F5F5F5] dark:bg-[#262626] px-1.5 py-0.5 rounded">댓글</span>
                  <p className="text-[13px] text-gray-900 dark:text-[#F0F0F0] line-clamp-1">
                    <span className="bg-yellow-100 dark:bg-yellow-900/30">아스널</span>{comment.content.replace('아스널', '')}
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{comment.post}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{comment.author}</span>
                  <span>·</span>
                  <span>{comment.date}</span>
                </div>
              </div>
            ))}
          </ContainerContent>
        </Container>
      </div>
    </>
  );
}

function ProfileIconDemo({ images }: { images: GuideDemoImages }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
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

  // 레벨 5 기본 아이콘 URL (level 5-8 → level-2.png)
  const levelIconUrl = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/profile-icons/level-icons/level-2.png';

  // 첼시만 고정 (상점에서 첼시를 구매한 시나리오)
  const ownedIcons = [{ id: 49, name: '첼시' }];

  const displayIcon = selectedId !== null
    ? ownedIcons.find((i) => i.id === selectedId)
    : null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 첼시에 클릭 유도
  const targetId = 49;

  return (
    <Container className="dark:border dark:border-white/10">
      <ContainerHeader className="h-auto py-3">
        <ContainerTitle>아이콘 선택</ContainerTitle>
      </ContainerHeader>
      <ContainerContent>
        {/* 현재 아이콘 */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white dark:bg-[#1D1D1D] flex items-center justify-center border border-black/7 dark:border-white/10">
            {displayIcon && images.teamLogos[displayIcon.id] ? (
              <Image src={images.teamLogos[displayIcon.id]} alt={displayIcon.name} width={20} height={20} className="object-contain" />
            ) : (
              <Image src={levelIconUrl} alt="레벨 5 기본 아이콘" width={20} height={20} className="object-contain" />
            )}
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
              {saved ? '아이콘이 변경되었습니다!' : (displayIcon?.name ?? '레벨 5 기본 아이콘')}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">현재 사용 중</div>
          </div>
        </div>

        {/* 아이콘 그리드 */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {/* 기본 레벨 아이콘 */}
          <button
            onClick={() => setSelectedId(null)}
            className={`relative p-2 rounded-lg border-2 transition-colors aspect-square flex items-center justify-center ${
              selectedId === null
                ? 'border-[#262626] dark:border-[#F0F0F0] bg-[#EAEAEA] dark:bg-[#333333]'
                : 'border-black/7 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 hover:bg-[#F5F5F5] dark:hover:bg-[#262626]'
            }`}
            title="레벨 5 기본 아이콘"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
              <Image src={levelIconUrl} alt="레벨 5 기본 아이콘" width={20} height={20} className="object-contain" />
            </div>
            {selectedId === null && (
              <div className="absolute top-1 right-1 bg-[#262626] dark:bg-[#F0F0F0] rounded-full p-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white dark:text-[#262626]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>

          {/* 보유 아이콘 */}
          {ownedIcons.map((icon) => {
            const isSelected = selectedId === icon.id;
            const isTarget = icon.id === targetId && !isSelected;

            return (
              <div key={icon.id} className="relative">
                {isTarget && (
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                  >
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                    <span className="text-lg">👇</span>
                  </motion.div>
                )}
                <button
                  onClick={() => setSelectedId(icon.id)}
                  className={`relative w-full p-2 rounded-lg border-2 transition-colors aspect-square flex items-center justify-center ${
                    isSelected
                      ? 'border-[#262626] dark:border-[#F0F0F0] bg-[#EAEAEA] dark:bg-[#333333]'
                      : `border-black/7 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] ${isTarget && hoverOn ? 'bg-[#F5F5F5] dark:bg-[#262626] border-black/15 dark:border-white/20' : ''}`
                  }`}
                  title={icon.name}
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
                    {images.teamLogos[icon.id] ? (
                      <Image src={images.teamLogos[icon.id]} alt={icon.name} width={20} height={20} className="object-contain" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-[#262626] dark:bg-[#F0F0F0] rounded-full p-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white dark:text-[#262626]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* 저장 버튼 */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[13px] text-gray-500 dark:text-gray-400">
            더 많은 아이콘 보기 →
          </span>
          <div className="relative">
            {!saved && (
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
              >
                <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                <span className="text-lg">👇</span>
              </motion.div>
            )}
            <button
              onClick={handleSave}
              disabled={saved}
              className={`px-4 py-2 text-[13px] font-medium rounded-lg transition ${
                saved
                  ? 'bg-green-600 text-white'
                  : `bg-[#262626] dark:bg-[#F0F0F0] text-white dark:text-[#1D1D1D] hover:bg-[#3F3F3F] dark:hover:bg-gray-200 ${hoverOn ? 'bg-[#3F3F3F] dark:bg-gray-200' : ''}`
              }`}
            >
              {saved ? '저장 완료!' : '아이콘 저장'}
            </button>
          </div>
        </div>
      </ContainerContent>
    </Container>
  );
}

/* ─────────────────────────────────────────────
   데모: 이모티콘
   ───────────────────────────────────────────── */
function EmoticonDemo() {
  const [selectedPack, setSelectedPack] = useState<{ name: string; count: number; price: number; thumbnail: string } | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const emoticonPacks = [
    { name: '축구 기본팩', count: 12, price: 0, thumbnail: '⚽' },
    { name: '골세레머니팩', count: 15, price: 300, thumbnail: '🎉' },
    { name: '심판 리액션팩', count: 10, price: 200, thumbnail: '🟨' },
    { name: '팬 응원팩', count: 18, price: 500, thumbnail: '📣' },
  ];

  const handlePurchase = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setPurchased(true);
      setIsProcessing(false);
    }, 800);
  };

  const targetPack = emoticonPacks[1];

  return (
    <>
      <div className="space-y-4 overflow-visible">
        {/* 상단 탭 — 이모티콘 활성 상태로 고정 */}
        <div className="bg-[#F5F5F5] dark:bg-[#262626] md:rounded-lg border border-black/7 dark:border-0 overflow-visible flex">
          {[
            { id: 'icons', label: '팀 아이콘' },
            { id: 'emoticons', label: '이모티콘' },
            { id: 'special', label: '특수 아이템' },
          ].map((tab) => {
            const isActive = tab.id === 'emoticons';
            const isEmoticon = tab.id === 'emoticons';
            return (
              <div key={tab.id} className="relative flex-1 overflow-visible">
                {isEmoticon && (
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                  >
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                    <span className="text-lg">👇</span>
                  </motion.div>
                )}
                <button
                  className={`w-full h-12 px-3 flex items-center justify-center text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-semibold border-b-2 border-[#262626] dark:border-[#F0F0F0]'
                      : 'text-gray-700 dark:text-gray-300'
                  } ${isEmoticon && hoverOn && !isActive ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
                >
                  {tab.label}
                </button>
              </div>
            );
          })}
        </div>

        {/* 이모티콘 스튜디오 링크 — 실제 UI: 모바일 세로, 데스크톱 가로 */}
        <div
          className={`relative flex flex-col items-center gap-0.5 sm:flex-row px-4 py-3 border border-black/7 dark:border-0 md:rounded-lg transition-colors cursor-pointer overflow-visible ${
            hoverOn ? 'bg-[#F5F5F5] dark:bg-[#262626]' : 'bg-white dark:bg-[#1D1D1D] hover:bg-[#F5F5F5] dark:hover:bg-[#262626]'
          }`}
        >
          <span className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0] sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            {/* 클릭 유도 — 좌→우 */}
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-0 -left-14 hidden sm:flex items-center gap-0.5 pointer-events-none z-10"
            >
              <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap">클릭!</span>
              <span className="text-lg">👉</span>
            </motion.span>
            이모티콘 스튜디오 →
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 sm:mr-auto">나만의 이모티콘 만들기</span>
          {/* 모바일 클릭 유도 — 아래에서 위로 */}
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-7 left-1/2 -translate-x-1/2 md:hidden flex flex-col items-center pointer-events-none z-10"
          >
            <span className="text-lg">👆</span>
            <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap">클릭!</span>
          </motion.div>
        </div>

        {/* 이모티콘 팩 그리드 */}
        <Container className="bg-white dark:bg-[#1D1D1D] overflow-visible">
          <ContainerContent className="overflow-visible pt-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {emoticonPacks.map((pack) => {
                const isFree = pack.price === 0;
                const isTarget = pack.name === targetPack.name && !purchased;
                const isOwned = pack.name === '축구 기본팩' || (purchased && pack.name === targetPack.name);

                return (
                  <div key={pack.name} className="relative">
                    {isTarget && (
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-1/2 -translate-y-1/2 -left-8 flex items-center gap-0.5 pointer-events-none z-10"
                      >
                        <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap">클릭!</span>
                        <span className="text-lg">👉</span>
                      </motion.div>
                    )}
                    <button
                      onClick={() => { if (!isOwned) setSelectedPack(pack); }}
                      className={`w-full flex flex-col items-center p-2.5 sm:p-3 rounded-md border border-black/7 dark:border-0 shadow-sm transition-all group ${
                        isOwned ? 'cursor-default bg-white dark:bg-[#1D1D1D]' : 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer'
                      } ${isTarget && hoverOn ? 'bg-[#EAEAEA] dark:bg-[#333333]' : 'bg-white dark:bg-[#1D1D1D]'}`}
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center mb-2">
                        <span className="text-[60px] group-hover:scale-105 transition-transform">{pack.thumbnail}</span>
                      </div>
                      <p className="text-xs sm:text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate w-full text-center leading-tight">{pack.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5">{pack.count}개</p>
                      <div className="mt-1.5">
                        {isOwned ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-blue-500 dark:text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            보유중
                          </span>
                        ) : isFree ? (
                          <span className="inline-flex items-center text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20">무료</span>
                        ) : (
                          <span className="text-xs sm:text-[13px] tabular-nums font-semibold text-gray-900 dark:text-[#F0F0F0]">{pack.price.toLocaleString()} P</span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </ContainerContent>
        </Container>
      </div>

      {/* 이모티콘 팩 상세 모달 데모 */}
      <>
          <FlowArrow label="이모티콘 팩 클릭" />

          {/* 데스크톱: 센터 모달 */}
          <div className="hidden md:block">
            <div className="max-w-[692px] mx-auto w-full border border-black/7 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D] shadow-lg">
              <div className="flex items-center justify-between px-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11">
                <span className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">팩 상세</span>
                <button className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {/* 팩 정보 — 데스크톱 가로 3단 */}
              <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-stretch gap-3">
                  <div className="w-[60px] h-[60px] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[48px]">{selectedPack?.thumbnail ?? targetPack.thumbnail}</span>
                  </div>
                  <div className="flex flex-col min-w-0 w-[20%] flex-shrink-0">
                    <p className="font-semibold text-[13px] text-gray-900 dark:text-[#F0F0F0]">{selectedPack?.name ?? targetPack.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{selectedPack?.count ?? targetPack.count}개 이모티콘</p>
                    <span className="text-[11px] tabular-nums font-bold text-gray-900 dark:text-[#F0F0F0] mt-auto">
                      {(selectedPack?.price ?? targetPack.price) === 0 ? '무료' : `${(selectedPack?.price ?? targetPack.price).toLocaleString()} P`}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] px-3 py-2">
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      축구 경기의 다양한 골 세레머니를 표현한 이모티콘 팩입니다.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">이모티콘 미리보기</p>
                <div className="grid grid-cols-6 gap-2">
                  {['🎉', '🥳', '💃', '🕺', '🙌', '✨', '🏆', '⚽', '🎯', '🔥', '💪', '👏'].map((emoji, i) => (
                    <div key={i} className="aspect-square flex items-center justify-center p-1 rounded">
                      <span className="text-[48px]">{emoji}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-black/5 dark:border-white/10">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
                  <p className="text-[10px] leading-tight text-gray-400 dark:text-gray-500">부적절하거나 저작권을 위반한 이모티콘은 별도 통보 없이 판매중지될 수 있습니다.</p>
                  <button type="button" className="text-[11px] text-red-500 dark:text-red-400 text-left w-fit">신고</button>
                </div>
                <div className="relative flex-shrink-0 overflow-visible">
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                  >
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                    <span className="text-lg">👇</span>
                  </motion.div>
                  <button
                    onClick={handlePurchase}
                    disabled={isProcessing || purchased}
                    className={`px-4 h-9 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 ${
                      purchased ? 'bg-green-600 text-white' : `${hoverOn ? 'bg-[#3F3F3F] dark:bg-[#4A4A4A] text-white' : 'bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A]'}`
                    }`}
                  >
                    {purchased ? '구매 완료!' : isProcessing ? '처리 중...' : '구매하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 모바일: 바텀시트 */}
          <div className="md:hidden">
            <div className="w-full rounded-t-2xl overflow-hidden bg-white dark:bg-[#1D1D1D] shadow-lg">
              <div className="h-11 px-4 flex items-center justify-between border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] rounded-t-2xl">
                <span className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">팩 상세</span>
                <button className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {/* 팩 정보 — 모바일 세로 */}
              <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-[48px] h-[48px] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[40px]">{selectedPack?.thumbnail ?? targetPack.thumbnail}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-gray-900 dark:text-[#F0F0F0] truncate">{selectedPack?.name ?? targetPack.name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{selectedPack?.count ?? targetPack.count}개 이모티콘</p>
                    </div>
                    <span className="text-[13px] tabular-nums font-bold text-gray-900 dark:text-[#F0F0F0] flex-shrink-0">
                      {(selectedPack?.price ?? targetPack.price) === 0 ? '무료' : `${(selectedPack?.price ?? targetPack.price).toLocaleString()} P`}
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#F5F5F5] dark:bg-[#262626] px-3 py-2">
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                      축구 경기의 다양한 골 세레머니를 표현한 이모티콘 팩입니다.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">이모티콘 미리보기</p>
                <div className="grid grid-cols-4 gap-2">
                  {['🎉', '🥳', '💃', '🕺', '🙌', '✨', '🏆', '⚽', '🎯', '🔥', '💪', '👏'].map((emoji, i) => (
                    <div key={i} className="aspect-square flex items-center justify-center p-1 rounded">
                      <span className="text-[40px]">{emoji}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-black/5 dark:border-white/10 mb-10">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
                  <p className="text-[9px] leading-tight text-gray-400 dark:text-gray-500">부적절하거나 저작권을 위반한 이모티콘은 별도 통보 없이 판매중지될 수 있습니다.</p>
                  <button type="button" className="text-[11px] text-red-500 dark:text-red-400 text-left w-fit">신고</button>
                </div>
                <div className="relative flex-shrink-0 overflow-visible">
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                  >
                    <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 whitespace-nowrap mb-0.5">클릭!</span>
                    <span className="text-lg">👇</span>
                  </motion.div>
                  <button
                    onClick={handlePurchase}
                    disabled={isProcessing || purchased}
                    className={`px-4 h-9 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 ${
                      purchased ? 'bg-green-600 text-white' : `${hoverOn ? 'bg-[#3F3F3F] dark:bg-[#4A4A4A] text-white' : 'bg-[#262626] dark:bg-[#3F3F3F] text-white'}`
                    }`}
                  >
                    {purchased ? '구매 완료!' : isProcessing ? '처리 중...' : '구매하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
    </>
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

      <div className="max-w-3xl mx-auto px-0 md:px-4 pb-8 space-y-8">

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

        {/* ───── 7. 상점 ───── */}
        <Section id="shop" className="scroll-mt-20 space-y-4 bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-white/10 px-4 py-6 md:px-6">
          <SectionHeader icon={ShoppingBag} title="상점" desc="포인트로 아이템 구매" color="violet" />

          <GuideBox title="소개">
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              활동으로 모은 포인트로 <strong className="text-gray-900 dark:text-gray-100">팀 아이콘</strong>, <strong className="text-gray-900 dark:text-gray-100">이모티콘 팩</strong>, <strong className="text-gray-900 dark:text-gray-100">닉네임 변경권</strong> 등을 구매할 수 있습니다.
            </p>
          </GuideBox>

          <GuideBox title="구매한 아이템 사용">
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
              <li><strong className="text-gray-900 dark:text-gray-100">팀 아이콘</strong> — 프로필에 표시되어 내가 응원하는 팀을 나타냅니다</li>
              <li><strong className="text-gray-900 dark:text-gray-100">이모티콘 팩</strong> — 댓글에서 이모티콘으로 사용할 수 있습니다</li>
              <li><strong className="text-gray-900 dark:text-gray-100">닉네임 변경권</strong> — 닉네임을 변경할 수 있습니다</li>
            </ul>
          </GuideBox>

          <GuideBox title="경로">
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              상단 메뉴 &rarr; <strong className="text-gray-900 dark:text-gray-100">상점</strong>
            </p>
          </GuideBox>

          <ShopDemo images={demoImages} />
        </Section>

        {/* ───── 8. 이모티콘 스튜디오 ───── */}
        <Section id="emoticon-studio" className="scroll-mt-20 space-y-4 bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-white/10 px-4 py-6 md:px-6">
          <SectionHeader icon={Palette} title="이모티콘" desc="이모티콘 구매 및 제작" color="amber" />

          <GuideBox title="이모티콘 구매">
            <ol className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
              <li>상점에서 <strong className="text-gray-900 dark:text-gray-100">이모티콘</strong> 탭을 클릭</li>
              <li>원하는 이모티콘 팩을 선택하여 구매</li>
            </ol>
          </GuideBox>

          <GuideBox title="이모티콘 스튜디오">
            <p className="text-[13px] text-gray-700 dark:text-gray-300 mb-2">
              나만의 이모티콘 팩을 직접 제작하여 제출할 수 있습니다.<br />
              운영팀 심사 후 승인되면 상점에 등록됩니다.
            </p>
            <ol className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
              <li>이모티콘 스튜디오에서 팩 이름, 설명, 가격을 입력</li>
              <li>이모티콘 이미지를 업로드 (최소 8개)</li>
              <li><strong className="text-gray-900 dark:text-gray-100">제출</strong> 버튼을 클릭하면 운영팀에 심사 요청</li>
              <li>승인되면 상점에 자동 등록되어 다른 유저들이 구매 가능</li>
            </ol>
          </GuideBox>

          <GuideBox title="경로">
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
              <li>이모티콘 구매: 상점 &rarr; <strong className="text-gray-900 dark:text-gray-100">이모티콘</strong> 탭</li>
              <li>이모티콘 제작: 상점 &rarr; 이모티콘 탭 &rarr; <strong className="text-gray-900 dark:text-gray-100">이모티콘 스튜디오 →</strong></li>
            </ul>
          </GuideBox>

          <EmoticonDemo />

          {/* 소제목: 이모티콘 사용 */}
          <div className="pt-4 border-t border-black/5 dark:border-white/10">
            <h3 className="text-[15px] font-bold text-gray-900 dark:text-[#F0F0F0] mb-1">이모티콘 사용 (댓글 삽입)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">구매한 이모티콘을 댓글에서 사용</p>
          </div>

          <GuideBox title="사용 방법">
            <ol className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
              <li>게시글 하단 댓글 입력창에서 <strong className="text-gray-900 dark:text-gray-100">이모티콘 버튼</strong>을 클릭</li>
              <li>보유한 이모티콘 팩 중 원하는 이모티콘을 선택</li>
              <li>선택한 이모티콘이 댓글에 삽입됩니다</li>
            </ol>
          </GuideBox>

          <EmoticonPickerDemo />
        </Section>

        {/* ───── 9. 고객센터 문의 ───── */}
        <Section id="chatbot" className="scroll-mt-20 space-y-4 bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-white/10 px-4 py-6 md:px-6">
          <SectionHeader icon={Bot} title="고객센터 문의" desc="사이트 이용 문의, 신고, 의견 제출" color="green" />

          <GuideBox title="소개">
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              사이트 이용 중 궁금한 점이나 불편사항을 챗봇을 통해 문의할 수 있습니다.<br />
              화면 우하단의 문의 버튼을 클릭하면 채팅 창이 열립니다.
            </p>
          </GuideBox>

          <GuideBox title="문의 유형">
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
              <li><strong className="text-gray-900 dark:text-gray-100">커뮤니티 이용문의</strong> — 계정, 이용 방법, 기능 관련 질문</li>
              <li><strong className="text-gray-900 dark:text-gray-100">약관 및 정보처리방침</strong> — 이용약관, 개인정보 관련 문의</li>
              <li><strong className="text-gray-900 dark:text-gray-100">회원신고</strong> — 스팸, 욕설, 사칭 등 부적절한 사용자 신고</li>
              <li><strong className="text-gray-900 dark:text-gray-100">의견제출</strong> — 기능 요청, UI 개선, 성능 피드백</li>
              <li><strong className="text-gray-900 dark:text-gray-100">게시글/댓글 삭제요청</strong> — 게시글 또는 댓글 삭제 요청</li>
              <li><strong className="text-gray-900 dark:text-gray-100">버그신고</strong> — 오류 발견 시 브라우저, 페이지, 재현 방법 포함 신고</li>
            </ul>
          </GuideBox>

          <GuideBox title="경로">
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
              <li>푸터 &rarr; <strong className="text-gray-900 dark:text-gray-100">문의하기</strong></li>
              <li>헤더 프로필 &rarr; <strong className="text-gray-900 dark:text-gray-100">문의하기</strong> (데스크톱)</li>
            </ul>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2">
              모바일에서는 푸터의 문의하기를 이용해주세요.<br />
              문의하기를 클릭하면 화면 우하단에 채팅 버튼이 나타나고 채팅창이 열립니다.
            </p>
          </GuideBox>

          <ChatbotDemo />
        </Section>

        {/* ───── 10. 알림 ───── */}
        <Section id="notification" className="scroll-mt-20 space-y-4 bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-white/10 px-4 py-6 md:px-6">
          <SectionHeader icon={Bell} title="알림" desc="댓글, 추천, 멘션 알림" color="red" />

          <GuideBox title="소개">
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              내 글에 댓글, 추천, 멘션이 달리면 실시간으로 알림이 발송됩니다.<br />
              상단 알림 아이콘에서 확인할 수 있으며, 읽음 처리 및 삭제가 가능합니다.
            </p>
          </GuideBox>

          <GuideBox title="알림 종류">
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
              <li><strong className="text-gray-900 dark:text-gray-100">댓글</strong> — 내 게시글에 댓글이 달렸을 때</li>
              <li><strong className="text-gray-900 dark:text-gray-100">답글</strong> — 내 댓글에 답글이 달렸을 때</li>
              <li><strong className="text-gray-900 dark:text-gray-100">좋아요</strong> — 내 게시글/댓글이 추천되었을 때</li>
              <li><strong className="text-gray-900 dark:text-gray-100">인기 게시글</strong> — 내 게시글이 인기글에 선정되었을 때</li>
              <li><strong className="text-gray-900 dark:text-gray-100">레벨업</strong> — 레벨이 올랐을 때</li>
            </ul>
          </GuideBox>

          <GuideBox title="경로">
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              상단 헤더 &rarr; <strong className="text-gray-900 dark:text-gray-100">알림 아이콘 (종 모양)</strong>
            </p>
          </GuideBox>

          <NotificationDemo />
        </Section>

        {/* ───── 11. 검색 ───── */}
        <Section id="search" className="scroll-mt-20 space-y-4 bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-white/10 px-4 py-6 md:px-6">
          <SectionHeader icon={Search} title="검색" desc="게시글, 팀, 댓글 통합 검색" color="blue" />

          <GuideBox title="소개">
            <p className="text-[13px] text-gray-700 dark:text-gray-300">
              게시글, 댓글, 팀을 통합 검색할 수 있습니다.<br />
              검색 결과에서 탭을 전환하여 원하는 유형만 필터링할 수 있습니다.
            </p>
          </GuideBox>

          <GuideBox title="검색 대상">
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
              <li><strong className="text-gray-900 dark:text-gray-100">게시글</strong> — 제목으로 검색, 조회수·추천순 정렬 가능</li>
              <li><strong className="text-gray-900 dark:text-gray-100">댓글</strong> — 댓글 내용으로 검색</li>
              <li><strong className="text-gray-900 dark:text-gray-100">팀</strong> — 팀 이름, 리그, 경기장으로 검색, 최근 경기 확인 가능</li>
            </ul>
          </GuideBox>

          <GuideBox title="경로">
            <ul className="text-[13px] text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
              <li>데스크톱: 상단 헤더 &rarr; <strong className="text-gray-900 dark:text-gray-100">검색바</strong></li>
              <li>모바일: 상단 헤더 &rarr; <strong className="text-gray-900 dark:text-gray-100">검색 아이콘 (돋보기)</strong></li>
            </ul>
          </GuideBox>

          <SearchDemo images={demoImages} />
        </Section>

        {/* 마무리 + CTA */}
        <Section>
          <Container className="dark:border dark:border-white/10">
            <ContainerContent className="text-center py-6">
              <p className="text-[15px] font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">
                4590 Football의 주요 기능을 모두 살펴보았습니다.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                더 궁금한 점이 있으면 공지사항을 확인하거나 문의해주세요.
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
