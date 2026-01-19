# Card 스타일 상수

> 최종 업데이트: 2026-01-19

## 개요

Card 컴포넌트가 **스타일 상수로 대체**되었습니다.

**변경 전**: `src/shared/components/ui/card.tsx` (삭제됨)
**변경 후**: `src/shared/styles/card.ts` (스타일 상수)

---

## 스타일 상수

```typescript
// src/shared/styles/card.ts

// 카드 기본 스타일
export const cardStyles = 'rounded-lg bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] border border-black/5 dark:border-0 overflow-hidden';

// 카드 헤더
export const cardHeaderStyles = 'flex flex-col space-y-1.5 px-6 py-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg';

// 카드 타이틀
export const cardTitleStyles = 'text-2xl font-semibold leading-none tracking-tight';

// 카드 설명
export const cardDescriptionStyles = 'text-sm text-gray-500 dark:text-gray-400';

// 카드 콘텐츠
export const cardContentStyles = 'p-6 pt-0';

// 카드 푸터
export const cardFooterStyles = 'flex items-center p-6 pt-0';

// 간단한 카드 (패딩만)
export const cardSimpleStyles = 'rounded-lg bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] border border-black/5 dark:border-0 p-6';
```

---

## 사용법

### Import

```typescript
import { cardStyles, cardHeaderStyles, cardTitleStyles, cardSimpleStyles } from '@/shared/styles';
```

### 헤더가 있는 카드

```tsx
<div className={cardStyles}>
  <div className={cardHeaderStyles}>
    <h3 className={cardTitleStyles}>제목</h3>
  </div>
  <div className="p-6">
    {/* 내용 */}
  </div>
</div>
```

### 간단한 카드 (패딩만)

```tsx
<div className={cardSimpleStyles}>
  <h2 className="text-xl font-semibold mb-4">제목</h2>
  {/* 내용 */}
</div>
```

---

## 마이그레이션 완료

| 파일 | 변경 내용 |
|-----|----------|
| `src/app/admin/logs/components/LogViewer.tsx` | Card → cardStyles |
| `src/app/admin/shop/components/ShopItemManagement.tsx` | Card → cardSimpleStyles |

---

## Card vs Container 차이점

| 특성 | Card (스타일 상수) | Container (컴포넌트) |
|-----|-------------------|---------------------|
| **구현** | 스타일 상수 | React 컴포넌트 |
| **헤더 패딩** | px-6 py-4 | h-12 px-4 |
| **콘텐츠 패딩** | p-6 | 없음 (자유) |
| **용도** | Admin 영역, 독립 카드 | 섹션 레이아웃 |

---

## 변경 이력

| 날짜 | 변경 내용 |
|-----|----------|
| 2026-01-19 | Card 컴포넌트 삭제, 스타일 상수로 대체 |
| 2026-01-19 | 초기 문서 작성 |
