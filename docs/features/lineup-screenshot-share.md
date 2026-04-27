# 라인업 포메이션 스크린샷 공유 기능

## 목표

라인업 탭의 포메이션 경기장(선수 얼굴 + 이름 + 평점이 표시된 SVG)을
PNG 이미지로 캡처해 **모바일은 네이티브 공유(Web Share API), PC는 다운로드**로 배포.

---

## 기술 선택: `html-to-image`

### 왜 html2canvas가 아닌 html-to-image인가

| 항목 | html2canvas | html-to-image |
|------|-------------|---------------|
| SVG 지원 | 불완전 (SVG 내 foreignObject 불가) | 완전 (SVG 네이티브 렌더) |
| CSS Module | 부분 지원 | 인라인 스타일로 직렬화 |
| 외부 이미지 | CORS 우회 필요 | crossOrigin 속성 그대로 사용 |
| 번들 크기 | ~250KB | ~60KB |
| 유지보수 | 오래됨 | 활성화 |

Formation의 Field는 순수 SVG이므로 `html-to-image`가 정확하게 작동함.

### 사용 함수

```ts
import { toPng } from 'html-to-image';
```

---

## CORS 검토: 이미지 캡처 가능 여부

- 선수 이미지: `cdn.4590football.com/players/...` (Cloudflare Worker)
- SVG `<image>` 태그에 이미 `crossOrigin="anonymous"` 설정됨 ✅
- Cloudflare Worker에서 `Access-Control-Allow-Origin: *` 응답 ✅
- 결론: **CORS 차단 없이 캔버스 캡처 가능**

---

## DOM 구조 분석

```
Lineups.tsx
└── <div className="mb-4">
    └── Formation.tsx (motion.div)  ← ★ 캡처 대상 ref
        └── Field.tsx (Container > fieldWrapper div > SVG)
            └── Player.tsx (SVG g 요소들)
```

**캡처 범위**: `Formation.tsx`의 `motion.div` 전체
**버튼 위치**: `motion.div` 바깥 아래쪽 (캡처에 포함 안 됨)

---

## 변경 파일 목록

### 1. `package.json` — 패키지 추가

```bash
npm install html-to-image
```

### 2. `Field.tsx` — ref 전달 prop 추가

`fieldWrapper` div에 외부에서 ref를 붙일 수 있도록 prop 추가.

```tsx
interface FieldProps {
  isMobile?: boolean;
  children?: React.ReactNode;
  onRefresh?: () => void;
  captureRef?: React.RefObject<HTMLDivElement>;  // ← 추가
}

// fieldWrapper div에 적용
<div
  ref={captureRef}          // ← 추가
  className={styles.fieldWrapper}
  style={{ overflow: 'hidden', aspectRatio: ... }}
>
```

> **왜 Formation의 motion.div가 아닌 fieldWrapper인가:**
> formation.module.css의 배경색(초록 경기장)이 fieldWrapper에 있음.
> motion.div는 투명 래퍼라 배경이 잘림.

### 3. `Formation.tsx` — 캡처 로직 + 버튼 UI

```tsx
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Camera, Share2, Download } from 'lucide-react';
import Field from './components/Field';
import Player from './components/Player';

export default function Formation({ ... }) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!captureRef.current || capturing) return;
    setCapturing(true);

    try {
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2,        // 레티나 품질
        cacheBust: true,      // 이미지 캐시 무효화 (재시도 시 깨짐 방지)
        skipFonts: false,     // 한글 폰트 포함
        backgroundColor: '#3d9735',  // SVG 배경이 투명으로 캡처되면 초록으로 fallback
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'lineup.png', { type: 'image/png' });

      // 모바일: Web Share API (파일 공유)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: '라인업',
          text: '4590football 라인업 공유',
          files: [file],
        });
      } else {
        // PC: PNG 다운로드
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'lineup.png';
        link.click();
      }
    } catch (err) {
      // AbortError는 사용자가 공유 취소한 것 — 에러 아님
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('캡처 실패:', err);
        // TODO: 토스트 에러 메시지
      }
    } finally {
      setCapturing(false);
    }
  }, [capturing]);

  return (
    <>
      <motion.div ...>
        <Field isMobile={isMobile} onRefresh={handleRefresh} captureRef={captureRef}>
          <Player ... />
        </Field>
      </motion.div>

      {/* 공유 버튼 — captureRef 밖에 배치 (스크린샷에 포함 안 됨) */}
      <div className="flex justify-end px-4 mt-2">
        <button
          onClick={handleShare}
          disabled={capturing}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400
                     hover:text-gray-700 dark:hover:text-gray-200 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {capturing ? (
            <Spinner size="xs" />
          ) : (
            <Camera className="w-3.5 h-3.5" />
          )}
          {capturing ? '생성 중...' : '이미지 저장/공유'}
        </button>
      </div>
    </>
  );
}
```

---

## 예외 처리

| 상황 | 처리 |
|------|------|
| 선수 이미지 CORS 실패 | `crossOrigin="anonymous"` 이미 설정. 실패 시 placeholder 원(gray)으로 대체됨 (Player.tsx 기존 로직) |
| Web Share API 미지원 | `navigator.canShare` 체크 후 자동 다운로드 fallback |
| 사용자가 공유 취소 | `AbortError` 무시 |
| 캡처 자체 실패 | 콘솔 에러 + (추후) 토스트 메시지 |
| Framer Motion 애니메이션 중 캡처 | 버튼은 컴포넌트 마운트 후 노출되므로 첫 로드 애니메이션 이후에만 클릭 가능. 별도 대기 불필요 |

---

## 스크린샷 결과물 예시

- **크기**: fieldWrapper 실제 px × pixelRatio(2) → 레티나 해상도
- **내용**: 초록 경기장 + 양팀 선수 얼굴 + 번호 + 이름 + 평점 배지
- **배경**: `#3d9735` (경기장 초록)
- **미포함**: 공유 버튼, 새로고침 버튼은 SVG 내 포함되므로 **함께 캡처됨**

> 새로고침 버튼(우상단)을 캡처에서 제외하고 싶다면 Field.tsx의 `onRefresh` 버튼 `<g>`에
> `data-html2canvas-ignore` 또는 `html-to-image` 전용 제외 속성 추가 가능.
> 현재는 포함해도 큰 문제 없으므로 1차 구현에선 유지.

---

## 구현 순서

```
1. npm install html-to-image
2. Field.tsx: captureRef prop 추가 (3줄 변경)
3. Formation.tsx: handleShare 로직 + 버튼 UI 추가
4. 브라우저에서 테스트:
   - 모바일: 공유 시트 뜨는지 확인
   - PC: PNG 다운로드되는지 확인
   - 다크모드: 배경 정상 캡처 확인
   - 선수 이미지: 얼굴 정상 포함 확인
```

---

## 비고

- `html-to-image`는 `toPng` 외에 `toJpeg`, `toSvg`, `toBlob` 등 제공
- 향후 "이미지를 게시물에 첨부" 기능 연동 가능 (blob → FormData → Supabase Storage 업로드)
- CSS Module (`formation.module.css`) 스타일은 `html-to-image`가 인라인 직렬화하므로 별도 처리 불필요
