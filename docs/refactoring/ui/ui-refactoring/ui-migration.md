# UI 컴포넌트 마이그레이션 가이드

> 생성일: 2026-01-18
> 완료일: 2026-01-18

## 상태: ✅ 완료

모든 UI 컴포넌트가 `@/shared/components/ui/`로 통합되었습니다.
`@/shared/ui/` 폴더는 삭제되었습니다.

---

## 표준 UI 컴포넌트 경로

```tsx
// ✅ 올바른 import
import {
  Button,
  Container,
  ContainerHeader,
  ContainerTitle,
  ContainerContent,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Pagination,
  Select,           // 간단한 Select (value, onChange, options)
  SelectRadix,      // Radix UI Select (compound component)
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  TabList,          // 배열 기반 탭
  Tabs,             // 컨테이너 (primitive)
  TabButton,        // 탭 버튼 (primitive)
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseButton,
  Textarea,
  Input,
  Badge,
  ErrorMessage
} from '@/shared/components/ui';

import Spinner from '@/shared/components/Spinner';
```

---

## 컴포넌트 목록

### @/shared/components/ui/

| 컴포넌트 | 파일 | 용도 |
|----------|------|------|
| Button | button.tsx | 모든 버튼 |
| Card, CardHeader, ... | card.tsx | 카드 레이아웃 |
| Container, ... | container.tsx | 섹션 컨테이너 |
| Pagination | pagination.tsx | 페이지네이션 |
| Select | select.tsx | 간단한 드롭다운 (value, onChange, options) |
| SelectRadix, SelectTrigger, ... | select-radix.tsx | Radix UI Select (compound) |
| Tabs, TabButton | tabs.tsx | Primitive 탭 |
| TabList, TabContent, TabPanel | tabs.tsx | 배열 기반 Full-featured 탭 |
| Dialog, DialogContent, ... | dialog.tsx | 모달 다이얼로그 |
| Textarea | textarea.tsx | 텍스트 영역 |
| Input | input.tsx | 텍스트 입력 |
| Badge | badge.tsx | 배지/태그 |
| ErrorMessage | error-message.tsx | 에러 메시지 표시 |

### @/shared/components/editor/

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| tiptap/ | @/shared/components/editor/tiptap/ | 에디터 확장 |

### @/shared/components/

| 컴포넌트 | 파일 | 용도 |
|----------|------|------|
| Spinner | Spinner.tsx | 로딩 스피너 |

---

## Select 컴포넌트 사용법

### 1. 간단한 Select (권장 - 대부분의 경우)

```tsx
import { Select } from '@/shared/components/ui';

<Select
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  options={[
    { value: 'a', label: '옵션 A' },
    { value: 'b', label: '옵션 B' },
  ]}
  placeholder="선택하세요"
/>
```

### 2. Radix UI Select (복잡한 커스터마이징 필요 시)

```tsx
import {
  SelectRadix as Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/shared/components/ui';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">옵션 A</SelectItem>
    <SelectItem value="b">옵션 B</SelectItem>
  </SelectContent>
</Select>
```

---

## Tabs 컴포넌트 사용법

### 1. 배열 기반 TabList (권장 - 대부분의 경우)

```tsx
import { TabList, type TabItem } from '@/shared/components/ui';

const tabs: TabItem[] = [
  { id: 'tab1', label: '탭 1' },
  { id: 'tab2', label: '탭 2', count: 5 },
];

<TabList
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={(tabId) => setActiveTab(tabId)}
  showCount={true}
  variant="default" // 또는 "minimal"
/>
```

### 2. Primitive Tabs + TabButton (커스텀 레이아웃 필요 시)

```tsx
import { Tabs, TabButton } from '@/shared/components/ui';

<Tabs>
  <TabButton active={tab === 'a'} onClick={() => setTab('a')}>탭A</TabButton>
  <TabButton active={tab === 'b'} onClick={() => setTab('b')}>탭B</TabButton>
</Tabs>
```

---

## 완료된 작업

- [x] tiptap 폴더 이동 (`shared/ui/` → `shared/components/editor/`)
- [x] ErrorMessage 컴포넌트 마이그레이션
- [x] ScrollArea 제거 (간단한 CSS overflow 사용)
- [x] Tabs 마이그레이션 (TabItem → TabList)
- [x] Dialog 컴포넌트 마이그레이션
- [x] Textarea 컴포넌트 마이그레이션
- [x] Radix Select 컴포넌트 마이그레이션
- [x] Input, Badge 컴포넌트 마이그레이션
- [x] `@/shared/ui/` 폴더 삭제

---

## 삭제된 위젯

다음 위젯 컴포넌트들은 사용하지 않아 삭제되었습니다:

### YouTube Widget (삭제됨)
- `src/app/components/widgets/youtube-widget/` 전체 폴더 삭제
- 포함 파일: `index.tsx`, `youtube-fetcher.ts`, `youtube-widget-client.tsx`

### Banner Carousel Widget (삭제됨)
- `src/domains/widgets/components/banner-widget/` 전체 폴더 삭제
- `src/domains/widgets/components/banner-widget.tsx` 삭제
- `src/domains/widgets/components/banner-widget-client.tsx` 삭제
- 포함 파일: `BannerCarousel.tsx`, `BannerWrapper.tsx`, `types.ts`, `index.ts`, `README.md`

> **참고**: 배너 관리 기능 (`/admin/banners`)은 유지됩니다. 삭제된 것은 사용자 측 배너 표시 위젯입니다.

### Live Score Widget 구버전 (삭제됨)
- `src/domains/widgets/components/live-score-widget.tsx` 삭제
- `src/domains/widgets/components/live-score-widget-client.tsx` 삭제

> **참고**: V2 버전 (`live-score-widget/LiveScoreWidgetV2.tsx`)이 사용 중입니다.

---

*마지막 업데이트: 2026-01-18*
