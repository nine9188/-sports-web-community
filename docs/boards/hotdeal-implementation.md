# 핫딜 게시판 구현 계획

> ⚠️ **알림**: 이 문서는 초기 설계 문서입니다. 최신 구현 상태 및 사용 가이드는 **[hotdeal-system.md](./hotdeal-system.md)** 를 참고하세요.

## 개요

핫딜 게시판은 일반 게시판과 달리 **쇼핑몰, 가격, 배송비, 외부링크** 등 정형화된 정보를 표시해야 한다.
펨코(fmkorea) 핫딜 게시판 UI/UX를 참고하여 구현한다.

---

## 참고 UI 분석 (펨코 핫딜)

### 리스트 뷰

```
┌─────────────────────────────────────────────────────────────┐
│ ↑  [썸네일]  풀무원 워터루틴 생수 500ml, 80개  [2]          │
│ 5           쇼핑몰: 네이버멤버십 / 가격: 11,900원 / 배송: 무료 │
│             먹거리 / 18:51 / 월1이식                         │
├─────────────────────────────────────────────────────────────┤
│ ↑  [썸네일]  연세두유 무가당 고칼슘두유 24팩  [2]            │
│ 3           쇼핑몰: 딜러 / 가격: 6,900원 / 배송: 무배        │
│             먹거리 / 18:37 / 인과율                          │
└─────────────────────────────────────────────────────────────┘
```

**구성 요소**:
- 추천수 (왼쪽, 화살표 + 숫자)
- 썸네일 이미지
- 제목 + [댓글수]
- 메타 정보: `쇼핑몰` | `가격` | `배송`
- 하단 정보: `카테고리` | `시간` | `작성자`

### 상세 뷰

```
┌─────────────────────────────────────────────────────────────┐
│ 핫딜 ☆                                                      │
│ [네이버] 농부창고 저온압착 진한 국산 100%참기름 180ml 외     │
│         네이버멤버십 (11,160원) (무료)                       │
│                                                             │
│ 👤 다해니아        조회수 6312  추천수 3  댓글 19            │
├─────────────────────────────────────────────────────────────┤
│ 링크     https://brand.naver.com/nongbuchanggo/...          │
│ 쇼핑몰   네이버                                              │
│ 상품명   농부창고 저온압착 진한 국산 100%참기름 180ml 외...   │
│ 가격     11,160원                                            │
│ 배송     무료                                                │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ 종료된 핫딜입니다.                                        │
└─────────────────────────────────────────────────────────────┘
```

**구성 요소**:
- 제목: `[쇼핑몰] 상품명 + 가격 + 배송비`
- 작성자, 조회수, 추천수, 댓글수
- **정보 박스** (정형화된 테이블):
  - 링크 (클릭 가능)
  - 쇼핑몰
  - 상품명
  - 가격
  - 배송
- **종료 배너**: 품절/마감 시 노란색 경고 배너

---

## 데이터베이스 설계

### Option A: JSONB 컬럼 추가 (권장)

기존 `posts` 테이블에 `deal_info` JSONB 컬럼 추가.

```sql
ALTER TABLE posts ADD COLUMN deal_info JSONB DEFAULT NULL;

-- 인덱스 (검색 성능)
CREATE INDEX idx_posts_deal_info ON posts USING GIN (deal_info)
WHERE deal_info IS NOT NULL;
```

**deal_info 구조**:

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

**장점**:
- 기존 테이블 구조 유지
- 핫딜이 아닌 게시글은 NULL
- 유연한 확장 가능

### Option B: 별도 테이블 (대안)

```sql
CREATE TABLE hotdeal_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  store VARCHAR(100) NOT NULL,
  product_name VARCHAR(500) NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  shipping VARCHAR(50) DEFAULT '무료',
  deal_url TEXT NOT NULL,
  is_ended BOOLEAN DEFAULT FALSE,
  ended_at TIMESTAMPTZ,
  ended_reason VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id)
);
```

**장점**: 정규화, 명확한 스키마
**단점**: JOIN 필요, 복잡도 증가

### 선택: Option A (JSONB)

