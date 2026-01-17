# 핫딜 기능 트러블슈팅

## 문제: 핫딜 가격 정보가 리스트에 표시되지 않음

### 증상
- 핫딜 게시판 (`/boards/hotdeal-appliance`) 리스트에서 가격 정보가 표시되지 않음
- 데이터베이스에는 `deal_info`가 정상적으로 저장되어 있음
- 콘솔 로그에서 `deal_info: null`로 표시됨

### 원인
**데이터 변환 파이프라인에서 `deal_info`가 누락됨**

Next.js 서버 액션에서 클라이언트 컴포넌트까지 데이터가 전달되는 과정:

```
DB (Supabase)
  ↓ SQL SELECT
getPosts (쿼리 실행)
  ↓ formatPostData() ❌ deal_info 누락
API Response (Post 타입)
  ↓ convertApiPostsToLayoutPosts() ❌ deal_info 누락
Layout/Component (LayoutPost 타입)
  ↓
UI 렌더링
```

**누락된 지점:**
1. ✅ SQL 쿼리: `deal_info` 선택함
2. ❌ **`formatPostData()` 함수**: 타입 정의와 반환값에 `deal_info` 누락
3. ❌ **`convertApiPostsToLayoutPosts()` 함수**: 매핑에 `deal_info` 누락
4. ❌ **타입 정의**: `RawPostData`, `Post`, `ApiPost`, `LayoutPost`에 `deal_info` 누락

### 해결 방법

#### 1. 타입 정의 추가

**`src/domains/boards/actions/getPosts.ts`**
```typescript
import type { DealInfo } from '../types/hotdeal';

interface RawPostData {
  // ... 기존 필드들
  deal_info?: DealInfo | null;  // ✅ 추가
}

export interface Post {
  // ... 기존 필드들
  deal_info?: DealInfo | null;  // ✅ 추가
}
```

**`src/domains/boards/types/post/layout.ts`**
```typescript
import type { DealInfo } from '../hotdeal';

export interface LayoutPost {
  // ... 기존 필드들
  deal_info?: DealInfo | null;  // ✅ 추가
}

export interface ApiPost {
  // ... 기존 필드들
  deal_info?: DealInfo | null;  // ✅ 추가
}
```

#### 2. 데이터 변환 함수 수정

**`src/domains/boards/actions/posts/fetchPostsHelpers.ts`**
```typescript
import type { DealInfo } from '../../types/hotdeal';

export function formatPostData(
  post: {
    // ... 기존 필드들
    deal_info?: DealInfo | null;  // ✅ 파라미터 타입에 추가
  },
  // ... 기타 파라미터들
): Post {
  return {
    // ... 기존 필드들
    deal_info: post.deal_info || null  // ✅ 반환값에 추가
  };
}
```

**`src/domains/boards/utils/post/postUtils.ts`**
```typescript
export function convertApiPostsToLayoutPosts(apiPosts: ApiPost[]): LayoutPost[] {
  return apiPosts.map(post => ({
    // ... 기존 필드들
    deal_info: post.deal_info || null  // ✅ 매핑에 추가
  }));
}
```

### 검증 방법

콘솔 로그로 각 단계 확인:

```typescript
// DesktopPostList.tsx
console.log('[DesktopPostList] First post:', deferredPosts[0].title, 'deal_info:', deferredPosts[0].deal_info);
// ✅ 출력: deal_info: {price: 13920, store: '네이버', ...}

// DesktopPostItem.tsx
if (dealInfo) {
  console.log('[DesktopPostItem] dealInfo found:', post.title, dealInfo);
}
// ✅ 출력: dealInfo found: 프링글스... {price: 13920, ...}
```

## 간소화 방안

### 현재 문제점
- 데이터 변환 레이어가 2개 (`formatPostData` → `convertApiPostsToLayoutPosts`)
- 타입이 중복됨 (`RawPostData`, `Post`, `ApiPost`, `LayoutPost`)
- 새 필드 추가 시 여러 곳을 수정해야 함

### 개선 방안

#### Option 1: 타입 통합 (권장)
```typescript
// src/domains/boards/types/post/index.ts
import type { DealInfo } from '../hotdeal';

// 하나의 게시글 타입으로 통합
export interface Post {
  id: string;
  title: string;
  // ... 모든 필드
  deal_info?: DealInfo | null;
}

// API 응답용 별칭
export type ApiPost = Post;
export type LayoutPost = Post;
```

**장점:**
- 타입 중복 제거
- 필드 추가 시 한 곳만 수정
- 타입 불일치 오류 방지

**단점:**
- API와 Layout의 의미적 구분이 사라짐
- 리팩토링 범위가 큼

#### Option 2: 변환 레이어 단순화
```typescript
// formatPostData에서 LayoutPost로 직접 변환
export function formatPostData(rawPost: RawPostData): LayoutPost {
  // ... 모든 변환 로직 처리
  return {
    // ... 완전한 LayoutPost 반환
    deal_info: rawPost.deal_info || null
  };
}

// convertApiPostsToLayoutPosts 제거
// page.tsx에서 직접 formatPostData 결과 사용
```

