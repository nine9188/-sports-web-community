# PostEditForm.tsx 리팩토링

> 작성일: 2024-12-23
> 상태: ✅ 완료

## 1. 문제점

### 1.1 파일 정보

| 항목 | 내용 |
|------|------|
| **경로** | `src/domains/boards/components/post/PostEditForm.tsx` |
| **줄 수** | 996줄 |
| **문제** | 에디터 핸들러, 모달 상태, 공지 UI, 인라인 CSS가 한 파일에 혼재 |

### 1.2 구조 분석

```
PostEditForm.tsx (996줄)
│
├── [1-52줄] 타입 정의 및 imports
│
├── [53-109줄] 상태 선언 (12개의 useState)
│   ├── 폼 상태 (title, content, error 등)
│   ├── 공지 상태 (isNotice, noticeType 등)
│   └── 모달 상태 (showImageModal, showVideoModal 등)
│
├── [110-230줄] useEffect 및 유틸 함수
│   ├── 관리자 권한 확인
│   ├── 확장 로딩
│   └── 에디터 초기화
│
├── [231-365줄] handleSubmit (~135줄)
│
├── [367-662줄] 에디터 핸들러들 (~295줄) ← 분리 대상
│   ├── handleFileUpload
│   ├── handleAddImage
│   ├── handleAddYoutube
│   ├── handleAddVideo
│   ├── handleToggleDropdown
│   ├── handleAddMatch
│   ├── handleAddLink
│   └── handleAddSocialEmbed
│
├── [663-807줄] 공지 관리 섹션 UI (~144줄) ← 분리 대상
│
├── [808-968줄] 인라인 CSS (~160줄) ← 분리 대상
│
└── [969-996줄] 버튼 영역
```

---

## 2. 리팩토링 계획

### 2.1 분리 대상

| 항목 | 줄 수 | 분리 방법 |
|------|-------|----------|
| 에디터 핸들러 | ~295줄 | `useEditorHandlers` 훅 |
| 공지 관리 UI | ~144줄 | `NoticeAdminSection` 컴포넌트 |
| 인라인 CSS | ~160줄 | `globals.css`로 이동 |

### 2.2 새로운 파일 구조

```
components/post/
├── PostEditForm.tsx              # 메인 컴포넌트 (간소화)
└── post-edit-form/
    ├── index.ts                  # export
    ├── hooks/
    │   ├── index.ts
    │   └── useEditorHandlers.ts  # 에디터 핸들러 훅
    └── components/
        ├── index.ts
        └── NoticeAdminSection.tsx # 공지 관리 UI
```

---

## 3. 생성된 파일

### 3.1 useEditorHandlers.ts

**경로:** `post-edit-form/hooks/useEditorHandlers.ts`

```typescript
interface UseEditorHandlersProps {
  editor: Editor | null;
  extensionsLoaded: boolean;
  supabase: SupabaseClient | null;
}

interface UseEditorHandlersReturn {
  // 모달 상태
  showImageModal: boolean;
  showYoutubeModal: boolean;
  showVideoModal: boolean;
  showMatchModal: boolean;
  showLinkModal: boolean;
  showSocialModal: boolean;
  // 핸들러
  handleToggleDropdown: (...) => void;
  handleFileUpload: (...) => Promise<void>;
  handleAddImage: (...) => void;
  handleAddYoutube: (...) => Promise<void>;
  handleAddVideo: (...) => Promise<void>;
  handleAddMatch: (...) => Promise<void>;
  handleAddLink: (...) => void;
  handleAddSocialEmbed: (...) => void;
}

export function useEditorHandlers({...}): UseEditorHandlersReturn {
  // 모달 상태 관리
  // 8개의 핸들러 함수
  // ...
}
```

**줄 수:** ~300줄

### 3.2 NoticeAdminSection.tsx

**경로:** `post-edit-form/components/NoticeAdminSection.tsx`

```typescript
interface NoticeAdminSectionProps {
  isNotice: boolean;
  setIsNotice: (value: boolean) => void;
  noticeType: 'global' | 'board';
  setNoticeType: (value: 'global' | 'board') => void;
  noticeBoards: string[];
  setNoticeBoards: (boards: string[]) => void;
  noticeOrder: number;
  setNoticeOrder: (order: number) => void;
  allBoardsFlat: Board[];
}

export default function NoticeAdminSection({...}: NoticeAdminSectionProps) {
  // 공지 설정 UI
  // 공지 타입 선택 (전체/게시판)
  // 게시판 선택 (다중 선택)
  // 공지 순서 설정
}
```

**줄 수:** ~110줄

### 3.3 globals.css 추가

```css
/* TipTap 에디터 기본 스타일 */
.ProseMirror {
  padding: 1rem;
  min-height: 500px;
  color: #111827;
}

.dark .ProseMirror {
  color: #F0F0F0;
}

/* 에디터 내 경기 카드 스타일 */
.ProseMirror .match-card {
  width: 100% !important;
  max-width: 100% !important;
  /* ... */
}
```

---

## 4. 변경 결과

### 4.1 줄 수 비교

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| PostEditForm.tsx | 996줄 | **495줄** |
| useEditorHandlers.ts | - | 300줄 |
| NoticeAdminSection.tsx | - | 110줄 |
| globals.css (추가) | - | ~40줄 |

### 4.2 감소량

**PostEditForm.tsx: 996줄 → 495줄 (-501줄, ~50% 감소)**

### 4.3 개선된 점

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 단일 책임 원칙 | ❌ 위반 | ✅ 준수 |
| 코드 재사용성 | 낮음 | 높음 |
| 테스트 용이성 | 어려움 | 쉬움 |
| 인라인 CSS | 160줄+ | 0줄 |

---

## 5. 사용 방법

```typescript
// PostEditForm.tsx
import { useEditorHandlers } from './post-edit-form/hooks';
import { NoticeAdminSection } from './post-edit-form/components';

// 에디터 핸들러 훅 사용
const {
  showImageModal,
  showYoutubeModal,
  // ...
  handleFileUpload,
  handleAddImage,
  // ...
} = useEditorHandlers({
  editor,
  extensionsLoaded,
  supabase
});

// 공지 관리 컴포넌트 사용
{isCreateMode && isAdmin && (
  <NoticeAdminSection
    isNotice={isNotice}
    setIsNotice={setIsNotice}
    noticeType={noticeType}
    setNoticeType={setNoticeType}
    noticeBoards={noticeBoards}
    setNoticeBoards={setNoticeBoards}
    noticeOrder={noticeOrder}
    setNoticeOrder={setNoticeOrder}
    allBoardsFlat={allBoardsFlat}
  />
)}
```

---

## 6. 빌드 테스트

✅ 성공

---

[← Phase 1.2 게시판 리뷰](./phase1-2-boards-review.md)
