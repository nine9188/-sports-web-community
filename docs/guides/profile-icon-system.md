# 프로필 아이콘 시스템

사용자 프로필 아이콘을 관리하는 시스템 문서입니다.

## 개요

프로필 아이콘 시스템은 두 가지 타입의 아이콘을 지원합니다:
1. **레벨 아이콘**: 사용자 레벨에 따라 자동으로 부여되는 기본 아이콘
2. **커스텀 아이콘**: 상점에서 구매한 아이콘

## 파일 구조

```
src/
├── shared/
│   ├── components/
│   │   └── UserIcon.tsx              # 메인 아이콘 렌더링 컴포넌트
│   ├── context/
│   │   └── IconContext.tsx           # 전역 아이콘 상태 관리
│   └── utils/
│       ├── user-icons.ts             # 클라이언트용 아이콘 유틸리티
│       ├── level-icons-shared.ts     # 공통 상수/함수 (서버/클라이언트 공유)
│       ├── level-icons.ts            # 클라이언트용 (re-export + 클라이언트 전용 기능)
│       └── level-icons-server.ts     # 서버용 (re-export만)
│
├── domains/
│   ├── settings/
│   │   ├── components/icons/
│   │   │   └── IconForm.tsx          # 아이콘 선택 UI
│   │   └── actions/
│   │       └── icons.ts              # 아이콘 CRUD 서버 액션
│   ├── sidebar/
│   │   └── components/auth/
│   │       └── UserProfile.tsx       # 사이드바 프로필 표시
│   ├── user/
│   │   └── components/
│   │       ├── AuthorLink.tsx        # 작성자 링크 (아이콘 포함)
│   │       └── PublicProfileCard.tsx # 공개 프로필 카드
│   └── boards/
│       └── components/post/
│           ├── PostHeader.tsx        # 게시글 헤더 (작성자 아이콘)
│           └── Comment.tsx           # 댓글 (작성자 아이콘)
```

## 아키텍처

### 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                        데이터 소스                               │
├─────────────────────────────────────────────────────────────────┤
│  profiles 테이블          shop_items 테이블                      │
│  ├── icon_id (FK) ────▶  ├── id                                 │
│  ├── level                ├── name                              │
│  └── exp                  └── image_url                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       유틸리티 레이어                            │
├─────────────────────────────────────────────────────────────────┤
│  level-icons.ts          user-icons.ts                          │
│  ├── getLevelIconUrl()   ├── getOptimizedUserIcon()            │
│  ├── calculateLevel()    ├── getFallbackIconUrl()              │
│  └── getUserIconInfo()   └── iconCache (5분 TTL)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       컨텍스트 레이어                            │
├─────────────────────────────────────────────────────────────────┤
│  IconContext.tsx                                                │
│  ├── iconUrl (현재 아이콘 URL)                                   │
│  ├── iconName (현재 아이콘 이름)                                 │
│  ├── updateUserIconState() (상태 업데이트)                       │
│  └── refreshUserIcon() (새로고침)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       컴포넌트 레이어                            │
├─────────────────────────────────────────────────────────────────┤
│  UserIcon.tsx (공통 렌더링)                                      │
│  ├── iconUrl 우선 사용                                          │
│  ├── 없으면 level 기반 아이콘                                    │
│  ├── 에러 시 fallback 아이콘                                     │
│  └── API-Sports URL 지원                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 아이콘 결정 로직

```
                    ┌──────────────────┐
                    │   아이콘 요청     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ iconUrl 있음?    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │ Yes          │              │ No
              ▼              │              ▼
    ┌─────────────────┐      │    ┌─────────────────┐
    │ iconUrl 사용     │      │    │ getLevelIconUrl │
    └────────┬────────┘      │    │    (level)      │
             │               │    └────────┬────────┘
             │               │             │
             └───────────────┼─────────────┘
                             │
                    ┌────────▼─────────┐
                    │   이미지 로드     │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │ 성공         │              │ 에러
              ▼              │              ▼
    ┌─────────────────┐      │    ┌─────────────────┐
    │   이미지 표시    │      │    │ getFallbackIcon │
    └─────────────────┘      │    │    (level)      │
                             │    └─────────────────┘
```