- 핫딜 게시판만 특수 처리
- 쿼리 단순화 (JOIN 불필요)
- 향후 다른 특수 게시판에도 패턴 재사용 가능

---

## 컴포넌트 설계

### 디렉토리 구조

```
src/domains/boards/
├── components/
│   ├── hotdeal/                        # 핫딜 전용 컴포넌트
│   │   ├── index.ts                    # 재export
│   │   ├── HotdealInfoBox.tsx          # ⭐ Phase 2: 정보박스
│   │   ├── HotdealFormFields.tsx       # ⭐ Phase 3: 글쓰기 폼 필드
│   │   ├── HotdealEndedBanner.tsx      # Phase 5: 종료 배너
│   │   ├── HotdealActions.tsx          # Phase 5: 종료 버튼/모달
│   │   ├── RelatedProducts.tsx         # Phase 6: 유사 상품
│   │   ├── InternalPostItem.tsx        # Phase 6: 내부 유사글
│   │   └── ExternalProductItem.tsx     # Phase 6: 외부 상품
│   └── post/
│       └── ... (기존)
├── actions/
│   ├── hotdeal/                        # 핫딜 전용 서버 액션
│   │   ├── index.ts                    # 재export
│   │   ├── createHotdealPost.ts        # ⭐ Phase 3: 핫딜 생성
│   │   ├── updateHotdealPost.ts        # ⭐ Phase 3: 핫딜 수정
│   │   ├── endHotdeal.ts               # Phase 5: 핫딜 종료
│   │   ├── reopenHotdeal.ts            # Phase 5: 핫딜 재오픈
│   │   └── getRelatedPosts.ts          # Phase 6: 유사글 검색
│   └── ... (기존 액션들)
├── types/
│   ├── hotdeal/                        # 핫딜 전용 타입
│   │   ├── index.ts                    # ⭐ Phase 1: 재export
│   │   ├── deal-info.ts                # ⭐ Phase 1: DealInfo 인터페이스
│   │   └── constants.ts                # ⭐ Phase 1: 쇼핑몰/배송비 상수
│   └── ... (기존 타입들)
└── utils/
    ├── hotdeal/                        # 핫딜 전용 유틸리티
    │   ├── index.ts                    # ⭐ Phase 1: 재export
    │   ├── format.ts                   # ⭐ Phase 1: 가격 포맷팅, 할인율
    │   ├── detect.ts                   # ⭐ Phase 1: 쇼핑몰 감지, 제목 태그
    │   └── validation.ts               # ⭐ Phase 1: deal_info 유효성 검사
    └── ... (기존 유틸들)

src/shared/api/
├── hotdeal/                            # 핫딜 외부 API (Phase 6)
│   ├── index.ts
│   ├── coupang.ts                      # 쿠팡 파트너스
│   └── naver-shopping.ts               # 네이버 쇼핑
└── ... (기존 API들)

**⭐ = 우선 구현 대상**
**폴더 구조: hotdeal 관련 파일들은 모두 hotdeal 폴더 안에 구조화**
```

### 1. HotdealPostItem.tsx (데스크톱 리스트)

```tsx
interface HotdealPostItemProps {
  post: Post & { deal_info: DealInfo };
  isLast?: boolean;
  currentPostId?: string;
}

// 레이아웃:
// [추천] [썸네일] [제목 + 댓글수]
//                 [쇼핑몰 | 가격 | 배송]
//                 [카테고리 | 시간 | 작성자]
```

**스타일 특징**:
- 종료된 핫딜: `opacity-50` + 취소선 또는 흐리게
- 가격: `text-red-500 font-bold`
- 무료배송: `text-green-600`

### 2. HotdealInfoBox.tsx (상세페이지)

```tsx
interface HotdealInfoBoxProps {
  dealInfo: DealInfo;
}

// 테이블 형태:
// | 링크     | [클릭 가능한 URL]     |
// | 쇼핑몰   | 네이버                |
// | 상품명   | 농부창고 참기름...    |
// | 가격     | 11,160원              |
// | 배송     | 무료                  |
```

### 3. HotdealEndedBanner.tsx

