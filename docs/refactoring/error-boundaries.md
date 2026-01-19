# error.tsx 도메인별 추가 계획

## 1. 현재 상태

### 1.1 error.tsx
```
src/app/
├── error.tsx          ✅ 존재 (루트 - 전역 폴백)
├── boards/
│   └── (error.tsx)    ❌ 없음
├── livescore/
│   └── (error.tsx)    ❌ 없음
├── shop/
│   └── (error.tsx)    ❌ 없음
├── settings/
│   └── (error.tsx)    ❌ 없음
├── admin/
│   └── (error.tsx)    ❌ 없음
└── (auth)/
    └── (error.tsx)    ❌ 없음
```

### 1.2 loading.tsx (참고)
```
src/app/
├── loading.tsx             ✅
├── boards/loading.tsx      ✅
├── boards/[slug]/loading.tsx ✅
├── livescore/loading.tsx   ✅
├── shop/loading.tsx        ✅
└── settings/loading.tsx    ✅
```

---

## 2. 문제점

### 2.1 현재 에러 발생 시 동작

| 위치 | 에러 발생 시 | 문제 |
|------|-------------|------|
| `/boards/*` | 루트 error.tsx로 폴백 | 게시판 맥락 상실, "메인으로" 버튼만 있음 |
| `/livescore/*` | 루트 error.tsx로 폴백 | 라이브스코어 맥락 상실 |
| `/shop/*` | 루트 error.tsx로 폴백 | 상점 맥락 상실 |
| `/admin/*` | 루트 error.tsx로 폴백 | 관리자 맥락 상실 |
| `/signin`, `/signup` | 루트 error.tsx로 폴백 | 인증 플로우 중단 |

### 2.2 사용자 경험 문제

1. **맥락 상실**: 어디서 에러가 발생했는지 모름
2. **복구 어려움**: 해당 섹션으로 돌아가는 버튼 없음
3. **일관성 부족**: 도메인별 특화된 에러 메시지 없음

---

## 3. 추가 계획

### 3.1 우선순위별 분류

| 우선순위 | 경로 | 이유 | 특화 기능 |
|----------|------|------|----------|
| **P0** | `boards/` | 가장 사용량 많음 | "게시판 목록으로" 버튼 |
| **P0** | `livescore/` | 외부 API 의존, 에러 잦음 | "라이브스코어로" 버튼 |
| **P1** | `shop/` | 결제 관련 민감 | "상점으로" 버튼 |
| **P1** | `(auth)/` | 인증 에러 특화 | "로그인으로" 버튼 |
| **P2** | `settings/` | 설정 저장 실패 처리 | "설정으로" 버튼 |

### 3.2 추가할 파일 목록

```
src/app/
├── error.tsx                    ✅ 기존 (전역 폴백)
├── boards/
│   └── error.tsx                🆕 추가
├── livescore/
│   └── error.tsx                🆕 추가
├── shop/
│   └── error.tsx                🆕 추가
├── (auth)/
│   └── error.tsx                🆕 추가
└── settings/
    └── error.tsx                🆕 추가
```

**총 5개 파일 추가**

---

## 4. 구현 상세

### 4.1 공통 구조

```tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DomainError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Sentry 등 에러 로깅
    console.error('[Domain] Error:', error);
  }, [error]);

  return (
    <div className="container mx-auto min-h-[60vh] flex items-center justify-center">
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-8 text-center max-w-md">
        {/* 아이콘 */}
        <div className="text-5xl mb-4">{icon}</div>

        {/* 제목 */}
        <h1 className="text-xl font-semibold mb-3 text-gray-900 dark:text-[#F0F0F0]">
          {title}
        </h1>

        {/* 설명 */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
          {description}
        </p>

        {/* 에러 코드 */}
        {error.digest && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            오류 코드: {error.digest}
          </p>
        )}

        {/* 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="...">다시 시도</button>
          <Link href={backUrl} className="...">{backLabel}</Link>
        </div>
      </div>
    </div>
  );
}
```

### 4.2 도메인별 특화

#### boards/error.tsx
```tsx
// 아이콘: 📋
// 제목: "게시판 로딩 중 문제가 발생했습니다"
// 설명: "게시글을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
// 버튼: "다시 시도" + "게시판 목록으로" (/boards/all)
```

#### livescore/error.tsx
```tsx
// 아이콘: ⚽
// 제목: "경기 정보를 불러올 수 없습니다"
// 설명: "실시간 경기 데이터를 가져오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
// 버튼: "다시 시도" + "라이브스코어 홈으로" (/livescore/football)
// 추가: 외부 API 에러인 경우 별도 메시지
```

#### shop/error.tsx
```tsx
// 아이콘: 🛒
// 제목: "상점 페이지 오류"
// 설명: "상점 정보를 불러오는 중 문제가 발생했습니다."
// 버튼: "다시 시도" + "상점 홈으로" (/shop)
```

#### (auth)/error.tsx
```tsx
// 아이콘: 🔐
// 제목: "인증 처리 중 오류"
// 설명: "로그인/회원가입 처리 중 문제가 발생했습니다."
// 버튼: "다시 시도" + "로그인으로" (/signin)
```

#### settings/error.tsx
```tsx
// 아이콘: ⚙️
// 제목: "설정 페이지 오류"
// 설명: "설정을 불러오거나 저장하는 중 문제가 발생했습니다."
// 버튼: "다시 시도" + "설정으로" (/settings/profile)
```

---

## 5. 스타일 가이드

### 5.1 컨테이너
```css
/* 배경 */
bg-white dark:bg-[#1D1D1D]

/* 테두리 */
border border-black/7 dark:border-0

/* 모서리 */
rounded-lg

/* 패딩 */
p-8
```

### 5.2 버튼

#### Primary (다시 시도)
```css
bg-[#262626] dark:bg-[#3F3F3F]
text-white
hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A]
```

#### Secondary (돌아가기)
```css
border border-black/7 dark:border-white/10
text-gray-700 dark:text-gray-300
hover:bg-[#EAEAEA] dark:hover:bg-[#333333]
```

### 5.3 텍스트
```css
/* 제목 */
text-xl font-semibold text-gray-900 dark:text-[#F0F0F0]

/* 설명 */
text-sm text-gray-700 dark:text-gray-300

/* 에러 코드 */
text-xs text-gray-500 dark:text-gray-400
```

---

## 6. 구현 순서

```
1. 공통 에러 스타일 상수 생성 (shared/styles/error.ts)
2. boards/error.tsx 구현 (P0)
3. livescore/error.tsx 구현 (P0)
4. shop/error.tsx 구현 (P1)
5. (auth)/error.tsx 구현 (P1)
6. settings/error.tsx 구현 (P2)
7. 테스트 (각 도메인에서 에러 발생시켜 확인)
```

---

## 7. 예상 효과

| 항목 | Before | After |
|------|--------|-------|
| error.tsx 파일 수 | 1개 | 6개 |
| 도메인별 에러 메시지 | ❌ | ✅ |
| 맥락 유지 복귀 버튼 | ❌ | ✅ |
| 사용자 에러 경험 | 혼란 | 명확한 안내 |

---

## 8. 추후 개선

1. **Sentry 연동**: 에러 자동 수집
2. **에러 유형별 분기**: 네트워크/권한/서버 에러 구분
3. **not-found.tsx 도메인별 추가**: 404 페이지도 특화

---

*작성일: 2026-01-19*
*예상 작업 시간: 1-2시간*