## 핵심 컴포넌트

### 1. UserIcon.tsx

**역할**: 모든 아이콘 렌더링의 진입점

**Props**:
| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| iconUrl | string \| null | - | 커스텀 아이콘 URL |
| level | number | 1 | 사용자 레벨 (fallback용) |
| size | number | 20 | 아이콘 크기 (px) |
| alt | string | '유저 아이콘' | 대체 텍스트 |
| className | string | '' | 추가 CSS 클래스 |
| priority | boolean | false | Next.js Image priority |

**특징**:
- API-Sports URL 자동 감지 → `UnifiedSportsImage` 사용
- 에러 발생 시 레벨 아이콘으로 자동 fallback
- `React.memo`로 최적화

```tsx
// 사용 예시
<UserIcon
  iconUrl={user.icon_url}
  level={user.level}
  size={24}
  alt={`${user.nickname} 프로필`}
/>
```

### 2. IconContext.tsx

**역할**: 전역 아이콘 상태 관리

**제공 값**:
```typescript
interface IconContextType {
  iconUrl: string;              // 현재 아이콘 URL
  iconName: string;             // 현재 아이콘 이름
  updateUserIconState: (url, name) => void;  // 상태 업데이트
  isIconLoading: boolean;       // 로딩 상태
  refreshUserIcon: () => Promise<void>;      // DB에서 새로고침
}
```

**사용처**:
- `IconForm.tsx`: 아이콘 변경 시 전역 상태 업데이트
- `UserProfile.tsx`: 사이드바 프로필에서 전역 상태 사용

### 3. level-icons 아키텍처

**구조** (코드 중복 제거됨):
```
level-icons-shared.ts    # 공통 상수/함수 (단일 소스)
    ↓ re-export
level-icons.ts           # 클라이언트용 ('use client')
level-icons-server.ts    # 서버용 (지시어 없음)
```

**역할**: 레벨 기반 아이콘 URL 생성

**레벨 → 아이콘 매핑**:
```
레벨 1-4   → level-1.png
레벨 5-8   → level-2.png
레벨 9-12  → level-3.png
...
레벨 37-40 → level-10.png
레벨 41    → level-11.png
레벨 42    → level-12.png
...
레벨 49    → level-19.png
```

**공통 함수** (`level-icons-shared.ts`):
```typescript
// 레벨 → 아이콘 URL
getLevelIconUrl(level: number): string

// 경험치 → 레벨
calculateLevelFromExp(exp: number): number

// 레벨 진행률
calculateLevelProgress(level: number, exp: number): number

// 다음 레벨까지 남은 경험치
getExpToNextLevel(level: number, exp: number): number
```

### 4. user-icons.ts

**역할**: 클라이언트에서 사용자 아이콘 조회

**캐싱**:
- 메모리 캐시 (Map)
- TTL: 5분
- 키: userId

**함수**:
```typescript
// 최적화된 아이콘 조회 (캐시 사용)
getOptimizedUserIcon(userId, userLevel): Promise<{ url, name }>

// 레벨 기반 기본 아이콘
getUserLevelIconUrl(level): string

// 에러 시 fallback
getFallbackIconUrl(level): string
```

### 5. icons.ts (Server Actions)

**역할**: 아이콘 CRUD 작업

**함수**:
| 함수 | 설명 |
|------|------|
| `getUserIcons(userId)` | 사용자가 보유한 아이콘 목록 |
| `getCurrentUserIcon(userId)` | 현재 설정된 아이콘 정보 |
| `updateUserIcon(userId, iconId)` | 아이콘 변경 |
| `updateUserIconServer(userId, iconId)` | 서버 컴포넌트용 변경 |

## 레벨 시스템

### 경험치 테이블 (49레벨)

| 레벨 | 필요 EXP | 예상 도달 기간 |
|------|----------|---------------|
| 1 | 0 | 시작 |
| 5 | 1,500 | 약 1주 |
| 10 | 5,500 | 약 2주 |
| 15 | 12,000 | 약 1달 |
| 20 | 27,000 | 약 2달 |
| 30 | 138,000 | 약 6달 |
| 40 | 585,000 | 약 1.5년 |
| 49 | 1,920,000 | 전설 |

