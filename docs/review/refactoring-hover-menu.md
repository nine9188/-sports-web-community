# HoverMenu 로직 분리

> 작성일: 2024-12-23
> 상태: ✅ 완료

## 1. 문제점

### 1.1 파일 정보

| 파일 | 줄 수 | 문제 |
|------|-------|------|
| `HoverMenu.tsx` | 548줄 | 모바일 바텀시트 UI가 인라인으로 포함 |
| `ClientHoverMenu.tsx` | 121줄 | 타입이 중복 정의됨 |

### 1.2 타입 중복

`ChildBoard`, `TopBoard` 타입이 두 파일에 중복 정의됨:

```typescript
// HoverMenu.tsx
interface ChildBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface TopBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

// ClientHoverMenu.tsx
interface ChildBoard { ... } // 동일
interface TopBoard { ... }   // 동일
interface PrefetchedData { ... }
```

---

## 2. 리팩토링 계획

### 2.1 분리 대상

| 항목 | 줄 수 | 분리 방법 |
|------|-------|----------|
| 공통 타입 | ~30줄 | `types.ts`로 분리 |
| 모바일 바텀시트 | ~60줄 | `MobileBottomSheet` 컴포넌트 |

### 2.2 새로운 파일 구조

```
components/common/
├── HoverMenu.tsx              # 메인 컴포넌트 (간소화)
├── ClientHoverMenu.tsx        # 클라이언트 래퍼
└── hover-menu/
    ├── index.ts               # export
    ├── types.ts               # 공통 타입
    └── MobileBottomSheet.tsx  # 모바일 바텀시트
```

---

## 3. 생성된 파일

### 3.1 types.ts

**경로:** `hover-menu/types.ts`

```typescript
export interface ChildBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

export interface TopBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

export interface HoverMenuProps {
  currentBoardId: string;
  topBoards: TopBoard[];
  childBoardsMap: Record<string, ChildBoard[]>;
  rootBoardId: string;
  rootBoardSlug?: string;
}

export interface PrefetchedData {
  topBoards: TopBoard[];
  childBoardsMap: Record<string, ChildBoard[]>;
  isServerFetched: boolean;
}
```

**줄 수:** 31줄

### 3.2 MobileBottomSheet.tsx

**경로:** `hover-menu/MobileBottomSheet.tsx`

```typescript
interface MobileBottomSheetProps {
  hoveredBoard: string;
  boardName: string;
  boardSlug: string;
  childBoards: ChildBoard[];
  currentBoardId: string;
  onClose: () => void;
}

export default function MobileBottomSheet({
  hoveredBoard,
  boardName,
  boardSlug,
  childBoards,
  currentBoardId,
  onClose
}: MobileBottomSheetProps) {
  // 오버레이
  // 바텀시트 헤더
  // 게시판 목록
}
```

**줄 수:** 96줄

### 3.3 index.ts

**경로:** `hover-menu/index.ts`

```typescript
export type { ChildBoard, TopBoard, HoverMenuProps, PrefetchedData } from './types';
export { default as MobileBottomSheet } from './MobileBottomSheet';
```

---

## 4. 변경된 파일

### 4.1 HoverMenu.tsx

**변경 전:**
```typescript
interface ChildBoard { ... }
interface TopBoard { ... }
interface HoverMenuProps { ... }

// 모바일 바텀시트 인라인 코드 (~60줄)
{isMobile ? (
  <>
    <div className="fixed inset-0 ..." onClick={() => ...} />
    <div className="fixed bottom-0 ...">
      {/* 헤더 */}
      {/* 콘텐츠 */}
    </div>
  </>
) : (
  /* 데스크톱 메뉴 */
)}
```

**변경 후:**
```typescript
import { ChildBoard, TopBoard, HoverMenuProps, MobileBottomSheet } from './hover-menu';

// 간결한 사용
{isMobile ? (
  <MobileBottomSheet
    hoveredBoard={hoveredBoard}
    boardName={...}
    boardSlug={...}
    childBoards={getChildBoards(hoveredBoard)}
    currentBoardId={currentBoardId}
    onClose={() => setHoveredBoard(null)}
  />
) : (
  /* 데스크톱 메뉴 */
)}
```

### 4.2 ClientHoverMenu.tsx

**변경 전:**
```typescript
interface ChildBoard { ... }  // 중복
interface TopBoard { ... }    // 중복
interface PrefetchedData { ... }
```

**변경 후:**
```typescript
import { ChildBoard, TopBoard, PrefetchedData } from './hover-menu';
```

---

## 5. 변경 결과

### 5.1 줄 수 비교

| 파일 | 변경 전 | 변경 후 |
|------|---------|---------|
| HoverMenu.tsx | 548줄 | 480줄 |
| ClientHoverMenu.tsx | 121줄 | 100줄 |
| hover-menu/types.ts | - | 31줄 |
| hover-menu/MobileBottomSheet.tsx | - | 96줄 |
| hover-menu/index.ts | - | 2줄 |

### 5.2 개선된 점

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 타입 중복 | 2곳 | 1곳 (types.ts) |
| 모바일 UI 분리 | ❌ 인라인 | ✅ 컴포넌트 |
| 재사용성 | 낮음 | 높음 |
| 관심사 분리 | ❌ | ✅ |

---

## 6. 사용 방법

```typescript
// HoverMenu.tsx
import { ChildBoard, TopBoard, HoverMenuProps, MobileBottomSheet } from './hover-menu';

// ClientHoverMenu.tsx
import { ChildBoard, TopBoard, PrefetchedData } from './hover-menu';
```

---

## 7. 빌드 테스트

✅ 성공

---

[← Phase 1.2 게시판 리뷰](./phase1-2-boards-review.md)