```tsx
interface HotdealEndedBannerProps {
  reason?: string;  // "품절", "마감", "가격변동"
  endedAt?: string;
}

// UI: 노란색 경고 배너
// ⚠️ 종료된 핫딜입니다. (품절)
```

### 4. HotdealFormFields.tsx (글쓰기 폼)

```tsx
// 핫딜 게시판에서 글쓰기 시 추가 필드:
// - 쇼핑몰 (select 또는 input)
// - 상품명
// - 가격
// - 정가 (선택)
// - 배송비
// - 링크 URL
```

---

## 타입 정의

### src/domains/boards/types/hotdeal.ts

```typescript
/**
 * 핫딜 정보 인터페이스
 */
export interface DealInfo {
  /** 쇼핑몰/판매처 */
  store: string;

  /** 상품명 */
  product_name: string;

  /** 판매가 (원) */
  price: number;

  /** 정가 (원) - 할인율 표시용 */
  original_price?: number;

  /** 배송비 */
  shipping: string;

  /** 구매 링크 */
  deal_url: string;

  /** 종료 여부 */
  is_ended: boolean;

  /** 종료 시간 */
  ended_at?: string;

  /** 종료 사유 */
  ended_reason?: '품절' | '마감' | '가격변동' | '링크오류' | '기타';
}

/**
 * 핫딜 게시글 타입 (Post 확장)
 */
export interface HotdealPost extends Post {
  deal_info: DealInfo;
}

/**
 * 인기 쇼핑몰 목록 (자동완성용)
 */
export const POPULAR_STORES = [
  '네이버',
  '쿠팡',
  'G마켓',
  '11번가',
  '옥션',
  '위메프',
  '티몬',
  'SSG',
  '롯데온',
  '카카오',
  '알리익스프레스',
  '아마존',
  '기타',
] as const;

/**
 * 배송비 옵션
 */
export const SHIPPING_OPTIONS = [
  '무료',
  '무배',
  '조건부 무료',
  '2,500원',
  '3,000원',
  '별도',
] as const;
```

---

## 유틸리티 함수

### src/domains/boards/utils/hotdeal.ts

```typescript
/**
 * 가격 포맷팅 (숫자 → "11,160원")
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

/**
 * 할인율 계산
 */
export function getDiscountRate(price: number, originalPrice?: number): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round((1 - price / originalPrice) * 100);
}

/**
 * 핫딜 게시판 slug 목록
 */
export const HOTDEAL_BOARD_SLUGS = [
  'hotdeal',
  'hotdeal-food',
  'hotdeal-game',
  'hotdeal-pc',
  'hotdeal-appliance',
  'hotdeal-living',
  'hotdeal-fashion',
  'hotdeal-sale',
  'hotdeal-beauty',
  'hotdeal-mobile',
  'hotdeal-package',
  'hotdeal-coupon',
  'hotdeal-apptech',
  'hotdeal-sports',
  'hotdeal-overseas',
  'hotdeal-etc',
] as const;

/**
 * 핫딜 게시판인지 확인
 */
export function isHotdealBoard(boardSlug: string): boolean {
  return HOTDEAL_BOARD_SLUGS.includes(boardSlug as any);
}

/**
 * URL에서 쇼핑몰 자동 감지
 */
export function detectStoreFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;

    if (hostname.includes('coupang.com')) return '쿠팡';
    if (hostname.includes('gmarket.co.kr')) return 'G마켓';
    if (hostname.includes('11st.co.kr')) return '11번가';
    if (hostname.includes('auction.co.kr')) return '옥션';
    if (hostname.includes('naver.com')) return '네이버';
    if (hostname.includes('wemakeprice.com')) return '위메프';
    if (hostname.includes('tmon.co.kr')) return '티몬';
    if (hostname.includes('ssg.com')) return 'SSG';
    if (hostname.includes('lotteon.com')) return '롯데온';
    if (hostname.includes('aliexpress.com')) return '알리익스프레스';
    if (hostname.includes('amazon.com')) return '아마존';

    return '기타';
  } catch {
    return '기타';
  }
}

/**
 * 제목에 쇼핑몰 태그 추가
 * 예: "LG 통돌이" + "쿠팡" → "[쿠팡] LG 통돌이"
 */
export function addStoreTag(title: string, store: string): string {
  // 이미 태그가 있으면 그대로 반환
  if (title.startsWith('[')) return title;

  return `[${store}] ${title}`;
}
```