### 아이콘 저장 위치

```
Supabase Storage: profile-icons/level-icons/
├── level-1.png  (레벨 1-4)
├── level-2.png  (레벨 5-8)
├── ...
└── level-19.png (레벨 49)
```

## 사용 컴포넌트 목록

| 컴포넌트 | 위치 | 용도 |
|----------|------|------|
| `UserProfile` | 사이드바 | 로그인 사용자 프로필 |
| `AuthorLink` | 게시글/댓글 | 작성자 링크 + 아이콘 |
| `PostHeader` | 게시글 상세 | 작성자 정보 표시 |
| `Comment` | 댓글 | 댓글 작성자 아이콘 |
| `PublicProfileCard` | 유저 페이지 | 공개 프로필 헤더 |
| `IconForm` | 설정 페이지 | 아이콘 선택/변경 |
| `PostRenderers` | 게시글 목록 | 게시글 리스트 아이콘 |

## 데이터베이스 스키마

### profiles 테이블
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  icon_id INTEGER REFERENCES shop_items(id),
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  -- ...
);
```

### shop_items 테이블
```sql
CREATE TABLE shop_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_consumable BOOLEAN DEFAULT FALSE,
  -- ...
);
```

### user_items 테이블
```sql
CREATE TABLE user_items (
  user_id UUID REFERENCES profiles(id),
  item_id INTEGER REFERENCES shop_items(id),
  -- ...
);
```

## 이미지 소스

| 타입 | 소스 | URL 패턴 |
|------|------|----------|
| 레벨 아이콘 | Supabase Storage | `https://...supabase.co/.../level-icons/level-{n}.png` |
| 커스텀 아이콘 | shop_items.image_url | 다양함 |
| 선수/팀 아이콘 | API-Sports | `https://media.api-sports.io/football/players/{id}.png` |

## 주의사항

### 1. 서버에서 레벨 아이콘 제공
`src/domains/layout/actions.ts`의 `getHeaderUserData` 함수는:
- 커스텀 아이콘 (`profile.icon_id`)이 있으면 shop_items에서 조회
- 커스텀 아이콘이 없거나 조회 실패 시 `getLevelIconUrl(userLevel)` 사용
- 항상 `iconInfo`에 유효한 아이콘 URL을 제공 (null이 아님)

### 2. 서버/클라이언트 분리 (개선됨)
- `level-icons-shared.ts`: 공통 상수/함수 (단일 소스)
- `level-icons.ts`: `'use client'` → 클라이언트용 re-export + 클라이언트 전용 기능
- `level-icons-server.ts`: 지시어 없음 → 서버용 re-export
- **개선**: 코드 중복 제거, 단일 소스 유지

### 3. API-Sports URL 처리
`UserIcon.tsx`에서 API-Sports URL 자동 감지:
```typescript
if (isApiSportsUrl(src)) {
  return <UnifiedSportsImage ... />;
}
```

### 4. 에러 처리
모든 이미지 로딩 에러는 레벨 아이콘으로 fallback:
```typescript
onError={() => setError(true)}
// error === true → getFallbackIconUrl(level)
```

### 5. 캐시 무효화
아이콘 변경 시 `revalidatePath` 호출:
```typescript
revalidatePath('/settings/icons');
revalidatePath('/settings/profile');
revalidatePath('/');
```

## 전체 코드 리뷰 결과 (2026-01-10)

### 검사한 파일 (78개 관련 파일 중 주요 파일)

