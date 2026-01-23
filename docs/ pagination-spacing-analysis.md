# Pagination 컴포넌트 여백 분석

## 개요

모든 Pagination 사용처를 분석하여 위 컴포넌트와의 여백 처리 방식을 문서화합니다.

## pagination.tsx 기본 스타일

```tsx
// src/shared/components/ui/pagination.tsx:168
className={`flex items-center justify-center gap-1 px-4 ${borderClass} ${marginClass} ${className}`}
```

- **withMargin={true}**: `mt-4` 추가 (기본값 false)
- **py-2 제거** (2026-01-22): 여백은 외부에서 제어

---

## 파일별 분석

### 1. BoardDetailLayout.tsx

**위치**: `src/domains/boards/components/layout/BoardDetailLayout.tsx:282-307`

| 항목             | 값                                                                      |
| ---------------- | ----------------------------------------------------------------------- |
| 위 컴포넌트      | `<BoardSearchBar>` (mt-4) + 검색결과 표시 (mt-2)                        |
| Wrapper          | `<div className="flex items-center justify-between px-4 sm:px-0 mt-4">` |
| Pagination props | `withMargin={false}`                                                    |
| 컨테이너         | 없음 (space-y 없음)                                                     |
| **여백 합계**    | wrapper mt-4 (16px) = **16px** ✅                                       |

---

### 2. PostDetailLayout.tsx

**위치**: `src/domains/boards/components/layout/PostDetailLayout.tsx:389-399`

| 항목             | 값                                                 |
| ---------------- | -------------------------------------------------- |
| 위 컴포넌트      | `<MemoizedPostFooter withMargin={totalPages > 1}>` |
| Wrapper          | `<div className="px-4 sm:px-6 mt-4">`              |
| Pagination props | `withMargin={false}`                               |
| 컨테이너         | 없음                                               |
| **여백 합계**    | wrapper mt-4 (16px) = **16px** ✅                  |

---

### 3. SearchResultsContainer.tsx

**위치**: `src/domains/search/components/SearchResultsContainer.tsx:229-254`

| 항목             | 값                                               |
| ---------------- | ------------------------------------------------ |
| 위 컴포넌트      | `<div className="bg-white...">` (resultSections) |
| Wrapper          | 없음 (직접 사용)                                 |
| Pagination props | `withMargin={false}`                             |
| 컨테이너         | `<div className="space-y-4">`                    |
| **여백 합계**    | space-y-4 (16px) = **16px** ✅                   |

---

### 4. TransfersPageContent.tsx

**위치**: `src/domains/livescore/components/football/transfers/TransfersPageContent.tsx:617-624`

| 항목             | 값                                 |
| ---------------- | ---------------------------------- |
| 위 컴포넌트      | `<Container>` (이적 목록 테이블)   |
| Wrapper          | 없음 (직접 사용)                   |
| Pagination props | `withMargin={false}`               |
| 컨테이너         | `<div className="space-y-4 pb-0">` |
| **여백 합계**    | space-y-4 (16px) = **16px** ✅     |

---

### 5. my-posts/page.tsx

**위치**: `src/app/settings/my-posts/page.tsx:76-83`

| 항목             | 값                               |
| ---------------- | -------------------------------- |
| 위 컴포넌트      | `<MyPostsContent>`               |
| Wrapper          | `<div className="px-4 sm:px-6">` |
| Pagination props | `withMargin={false}`             |
| 컨테이너         | `<div className="space-y-4">`    |
| **여백 합계**    | space-y-4 (16px) = **16px** ✅   |

---

### 6. my-comments/page.tsx

**위치**: `src/app/settings/my-comments/page.tsx:72-79`

| 항목             | 값                               |
| ---------------- | -------------------------------- |
| 위 컴포넌트      | `<MyCommentsContent>`            |
| Wrapper          | `<div className="px-4 sm:px-6">` |
| Pagination props | `withMargin={false}`             |
| 컨테이너         | `<div className="space-y-4">`    |
| **여백 합계**    | space-y-4 (16px) = **16px** ✅   |

---

### 7. PlayerFixtures.tsx

**위치**: `src/domains/livescore/components/football/player/tabs/PlayerFixtures.tsx:420-426`

| 항목             | 값                               |
| ---------------- | -------------------------------- |
| 위 컴포넌트      | `<Container>` (리그별 경기 목록) |
| Wrapper          | 없음 (직접 사용)                 |
| Pagination props | `mode="button"`                  |
| 컨테이너         | `<div className="space-y-4">`    |
| **여백 합계**    | space-y-4 (16px) = **16px** ✅   |

---

### 8. UserActivityTabs.tsx

**위치**: `src/app/user/[publicId]/UserActivityTabs.tsx:59-64`

| 항목             | 값                                   |
| ---------------- | ------------------------------------ |
| 위 컴포넌트      | `<PostList>` (탭 콘텐츠)             |
| Wrapper          | 없음 (`<>` fragment)                 |
| Pagination props | `mode="button"`, `withMargin={true}` |
| 컨테이너         | 없음                                 |
| **여백 합계**    | withMargin mt-4 (16px) = **16px** ✅ |

---

### 9. notifications/page.tsx

**위치**: `src/app/notifications/page.tsx:335-345`

| 항목             | 값                                |
| ---------------- | --------------------------------- |
| 위 컴포넌트      | `<div>` (알림 목록 컨테이너)      |
| Wrapper          | `<div className="pb-4 mt-4">`     |
| Pagination props | `mode="button"`, `maxButtons={5}` |
| 컨테이너         | `<>` fragment                     |
| **여백 합계**    | wrapper mt-4 (16px) = **16px** ✅ |