---

## 쇼핑몰 자동 감지 시스템

### 개요

사용자가 핫딜 링크를 입력하면 **URL에서 쇼핑몰을 자동으로 감지**하여 폼에 미리 채워줍니다.

### 동작 방식

```tsx
// HotdealFormFields.tsx 내부
const [dealUrl, setDealUrl] = useState('');
const [store, setStore] = useState('');

// URL 입력 시 자동 감지
useEffect(() => {
  if (dealUrl) {
    const detectedStore = detectStoreFromUrl(dealUrl);
    setStore(detectedStore);
  }
}, [dealUrl]);

// 제목 자동 생성 (선택사항)
const autoGeneratedTitle = addStoreTag(productName, store);
```

### UI 흐름

```
1. 사용자가 링크 입력
   https://www.coupang.com/vp/products/12345

2. 쇼핑몰 자동 선택
   쇼핑몰: [쿠팡 ▼] (자동 선택, 수정 가능)

3. 제목 작성 시 자동으로 [쇼핑몰] 태그 추가
   입력: "LG 통돌이 세탁기 19kg"
   결과: "[쿠팡] LG 통돌이 세탁기 19kg"
```

### 폼 필드 순서

```tsx
<HotdealFormFields>
  {/* 1. 링크 (먼저 입력) */}
  <Input
    label="상품 링크"
    value={dealUrl}
    onChange={(e) => setDealUrl(e.target.value)}
    placeholder="https://www.coupang.com/..."
  />

  {/* 2. 쇼핑몰 (자동 선택, 수정 가능) */}
  <Select
    label="쇼핑몰"
    value={store}
    onChange={(e) => setStore(e.target.value)}
  >
    {POPULAR_STORES.map(s => <option key={s}>{s}</option>)}
  </Select>

  {/* 3. 상품명 */}
  <Input label="상품명" />

  {/* 4. 가격 */}
  <Input type="number" label="가격 (원)" />

  {/* 5. 배송비 */}
  <Select label="배송비">
    {SHIPPING_OPTIONS.map(o => <option key={o}>{o}</option>)}
  </Select>
</HotdealFormFields>
```

---

## 구현 순서 (우선순위)

### Phase 1: 기반 작업 ⭐ 먼저 구현

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 1-1 | DB 마이그레이션 | Supabase | `deal_info` JSONB 컬럼 추가 |
| 1-2 | 타입 정의 | `types/hotdeal.ts` | DealInfo 인터페이스 |
| 1-3 | 유틸리티 | `utils/hotdeal.ts` | 가격 포맷팅, 쇼핑몰 감지 |
| 1-4 | Supabase 타입 재생성 | `types/supabase.ts` | 타입 동기화 |

### Phase 2: 상세페이지 ⭐ 먼저 구현

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 2-1 | 정보박스 | `HotdealInfoBox.tsx` | 링크/쇼핑몰/상품명/가격/배송 테이블 |
| 2-2 | 상세페이지 통합 | `PostDetail.tsx` | 핫딜 게시판일 때 정보박스 렌더링 |

### Phase 3: 글쓰기 ⭐ 먼저 구현

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 3-1 | 폼 필드 | `HotdealFormFields.tsx` | 쇼핑몰/가격/배송/링크 입력 (URL 자동감지) |
| 3-2 | 폼 통합 | `PostWriteForm.tsx` | 핫딜 게시판일 때 필드 추가 |
| 3-3 | 서버액션 수정 | `createPost.ts` | deal_info 저장 |

---

## 추후 구현 (Phase 4-6)

### Phase 4: 리스트 (기존 이미지형 활용)

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 4-1 | 메타정보 추가 | `PostRenderers.tsx` | 쇼핑몰/가격/배송 표시 |
| 4-2 | 종료 스타일 | `DesktopPostItem.tsx` | 종료된 핫딜 opacity 처리 |

