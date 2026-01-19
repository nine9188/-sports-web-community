# Pagination 컴포넌트 사용 현황

> 최종 업데이트: 2026-01-19

## 개요

`src/shared/components/ui/pagination.tsx` - URL 모드와 버튼 모드를 지원하는 페이지네이션 컴포넌트.

---

## ✅ 마이그레이션 완료

**ShopPagination → 공유 Pagination 마이그레이션 완료** (2026-01-19)

---

## 사용 중 (12곳)

| 파일 | 용도 | 모드 |
|-----|------|------|
| `src/app/user/[publicId]/UserActivityTabs.tsx` | 사용자 활동 | button |
| `src/domains/search/components/SearchResultsContainer.tsx` | 검색 결과 | url |
| `src/domains/livescore/components/football/player/tabs/PlayerFixtures.tsx` | 선수 경기 일정 | button |
| `src/app/settings/my-posts/page.tsx` | 내 게시글 | url |
| `src/app/settings/my-comments/page.tsx` | 내 댓글 | url |
| `src/domains/boards/components/layout/BoardDetailLayout.tsx` | 게시판 상세 | url |
| `src/domains/boards/components/layout/PostDetailLayout.tsx` | 게시글 상세 | url |
| `src/domains/livescore/components/football/transfers/TransfersPageContent.tsx` | 이적 목록 | url |
| `src/app/shop/page.tsx` | 샵 메인 | url |
| `src/app/shop/[category]/page.tsx` | 샵 카테고리 | url |

---

## 삭제됨

- ~~`src/domains/shop/components/ShopPagination.tsx`~~ (삭제)
- ~~`src/domains/settings/components/my-posts/PostsPagination.tsx`~~ (삭제)
- ~~`src/domains/settings/components/my-comments/PostsPagination.tsx`~~ (삭제)
- ~~`src/domains/search/components/Pagination.tsx`~~ (삭제)

---

## 사용 예시

```tsx
import { Pagination } from '@/shared/components/ui';

// URL 모드 (Link 사용, 서버 컴포넌트 호환)
<Pagination
  currentPage={1}
  totalPages={10}
  mode="url"
/>

// 버튼 모드 (콜백 사용, 클라이언트 컴포넌트)
<Pagination
  currentPage={page}
  totalPages={total}
  onPageChange={setPage}
  mode="button"
/>
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|-----|----------|
| 2026-01-19 | 초기 문서 작성 |
