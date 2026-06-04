'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Camera, RefreshCw, PenSquare } from 'lucide-react';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { getCachedAllBoards } from '@/domains/boards/actions/getCachedBoards';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Field from './components/Field';
import Player from './components/Player';
import { PlayerKoreanNames } from '../../MatchPageClient';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);
    updateMatches();
    mediaQuery.addEventListener('change', updateMatches);
    return () => mediaQuery.removeEventListener('change', updateMatches);
  }, [query]);
  return matches;
}

interface PlayerData {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string;
  captain: boolean;
  photo: string;
}

interface TeamData {
  team: {
    id: number;
    name: string;
    colors: {
      player: { primary: string; number: string; border: string };
      goalkeeper: { primary: string; number: string; border: string };
    };
  };
  formation: string;
  startXI: PlayerData[];
}

interface FormationProps {
  homeTeamData: TeamData;
  awayTeamData: TeamData;
  matchStatus?: string;
  playersRatings?: Record<number, number>;
  playerKoreanNames?: PlayerKoreanNames;
  homeTeamDisplayName?: string;
  awayTeamDisplayName?: string;
  homeTeamLogoUrl?: string;
  awayTeamLogoUrl?: string;
  isLoading?: boolean;
}

// 이미지 로드 헬퍼
function loadImg(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// SVG <image> 요소를 base64 data URL로 교체 (html-to-image XHR hang 방지)
// 반환값: 원래 href 복원 함수
async function inlineImages(root: HTMLElement): Promise<() => void> {
  const imageEls = Array.from(root.querySelectorAll<SVGImageElement>('image'));
  const originals = new Map<SVGImageElement, string>();
  const IMAGE_FETCH_TIMEOUT_MS = 10000;

  await Promise.allSettled(
    imageEls.map(async (el) => {
      const href = el.getAttribute('href') || '';
      if (!href || href.startsWith('data:') || href.startsWith('/')) return;
      originals.set(el, href);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(href, {
          mode: 'cors',
          cache: 'force-cache',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
        const blob = await res.blob();
        const b64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        el.setAttribute('href', b64);
      } catch {
        // fetch 실패 시 placeholder로 대체 (원래 href 유지해서 복원 가능)
        el.removeAttribute('href');
      } finally {
        window.clearTimeout(timeoutId);
      }
    })
  );

  return () => {
    originals.forEach((href, el) => el.setAttribute('href', href));
  };
}

// canvas에 둥근 이미지 그리기
function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, size: number, radius: number,
) {
  const maxDrawSize = size * 0.78;
  const ratio = Math.min(maxDrawSize / img.naturalWidth, maxDrawSize / img.naturalHeight);
  const drawW = img.naturalWidth * ratio;
  const drawH = img.naturalHeight * ratio;
  const drawX = x + (size - drawW) / 2;
  const drawY = y + (size - drawH) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.clip();
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
}

export default function Formation({
  homeTeamData,
  awayTeamData,
  matchStatus,
  playersRatings,
  playerKoreanNames = {},
  homeTeamDisplayName,
  awayTeamDisplayName,
  homeTeamLogoUrl,
  awayTeamLogoUrl,
  isLoading = false,
}: FormationProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const hasFormationPlayers = homeTeamData.startXI.length > 0 || awayTeamData.startXI.length > 0;
  const captureRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [posting, setPosting] = useState(false);
  const router = useRouter();

  const handleRefresh = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  const defaultColors = useMemo(() => ({
    player: { primary: '1a5f35', number: 'ffffff', border: '1a5f35' },
    goalkeeper: { primary: 'ffd700', number: '000000', border: 'ffd700' },
  }), []);

  const processTeamData = useMemo(() => {
    return (teamData: Partial<TeamData>): TeamData => ({
      team: {
        id: teamData.team?.id || 0,
        name: teamData.team?.name || '',
        colors: teamData.team?.colors || defaultColors,
      },
      formation: teamData.formation || '',
      startXI: (teamData.startXI || []).map((player: Partial<PlayerData>) => ({
        id: player.id || 0,
        name: player.name || '',
        number: player.number || 0,
        pos: player.pos || '',
        grid: player.grid || '',
        captain: player.captain || false,
        photo: player.photo || '',
      })),
    });
  }, [defaultColors]);

  const processedHomeTeam = useMemo(() => processTeamData(homeTeamData), [processTeamData, homeTeamData]);
  const processedAwayTeam = useMemo(() => processTeamData(awayTeamData), [processTeamData, awayTeamData]);

  const homeName = homeTeamDisplayName || processedHomeTeam.team.name;
  const awayName = awayTeamDisplayName || processedAwayTeam.team.name;

  const composeCard = useCallback(async (): Promise<string> => {
    if (!captureRef.current) throw new Error('ref 없음');

    // 1. 캡처 무시 요소 숨기기 + SVG <image> base64 주입 (XHR hang 방지)
    const ignoreEls = captureRef.current.querySelectorAll<SVGElement>('[data-capture-ignore="true"]');
    ignoreEls.forEach(el => el.setAttribute('visibility', 'hidden'));
    const restoreImages = await inlineImages(captureRef.current);

    let formationDataUrl: string;
    try {
      const pixelRatio = isMobile ? 2 : 3;
      const TIMEOUT_MS = 15000;
      formationDataUrl = await Promise.race([
        toPng(captureRef.current, {
          pixelRatio,
          cacheBust: false,
          skipFonts: true,
          backgroundColor: '#3d9735',
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('이미지 생성 시간 초과. 다시 시도해주세요.')), TIMEOUT_MS)
        ),
      ]);
    } finally {
      restoreImages();
      ignoreEls.forEach(el => el.removeAttribute('visibility'));
    }

    // 2. 이미지 병렬 로드
    const [formationResult, logoResult, homeLogoResult, awayLogoResult] =
      await Promise.allSettled([
        loadImg(formationDataUrl),
        loadImg('/logo/4590football-logo.png'),  // 검은색 로고
        homeTeamLogoUrl ? loadImg(homeTeamLogoUrl, true) : Promise.reject(),
        awayTeamLogoUrl ? loadImg(awayTeamLogoUrl, true) : Promise.reject(),
      ]);

    if (formationResult.status === 'rejected') throw new Error('포메이션 이미지 로드 실패');
    const formationImg = formationResult.value;

    // 3. 공통 상수
    const S = 3;
    const PAD = 20 * S;
    const HEADER_H = 52 * S;
    const LOGO_SIZE = 36 * S;
    const fw = formationImg.naturalWidth;
    const fh = formationImg.naturalHeight;

    // 팀 바 그리기 헬퍼
    const drawTeamBar = (
      ctx: CanvasRenderingContext2D,
      y: number,
      barH: number,
      cardW: number,
      logoImg: HTMLImageElement | null,
      name: string,
      formation: string,
      dividerTop: boolean,
    ) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, y, cardW, barH);

      const lineY = dividerTop ? y : y + barH - S;
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, lineY, cardW, S);

      const cy = y + barH / 2;
      if (logoImg) {
        drawRoundedImage(ctx, logoImg, PAD, cy - LOGO_SIZE / 2, LOGO_SIZE, 4 * S);
      }

      const tx = PAD + LOGO_SIZE + 10 * S;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.font = `bold ${17 * S}px sans-serif`;
      ctx.fillStyle = '#111827';
      ctx.fillText(name, tx, cy - 7 * S);
      ctx.font = `${12 * S}px sans-serif`;
      ctx.fillStyle = '#1a5f35';
      ctx.fillText(formation, tx, cy + 13 * S);
    };

    const drawHeader = (ctx: CanvasRenderingContext2D, cardW: number) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cardW, HEADER_H);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, HEADER_H - S, cardW, S);

      if (logoResult.status === 'fulfilled') {
        const logo = logoResult.value;
        const lh = 22 * S;
        const lw = logo.width * (lh / logo.height);
        ctx.drawImage(logo, PAD, (HEADER_H - lh) / 2, lw, lh);
      }
      ctx.font = `${11 * S}px sans-serif`;
      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('4590fb.com', cardW - PAD, HEADER_H / 2);
    };

    const homeLogo = homeLogoResult.status === 'fulfilled' ? homeLogoResult.value : null;
    const awayLogo = awayLogoResult.status === 'fulfilled' ? awayLogoResult.value : null;

    // 4. 레이아웃 분기
    if (isMobile) {
      // ── 모바일 (9:16): 홈 바(위) → 포메이션 → 어웨이 바(아래) ──
      const TEAM_BAR_H = 68 * S;
      const cardH = HEADER_H + TEAM_BAR_H + fh + TEAM_BAR_H;
      const canvas = document.createElement('canvas');
      canvas.width = fw;
      canvas.height = cardH;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, fw, cardH);

      drawHeader(ctx, fw);

      // 홈팀 바 (헤더 아래)
      drawTeamBar(ctx, HEADER_H, TEAM_BAR_H, fw, homeLogo, homeName, processedHomeTeam.formation, false);

      // 포메이션
      ctx.drawImage(formationImg, 0, HEADER_H + TEAM_BAR_H, fw, fh);

      // 어웨이팀 바 (포메이션 아래)
      drawTeamBar(ctx, HEADER_H + TEAM_BAR_H + fh, TEAM_BAR_H, fw, awayLogo, awayName, processedAwayTeam.formation, true);

      return canvas.toDataURL('image/png');

    } else {
      // ── 데스크탑 (16:9): 헤더 → 좌우 팀 바 → 포메이션 ──
      const TEAM_H = 60 * S;
      const cardH = HEADER_H + TEAM_H + fh;
      const canvas = document.createElement('canvas');
      canvas.width = fw;
      canvas.height = cardH;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, fw, cardH);

      drawHeader(ctx, fw);

      // 팀 정보 바 (좌우)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, HEADER_H, fw, TEAM_H);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, HEADER_H + TEAM_H - S, fw, S);

      const teamCY = HEADER_H + TEAM_H / 2;

      if (homeLogo) drawRoundedImage(ctx, homeLogo, PAD, teamCY - LOGO_SIZE / 2, LOGO_SIZE, 4 * S);
      if (awayLogo) drawRoundedImage(ctx, awayLogo, fw - PAD - LOGO_SIZE, teamCY - LOGO_SIZE / 2, LOGO_SIZE, 4 * S);

      const textX = PAD + LOGO_SIZE + 10 * S;
      const textXAway = fw - PAD - LOGO_SIZE - 10 * S;
      ctx.textBaseline = 'middle';

      ctx.font = `bold ${17 * S}px sans-serif`;
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'left';
      ctx.fillText(homeName, textX, teamCY - 7 * S);
      ctx.font = `${12 * S}px sans-serif`;
      ctx.fillStyle = '#1a5f35';
      ctx.fillText(processedHomeTeam.formation, textX, teamCY + 13 * S);

      ctx.font = `bold ${12 * S}px sans-serif`;
      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'center';
      ctx.fillText('VS', fw / 2, teamCY);

      ctx.font = `bold ${17 * S}px sans-serif`;
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'right';
      ctx.fillText(awayName, textXAway, teamCY - 7 * S);
      ctx.font = `${12 * S}px sans-serif`;
      ctx.fillStyle = '#1a5f35';
      ctx.fillText(processedAwayTeam.formation, textXAway, teamCY + 13 * S);

      ctx.drawImage(formationImg, 0, HEADER_H + TEAM_H, fw, fh);

      return canvas.toDataURL('image/png');
    }
  }, [
    isMobile,
    homeName,
    awayName,
    homeTeamLogoUrl,
    awayTeamLogoUrl,
    processedHomeTeam.formation,
    processedAwayTeam.formation,
  ]);

  const handleShare = useCallback(async () => {
    if (!captureRef.current || capturing) return;
    setCapturing(true);

    try {
      const dataUrl = await composeCard();
      const blob = await (await fetch(dataUrl)).blob();
      const safeFileName = `${homeName} vs ${awayName} lineup`
        .replace(/[<>:"/\\|?*]/g, '')
        .trim();
      const file = new File([blob], `${safeFileName}.png`, { type: 'image/png' });

      // 모바일만 Web Share API (iOS/Android 공유시트에 저장 옵션 있음)
      // 데스크탑은 Web Share가 있어도 저장이 없으므로 무조건 다운로드
      const isMobileShare = isMobile &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });

      if (isMobileShare) {
        await navigator.share({
          title: `${homeName} vs ${awayName} 라인업`,
          text: '4590football 라인업',
          files: [file],
        });
        toast.success('라인업 이미지를 공유했습니다.');
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${safeFileName}.png`;
        link.click();
        toast.info(isMobile ? '공유를 지원하지 않아 이미지 다운로드를 시작했습니다.' : '라인업 이미지 다운로드를 시작했습니다.');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('라인업 카드 생성 실패:', err);
        toast.error(err.message || '이미지 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setCapturing(false);
    }
  }, [isMobile, capturing, composeCard, homeName, awayName]);

  const handlePost = useCallback(async () => {
    if (!captureRef.current || posting) return;
    setPosting(true);

    try {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const redirect = `${window.location.pathname}${window.location.search}`;
        router.push(`/signin?redirect=${encodeURIComponent(redirect)}&message=${encodeURIComponent('로그인이 필요한 기능입니다')}`);
        return;
      }

      const dataUrl = await composeCard();
      const blob = await (await fetch(dataUrl)).blob();

      const timestamp = Date.now();
      const fileName = `${user.id}/images/${timestamp}_lineup.png`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, blob, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      const boards = await getCachedAllBoards();
      const targetBoard =
        boards.find(b => b.slug === 'soccer') ??
        boards.find(b => b.slug) ??
        boards[0];
      const firstSlug = targetBoard?.slug ?? targetBoard?.id;
      if (!firstSlug) throw new Error('게시판 정보를 불러올 수 없습니다');

      router.push(`/boards/${firstSlug}/create?imageUrl=${encodeURIComponent(urlData.publicUrl)}`);
    } catch (err) {
      console.error('게시글 작성 이동 실패:', err);
      alert(err instanceof Error ? err.message : '게시글 작성 이동에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setPosting(false);
    }
  }, [posting, composeCard, router]);

  return (
    <Container>
      {/* 헤더: 타이틀 + 액션 버튼 */}
      <ContainerHeader>
        <ContainerTitle>포메이션</ContainerTitle>
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400
                       hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            새로고침
          </button>
          <div className="w-px h-3.5 bg-black/10 dark:bg-white/10" />
          <button
            onClick={handleShare}
            disabled={capturing || posting}
            className="flex items-center gap-1.5 text-xs font-medium
                       text-gray-600 dark:text-gray-300
                       hover:text-gray-900 dark:hover:text-white transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!capturing && <Camera className="w-3.5 h-3.5" />}
            {capturing ? '생성 중...' : '저장/공유'}
          </button>
          <div className="w-px h-3.5 bg-black/10 dark:bg-white/10" />
          <button
            onClick={handlePost}
            disabled={posting || capturing}
            className="flex items-center gap-1.5 text-xs font-medium
                       text-gray-600 dark:text-gray-300
                       hover:text-gray-900 dark:hover:text-white transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!posting && <PenSquare className="w-3.5 h-3.5" />}
            {posting ? '업로드 중...' : '게시글 작성'}
          </button>
        </div>
      </ContainerHeader>

      {/* 경기장 */}
      <ContainerContent className="p-0">
        {false && !hasFormationPlayers && (
          <div className="border-b border-black/5 px-3 py-4 text-center text-[13px] text-gray-500 dark:border-white/10 dark:text-gray-400">
            포메이션 데이터가 없습니다. 라인업은 경기 시작 전에 공개됩니다.
          </div>
        )}
        <motion.div
          style={{
            maxWidth: '100%',
            aspectRatio: isMobile ? '9/16' : '100/67',
            margin: '0 auto',
            position: 'relative',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Field isMobile={isMobile} captureRef={captureRef}>
            <Player
              isMobile={isMobile}
              homeTeamData={processedHomeTeam}
              awayTeamData={processedAwayTeam}
              matchStatus={matchStatus}
              playersRatings={playersRatings}
              playerKoreanNames={playerKoreanNames}
            />
          </Field>
          {(isLoading || !hasFormationPlayers) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center px-4 pointer-events-none">
              <div className="max-w-[280px] rounded-md border border-white/20 bg-black/45 px-4 py-3 text-center text-[13px] font-medium leading-relaxed text-white shadow-sm backdrop-blur-sm">
                {isLoading ? (
                  '불러오는 중...'
                ) : (
                  <>
                    포메이션 데이터가 없습니다.
                    <br />
                    라인업은 경기 시작 전에 공개됩니다.
                  </>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </ContainerContent>
    </Container>
  );
}