**참고**: 현재 이미지형 PostList가 이미 구현되어 있으므로, 메타정보만 추가하면 됨.

### Phase 5: 관리 기능 (종료 처리) - 추후 구현

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 5-1 | 종료 배너 | `HotdealEndedBanner.tsx` | 품절/마감 경고 배너 |
| 5-2 | 종료 액션 | `endHotdeal.ts` | 핫딜 종료 서버 액션 |
| 5-3 | 종료 버튼/모달 | `HotdealActions.tsx` | 작성자/관리자용 종료 UI |
| 5-4 | 종료 복구 액션 | `reopenHotdeal.ts` | 종료 취소 서버 액션 |

<details>
<summary>종료 처리 UI 상세 설계 (펼치기)</summary>

#### 종료 처리 UI 상세 설계

**1. 종료 버튼 위치**
```tsx
// 게시글 상단 액션 버튼들
<div className="flex gap-2">
  {isAuthorOrAdmin && (
    <>
      <Button variant="outline" size="sm">수정</Button>
      <Button variant="outline" size="sm">삭제</Button>
      <Button
        variant="outline"
        size="sm"
        className="text-orange-600"
        onClick={() => setShowEndModal(true)}
      >
        핫딜 종료하기
      </Button>
    </>
  )}
</div>
```

**2. 종료 모달**
```tsx
<Dialog open={showEndModal} onOpenChange={setShowEndModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>핫딜 종료</DialogTitle>
      <DialogDescription>
        이 핫딜을 종료하시겠습니까? 종료된 핫딜은 리스트에서 흐리게 표시됩니다.
      </DialogDescription>
    </DialogHeader>

    {/* 종료 사유 선택 */}
    <RadioGroup value={endReason} onValueChange={setEndReason}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="품절" id="r1" />
        <Label htmlFor="r1">품절</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="마감" id="r2" />
        <Label htmlFor="r2">마감</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="가격변동" id="r3" />
        <Label htmlFor="r3">가격 변동</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="링크오류" id="r4" />
        <Label htmlFor="r4">링크 오류</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="기타" id="r5" />
        <Label htmlFor="r5">기타</Label>
      </div>
    </RadioGroup>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowEndModal(false)}>
        취소
      </Button>
      <Button onClick={handleEndHotdeal} disabled={!endReason}>
        종료하기
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**3. 종료 서버 액션**
```typescript
// domains/boards/actions/endHotdeal.ts
'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';

export async function endHotdeal(
  postId: string,
  reason: '품절' | '마감' | '가격변동' | '링크오류' | '기타'
) {
  const supabase = await createClient();

  // 권한 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, deal_info')
    .eq('id', postId)
    .single();

  if (post.author_id !== user.id) {
    // TODO: 관리자 권한 체크
    throw new Error('권한이 없습니다');
  }

  // deal_info 업데이트
  const updatedDealInfo = {
    ...post.deal_info,
    is_ended: true,
    ended_at: new Date().toISOString(),
    ended_reason: reason,
  };

  await supabase
    .from('posts')
    .update({ deal_info: updatedDealInfo })
    .eq('id', postId);

  revalidatePath('/boards/[slug]', 'page');
  return { success: true };
}
```

**4. 종료 복구 (재오픈)**
```typescript
// domains/boards/actions/reopenHotdeal.ts
'use server';

export async function reopenHotdeal(postId: string) {
  const supabase = await createClient();

  // 권한 체크 (동일)
  // ...

  const updatedDealInfo = {
    ...post.deal_info,
    is_ended: false,
    ended_at: null,
    ended_reason: null,
  };

  await supabase
    .from('posts')
    .update({ deal_info: updatedDealInfo })
    .eq('id', postId);

  revalidatePath('/boards/[slug]', 'page');
  return { success: true };
}
```

**5. 종료된 핫딜 UI 처리**
```tsx
// 리스트에서 종료된 핫딜 표시
{post.deal_info?.is_ended && (
  <div className="opacity-50">
    <span className="line-through">{post.title}</span>
    <span className="text-red-500 text-xs ml-2">[종료]</span>
  </div>
)}

