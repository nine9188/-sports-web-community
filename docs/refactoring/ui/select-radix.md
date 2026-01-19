# SelectRadix 컴포넌트 사용 현황

> 최종 업데이트: 2026-01-19

## 개요

`src/shared/components/ui/select-radix.tsx` - Radix Select 기반 드롭다운 컴포넌트.

---

## 사용 중 (6곳)

| 파일 | 용도 |
|-----|------|
| `src/domains/user/components/AuthorLink.tsx` | 사용자 옵션 선택 |
| `src/domains/livescore/components/football/transfers/TransferFilters.tsx` | 이적 필터 선택 |
| `src/domains/reports/components/ReportButton.tsx` | 신고 유형 선택 |
| `src/app/admin/logs/components/LogViewer.tsx` | 로그 필터 선택 |
| `src/domains/boards/components/post/PostEditForm.tsx` | 핫딜 정보 (쇼핑몰, 배송비) |
| `src/domains/chatbot/components/ChatFormRenderer.tsx` | 챗봇 동적 폼 |

---

## 미사용 (네이티브 select) - Admin 11곳

### Admin 영역 (11곳) - 보류

| 파일 |
|-----|
| `src/app/admin/banners/components/BannerManagementClient.tsx` |
| `src/app/admin/reports/page.tsx` |
| `src/app/admin/youtube/page.tsx` |
| `src/app/admin/boards/page.tsx` |
| `src/app/admin/shop/components/ShopItemManagement.tsx` |
| `src/app/admin/rss/page.tsx` |
| `src/app/admin/prediction/page.tsx` |
| `src/app/admin/test-kleague/page.tsx` |
| `src/app/admin/test-teams/page.tsx` |
| `src/app/admin/widgets/board-collection/page.tsx` |
| `src/domains/admin/components/SuspensionManager.tsx` |

---

## 마이그레이션 완료

### PostEditForm.tsx (2026-01-19)

- 쇼핑몰 선택 (`store`) → SelectRadix
- 배송비 선택 (`shipping`) → SelectRadix
- ~~`HotdealFormFields.tsx`~~ → 미사용 코드로 삭제됨

### ChatFormRenderer.tsx (2026-01-19)

- 동적 폼 select 필드 → SelectRadix
- `value || undefined` 패턴으로 빈 값 처리

---

## 사용 예시

```tsx
import {
  SelectRadix as Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem
} from '@/shared/components/ui';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">옵션 1</SelectItem>
    <SelectItem value="option2">옵션 2</SelectItem>
  </SelectContent>
</Select>
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|-----|----------|
| 2026-01-19 | ChatFormRenderer.tsx 마이그레이션 완료 (일반 영역 완료) |
| 2026-01-19 | PostEditForm.tsx 마이그레이션 완료, HotdealFormFields.tsx 삭제 |
| 2026-01-19 | 초기 문서 작성 |
