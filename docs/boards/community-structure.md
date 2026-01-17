# 커뮤니티 게시판 구조

## 개요

"커뮤니티"는 네비게이션에서 그룹핑용 라벨이며, 실제 DB에는 존재하지 않는다.
(현재 "스포츠" 라벨 아래 해외축구, 국내축구가 묶여있는 것과 동일한 구조)

---

## 구조 설명

```
[Nav: 커뮤니티] ← 네비게이션 전용 라벨 (DB에 없음)
├── 자유게시판   ← 최상위 게시판 (parent_id: null)
│   ├── 자유
│   ├── 유머
│   └── ...
├── 핫딜         ← 최상위 게시판 (parent_id: null)
│   ├── 먹거리
│   └── ...
└── ...
```

---

## 1. 자유게시판

### 최상위 게시판

| 항목 | 값 |
|------|-----|
| name | 자유게시판 |
| slug | free |
| parent_id | null |
| display_order | 60 |

### 하위 게시판

| order | name | slug | parent_slug | 설명 |
|-------|------|------|-------------|------|
| 0 | 자유 | free-talk | free | 자유로운 주제 |
| 1 | 유머 | humor | free | 유머/웃긴글 |
| 2 | 이슈 | issue | free | 이슈/화제 |
| 3 | 질문 | qna | free | 질문과 답변 |
| 4 | 정보/팁 | tips | free | 유용한 정보 |

---

## 2. 핫딜

### 최상위 게시판

| 항목 | 값 |
|------|-----|
| name | 핫딜 |
| slug | hotdeal |
| parent_id | null |
| display_order | 61 |

### 하위 게시판

| order | name | slug | parent_slug | 설명 |
|-------|------|------|-------------|------|
| 0 | 먹거리 | hotdeal-food | hotdeal | 식품/배달/외식 |
| 1 | SW/게임 | hotdeal-game | hotdeal | 소프트웨어/게임 |
| 2 | PC제품 | hotdeal-pc | hotdeal | PC/주변기기 |
| 3 | 가전제품 | hotdeal-appliance | hotdeal | 가전/전자제품 |
| 4 | 생활용품 | hotdeal-living | hotdeal | 생활/주방용품 |
| 5 | 의류 | hotdeal-fashion | hotdeal | 패션/의류 |
| 6 | 세일정보 | hotdeal-sale | hotdeal | 세일/할인행사 |
| 7 | 화장품 | hotdeal-beauty | hotdeal | 화장품/뷰티 |
| 8 | 모바일/상품권 | hotdeal-mobile | hotdeal | 모바일/상품권 |
| 9 | 패키지/이용권 | hotdeal-package | hotdeal | 여행/이용권 |
| 10 | 쿠폰/할인코드 | hotdeal-coupon | hotdeal | 쿠폰/프로모션 코드 |
| 11 | 앱테크 | hotdeal-apptech | hotdeal | 앱테크/포인트 |
| 12 | 스포츠 | hotdeal-sports | hotdeal | 스포츠용품/티켓 |
| 13 | 해외핫딜 | hotdeal-overseas | hotdeal | 해외직구/핫딜 |
| 14 | 기타 | hotdeal-etc | hotdeal | 기타 핫딜 |

---

## 3. 자유마켓

### 최상위 게시판

| 항목 | 값 |
|------|-----|
| name | 자유마켓 |
| slug | market |
| parent_id | null |
| display_order | 62 |

### 하위 게시판

| order | name | slug | parent_slug | 설명 |
|-------|------|------|-------------|------|
| 0 | 자유 | market-free | market | 자유 거래글 |
| 1 | 후기 | market-review | market | 거래 후기 |
| 2 | 일반딜 | market-deal | market | 일반 딜 |
| 3 | 클릭딜 | market-click | market | 클릭딜 |
| 4 | 나눔 | market-share | market | 무료 나눔 |
| 5 | 응모/추첨 | market-lottery | market | 응모/추첨 이벤트 |
| 6 | 퀴즈 | market-quiz | market | 퀴즈 이벤트 |
| 7 | 알리 | market-ali | market | 알리익스프레스 |
| 8 | 공동구매 | market-groupbuy | market | 공동구매 모집 |
| 9 | 교환 | market-exchange | market | 물물교환 |
| 10 | 판매 | market-sell | market | 판매글 |
| 11 | 구매 | market-buy | market | 구매글 |

---

## 4. 인증/후기

### 최상위 게시판

| 항목 | 값 |
|------|-----|
| name | 인증/후기 |
| slug | review |
| parent_id | null |
| display_order | 63 |

### 하위 게시판

| order | name | slug | parent_slug | 설명 |
|-------|------|------|-------------|------|
| 0 | 구매인증 | review-purchase | review | 구매 인증샷 |
| 1 | 직관인증 | review-stadium | review | 경기장 직관 인증 |
| 2 | 일반후기 | review-general | review | 기타 후기 |

---

## 5. 창작

### 최상위 게시판

| 항목 | 값 |
|------|-----|
| name | 창작 |
| slug | creative |
| parent_id | null |
| display_order | 64 |

### 하위 게시판

| order | name | slug | parent_slug | 설명 |
|-------|------|------|-------------|------|
| 0 | 팬아트 | creative-fanart | creative | 팬아트/그림 |
| 1 | 움짤제작 | creative-gif | creative | 움짤/짤 제작 |
| 2 | 영상 | creative-video | creative | 영상 제작 |

---

## 네비게이션 구현

### BoardNavigationClient.tsx 수정 필요

```typescript
// createNavBoards() 함수에 추가
{
  id: 'nav-community',
  name: '커뮤니티',
  slug: 'free', // 클릭 시 자유게시판으로 이동
  parent_id: null,
  display_order: 60,
  children: [
    // 실제 boards에서 free, hotdeal, market, review, creative 찾아서 매핑
  ]
}
```

### EXCLUDED_BOARD_SLUGS에 추가

```typescript
const EXCLUDED_BOARD_SLUGS = [
  // 기존...
  'free', 'hotdeal', 'market', 'review', 'creative'
];
```

---

## 총 게시판 수

| 카테고리 | 최상위 | 하위 | 합계 |
|----------|--------|------|------|
| 자유게시판 | 1 | 5 | 6 |
| 핫딜 | 1 | 15 | 16 |
| 자유마켓 | 1 | 12 | 13 |
| 인증/후기 | 1 | 3 | 4 |
| 창작 | 1 | 3 | 4 |
| **총합** | **5** | **38** | **43** |

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2025-01-14 | 최초 문서 작성 |
| 2025-01-14 | 구조 수정 - 커뮤니티를 nav 라벨로 변경 |