// 상세페이지 배너
{post.deal_info?.is_ended && (
  <HotdealEndedBanner
    reason={post.deal_info.ended_reason}
    endedAt={post.deal_info.ended_at}
  />
)}
```

</details>

### Phase 6: 외부 API 연동 (유사 상품 추천) - 추후 구현

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 6-1 | 쿠팡 API 설정 | `.env.local` | API 키 설정 |
| 6-2 | API 클라이언트 | `api/coupang.ts` | 쿠팡 파트너스 API 클라이언트 |
| 6-3 | 네이버 API 클라이언트 | `api/naver-shopping.ts` | 네이버 쇼핑 API |
| 6-4 | 내부 유사글 검색 | `getRelatedPosts.ts` | 상품명 기반 검색 |
| 6-5 | RelatedProducts 컴포넌트 | `RelatedProducts.tsx` | 유사 상품 표시 |
| 6-6 | 상세페이지 통합 | `PostDetail.tsx` | 하단에 RelatedProducts 추가 |

**참고**: 쿠팡 파트너스는 15만원 판매 실적 필요. 초기에는 네이버 쇼핑 API만 사용 권장.

<details>
<summary>외부 API 연동 상세 설계 (펼치기)</summary>

#### 외부 API 연동 상세 설계

**1. 환경 변수 설정**
```env
# .env.local
COUPANG_ACCESS_KEY=your_access_key
COUPANG_SECRET_KEY=your_secret_key

NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

**2. 쿠팡 파트너스 API 클라이언트**
```typescript
// src/shared/api/coupang.ts

interface CoupangProduct {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
}

export async function searchCoupangProducts(
  keyword: string,
  limit = 5
): Promise<CoupangProduct[]> {
  try {
    const response = await fetch(
      `https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/products/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.COUPANG_ACCESS_KEY}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // 1시간 캐시
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.data?.productData || [];
  } catch (error) {
    console.error('Coupang API error:', error);
    return [];
  }
}
```

**3. 네이버 쇼핑 API 클라이언트**
```typescript
// src/shared/api/naver-shopping.ts

interface NaverProduct {
  title: string;
  link: string;
  image: string;
  lprice: string; // 최저가
  mallName: string;
}

export async function searchNaverProducts(
  query: string,
  display = 5
): Promise<NaverProduct[]> {
  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=${display}`,
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Naver API error:', error);
    return [];
  }
}
```

**4. 내부 유사글 검색**
```typescript
// domains/boards/actions/getRelatedPosts.ts
'use server';

export async function getRelatedHotdealPosts(
  keyword: string,
  currentPostId: string,
  limit = 5
) {
  const supabase = await createClient();

  // 6개월 이내, 키워드 포함, 핫딜 게시판
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data } = await supabase
    .from('posts')
    .select('id, title, deal_info, created_at, likes')
    .neq('id', currentPostId)
    .not('deal_info', 'is', null)
    .gte('created_at', sixMonthsAgo.toISOString())
    .ilike('title', `%${keyword}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}
```

**5. RelatedProducts 컴포넌트**
```tsx
// domains/boards/components/hotdeal/RelatedProducts.tsx

interface RelatedProductsProps {
  productName: string;
  currentPostId: string;
}

