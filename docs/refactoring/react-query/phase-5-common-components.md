# Phase 5: 공통 컴포넌트 & 정리

> 상태: ✅ 완료

---

## 개요

공통으로 사용할 상태 컴포넌트와 유틸 훅을 생성합니다.

---

## 체크리스트 ✅

- [x] StateComponents.tsx 생성 (로딩/에러/빈 상태)
- [x] useClickOutside.ts 생성
- [x] useClickOutside 적용 (Comment.tsx, EntityPickerForm.tsx, MatchResultForm.tsx)
- [x] 문서 업데이트

---

## 생성된 파일

### StateComponents.tsx

```
src/shared/components/StateComponents.tsx  ✅
```

**Container 버전 (전체 페이지/섹션용):**
- `LoadingState` - 로딩 상태 표시
- `ErrorState` - 에러 상태 표시
- `EmptyState` - 빈 상태 표시

**Inline 버전 (간단한 인라인용):**
- `InlineLoading` - 간단한 로딩
- `InlineError` - 간단한 에러
- `InlineEmpty` - 간단한 빈 상태

### useClickOutside.ts

```
src/shared/hooks/useClickOutside.ts  ✅
```

**훅 목록:**
- `useClickOutside` - 외부 클릭 감지
- `useEscapeKey` - ESC 키 감지
- `useClickOutsideOrEscape` - 조합

---

## useClickOutside 적용 컴포넌트

| 파일 | 변경 내용 |
|------|----------|
| `Comment.tsx` | authorDropdown 외부 클릭 감지 |
| `EntityPickerForm.tsx` | 모달 외부 클릭 감지 |
| `MatchResultForm.tsx` | 모달 외부 클릭 감지 (캘린더 열림 시 제외) |

---

## 사용 예시

### StateComponents 사용

```tsx
import { LoadingState, ErrorState, EmptyState } from '@/shared/components/StateComponents';

// 로딩 상태
if (isLoading) return <LoadingState message="데이터를 불러오는 중..." />;

// 에러 상태
if (error) return <ErrorState message={error.message} onRetry={refetch} />;

// 빈 상태
if (data.length === 0) return <EmptyState message="데이터가 없습니다." />;
```

### useClickOutside 사용

```tsx
import { useClickOutside, useEscapeKey } from '@/shared/hooks/useClickOutside';

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  // ESC 키로 닫기
  useEscapeKey(() => setIsOpen(false), isOpen);

  return (
    <div ref={dropdownRef}>
      {/* 드롭다운 내용 */}
    </div>
  );
}
```

### useClickOutsideOrEscape 조합 사용

```tsx
import { useClickOutsideOrEscape } from '@/shared/hooks/useClickOutside';

function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 또는 ESC 키로 닫기
  useClickOutsideOrEscape(modalRef, () => setIsOpen(false), isOpen);

  return (
    <div ref={modalRef}>
      {/* 모달 내용 */}
    </div>
  );
}
```

---

## 결과

| 항목 | 생성됨 |
|------|--------|
| 공통 컴포넌트 | StateComponents.tsx (6개 컴포넌트) |
| 공통 훅 | useClickOutside.ts (3개 훅) |
| 적용된 컴포넌트 | 3개 |
