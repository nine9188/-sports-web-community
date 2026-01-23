# UI 컴포넌트 가이드

> 최종 업데이트: 2026-01-22

## 개요

`src/shared/components/ui/` 폴더의 공용 UI 컴포넌트 분류 및 사용 가이드입니다.

---

## 컴포넌트 분류

### 1. 필수 컴포넌트 (복잡한 로직/동작)

컴포넌트로 유지해야 하는 것들입니다. 상태 관리, Radix 프리미티브, 복잡한 로직이 포함되어 있습니다.

| 컴포넌트 | 파일 | 사용처 | 유지 이유 | 상세 문서 |
|---------|------|-------|----------|----------|
| **Button** | `button.tsx` | 많음 | cva variants + Radix Slot (asChild) | [button.md](./ui/button.md) |
| **Dialog** | `dialog.tsx` | 2곳 | Radix Dialog + 애니메이션 + 접근성 | [dialog.md](./ui/dialog.md) |
| **Tabs** | `tabs.tsx` | 10곳 | 콜백, 상태관리, variants | [tabs.md](./ui/tabs.md) |
| **Pagination** | `pagination.tsx` | 3곳 | URL/button 모드, 페이지 계산 로직 | [pagination.md](./ui/pagination.md) |
| **NativeSelect** | `select-native.tsx` | 11곳 | 스크롤 잠금 없는 커스텀 드롭다운 | [select-radix.md](./ui/select-radix.md) |
| **Container** | `container.tsx` | 36곳 | 레이아웃 추상화, 일관성 | [container.md](./ui/container.md) |

> 각 컴포넌트의 상세 사용 현황, 미사용(커스텀 구현) 목록, 마이그레이션 계획은 상세 문서를 참고하세요.

---

### 2. 스타일 상수로 대체 가능

단순 스타일 래퍼이므로 필요시 스타일 상수로 대체할 수 있습니다.

| 컴포넌트 | 파일 | 사용처 | 상태 |
|---------|------|-------|------|
| **Card** | `card.tsx` | 5곳 | 유지 중 (대체 가능) |
| **Badge** | `badge.tsx` | 1곳 | 유지 중 (대체 가능) |
| **ErrorMessage** | `error-message.tsx` | 6곳 | 유지 중 (대체 가능) |

---

### 3. 삭제됨 (미사용 또는 스타일 상수로 대체)

| 컴포넌트 | 이전 파일 | 삭제 이유 | 대체 방법 |
|---------|----------|----------|----------|
| ~~Input~~ | `input.tsx` | 스타일 상수로 충분 | `inputBaseStyles` + `focusStyles` |
| ~~Textarea~~ | `textarea.tsx` | 스타일 상수로 충분 | `inputGrayBgStyles` + `focusStyles` |
| ~~Select~~ | `select.tsx` | 미사용 (SelectRadix 사용) | `SelectRadix` 사용 |

---

## 사용 가이드

### 컴포넌트 Import

```tsx
// 필수 컴포넌트 사용
import {
  Button,
  Container, ContainerHeader, ContainerTitle, ContainerContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
  Pagination,
  TabList, type TabItem,
  NativeSelect
} from '@/shared/components/ui';
```

### 스타일 상수 Import

```tsx
// Input/Textarea는 스타일 상수 사용
import { focusStyles, inputBaseStyles, inputGrayBgStyles } from '@/shared/styles';
import { cn } from '@/shared/utils/cn';

// Input 대체
<input
  className={cn('h-10 w-full rounded-md px-3 py-2 text-sm', inputBaseStyles, focusStyles)}
/>

// Textarea 대체
<textarea
  className={cn('w-full min-h-[80px] rounded-md px-3 py-2 text-sm resize-none', inputGrayBgStyles, focusStyles)}
/>
```

---

## 컴포넌트별 상세

### Button

다양한 variant와 size를 지원하는 버튼 컴포넌트.

> 상세 마이그레이션 현황: [docs/refactoring/ui/button.md](./ui/button.md)

