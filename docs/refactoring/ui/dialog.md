# Dialog 컴포넌트 사용 현황

> 최종 업데이트: 2026-01-19

## 개요

`src/shared/components/ui/dialog.tsx` - Radix Dialog 기반 모달 컴포넌트.

**Variant 지원:**
- `default` - 센터 모달 (PC/모바일 동일)
- `bottomSheet` - 모바일: 바텀시트, 데스크탑: 센터 모달

---

## 사용 중 (8곳)

| 파일 | 용도 | Variant |
|-----|------|---------|
| `src/domains/user/components/AuthorLink.tsx` | 사용자 프로필/신고 다이얼로그 | default |
| `src/domains/reports/components/ReportButton.tsx` | 신고 다이얼로그 | default |
| `src/domains/boards/components/hotdeal/HotdealEndButton.tsx` | 핫딜 종료 확인 | default |
| `src/domains/settings/components/account-delete/AccountDeleteForm.tsx` | 계정 삭제 확인 | default |
| `src/domains/livescore/components/football/match/tabs/lineups/components/PlayerStatsModal.tsx` | 선수 통계 모달 | default |
| `src/domains/shop/components/PurchaseModal.tsx` | 구매 확인 모달 | bottomSheet |
여백 확인
| `src/domains/settings/components/profile/NicknameChangeModal.tsx` | 닉네임 변경 | bottomSheet |

---

## 미사용 (슬라이드 드로어) - 4곳 (보류)

슬라이드 애니메이션이 필요하여 Dialog로 마이그레이션 보류. 별도 Drawer 컴포넌트 개발 검토.

| 파일 | 용도 | 마이그레이션 난이도 |
|-----|------|--------------------|
| `src/domains/notifications/components/MobileNotificationModal.tsx` | 모바일 알림 | 높음 (Drawer 필요) |
| `src/domains/layout/components/MobileHamburgerModal.tsx` | 모바일 메뉴 | 높음 (Drawer 필요) |
| `src/domains/layout/components/navigation/MobileBoardModal.tsx` | 게시판 선택 | 높음 (Drawer 필요) |
| `src/domains/layout/components/livescoremodal/LiveScoreModalClient.tsx` | 라이브스코어 | 높음 (Drawer 필요) |

---

## 사용 예시

### 기본 Dialog (센터 모달)

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
      <Button variant="secondary">취소</Button>
      <Button variant="primary">확인</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 바텀시트 Dialog (모바일: 바텀시트, 데스크탑: 센터 모달)

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent variant="bottomSheet">
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
      <DialogCloseButton />
    </DialogHeader>
    <DialogBody>
      {/* 내용 */}
    </DialogBody>
    <DialogFooter>
      <Button variant="secondary" className="flex-1">취소</Button>
      <Button variant="primary" className="flex-1">확인</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Controlled Dialog (외부 상태 제어)

```tsx
const [isOpen, setIsOpen] = useState(false);

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    {/* ... */}
  </DialogContent>
</Dialog>
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|-----|----------|
| 2026-01-19 | `bottomSheet` variant 추가 |
| 2026-01-19 | 5개 모달 마이그레이션 완료 (HotdealEndButton, AccountDeleteForm, PlayerStatsModal, PurchaseModal, NicknameChangeModal) |
| 2026-01-19 | 슬라이드 드로어 4개 보류 결정 |
| 2026-01-19 | 초기 문서 작성 |