---

### 10. ExpHistoryTable.tsx

**위치**: `src/domains/admin/components/exp/ExpHistoryTable.tsx:79`

| 항목             | 값                                   |
| ---------------- | ------------------------------------ |
| 위 컴포넌트      | `<div>` (테이블 wrapper)             |
| Wrapper          | 없음 (`<>` fragment 내부)            |
| Pagination props | `mode="button"`, `withMargin={true}` |
| 컨테이너         | 없음                                 |
| **여백 합계**    | withMargin mt-4 (16px) = **16px** ✅ |

---

### 11. PointManager.tsx

**위치**: `src/app/admin/points/components/PointManager.tsx:302-308`

| 항목             | 값                                   |
| ---------------- | ------------------------------------ |
| 위 컴포넌트      | `<div>` (테이블 wrapper)             |
| Wrapper          | 없음 (`<>` fragment 내부)            |
| Pagination props | `mode="button"`, `withMargin={true}` |
| 컨테이너         | 없음                                 |
| **여백 합계**    | withMargin mt-4 (16px) = **16px** ✅ |

---

### 12. FixturesTab.tsx (팀 경기일정)

**위치**: `src/domains/livescore/components/football/team/tabs/fixtures/FixturesTab.tsx:236-244`

| 항목             | 값                                  |
| ---------------- | ----------------------------------- |
| 위 컴포넌트      | `<Container>` (경기 테이블)         |
| Wrapper          | 없음                                |
| Pagination props | `className="mt-4 pt-0"`             |
| 컨테이너         | `<div>` (space-y 없음)              |
| **여백 합계**    | className mt-4 (16px) = **16px** ✅ |

---

### 13. shop/page.tsx

**위치**: `src/app/shop/page.tsx:137-143`

| 항목             | 값                                   |
| ---------------- | ------------------------------------ |
| 위 컴포넌트      | `<CategoryFilter>`                   |
| Wrapper          | 없음 (직접 사용)                     |
| Pagination props | `mode="url"`, `withMargin={true}`    |
| 컨테이너         | 없음                                 |
| **여백 합계**    | withMargin mt-4 (16px) = **16px** ✅ |

---

### 14. shop/[category]/page.tsx

**위치**: `src/app/shop/[category]/page.tsx:114-120`

| 항목             | 값                                   |
| ---------------- | ------------------------------------ |
| 위 컴포넌트      | `<CategoryFilter>`                   |
| Wrapper          | 없음 (직접 사용)                     |
| Pagination props | `mode="url"`, `withMargin={true}`    |
| 컨테이너         | 없음                                 |
| **여백 합계**    | withMargin mt-4 (16px) = **16px** ✅ |

---

### 15. ui/page.tsx (UI Showcase)

**위치**: `src/app/ui/page.tsx:807-812`

| 항목             | 값                                  |
| ---------------- | ----------------------------------- |
| 위 컴포넌트      | 데모 컨테이너                       |
| Wrapper          | `<div className="bg-[#F5F5F5]...">` |
| Pagination props | `mode="button"`                     |
| 컨테이너         | Section 내부 (space-y-4)            |
| **여백 합계**    | space-y-4 (16px) = **16px** ✅      |

---

### 16. PopularPageClient.tsx

**위치**: `src/app/boards/popular/PopularPageClient.tsx`

| 항목 | 값                                        |
| ---- | ----------------------------------------- |
| 구현 | `BoardDetailLayout` 사용                  |
| 비고 | BoardDetailLayout 내부 Pagination 사용 ✅ |

---

## 요약 테이블

| 파일                   | 방식              | 여백 | 상태 |
| ---------------------- | ----------------- | ---- | ---- |
| BoardDetailLayout      | wrapper mt-4      | 16px | ✅   |
| PostDetailLayout       | wrapper mt-4      | 16px | ✅   |
| SearchResultsContainer | space-y-4         | 16px | ✅   |
| TransfersPageContent   | space-y-4         | 16px | ✅   |
| my-posts               | space-y-4         | 16px | ✅   |
| my-comments            | space-y-4         | 16px | ✅   |
| PlayerFixtures         | space-y-4         | 16px | ✅   |
| UserActivityTabs       | withMargin={true} | 16px | ✅   |
| notifications          | wrapper mt-4      | 16px | ✅   |
| ExpHistoryTable        | withMargin={true} | 16px | ✅   |
| PointManager           | withMargin={true} | 16px | ✅   |
| FixturesTab            | className="mt-4"  | 16px | ✅   |
| shop/page              | withMargin={true} | 16px | ✅   |
| shop/[category]        | withMargin={true} | 16px | ✅   |
| ui/page                | space-y-4         | 16px | ✅   |
| PopularPageClient      | BoardDetailLayout | -    | ✅   |

---

## 표준 패턴

### space-y-4 컨테이너 내부 (권장)

```tsx
<div className="space-y-4">
  <Content />
  <Pagination withMargin={false} />
</div>
```

- space-y-4가 16px 상단 여백 제공

### 독립 사용

```tsx
<Content />
<Pagination withMargin={true} />
```

- withMargin이 mt-4 (16px) 제공

### 또는 wrapper 사용

```tsx
<div className="mt-4">
  <Pagination />
</div>
```

---

_최종 업데이트: 2026-01-22_