| 파일 | 상태 | 비고 |
|------|------|------|
| `UserIcon.tsx` | ✅ 양호 | React.memo, 에러 핸들링, API-Sports 지원 |
| `IconContext.tsx` | ✅ 양호 | 전역 상태 관리 잘 구현됨 |
| `level-icons-shared.ts` | ✅ 신규 | 공통 상수/함수 단일 소스 |
| `level-icons.ts` | ✅ 리팩토링 | 공유 파일에서 re-export |
| `level-icons-server.ts` | ✅ 리팩토링 | 공유 파일에서 re-export |
| `user-icons.ts` | ✅ 수정됨 | unoptimized 제거, 기본 아이콘 URL 수정 |
| `layout/actions.ts` | ✅ 수정됨 | 레벨 아이콘 폴백 추가 |
| `sidebar/userProfile.ts` | ✅ 수정됨 | 레벨 아이콘 폴백 추가 |
| `settings/icons.ts` | ✅ 수정됨 | 하드코딩된 경로 제거, 레벨 아이콘 사용 |
| `IconForm.tsx` | ✅ 양호 | 전역 상태 업데이트 잘 구현됨 |
| `UserProfile.tsx` (사이드바) | ✅ 양호 | 복잡하지만 정상 동작 |
| `AuthorLink.tsx` | ✅ 양호 | UserIcon 컴포넌트 활용 |
| `PostHeader.tsx` | ✅ 양호 | AuthorLink 활용 |
| `Comment.tsx` | ✅ 양호 | UserIcon 직접 사용 |
| `PublicProfileCard.tsx` | ✅ 양호 | UserIcon 직접 사용 |
| `PostRenderers.tsx` | ✅ 양호 | AuthorLink 활용 |

### 발견 및 수정한 문제

#### 버그 수정

1. **PC 헤더 레벨 1 아이콘 버그** (`layout/actions.ts`)
   - **원인**: `icon_id`가 없을 때 `iconInfo`가 `null`로 유지됨
   - **수정**: 레벨 아이콘 폴백 로직 추가

2. **사이드바 레벨 아이콘 누락** (`sidebar/userProfile.ts`)
   - **원인**: 동일하게 `iconUrl`이 `null`로 유지됨
   - **수정**: 레벨 아이콘 폴백 로직 추가

3. **하드코딩된 아이콘 경로** (`settings/actions/icons.ts`)
   - **원인**: `/images/level-icons/level-default.png` 하드코딩
   - **수정**: `getLevelIconUrl(userLevel)` 동적 호출로 변경

#### 코드 개선

4. **코드 중복 제거** (`level-icons-shared.ts` 신규)
   - **원인**: `level-icons.ts`와 `level-icons-server.ts`가 동일한 로직
   - **수정**: 공통 파일 생성, re-export 구조로 변경

5. **사용하지 않는 import 제거** (`level-icons.ts`)
   - **수정**: 불필요한 `getSupabaseBrowser` import 제거

6. **Next.js 이미지 최적화 활성화** (`user-icons.ts`)
   - **원인**: `profileImageProps`에 `unoptimized: true` 설정
   - **수정**: `unoptimized` 옵션 제거

7. **기본 아이콘 URL 일관성** (`user-icons.ts`)
   - **원인**: `DEFAULT_ICON_URL`이 `/images/player.svg` 사용
   - **수정**: 레벨 1 아이콘 URL로 변경

### 네이밍 규칙 (의도된 설계)

| 컨텍스트 | 네이밍 | 예시 |
|----------|--------|------|
| 데이터베이스/타입 | snake_case | `icon_url`, `icon_id` |
| React props/변수 | camelCase | `iconUrl`, `iconId` |

이는 PostgreSQL/Supabase와 JavaScript 간의 표준 네이밍 규칙을 따른 것입니다.

### 아키텍처 평가

**장점**:
- ✅ 명확한 계층 구조 (유틸리티 → 컨텍스트 → 컴포넌트)
- ✅ 일관된 fallback 전략 (레벨 아이콘)
- ✅ 서버/클라이언트 분리 준수
- ✅ API-Sports 이미지 특별 처리
- ✅ 메모이제이션 적용 (`React.memo`, `useMemo`, `useCallback`)
- ✅ 코드 중복 제거 (공유 파일)

**모든 주요 개선 사항 완료됨** ✅

---

**문서 작성일**: 2026-01-10
**최종 업데이트**: 2026-01-10
**버전**: 1.2.0

### 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-01-10 | 1.2.0 | 코드 중복 제거, Next.js 최적화 활성화, 기본 아이콘 URL 수정 |
| 2026-01-10 | 1.1.0 | 전체 코드 리뷰 완료, 4개 버그 수정, 리뷰 결과 문서화 |
| 2026-01-10 | 1.0.1 | 서버 레벨 아이콘 폴백 로직 추가 (actions.ts 수정) |
| 2026-01-10 | 1.0.0 | 초기 문서 작성 |
