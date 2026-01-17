# 핫딜 시스템 문서

## 📋 목차
- [개요](#개요)
- [시스템 구조](#시스템-구조)
- [데이터베이스 설계](#데이터베이스-설계)
- [컴포넌트](#컴포넌트)
- [서버 액션](#서버-액션)
- [타입 & 유틸리티](#타입--유틸리티)
- [UI 사용 가이드](#ui-사용-가이드)
- [문제 해결](#문제-해결)

---

## 개요

핫딜 시스템은 쇼핑몰 특가 정보를 공유하는 게시판 기능입니다. 일반 게시판과 달리 **쇼핑몰, 상품명, 가격, 배송비, 외부 링크** 등 정형화된 정보를 구조화하여 표시합니다.

### 주요 기능

- ✅ **핫딜 정보 등록**: 상품명, 가격, 할인율, 배송비, 쇼핑몰 URL
- ✅ **자동 감지**: URL 입력 시 쇼핑몰 자동 감지
- ✅ **종료 관리**: 품절/마감 등 사유별 종료 처리
- ✅ **쇼핑몰 필터**: 쇼핑몰별 핫딜 필터링
- ✅ **리스트 표시**: 종료된 핫딜 `[종료]` 배지 + 취소선 표시
- ✅ **상세 정보**: 테이블 형태로 깔끔한 정보 표시

### 참고 UI

펨코(fmkorea) 핫딜 게시판 UI/UX를 참고하여 구현했습니다.

---

## 시스템 구조

### 디렉토리 구조

```
src/domains/boards/
├── components/
│   └── hotdeal/                       # 핫딜 전용 컴포넌트
│       ├── index.ts                   # 재export
│       ├── HotdealInfoBox.tsx         # ✅ 상세페이지 정보 박스
│       ├── HotdealFormFields.tsx      # ✅ 글쓰기 폼 필드
│       ├── HotdealEndButton.tsx       # ✅ 종료 버튼 + 모달
│       └── StoreFilterMenu.tsx        # ✅ 쇼핑몰 필터 메뉴
│
├── actions/
│   └── hotdeal/                       # 핫딜 전용 서버 액션
│       ├── index.ts                   # 재export
│       └── endDeal.ts                 # ✅ 핫딜 종료 처리
│
├── types/
│   └── hotdeal/                       # 핫딜 전용 타입
│       ├── index.ts                   # 재export
│       ├── deal-info.ts               # ✅ DealInfo 인터페이스
│       └── constants.ts               # ✅ 쇼핑몰/배송비 상수
│
└── utils/
    └── hotdeal/                       # 핫딜 전용 유틸리티
        ├── index.ts                   # 재export
        ├── format.ts                  # ✅ 가격 포맷팅, 할인율
        ├── detect.ts                  # ✅ 쇼핑몰 감지, 제목 태그
        └── validation.ts              # ✅ deal_info 유효성 검사
```

### 데이터 흐름

```
[사용자 입력]
    ↓
[HotdealFormFields] → URL 자동 감지 → 쇼핑몰 선택
    ↓
[createPost] → deal_info JSONB 저장
    ↓
[Supabase posts 테이블]
    ↓
[getPosts] → deal_info 포함 조회
    ↓
[PostList] → 종료 상태 확인 → [종료] 배지
    ↓
[PostDetail] → [HotdealInfoBox] → 정보 테이블 표시
```

---

## 데이터베이스 설계

### posts 테이블 확장

`posts` 테이블에 `deal_info` JSONB 컬럼 추가:

```sql
ALTER TABLE posts ADD COLUMN deal_info JSONB DEFAULT NULL;

-- 인덱스 (검색 성능 향상)
CREATE INDEX idx_posts_deal_info ON posts USING GIN (deal_info)
WHERE deal_info IS NOT NULL;
```

### DealInfo 구조

```typescript
interface DealInfo {
  store: string;           // 쇼핑몰 (네이버, 쿠팡, G마켓 등)
  product_name: string;    // 상품명
  price: number;           // 판매가 (숫자)
  original_price?: number; // 정가 (선택, 할인율 계산용)
  shipping: string;        // 배송비 ("무료", "3,000원" 등)
  deal_url: string;        // 외부 링크
  is_ended: boolean;       // 종료 여부 (품절/마감)
  ended_at?: string;       // 종료 시간 (ISO 날짜)
  ended_reason?: string;   // 종료 사유 ("품절", "마감", "가격변동" 등)
}
```

### 쇼핑몰 필터링 쿼리

```typescript
// 쇼핑몰별 필터링
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('deal_info->>store', '쿠팡');  // JSONB 연산자

// 종료되지 않은 핫딜만
const { data } = await supabase
  .from('posts')
  .select('*')
  .not('deal_info', 'is', null)
  .eq('deal_info->>is_ended', 'false');
```

---

## 컴포넌트

### 1. HotdealInfoBox

**위치**: `src/domains/boards/components/hotdeal/HotdealInfoBox.tsx`

**용도**: 상세페이지에서 핫딜 정보를 테이블 형태로 표시

**Props**:
```typescript
interface HotdealInfoBoxProps {
  dealInfo: DealInfo;
  postId: string;
  isAuthor: boolean;
}
```

**주요 기능**:
- 링크, 쇼핑몰, 상품명, 가격, 배송비 테이블 표시
- 정가가 있으면 할인율 표시 (`26%↓`)
- 종료된 핫딜: `🔴 종료됨` 배지 + 사유 표시
- 작성자: 종료 처리 버튼 표시

**UI 구성**:
```
┌─────────────────────────────────────────┐
│ [종료 처리] 버튼 (작성자만)              │
├─────────────────────────────────────────┤
│ 링크     │ https://coupang.com/...     │
│ 쇼핑몰   │ 쿠팡                         │
│ 상품명   │ LG 통돌이 세탁기 19kg        │
│ 가격     │ 11,900원 15,000원 20%↓      │
│ 배송     │ 무료배송                     │
└─────────────────────────────────────────┘
```

### 2. HotdealFormFields

**위치**: `src/domains/boards/components/hotdeal/HotdealFormFields.tsx`

**용도**: 글쓰기 폼에서 핫딜 정보 입력 필드 제공

**Props**:
```typescript
interface HotdealFormFieldsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  errors?: Record<string, any>;
}
```

**주요 기능**:
- URL 입력 시 쇼핑몰 자동 감지 (`detectStoreFromUrl`)
- React Hook Form 통합
- 유효성 검사 (필수 필드, URL 형식)

**필드 순서**:
1. 상품 링크 (URL) - 필수
2. 쇼핑몰 (자동 선택) - 필수
3. 상품명 - 필수
4. 판매가 - 필수
5. 정가 - 선택
6. 배송비 - 필수

### 3. HotdealEndButton

**위치**: `src/domains/boards/components/hotdeal/HotdealEndButton.tsx`

**용도**: 작성자가 핫딜을 종료 처리할 수 있는 버튼 + 모달

**Props**:
```typescript
interface HotdealEndButtonProps {
  postId: string;
}
```

**주요 기능**:
- 종료 사유 선택 (품절, 마감, 가격변동, 링크오류, 기타)
- 모달 UI (라디오 버튼)
- `endDeal` 서버 액션 호출
- 성공 시 toast 알림 + 페이지 갱신

**UI 구성**:
```
┌─────────────────────────────────┐
│ 핫딜 종료 처리                   │
├─────────────────────────────────┤
│ 종료 사유를 선택해주세요.        │
│                                  │
│ ○ 품절                          │
│ ● 마감                          │
│ ○ 가격 변동                     │
│ ○ 링크 오류                     │
│ ○ 기타                          │
│                                  │
│ [취소]  [종료 처리]              │
└─────────────────────────────────┘
```

### 4. StoreFilterMenu

**위치**: `src/domains/boards/components/hotdeal/StoreFilterMenu.tsx`

**용도**: 쇼핑몰별 핫딜 필터링 탭 메뉴

**Props**:
```typescript
interface StoreFilterMenuProps {
  boardSlug: string;
}
```

**주요 기능**:
- HoverMenu와 비슷한 스타일
- URL 쿼리 파라미터 기반 (`?store=쿠팡`)
- 전체 / 쇼핑몰별 탭
- 활성 탭 하이라이트

**UI 구성**:
```
┌─────────────────────────────────────────┐
│ [전체] [네이버] [쿠팡] [G마켓] [11번가]   │
│ [옥션] [위메프] [티몬] ...                │
└─────────────────────────────────────────┘
```

**통합 위치**: `BoardDetailLayout.tsx`에서 HoverMenu 아래에 표시

```tsx
{/* HoverMenu */}
<ClientHoverMenu {...} />

{/* 쇼핑몰 필터 - 핫딜 게시판일 때만 */}
{isHotdealBoard(slug) && (
  <StoreFilterMenu boardSlug={slug} />
)}
```

---

## 서버 액션

### endDeal

**위치**: `src/domains/boards/actions/hotdeal/endDeal.ts`

**용도**: 핫딜 종료 처리

**파라미터**:
```typescript
interface EndDealParams {
  postId: string;
  reason: '품절' | '마감' | '가격변동' | '링크오류' | '기타';
}
```

**동작 흐름**:
1. 로그인 확인
2. 게시글 조회 (작성자 확인)
3. 권한 체크 (작성자만 가능)
4. `deal_info` 업데이트:
   ```typescript
   {
     ...dealInfo,
     is_ended: true,
     ended_at: new Date().toISOString(),
     ended_reason: reason
   }
   ```
5. 로그 기록 (`logUserAction`)
6. 캐시 갱신 (`revalidatePath`)

**리턴값**:
```typescript
{ success: true } | { success: false, error: string }
```

---

## 타입 & 유틸리티

### 타입 정의

**위치**: `src/domains/boards/types/hotdeal/`

#### DealInfo (deal-info.ts)
```typescript
export interface DealInfo {
  store: string;
  product_name: string;
  price: number;
  original_price?: number;
  shipping: string;
  deal_url: string;
  is_ended: boolean;
  ended_at?: string;
  ended_reason?: '품절' | '마감' | '가격변동' | '링크오류' | '기타';
}
```

#### 상수 (constants.ts)
```typescript
// 인기 쇼핑몰 목록
export const POPULAR_STORES = [
  '네이버', '쿠팡', 'G마켓', '11번가', '옥션',
  '위메프', '티몬', 'SSG', '롯데온', '카카오',
  '알리익스프레스', '아마존', '기타'
] as const;

// 배송비 옵션
export const SHIPPING_OPTIONS = [
  '무료', '무배', '조건부 무료',
  '2,500원', '3,000원', '별도'
] as const;

// 핫딜 게시판 slug
export const HOTDEAL_BOARD_SLUGS = [
  'hotdeal', 'hotdeal-food', 'hotdeal-game',
  'hotdeal-pc', 'hotdeal-appliance', ...
] as const;

// 종료 사유
export const END_REASONS = [
  '품절', '마감', '가격변동', '링크오류', '기타'
] as const;
```

### 유틸리티 함수

**위치**: `src/domains/boards/utils/hotdeal/`

#### format.ts - 포맷팅

```typescript
// 가격 포맷팅
formatPrice(11160) // "11,160원"

// 할인율 계산
getDiscountRate(11160, 15000) // 26

// 배송비 포맷팅
formatShipping('무료') // "무료배송"
formatShipping('3000') // "배송비 3,000원"
```

#### detect.ts - 감지 및 태그

```typescript
// 쇼핑몰 자동 감지
detectStoreFromUrl('https://www.coupang.com/vp/products/123') // '쿠팡'

// 제목 태그 추가
addStoreTag('LG 통돌이 세탁기', '쿠팡') // '[쿠팡] LG 통돌이 세탁기'

// 제목 태그 제거
removeStoreTag('[쿠팡] LG 통돌이 세탁기') // 'LG 통돌이 세탁기'

// 핫딜 게시판 확인
isHotdealBoard('hotdeal-food') // true
isHotdealBoard('free') // false
```

#### validation.ts - 유효성 검사

```typescript
// DealInfo 유효성 검사
validateDealInfo({
  store: '쿠팡',
  product_name: 'LG 통돌이',
  price: 11900,
  shipping: '무료',
  deal_url: 'https://...'
}); // 에러 없으면 통과

// DealInfo 생성 (검증 포함)
const dealInfo = createDealInfo({ ... });

// URL 유효성 검사
isValidUrl('https://coupang.com') // true

// 가격 파싱
parsePrice('11,160원') // 11160
```

---

## UI 사용 가이드

### 1. 핫딜 글쓰기

**경로**: `/boards/hotdeal/create`

**순서**:
1. 제목 입력
2. **상품 링크 입력** → 쇼핑몰 자동 감지
3. 쇼핑몰 확인/수정
4. 상품명 입력
5. 판매가 입력
6. (선택) 정가 입력 → 할인율 자동 계산
7. 배송비 선택
8. 내용 작성 (TipTap 에디터)
9. 작성 완료

### 2. 핫딜 보기

**리스트 (BoardDetailLayout)**:
- 썸네일 이미지
- 제목 (종료된 경우 `[종료]` 배지 + 취소선)
- 쇼핑몰 | 가격 | 배송 메타 정보
- 할인율 표시 (정가가 있는 경우)

**상세 (PostDetail)**:
- 게시글 내용
- **HotdealInfoBox**: 정보 테이블
  - 링크 (클릭 가능)
  - 쇼핑몰, 상품명
  - 가격 (할인율 표시)
  - 배송비
- 종료 처리 버튼 (작성자만)

### 3. 쇼핑몰 필터링

**경로**: `/boards/hotdeal?store=쿠팡`

**사용법**:
1. HoverMenu 아래 StoreFilterMenu 표시
2. 쇼핑몰 탭 클릭
3. URL 쿼리 파라미터 업데이트
4. `getPosts`에서 `deal_info->>store` 필터링

### 4. 핫딜 종료

**작성자 전용**:
1. 상세페이지에서 `[종료 처리]` 버튼 클릭
2. 종료 사유 선택 (품절, 마감, 가격변동, 링크오류, 기타)
3. `[종료 처리]` 버튼 클릭
4. `endDeal` 서버 액션 호출
5. 성공 시:
   - `deal_info.is_ended = true`
   - `deal_info.ended_at = 현재 시간`
   - `deal_info.ended_reason = 선택한 사유`
6. 페이지 갱신 → `🔴 종료됨` 배지 표시

---

## 문제 해결

### Q1. 핫딜 정보가 표시되지 않아요

**원인**:
- `deal_info`가 null이거나 누락됨
- 데이터 변환 체인에서 `deal_info` 누락

**해결**:
1. `getPosts.ts`에서 `deal_info` 조회 확인:
   ```typescript
   .select('..., deal_info')
   ```
2. `formatPostData` → `convertApiPostsToLayoutPosts` 체인 확인
3. `PostDetail.tsx`에서 `deal_info` 존재 여부 체크:
   ```tsx
   {post.deal_info && <HotdealInfoBox dealInfo={post.deal_info} />}
   ```

### Q2. 쇼핑몰 자동 감지가 안 돼요

**원인**:
- URL 형식이 잘못됨
- `detectStoreFromUrl`에 해당 쇼핑몰 미등록

**해결**:
1. URL이 `https://`로 시작하는지 확인
2. `utils/hotdeal/detect.ts`에 쇼핑몰 추가:
   ```typescript
   if (hostname.includes('새쇼핑몰.com')) return '새쇼핑몰';
   ```

### Q3. 종료 처리가 안 돼요

**원인**:
- 권한 부족 (작성자가 아님)
- `deal_info`가 null

**해결**:
1. 작성자 확인: `post.user_id === user.id`
2. `deal_info` 존재 확인
3. 서버 액션 로그 확인:
   ```typescript
   console.log('[endDeal]', { postId, reason, post });
   ```

### Q4. 쇼핑몰 필터링이 안 돼요

**원인**:
- `store` 쿼리 파라미터가 전달되지 않음
- `getPosts`에서 필터링 로직 누락

**해결**:
1. `page.tsx`에서 `store` 추출 확인:
   ```typescript
   const { store } = await searchParams;
   ```
2. `fetchPosts`에 `store` 전달:
   ```typescript
   await fetchPosts({ ..., store });
   ```
3. `getPosts.ts`에서 필터링 로직 확인:
   ```typescript
   if (store) {
     postsQuery = postsQuery.eq('deal_info->>store', store);
   }
   ```

### Q5. 할인율이 이상해요

**원인**:
- 정가가 판매가보다 낮음
- 할인율 계산 오류

**해결**:
1. 유효성 검사 확인:
   ```typescript
   if (original_price < price) {
     throw new Error('정가는 판매가보다 높아야 합니다');
   }
   ```
2. 할인율 계산식:
   ```typescript
   Math.round((1 - price / originalPrice) * 100)
   ```

---

## 스타일 가이드

### 가격 표시

```tsx
{/* 판매가 */}
<span className="text-base font-bold text-red-600 dark:text-red-400">
  {formatPrice(dealInfo.price)}
</span>

{/* 정가 + 할인율 */}
{dealInfo.original_price && discountRate && (
  <>
    <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
      {formatPrice(dealInfo.original_price)}
    </span>
    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
      {discountRate}%↓
    </span>
  </>
)}
```

### 배송비 표시

```tsx
<span className={`text-sm ${
  dealInfo.shipping === '무료' || dealInfo.shipping === '무배'
    ? 'text-green-600 dark:text-green-400 font-medium'
    : 'text-gray-900 dark:text-[#F0F0F0]'
}`}>
  {formatShipping(dealInfo.shipping)}
</span>
```

### 종료 상태 표시

**리스트**:
```tsx
const titleText = isEnded ? `[종료] ${baseTitleText}` : baseTitleText;
const titleClassName = isEnded
  ? `${baseTitleClassName} line-through text-gray-400 dark:text-gray-500`
  : baseTitleClassName;
```

**상세페이지**:
```tsx
<div className="bg-[#F5F5F5] dark:bg-[#262626] px-4 py-3">
  <div className="flex items-center gap-3">
    <span className="text-sm px-3 py-1 rounded bg-[#EAEAEA] dark:bg-[#333333]">
      🔴 종료됨
    </span>
    <span className="text-sm text-gray-500 dark:text-gray-400">
      사유: {dealInfo.ended_reason || '알 수 없음'}
    </span>
  </div>
</div>
```

---

## 구현 체크리스트

### ✅ Phase 1: 기반 작업
- [x] DB 마이그레이션 (`deal_info` JSONB 컬럼)
- [x] 타입 정의 (`DealInfo`, 상수)
- [x] 유틸리티 함수 (포맷팅, 감지, 유효성 검사)

### ✅ Phase 2: 상세페이지
- [x] `HotdealInfoBox` 컴포넌트
- [x] 상세페이지 통합 (`PostDetail.tsx`)

### ✅ Phase 3: 글쓰기
- [x] `HotdealFormFields` 컴포넌트
- [x] URL 자동 감지 기능
- [x] 폼 통합 (`PostWriteForm.tsx`)
- [x] 서버 액션 수정 (`createPost.ts`)

### ✅ Phase 4: 리스트
- [x] 종료 상태 표시 (`[종료]` 배지 + 취소선)
- [x] 메타 정보 표시 (쇼핑몰/가격/배송)
- [x] Desktop/Mobile PostItem 통합

### ✅ Phase 5: 관리 기능
- [x] `HotdealEndButton` 컴포넌트 (종료 모달)
- [x] `endDeal` 서버 액션
- [x] 종료 상태 UI (상세페이지 배너)
- [ ] 종료 복구 기능 (`reopenDeal`) - 추후 구현

### ✅ Phase 6: 필터링
- [x] `StoreFilterMenu` 컴포넌트
- [x] 쇼핑몰별 필터링 (`?store=쿠팡`)
- [x] `getPosts`에 필터 로직 추가

### 🔄 Phase 7: 외부 API 연동 (계획)
- [ ] 쿠팡 파트너스 API
- [ ] 네이버 쇼핑 API
- [ ] 유사 상품 추천 (`RelatedProducts`)
- [ ] 내부 유사글 검색

---

## 추후 확장 계획

### 1. 가격 알림
- 특정 상품 가격 변동 시 알림
- 최저가 알림 설정

### 2. 자동 종료
- 외부 링크 크롤링으로 품절 감지
- 주기적인 가격 체크

### 3. 가격 히스토리
- 가격 변동 추적
- 차트로 시각화

### 4. 핫딜 랭킹
- 추천수/조회수 기반 HOT 핫딜
- 일간/주간 베스트 핫딜

### 5. 쇼핑몰 연동
- API로 상품 정보 자동 입력
- 썸네일 자동 가져오기

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-01-14 | 최초 문서 작성 |
| 2026-01-16 | Phase 1-6 구현 완료, StoreFilterMenu 추가, 컴포넌트 검토 및 문서 업데이트 |

---

**문서 작성일**: 2026-01-14
**최종 업데이트**: 2026-01-16
**버전**: 2.0.0