```tsx
import { Button } from '@/shared/components/ui';

// Variants: default, primary, secondary, destructive, outline, ghost, link, header
<Button variant="primary">확인</Button>
<Button variant="outline" size="sm">취소</Button>
<Button variant="ghost" size="icon"><Icon /></Button>

// asChild로 Link 감싸기
<Button asChild variant="primary">
  <Link href="/path">이동</Link>
</Button>
```

### Container

섹션 레이아웃을 위한 컨테이너 컴포넌트.

```tsx
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';

<Container>
  <ContainerHeader>
    <ContainerTitle>섹션 제목</ContainerTitle>
  </ContainerHeader>
  <ContainerContent>
    {/* 내용 */}
  </ContainerContent>
</Container>
```

### Dialog

모달 다이얼로그 컴포넌트 (Radix 기반).

```tsx
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogCloseButton,
  DialogBody, DialogFooter
} from '@/shared/components/ui';

<Dialog>
  <DialogTrigger asChild>
    <Button>열기</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
      <DialogCloseButton />
    </DialogHeader>
    <DialogBody>
      {/* 내용 */}
    </DialogBody>
    <DialogFooter>
      <Button variant="outline">취소</Button>
      <Button variant="primary">확인</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### TabList

탭 네비게이션 컴포넌트.

```tsx
import { TabList, type TabItem } from '@/shared/components/ui';

const tabs: TabItem[] = [
  { id: 'tab1', label: '탭 1' },
  { id: 'tab2', label: '탭 2', count: 10 },
];

<TabList
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  showCount
/>
```

### Pagination

페이지네이션 컴포넌트 (URL/버튼 모드 지원).

```tsx
import { Pagination } from '@/shared/components/ui';

// URL 모드 (Link 사용)
<Pagination currentPage={1} totalPages={10} mode="url" />

// 버튼 모드 (콜백 사용)
<Pagination
  currentPage={page}
  totalPages={total}
  onPageChange={setPage}
  mode="button"
/>
```

### NativeSelect

드롭다운 선택 컴포넌트 (스크롤 잠금 없음).

```tsx
import { NativeSelect } from '@/shared/components/ui';

const OPTIONS = [
  { value: 'option1', label: '옵션 1' },
  { value: 'option2', label: '옵션 2' },
];

<NativeSelect
  value={value}
  onValueChange={setValue}
  options={OPTIONS}
  placeholder="선택하세요"
  disabled={false}
/>
```

> **Note**: `SelectRadix`는 deprecated됨. 스크롤 잠금 문제로 `NativeSelect` 사용 권장.

---

## 파일 구조

```
src/shared/components/ui/
├── index.ts          # Export 모음
├── button.tsx        # Button (cva + Radix Slot)
├── card.tsx          # Card (단순 래퍼)
├── container.tsx     # Container (레이아웃)
├── dialog.tsx        # Dialog (Radix Dialog)
├── tabs.tsx          # Tabs, TabList (상태 관리)
├── pagination.tsx    # Pagination (URL/버튼 모드)
├── select-native.tsx # NativeSelect (커스텀 드롭다운, 권장)
├── select-radix.tsx  # SelectRadix (deprecated, 스크롤 잠금 문제)
├── badge.tsx         # Badge (cva)
└── error-message.tsx # ErrorMessage (에러 표시)

src/shared/styles/
├── index.ts          # Export 모음
├── focus.ts          # focusStyles, buttonFocusStyles
├── input.ts          # inputBaseStyles, inputGrayBgStyles
└── hover.ts          # hoverStyles, hoverTextStyles
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|-----|----------|
| 2026-01-22 | `NativeSelect` 추가, 모든 `SelectRadix` 사용처 마이그레이션 완료 |
| 2026-01-22 | `SelectRadix` deprecated (스크롤 잠금 문제) |
| 2026-01-19 | `select.tsx` 삭제, `TransferFilters.tsx`를 `SelectRadix`로 마이그레이션 |
| 2026-01-19 | `input.tsx`, `textarea.tsx` 삭제 → 스타일 상수로 대체 |
| 2026-01-19 | `src/shared/styles/` 폴더 생성 |
| 2026-01-19 | Button 컴포넌트 마이그레이션 24개 파일 완료 (Admin 제외) |
