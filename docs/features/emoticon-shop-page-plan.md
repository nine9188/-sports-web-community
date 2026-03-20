# 이모티콘 상점 페이지 연동 계획

## 목차

1. [개요](#1-개요)
2. [현재 상점 시스템 분석](#2-현재-상점-시스템-분석)
3. [설계 방향](#3-설계-방향)
4. [DB 데이터 등록](#4-db-데이터-등록)
5. [서버 액션](#5-서버-액션)
6. [상점 페이지 변경](#6-상점-페이지-변경)
7. [이모티콘 팩 카드](#7-이모티콘-팩-카드)
8. [팩 상세 모달](#8-팩-상세-모달)
9. [관리자 기능](#9-관리자-기능)
10. [구현 체크리스트](#10-구현-체크리스트)

---

## 1. 개요

`/shop` 페이지에서 "이모티콘" 카테고리 탭 선택 시, 이모티콘 팩을 전용 UI로 표시한다.
기존 팀 로고 아이템과 다른 구조이므로 **카테고리별 조건부 렌더링**으로 처리한다.

### 핵심 원칙

- 기존 `CategoryFilter` + `ItemGrid` 구조는 그대로 유지
- 이모티콘 카테고리일 때만 `EmoticonPackGrid` 로 교체 렌더링
- 구매 플로우는 기존 `purchaseItem` RPC 100% 재활용
- **트리거 사용 금지** — 모든 데이터 조회는 서버 액션에서 직접 JOIN/쿼리

---

## 2. 현재 상점 시스템 분석

### 2-1. 데이터 흐름

```
[서버] shop/page.tsx (Server Component)
  ├── getShopCategories()           → 전체 카테고리 목록
  ├── getCategoryItemsPaginated()   → 전체 아이템 (500개 한번에)
  ├── getUserPoints()               → 유저 포인트
  └── getUserItems()                → 유저 보유 아이템 ID 목록
         ↓
[클라이언트] CategoryFilter (Client Component)
  ├── 카테고리 탭으로 클라이언트 필터링
  ├── 30개씩 페이지네이션
  └── ItemGrid → ItemCard → PurchaseModal
```

### 2-2. 카테고리 현황

| slug | name | parent_id | item_count |
|------|------|-----------|------------|
| `emoticon-packs` | 이모티콘 | null | **0** |
| `premier-league-teams` | 프리미어리그 팀 | null | 20 |
| `k-league-teams` | K리그 팀 | null | 12 |
| `laliga-teams` | 라리가 팀 | null | 20 |
| ... | ... | ... | ... |
| `special-items` | 특수 아이템 | null | 1 |

- `emoticon-packs` (id=25)는 display_order=5로 **가장 먼저** 표시됨
- 현재 이 카테고리에 shop_items가 없음 → 유료 팩 등록 필요

### 2-3. 팀 로고 아이템 vs 이모티콘 팩

| 항목 | 팀 로고 | 이모티콘 팩 |
|------|---------|------------|
| shop_items 1개 = | 아이콘 이미지 1장 | 이모티콘 N개 묶음 |
| 가격 | 3000P 균일 | 팩마다 다름 |
| 미리보기 | 이미지 1장 | 이모티콘 그리드 필요 |
| 메타데이터 | name만 | 제작자, 설명, 이모티콘 수 |
| 구매 후 | 프로필 아이콘 | 이모티콘 피커에서 사용 |
| 무료 | 없음 (is_default만) | 기본 무료 팩 존재 |
| 카드 UI | 작은 아이콘 + 이름 | 큰 썸네일 + 이름 + 수량 |

→ **같은 ItemCard로는 표현 불가**, 전용 카드 필요

---

## 3. 설계 방향

### 3-1. 조건부 렌더링 전략

```typescript
// CategoryFilter.tsx 내부
const isEmoticonCategory = activeCategory === String(EMOTICON_CATEGORY_ID);

return (
  <>
    {/* 카테고리 탭 (공통) */}
    <CategoryTabs ... />

    {/* 조건부 렌더링 */}
    {isEmoticonCategory ? (
      <EmoticonPackGrid
        userItems={userItems}
        userPoints={userPoints}
        userId={userId}
      />
    ) : (
      <ItemGrid items={paginatedItems} ... />
    )}

    {/* 페이지네이션 (이모티콘이 아닐 때만) */}
    {!isEmoticonCategory && <Pagination ... />}
  </>
);
```

### 3-2. 이모티콘 팩 데이터 소스

이모티콘 카테고리 선택 시 shop_items가 아닌 **emoticon_packs 테이블에서 직접** 팩 데이터를 가져온다.

이유:
- shop_items에는 유료 팩만 있음 (무료 팩은 shop_item_id = NULL)
- 이모티콘 수, 제작자, 설명 등은 emoticon_packs에만 존재
- 무료/유료 팩을 모두 한 화면에 보여줘야 함

```
[기존 플로우]  shop_items → ItemGrid → ItemCard
[이모티콘]     emoticon_packs (서버 액션) → EmoticonPackGrid → EmoticonPackCard
```

### 3-3. 구매 플로우 재활용

```
EmoticonPackCard 클릭
  → PackDetailModal 열림 (이모티콘 미리보기)
  → "구매하기" 클릭
  → PurchaseModal 열림 (기존 컴포넌트 재활용)
  → purchaseItem(shop_item_id) RPC 호출
  → 성공 시 상태 갱신
```

---

## 4. DB 데이터 등록

### 4-1. 유료 이모티콘 팩을 shop_items에 등록

유료 팩을 판매하려면 shop_items에 해당 팩의 상품을 만들어야 한다.
이모티콘 팩 생성 워크플로우:

```
1. [admin] shop_items에 상품 생성
   → name: "동물 이모티콘 팩"
   → description: "귀여운 동물 이모티콘 24개"
   → image_url: pack_thumbnail URL
   → price: 500
   → category_id: 25 (emoticon-packs)
   → is_consumable: false
   → tier: 'common'

2. [admin] emoticon_packs에 이모티콘들 등록
   → shop_item_id: (1에서 생성된 id)
   → pack_id: 'animal'
   → pack_name: '동물'
   → 각 이모티콘 row 삽입
```

### 4-2. 자동화는 하지 않음

- admin에서 수동 등록 (트리거 없음)
- shop_items 생성 → emoticon_packs에 shop_item_id 연결
- 무료 팩은 shop_items에 등록할 필요 없음 (shop_item_id = NULL)

---

## 5. 서버 액션

### 파일: `src/domains/boards/actions/emoticons.ts` (기존 확장)

#### 신규: 상점 페이지용 팩 목록

```typescript
/**
 * 상점 페이지용 이모티콘 팩 목록
 * - 무료 팩 + 유료 팩 모두 포함
 * - 이모티콘 수, 제작자, 설명 포함
 * - 유저 보유 여부 포함
 */
export async function getEmoticonPacksForShopPage(): Promise<{
  packs: EmoticonPackInfo[]
  ownedItemIds: number[]
  userPoints: number
  isLoggedIn: boolean
  userId: string | null
}>
```

이 액션은 기존 `getEmoticonShopData()`와 거의 동일하지만, 상점 페이지 컨텍스트에서 호출된다.
→ 사실상 `getEmoticonShopData()`를 재활용하면 됨.

---

## 6. 상점 페이지 변경

### 6-1. `shop/page.tsx` 변경 사항

서버 컴포넌트에서 이모티콘 카테고리 ID를 prop으로 전달:

```typescript
// 이모티콘 카테고리 ID 찾기
const emoticonCategory = categories.find(c => c.slug === 'emoticon-packs');
const emoticonCategoryId = emoticonCategory?.id ?? null;

<CategoryFilter
  ...기존 props
  emoticonCategoryId={emoticonCategoryId}   // 신규
/>
```

### 6-2. `CategoryFilter.tsx` 변경 사항

```typescript
interface CategoryFilterProps {
  // ... 기존 props
  emoticonCategoryId?: number | null  // 신규
}

// 내부 로직
const isEmoticonCategory = emoticonCategoryId != null
  && activeCategory === String(emoticonCategoryId);
```

조건부 렌더링:

```tsx
{isEmoticonCategory ? (
  <EmoticonShopSection
    userId={userId}
    userItems={userItems}
    userPoints={userPoints}
  />
) : (
  <>
    <ItemGrid items={paginatedItems} ... />
    <Pagination ... />
  </>
)}
```

### 6-3. 이모티콘 카테고리 선택 시 동작

1. "이모티콘" 탭 클릭
2. `activeCategory`가 이모티콘 카테고리 ID로 설정
3. `isEmoticonCategory = true`
4. `ItemGrid` 대신 `EmoticonShopSection` 렌더링
5. `EmoticonShopSection`이 자체적으로 `getEmoticonShopData()` 호출
6. 팩 카드 그리드 표시

→ 기존 팀 로고 아이템 필터링 로직에 영향 없음

---

## 7. 이모티콘 팩 카드

### 7-1. EmoticonShopSection 컴포넌트

```
파일: src/domains/shop/components/EmoticonShopSection.tsx
```

**구조:**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  🔍 이모티콘 팩 검색...                           │ ← 검색 input (옵션)
│                                                  │
│  [전체] [무료] [유료]                              │ ← 서브 필터
│                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ...     │
│  │         │  │         │  │         │           │
│  │ [썸네일] │  │ [썸네일] │  │ [썸네일] │           │ ← 팩 카드 그리드
│  │         │  │         │  │         │           │    grid-cols-2 sm:3 md:4 lg:5
│  │ 기본    │  │ 스포츠  │  │ 동물    │           │
│  │ 48개    │  │ 24개    │  │ 20개    │           │
│  │ 무료    │  │ 무료    │  │ 500 P   │           │
│  └─────────┘  └─────────┘  └─────────┘           │
│                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ...     │
│  │         │  │         │  │         │           │
│  │ [썸네일] │  │ [썸네일] │  │ [썸네일] │           │
│  │         │  │         │  │         │           │
│  │ 음식    │  │ 직장    │  │ 시즌    │           │
│  │ 18개    │  │ 22개    │  │ 12개    │           │
│  │ 300 P   │  │ 400 P   │  │ 200 P   │           │
│  └─────────┘  └─────────┘  └─────────┘           │
│                                                  │
│  ◀ 1 2 3 ▶                                       │ ← 페이지네이션 (팩 많을 때)
│                                                  │
└──────────────────────────────────────────────────┘
```

### 7-2. EmoticonPackCard 컴포넌트

```
파일: src/domains/shop/components/EmoticonPackCard.tsx
```

기존 `ItemCard`와 다른 전용 카드:

```
┌──────────────────────┐
│                      │
│     ┌──────────┐     │
│     │          │     │
│     │ [썸네일]  │     │  ← 큰 썸네일 (w-16 h-16 md:w-20 md:h-20)
│     │          │     │     bg-[#F5F5F5] dark:bg-[#262626] 원형/사각 배경
│     └──────────┘     │
│                      │
│     팩 이름           │  ← text-sm font-medium, 중앙 정렬
│     24개 이모티콘     │  ← text-xs text-gray-500
│                      │
│  ┌────────────────┐  │
│  │  무료 ✓        │  │  ← 무료 팩: 초록 뱃지
│  │  500 P         │  │  ← 유료 팩: 가격 표시
│  │  보유중 ✓      │  │  ← 구매 완료: 파란 뱃지
│  └────────────────┘  │
│                      │
└──────────────────────┘
```

**카드 클릭 → 팩 상세 모달 열림**

### 7-3. 카드 상태별 스타일

| 상태 | 뱃지 | 스타일 |
|------|------|--------|
| 무료 | `무료 ✓` | `text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20` |
| 보유중 | `보유중 ✓` | `text-blue-500 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20` |
| 미보유 (구매 가능) | `500 P` | `text-gray-900 dark:text-[#F0F0F0] font-semibold tabular-nums` |
| 미보유 (포인트 부족) | `500 P` | 동일 + 클릭 시 모달에서 부족 표시 |

---

## 8. 팩 상세 모달

### 8-1. PackDetailModal 컴포넌트

```
파일: src/domains/shop/components/EmoticonPackDetailModal.tsx
```

기존 `Dialog` + `bottomSheet` variant 사용:

```
┌──────────────────────────────────────────────┐
│  팩 상세                              [닫기] │ ← DialogHeader
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ [대형 썸네일]    팩이름               │    │ ← 팩 헤더 카드
│  │                 제작: OOO            │    │
│  │                 24개 이모티콘         │    │
│  │                 설명 텍스트...        │    │
│  └──────────────────────────────────────┘    │
│                                              │ ← DialogBody (스크롤)
│  이모티콘 미리보기                             │
│  ┌────┬────┬────┬────┬────┬────┐            │
│  │ 😀 │ 😉 │ 😍 │ 😂 │ 😎 │ 😜 │            │ ← 6열 그리드
│  ├────┼────┼────┼────┼────┼────┤            │
│  │ 😊 │ 🥳 │ 😭 │ 😢 │ 😡 │ 😱 │            │
│  └────┴────┴────┴────┴────┴────┘            │
│                                              │
├──────────────────────────────────────────────┤
│  500 P                       [구매하기]      │ ← DialogFooter
│                               [보유중 ✓]     │
└──────────────────────────────────────────────┘
```

### 8-2. 구매 플로우

```
PackDetailModal "구매하기" 클릭
  → PurchaseModal 열림 (기존 shop 컴포넌트 재활용)
     → 기존 포인트 계산 UI
     → purchaseItem(shop_item_id) 호출
     → 성공 시:
        ① PurchaseModal 닫힘
        ② PackDetailModal에서 "보유중" 상태로 갱신
        ③ EmoticonPackCard도 "보유중" 상태로 갱신
```

### 8-3. 기존 PurchaseModal 재활용 방법

```typescript
// EmoticonPackDetailModal 내부
const [showPurchaseModal, setShowPurchaseModal] = useState(false);

// PurchaseModal에 넘길 ShopItem 변환
const shopItem: ShopItem = {
  id: pack.shop_item_id!,
  name: `${pack.pack_name} 이모티콘 팩`,
  description: pack.pack_description,
  image_url: pack.pack_thumbnail,
  price: pack.price || 0,
  category_id: emoticonCategoryId,
  is_default: null,
  is_active: true,
  created_at: null,
};
```

---

## 9. 관리자 기능

### 9-1. 이모티콘 팩 등록 워크플로우 (수동)

현재 admin shop 관리 페이지에서 아이템을 생성할 수 있으므로:

```
1. /admin/shop에서 shop_item 생성
   - 카테고리: "이모티콘" 선택
   - 이름: "동물 이모티콘 팩"
   - 이미지: 대표 이모티콘 썸네일
   - 가격: 500

2. Supabase 대시보드에서 emoticon_packs에 이모티콘 데이터 삽입
   - shop_item_id: (1에서 생성된 id)
   - pack_id: 'animal'
   - 각 이모티콘 row
```

### 9-2. 향후 개선 (스코프 밖)

- admin에서 이모티콘 팩 전용 관리 페이지
- 이미지 업로드 → emoticon_packs 자동 삽입
- 팩 활성/비활성 토글

---

## 10. 구현 체크리스트

### Phase 1: 컴포넌트 구현

- [ ] `EmoticonPackCard.tsx` — 팩 카드 컴포넌트
- [ ] `EmoticonPackDetailModal.tsx` — 팩 상세 모달 (Dialog bottomSheet)
- [ ] `EmoticonShopSection.tsx` — 상점 페이지 이모티콘 섹션

### Phase 2: 상점 페이지 연동

- [ ] `shop/page.tsx` — emoticonCategoryId prop 추가
- [ ] `CategoryFilter.tsx` — 이모티콘 카테고리 조건부 렌더링
- [ ] URL 파라미터 연동 (`/shop?cat=25`)

### Phase 3: 이모티콘 피커 연동

- [ ] 피커 상점 뷰의 "이모티콘 상점 바로가기" → `/shop?cat=25`
- [ ] 구매 완료 시 피커 데이터 갱신

### Phase 4: 테스트

- [ ] 무료 팩 표시 확인
- [ ] 유료 팩 구매 플로우 (포인트 충분/부족)
- [ ] 이미 보유한 팩 상태 표시
- [ ] 모바일/데스크톱 반응형
- [ ] 다크모드

---

## 부록: 파일 구조

```
src/domains/shop/components/
├── CategoryFilter.tsx         ← 수정 (이모티콘 분기 추가)
├── EmoticonShopSection.tsx    ← 신규
├── EmoticonPackCard.tsx       ← 신규
├── EmoticonPackDetailModal.tsx ← 신규
├── ItemCard.tsx               ← 변경 없음
├── ItemGrid.tsx               ← 변경 없음
├── PurchaseModal.tsx          ← 재활용 (변경 없음)
└── ShopCategoryCard.tsx       ← 변경 없음

src/app/(site)/shop/
├── page.tsx                   ← 수정 (emoticonCategoryId 전달)
```
