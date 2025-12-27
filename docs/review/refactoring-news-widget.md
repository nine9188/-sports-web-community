# NewsWidget 리팩토링 계획

> 작성일: 2024-12-23
> 상태: ✅ 완료

## 1. 현재 상태 분석

### 1.1 파일 구조
```
widgets/components/
├── news-widget.tsx           # 서버 컴포넌트 (242줄) ← 문제
└── news-widget-client.tsx    # 클라이언트 컴포넌트 (310줄)
```

### 1.2 현재 코드 구조 (news-widget.tsx)

```
news-widget.tsx (242줄)
│
├── [4-14줄] NewsItem 타입 정의
│   └── ⚠️ 클라이언트에도 동일 타입 중복
│
├── [16-18줄] NewsWidgetProps 타입
│
├── [20-40줄] validateImageUrl() - 21줄
│   └── 이미지 URL 유효성 검사
│
├── [42-131줄] extractImageFromContent() - 90줄 ← 너무 김!
│   ├── JSON/TipTap 파싱 (48-83줄)
│   ├── HTML img 태그 추출 (85-97줄)
│   ├── 마크다운 이미지 추출 (99-104줄)
│   ├── URL 패턴 추출 (106-111줄)
│   └── og:image/twitter:image (113-125줄)
│
├── [133-218줄] getBoardPosts() - 86줄
│   ├── 게시판 정보 조회 (139-154줄)
│   ├── 게시글 조회 (156-167줄)
│   └── 데이터 포맷팅 (169-211줄)
│
└── [220-242줄] NewsWidget 컴포넌트 - 23줄
```

### 1.3 발견된 문제점

| # | 문제 | 심각도 | 위치 |
|---|------|--------|------|
| 1 | extractImageFromContent 함수가 90줄로 복잡 | 🟠 중간 | 42-131줄 |
| 2 | NewsItem 타입 중복 정의 | 🟠 중간 | 서버/클라이언트 |
| 3 | 서버 컴포넌트에 유틸 함수가 혼재 | 🟡 낮음 | - |
| 4 | 파일명이 kebab-case (컴포넌트는 PascalCase) | 🟢 정보 | - |

---

## 2. 리팩토링 목표

### 2.1 정량적 목표
| 항목 | 현재 | 목표 |
|------|------|------|
| news-widget.tsx 줄 수 | 242줄 | < 80줄 |
| extractImageFromContent 줄 수 | 90줄 | 분리 |
| 타입 중복 | 2곳 | 1곳 |

### 2.2 정성적 목표
- 이미지 추출 로직을 재사용 가능한 유틸로 분리
- 공통 타입 파일로 중복 제거
- 단일 책임 원칙 적용

---

## 3. 리팩토링 계획

### 3.1 새로운 파일 구조

```
widgets/components/
├── news-widget/                          # 🆕 폴더로 변경
│   ├── index.ts                          # export
│   ├── types.ts                          # 공통 타입
│   ├── NewsWidget.tsx                    # 서버 컴포넌트 (간소화)
│   ├── NewsWidgetClient.tsx              # 클라이언트 (이동)
│   ├── actions/
│   │   └── getNewsPosts.ts               # 데이터 fetching
│   └── utils/
│       ├── extractImageFromContent.ts    # 이미지 추출 유틸
│       └── validateImageUrl.ts           # URL 검증 유틸
```

### 3.2 단계별 작업

#### Step 1: 폴더 구조 생성 및 타입 분리

**파일:** `news-widget/types.ts`

```typescript
// types.ts
export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
  url: string;
  postNumber?: number;
}

export interface NewsWidgetProps {
  boardSlug?: string | string[];
}
```

---

#### Step 2: 이미지 추출 유틸 분리

**파일:** `news-widget/utils/extractImageFromContent.ts`

이미지 추출 전략을 분리하여 가독성 향상:

```typescript
// extractImageFromContent.ts

/** TipTap JSON에서 이미지 추출 */
function extractFromTipTap(content: object): string | null { ... }

/** RSS Post 형식에서 이미지 추출 */
function extractFromRssPost(content: object): string | null { ... }

/** HTML에서 img 태그 추출 */
function extractFromHtml(content: string): string | null { ... }

/** 마크다운에서 이미지 추출 */
function extractFromMarkdown(content: string): string | null { ... }

/** URL 패턴에서 이미지 추출 */
function extractFromUrl(content: string): string | null { ... }

/** 메타 태그에서 이미지 추출 (og:image, twitter:image) */
function extractFromMetaTags(content: string): string | null { ... }

/** 메인 함수 - 순차적으로 시도 */
export function extractImageFromContent(content: string): string { ... }
```

---

#### Step 3: URL 검증 유틸 분리

**파일:** `news-widget/utils/validateImageUrl.ts`

```typescript
// validateImageUrl.ts

const IMAGE_URL_PATTERN = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;

export function validateImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true; // 로컬 이미지
  return IMAGE_URL_PATTERN.test(url);
}
```

---

#### Step 4: 데이터 fetching 분리

**파일:** `news-widget/actions/getNewsPosts.ts`