**장점:**
- 변환 단계 1회로 감소
- 데이터 손실 위험 감소

**단점:**
- 기존 코드 대폭 수정 필요

#### Option 3: 자동 타입 매핑 (중기 개선)
```typescript
// 제네릭 매퍼로 모든 필드 자동 복사
function mapPost<T extends Partial<Post>>(source: T): Post {
  return {
    id: source.id!,
    title: source.title!,
    // ... 필수 필드만 명시
    ...source  // 나머지 모든 필드 자동 복사
  };
}
```

**장점:**
- 새 필드 추가 시 자동 처리
- 타입 안정성 유지

**단점:**
- 옵셔널 필드 처리 복잡
- 런타임 오류 가능성

### 즉시 적용 가능한 개선

#### 1. 타입 체크리스트 작성
```typescript
// src/domains/boards/types/post/checklist.ts
/**
 * 새 게시글 필드 추가 시 체크리스트
 *
 * [ ] RawPostData (getPosts.ts)
 * [ ] Post (getPosts.ts)
 * [ ] ApiPost (layout.ts)
 * [ ] LayoutPost (layout.ts)
 * [ ] formatPostData 파라미터 (fetchPostsHelpers.ts)
 * [ ] formatPostData 반환값 (fetchPostsHelpers.ts)
 * [ ] convertApiPostsToLayoutPosts (postUtils.ts)
 * [ ] SQL SELECT 쿼리 (getPosts.ts, getPopularPosts.ts 등)
 */
```

#### 2. 타입 공통 인터페이스 정의
```typescript
// src/domains/boards/types/post/shared.ts
export interface PostBaseFields {
  id: string;
  title: string;
  // ... 모든 공통 필드
  deal_info?: DealInfo | null;
}

// 각 타입에서 확장
export interface Post extends PostBaseFields {
  // Post 특화 필드
}

export interface LayoutPost extends PostBaseFields {
  // LayoutPost 특화 필드
}
```

#### 3. 단위 테스트 추가
```typescript
// src/domains/boards/actions/__tests__/getPosts.test.ts
describe('formatPostData', () => {
  it('should preserve deal_info', () => {
    const input = {
      id: 'test',
      title: 'Test Post',
      deal_info: { price: 10000, store: 'Test' }
    };

    const result = formatPostData(input, ...);

    expect(result.deal_info).toEqual(input.deal_info);
  });
});
```

## 예방 조치

### 1. ESLint 규칙 추가
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // 타입에 누락된 필드 경고
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error'
  }
};
```

### 2. 타입 유효성 검사
```typescript
// src/shared/utils/validation.ts
export function validatePostData(post: unknown): post is Post {
  const p = post as Post;
  return (
    typeof p.id === 'string' &&
    typeof p.title === 'string' &&
    // ... 모든 필수 필드 검증
    (p.deal_info === null || typeof p.deal_info === 'object')
  );
}
```

### 3. 통합 테스트
```typescript
// e2e/hotdeal.spec.ts
test('핫딜 게시판에서 가격 정보 표시', async ({ page }) => {
  await page.goto('/boards/hotdeal-appliance');

  const priceElement = await page.locator('text=/[0-9,]+원/').first();
  await expect(priceElement).toBeVisible();
});
```

## 교훈

1. **데이터 변환 레이어가 많을수록 데이터 손실 위험 증가**
   - 가능한 한 변환 단계를 줄일 것
   - 각 변환 단계마다 검증 로직 추가

2. **타입 정의와 실제 구현의 일치가 중요**
   - 타입에 필드가 있어도 실제 매핑에서 누락되면 런타임 오류
   - 타입스크립트는 타입 체크만 할 뿐 데이터 변환은 하지 않음

3. **SQL 쿼리에서 선택해도 중간 과정에서 버려질 수 있음**
   - DB → 클라이언트까지 전체 파이프라인 추적 필요
   - 각 단계에서 로깅으로 검증

4. **새 기능 추가 시 체크리스트 필수**
   - 관련된 모든 타입과 함수를 문서화
   - 자동화된 테스트로 검증

## 관련 파일

### 수정된 파일
- `src/domains/boards/actions/getPosts.ts` - RawPostData, Post 타입
- `src/domains/boards/actions/posts/fetchPostsHelpers.ts` - formatPostData 함수
- `src/domains/boards/types/post/layout.ts` - ApiPost, LayoutPost 타입
- `src/domains/boards/utils/post/postUtils.ts` - convertApiPostsToLayoutPosts 함수

### 영향받는 컴포넌트
- `src/domains/boards/components/post/postlist/components/desktop/DesktopPostItem.tsx`
- `src/domains/boards/components/post/postlist/components/mobile/MobilePostItem.tsx`
- `src/domains/boards/components/post/PopularPostList.tsx`

### 관련 문서
- [핫딜 시스템 개요](./system-overview.md)
- [데이터베이스 스키마](./database-schema.md)
- [UI 컴포넌트 가이드](./ui-components.md)
