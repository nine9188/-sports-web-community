# UI 컴포넌트 문서 인덱스

> 최종 업데이트: 2026-01-19

## 개요

`src/shared/components/ui/` 폴더의 공유 UI 컴포넌트별 상세 문서입니다.

---

## 컴포넌트별 문서

| 컴포넌트 | 사용처 | 미사용(커스텀) | 문서 |
|---------|-------|--------------|------|
| **Button** | 90개+ | - | [button.md](./button.md) |
| **Container** | 36개 | - | [container.md](./container.md) |
| **Tabs** | 16개 | 1개 (필터버튼) | [tabs.md](./tabs.md) |
| **Dialog** | 7개 | 4개 (드로어) | [dialog.md](./dialog.md) |
| **SelectRadix** | 6개 | 11개 (Admin) | [select-radix.md](./select-radix.md) |
| **Pagination** | 12개 | ✅ 완료 | [pagination.md](./pagination.md) |

---

## 마이그레이션 우선순위

### ✅ 완료
- **센터 모달 → Dialog**: `PlayerStatsModal.tsx`, `HotdealEndButton.tsx`, `AccountDeleteForm.tsx`
- **바텀시트 모달 → Dialog (bottomSheet)**: `PurchaseModal.tsx`, `NicknameChangeModal.tsx`
- **커스텀 탭 → TabList (contained)**: `TabsClient.tsx`, `HotdealTabsClient.tsx`, `LeagueStandings.tsx`, `UserActivityTabs.tsx`, `EntityPickerForm.tsx`, `account-recovery`
- **ShopPagination → Pagination**: 9곳 마이그레이션, ShopPagination 삭제
- **Native select → SelectRadix**: `PostEditForm.tsx`, `ChatFormRenderer.tsx` 마이그레이션, `HotdealFormFields.tsx` 삭제 (일반 영역 완료)

### 낮음 (보류)
- **슬라이드 드로어**: Drawer 컴포넌트 신규 개발 또는 유지 (4개)

---

## 테스트 페이지

공유 UI 컴포넌트는 `/ui` 페이지에서 확인 가능합니다.

---

## 관련 문서

- [UI 컴포넌트 가이드](../ui-components-guide.md) - 컴포넌트 분류 및 사용법

---

## 변경 이력

| 날짜 | 변경 내용 |
|-----|----------|
| 2026-01-19 | SelectRadix 마이그레이션 완료 (PostEditForm.tsx, ChatFormRenderer.tsx), HotdealFormFields.tsx 삭제 |
| 2026-01-19 | 컴포넌트별 개별 문서로 분리, 인덱스 페이지로 변경 |
| 2026-01-19 | 초기 문서 작성 |
