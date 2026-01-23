# SelectRadix 컴포넌트 (Deprecated)

> 최종 업데이트: 2026-01-22

## 주의: NativeSelect로 마이그레이션됨

`SelectRadix`는 Radix Select 기반으로 드롭다운이 열릴 때 **스크롤 잠금 문제**가 있습니다.
`body`에 `data-scroll-locked="1"` 속성이 추가되어 페이지 스크롤바가 사라지는 현상이 발생합니다.

모든 사용처가 **NativeSelect**로 마이그레이션되었습니다.

---

## NativeSelect 사용법

```tsx
import { NativeSelect } from '@/shared/components/ui';

const OPTIONS = [
  { value: 'option1', label: '옵션 1' },
  { value: 'option2', label: '옵션 2' },
  { value: 'option3', label: '옵션 3' },
];

<NativeSelect
  value={value}
  onValueChange={setValue}
  options={OPTIONS}
  placeholder="선택하세요"
  disabled={false}
  triggerClassName="w-40"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | 선택된 값 |
| `onValueChange` | `(value: string) => void` | - | 값 변경 콜백 |
| `options` | `{ value: string; label: string }[]` | - | 옵션 목록 |
| `placeholder` | `string` | `"선택"` | 플레이스홀더 |
| `disabled` | `boolean` | `false` | 비활성화 여부 |
| `className` | `string` | - | 컨테이너 className |
| `triggerClassName` | `string` | - | 트리거 버튼 className |
| `contentClassName` | `string` | - | 드롭다운 컨텐츠 className |
| `itemClassName` | `string` | - | 아이템 className |

---

## 마이그레이션 완료 목록

| 파일 | 마이그레이션 날짜 |
|-----|-----------------|
| `src/domains/boards/components/board/BoardSearchBar.tsx` | 2026-01-22 |
| `src/domains/admin/components/logs/LogFilters.tsx` | 2026-01-22 |
| `src/domains/admin/components/boards/BoardForm.tsx` | 2026-01-22 |
| `src/domains/admin/components/reports/ReportFilters.tsx` | 2026-01-22 |
| `src/app/admin/widgets/board-collection/page.tsx` | 2026-01-22 |
| `src/domains/chatbot/components/ChatFormRenderer.tsx` | 2026-01-22 |
| `src/app/ui/page.tsx` | 2026-01-22 |
| `src/domains/livescore/components/football/transfers/TransferFilters.tsx` | 2026-01-22 |
| `src/domains/boards/components/post/PostEditForm.tsx` | 2026-01-22 |
| `src/domains/user/components/AuthorLink.tsx` | 2026-01-22 |
| `src/domains/reports/components/ReportButton.tsx` | 2026-01-22 |

---

## 변경 이력

| 날짜 | 변경 내용 |
|-----|----------|
| 2026-01-22 | 모든 사용처 NativeSelect로 마이그레이션, SelectRadix deprecated |
| 2026-01-19 | ChatFormRenderer.tsx 마이그레이션 완료 |
| 2026-01-19 | PostEditForm.tsx 마이그레이션 완료 |
| 2026-01-19 | 초기 문서 작성 |