```typescript
// getNewsPosts.ts
'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { NewsItem } from '../types';
import { extractImageFromContent } from '../utils/extractImageFromContent';
import { validateImageUrl } from '../utils/validateImageUrl';

const BACKUP_IMAGE_PATH = '/213/news';

export async function getNewsPosts(boardSlug: string): Promise<NewsItem[]> {
  // 데이터 fetching 로직
}

export async function getAllNewsPosts(boardSlugs: string[]): Promise<NewsItem[]> {
  // 여러 게시판에서 가져와서 정렬
}
```

---

#### Step 5: 메인 컴포넌트 간소화

**파일:** `news-widget/NewsWidget.tsx`

```typescript
// NewsWidget.tsx
import { getAllNewsPosts } from './actions/getNewsPosts';
import NewsWidgetClient from './NewsWidgetClient';
import { NewsWidgetProps } from './types';

const DEFAULT_BOARD_SLUGS = ['foreign-news', 'domestic-news'];

export default async function NewsWidget({ boardSlug }: NewsWidgetProps) {
  const slugs = boardSlug
    ? (Array.isArray(boardSlug) ? boardSlug : [boardSlug])
    : DEFAULT_BOARD_SLUGS;

  const news = await getAllNewsPosts(slugs);

  return <NewsWidgetClient initialNews={news} />;
}
```

---

#### Step 6: 클라이언트 컴포넌트 이동 및 수정

**파일:** `news-widget/NewsWidgetClient.tsx`

- 기존 `news-widget-client.tsx` 이동
- 타입 import 경로 수정
- NewsItem 타입 중복 제거

---

#### Step 7: 기존 export 호환성 유지

**파일:** `news-widget/index.ts`

```typescript
export { default as NewsWidget } from './NewsWidget';
export { default as NewsWidgetClient } from './NewsWidgetClient';
export type { NewsItem, NewsWidgetProps } from './types';
```

**파일:** `widgets/components/index.ts` 수정

```typescript
// 기존
export { default as NewsWidget } from './news-widget';
// 변경
export { NewsWidget, NewsWidgetClient } from './news-widget';
export type { NewsItem } from './news-widget';
```

---

## 4. 리팩토링 전후 비교

### 4.1 파일/줄 수 비교

| 파일 | 리팩토링 전 | 리팩토링 후 |
|------|-------------|-------------|
| 메인 컴포넌트 | 242줄 | ~25줄 |
| 클라이언트 | 310줄 | ~300줄 (타입 import 변경) |
| types.ts | - | ~15줄 |
| extractImageFromContent.ts | - | ~80줄 |
| validateImageUrl.ts | - | ~15줄 |
| getNewsPosts.ts | - | ~70줄 |

### 4.2 코드 품질 비교

| 항목 | 리팩토링 전 | 리팩토링 후 |
|------|-------------|-------------|
| 단일 책임 원칙 | ❌ 위반 | ✅ 준수 |
| 타입 중복 | 2곳 | 1곳 |
| 재사용성 | 낮음 | 높음 |
| 테스트 용이성 | 어려움 | 쉬움 |

---

## 5. 작업 체크리스트

- [x] Step 1: news-widget 폴더 생성, types.ts 작성
- [x] Step 2: utils/extractImageFromContent.ts 작성
- [x] Step 3: utils/validateImageUrl.ts 작성
- [x] Step 4: actions/getNewsPosts.ts 작성
- [x] Step 5: NewsWidget.tsx (메인 컴포넌트) 작성
- [x] Step 6: NewsWidgetClient.tsx 이동 및 수정
- [x] Step 7: index.ts 및 상위 export 수정
- [x] Step 8: 기존 파일 삭제
- [x] Step 9: 빌드 테스트 ✅ 성공

---

## 6. 예상 소요 시간

| 단계 | 예상 시간 |
|------|----------|
| Step 1-3: 타입 및 유틸 | 15분 |
| Step 4: actions | 10분 |
| Step 5-6: 컴포넌트 | 15분 |
| Step 7-8: export 및 정리 | 10분 |
| Step 9: 테스트 | 10분 |
| **총합** | **~60분** |

---

## 7. 승인 및 진행

- [x] 계획 검토 완료
- [x] 리팩토링 진행 승인
- [x] 작업 시작
- [x] 작업 완료 ✅

---

## 8. 결과 요약

### 8.1 최종 파일 구조

```
widgets/components/news-widget/
├── index.ts                          # 13줄
├── types.ts                          # 13줄
├── NewsWidget.tsx                    # 24줄 (기존 242줄 → 90% 감소)
├── NewsWidgetClient.tsx              # 302줄
├── actions/
│   ├── index.ts                      # 2줄
│   └── getNewsPosts.ts               # 101줄
└── utils/
    ├── index.ts                      # 3줄
    ├── extractImageFromContent.ts    # 127줄
    └── validateImageUrl.ts           # 28줄
```

### 8.2 달성 결과

| 항목 | 목표 | 결과 |
|------|------|------|
| 메인 컴포넌트 줄 수 | < 80줄 | ✅ 24줄 |
| 타입 중복 | 1곳 | ✅ 1곳 (types.ts) |
| 빌드 테스트 | 성공 | ✅ 성공 |

### 8.3 삭제된 파일

- `widgets/components/news-widget.tsx` (242줄) → 삭제됨
- `widgets/components/news-widget-client.tsx` → 폴더로 이동

---

[← Phase 1.1 메인 페이지 리뷰](./phase1-1-main-page-review.md)