export async function RelatedProducts({
  productName,
  currentPostId,
}: RelatedProductsProps) {
  // 병렬로 모든 데이터 가져오기
  const [internalPosts, coupangProducts, naverProducts] = await Promise.all([
    getRelatedHotdealPosts(productName, currentPostId),
    searchCoupangProducts(productName),
    searchNaverProducts(productName),
  ]);

  return (
    <div className="mt-8 space-y-6">
      {/* 내부 유사글 */}
      {internalPosts.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-3">
            유사한 글은 6개월 목록을
          </h3>
          <div className="space-y-2">
            {internalPosts.map((post) => (
              <InternalPostItem key={post.id} post={post} />
            ))}
          </div>
          <button className="text-sm text-blue-600 mt-2">
            더 보기 (총 {internalPosts.length}개)
          </button>
        </section>
      )}

      {/* 외부 쿠팡/네이버 상품 */}
      {(coupangProducts.length > 0 || naverProducts.length > 0) && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">유사한 쿠팡/지마켓 상품</h3>
            <span className="text-xs text-gray-500">
              쿠팡에서 / 지마켓에서 보기
            </span>
          </div>

          <div className="space-y-3">
            {/* 쿠팡 상품 */}
            {coupangProducts.map((product) => (
              <ExternalProductItem
                key={product.productId}
                name={product.productName}
                price={product.productPrice}
                image={product.productImage}
                url={product.productUrl}
                store="쿠팡"
              />
            ))}

            {/* 네이버 상품 */}
            {naverProducts.map((product, idx) => (
              <ExternalProductItem
                key={idx}
                name={product.title}
                price={parseInt(product.lprice)}
                image={product.image}
                url={product.link}
                store={product.mallName}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

**6. 상품 아이템 컴포넌트**
```tsx
// ExternalProductItem.tsx
interface ExternalProductItemProps {
  name: string;
  price: number;
  image: string;
  url: string;
  store: string;
}

function ExternalProductItem({
  name,
  price,
  image,
  url,
  store,
}: ExternalProductItemProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      {/* 썸네일 */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover rounded"
        />
      </div>

      {/* 상품 정보 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm line-clamp-2">{name}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-red-600 font-bold">
            {formatPrice(price)}
          </span>
          <span className="text-xs text-gray-500">무료배송</span>
        </div>
      </div>

      {/* 쇼핑몰 배지 */}
      <div className="flex-shrink-0">
        {store === '쿠팡' ? (
          <Image src="/icons/coupang.png" alt="쿠팡" width={50} height={20} />
        ) : (
          <span className="text-xs text-gray-500">{store}</span>
        )}
      </div>
    </a>
  );
}
```

**7. 상세페이지 통합**
```tsx
// PostDetail.tsx
export default async function PostDetail({ postId }) {
  const post = await getPost(postId);

  return (
    <div>
      {/* 기존 게시글 내용 */}

      {/* 핫딜이면 정보박스 + 유사상품 */}
      {post.deal_info && (
        <>
          <HotdealInfoBox dealInfo={post.deal_info} />

          {post.deal_info.is_ended && (
            <HotdealEndedBanner
              reason={post.deal_info.ended_reason}
              endedAt={post.deal_info.ended_at}
            />
          )}

          <Suspense fallback={<Spinner />}>
            <RelatedProducts
              productName={post.deal_info.product_name}
              currentPostId={postId}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
```

#### API 제한 사항 및 대응

| API | 제한 | 대응 |
|-----|------|------|
| 쿠팡 파트너스 | 10회/시간 | 1시간 캐시 (`next: { revalidate: 3600 }`) |
| 네이버 쇼핑 | 25,000회/일 | 1시간 캐시, 에러 시 빈 배열 반환 |

**캐싱 전략**:
- Next.js `fetch` 캐시 활용
- API 에러 시 조용히 실패 (빈 배열 반환)
- Suspense로 로딩 상태 처리

</details>

---

## UI 스타일 가이드

### 가격 표시

```tsx
// 정상가
<span className="text-red-600 dark:text-red-400 font-bold">
  11,160원
</span>

// 할인율 표시 (정가 있을 때)
<span className="text-gray-400 line-through text-sm">15,000원</span>
<span className="text-red-600 font-bold">11,160원</span>
<span className="text-orange-500 text-xs ml-1">26%↓</span>
```

### 배송비 표시

```tsx
// 무료
<span className="text-green-600 dark:text-green-400">무료</span>

// 유료
<span className="text-gray-500">3,000원</span>
```

### 종료된 핫딜

```tsx
// 리스트 아이템
<div className="opacity-50">
  <span className="line-through">{title}</span>
  <span className="text-red-500 text-xs ml-2">[종료]</span>
</div>

// 상세페이지 배너
<div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4">
  <div className="flex items-center gap-2">
    <AlertTriangle className="w-5 h-5 text-yellow-600" />
    <span className="text-yellow-800 dark:text-yellow-200 font-medium">
      종료된 핫딜입니다.
    </span>
    {reason && <span className="text-yellow-600">({reason})</span>}
  </div>
</div>
```

### 쇼핑몰 배지

```tsx
// 쇼핑몰별 색상 (선택적)
const STORE_COLORS: Record<string, string> = {
  '네이버': 'bg-green-100 text-green-800',
  '쿠팡': 'bg-red-100 text-red-800',
  'G마켓': 'bg-green-100 text-green-800',
  '11번가': 'bg-red-100 text-red-800',
  '알리': 'bg-orange-100 text-orange-800',
  'default': 'bg-gray-100 text-gray-800',
};
```

---

## RLS 정책

```sql
-- deal_info 컬럼은 기존 posts RLS 정책 따름
-- 추가 정책 불필요

-- 종료 처리는 작성자 또는 관리자만
-- (서버 액션에서 권한 체크)
```

---

## 추후 확장 가능성

1. **가격 알림**: 특정 상품 가격 변동 시 알림
2. **자동 종료**: 외부 링크 크롤링으로 품절 감지
3. **가격 히스토리**: 최저가 추적
4. **쇼핑몰 연동**: API로 상품 정보 자동 입력
5. **핫딜 랭킹**: 추천수/조회수 기반 HOT 핫딜

---

## 예상 작업 시간

### 우선 구현 (Phase 1-3)

| Phase | 작업량 | 복잡도 | 비고 |
|-------|--------|--------|------|
| Phase 1 | 작음 | 낮음 | DB 마이그레이션, 타입 정의, 유틸리티 |
| Phase 2 | 작음 | 낮음 | 정보박스 컴포넌트, 상세페이지 통합 |
| Phase 3 | 중간 | 중간 | 글쓰기 폼, URL 감지 자동화, 서버 액션 |

### 추후 구현 (Phase 4-6)

| Phase | 작업량 | 복잡도 | 비고 |
|-------|--------|--------|------|
| Phase 4 | 작음 | 낮음 | 기존 이미지형 리스트에 메타정보만 추가 |
| Phase 5 | 중간 | 중간 | 종료 처리 UI, 모달, 서버 액션 |
| Phase 6 | 큼 | 높음 | 외부 API 연동, 쿠팡/네이버 파트너 가입 필요 |

**Phase 6 참고**: API 키 발급 시간이 추가로 소요될 수 있습니다.
- 쿠팡 파트너스: 15만원 판매 실적 필요
- 네이버 쇼핑 API: 즉시 발급 가능

---

## 추가 고려사항

### 1. 쿠팡 파트너스 API 가입 조건

쿠팡 파트너스는 **15만원 이상 판매 실적**이 필요합니다. 초기에는 네이버 쇼핑 API만 사용하고, 추후 쿠팡 API를 추가하는 것을 권장합니다.

**대안**:
```typescript
// 쿠팡 API 없이도 동작하도록 구현
const [internalPosts, naverProducts] = await Promise.all([
  getRelatedHotdealPosts(productName, currentPostId),
  searchNaverProducts(productName),
  // searchCoupangProducts(productName), // 주석 처리
]);
```

### 2. API 비용 관리

| API | 무료 한도 | 비용 |
|-----|-----------|------|
| 네이버 쇼핑 | 25,000회/일 | 무료 |
| 쿠팡 파트너스 | 제한 없음 | 무료 (제휴 수익) |

### 3. 법적 고려사항

- **제휴 마케팅 표시**: "쿠팡 파트너스 활동의 일환으로 수수료를 제공받을 수 있습니다" 문구 필수
- **저작권**: 상품 이미지는 API에서 제공하는 URL 그대로 사용
- **개인정보**: 외부 API에 사용자 정보 전송 금지

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-01-14 | 최초 문서 작성 |
| 2026-01-16 | 쇼핑몰 자동 감지, 종료 처리 UI, Phase 6 (외부 API) 추가 |
