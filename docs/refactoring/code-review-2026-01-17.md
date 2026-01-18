# 코드 리뷰 보고서 (2026-01-17)

## 개요

전체 코드베이스를 13가지 관점에서 검토:

**기본 분석 (1-7)**
1. 구조/설계의 적절성
2. 데이터 흐름의 적절성
3. 유지보수 관점 개선점
4. 불필요하게 복잡한 로직
5. 서버/클라이언트 컴포넌트 분리
6. Next.js + Supabase 최신 방식 준수
7. 확장성 관점 구조 문제

**추가 분석 (8-14)** - 2026-01-18 추가
8. 서버 액션 호출 빈도 / 캐시 전략 / 불필요한 렌더링
9. Supabase 및 외부 API 비용
10. UX/사용자 플로우 (첫 진입, 로딩 상태, 에러 처리)
11. 보안/권한/데이터 안전
12. 테스팅/안정성
13. 배포/운영
14. UI 일관성 / 디자인 시스템

---

## 1. 프로젝트 규모

```
총 파일: 774개 (TS/TSX)
├── src/app/:      120개 (페이지, 레이아웃)
├── src/domains/:  547개 (도메인 로직)
└── src/shared/:   107개 (공유 유틸)
```

---

## 2. 구조/설계 분석

### 2.1 잘된 점 ✅

| 항목 | 설명 |
|------|------|
| 도메인 주도 설계 | 기능별 명확한 도메인 분리 (20개 도메인) |
| 서버 액션 중심 | API 라우트 대신 서버 액션 사용 |
| 타입 안정성 | TypeScript + Supabase 생성 타입 |
| React 18 활용 | useDeferredValue, startTransition 사용 |
| 캐싱 전략 | React cache(), React Query 활용 |

### 2.2 문제점 ❌

#### 문제 1: 거대 도메인 (높은 우선순위)

```
boards 도메인:    120+ 파일
livescore 도메인: 160+ 파일
```

**권장**: 50 파일 이내로 분할

```
개선안:
boards/ →
├── core/     (게시판, 게시글 핵심)
├── comments/ (댓글 전용)
├── hotdeal/  (HOT딜 분리)
└── content/  (에디터, 카드 렌더러)

livescore/ →
├── core/     (라이브스코어 핵심)
├── match/    (매치 상세)
├── team/     (팀 정보)
└── player/   (선수 정보)
```

#### 문제 2: 컴포넌트 폴더 구조 불일관

```
현재:
boards/components/    → 70+ 파일 혼재
  ├── 일부 서브폴더 존재 (post/, board/)
  └── 많은 파일이 최상위에 방치

개선안:
boards/components/
├── board/        # 게시판 목록
├── post/         # 게시글 관련
├── comment/      # 댓글 관련
├── form/         # 폼 컴포넌트
└── cards/        # 카드 컴포넌트
```

---

## 3. 데이터 흐름 분석

### 3.1 현재 상태 (문제 있음)

```
┌─────────────────────────────────────────────────────────────────┐
│                     layout.tsx (서버)                            │
├─────────────────────────────────────────────────────────────────┤
│  1. getFullUserData()          ← profiles + 통계 + 아이콘       │
│  2. getBoardsForNavigation()   ← 게시판 계층 구조                │
│  3. fetchMultiDayMatches()     ← 라이브스코어 (외부 API)        │
│  4. getUIThemeSettings()       ← UI 테마                        │
│  5. getSeoSettings()           ← SEO 설정                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 RootLayoutClient (클라이언트)                    │
├─────────────────────────────────────────────────────────────────┤
│  Props: fullUserData, headerBoards, liveScoreData...            │
│  → AuthProvider, IconProvider 등에 전달                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AuthSection (서버)                            │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️ getSidebarUserProfile() ← 또 profiles + 통계 + 아이콘 fetch │
│  ⚠️ 중복! layout.tsx의 getFullUserData()와 동일한 데이터!       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 ServerUserProfile (서버)                         │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️ getSidebarUserProfile() ← 또 호출! (cache()로 같은 요청 내  │
│     에서는 캐시되지만, 별도 함수라 getFullUserData와 중복)       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 핵심 문제: 사용자 데이터 중복 fetch

| 함수 | 위치 | 데이터 |
|------|------|--------|
| `getFullUserData()` | shared/actions/user.ts | profiles + 통계 + 아이콘 |
| `getSidebarUserProfile()` | sidebar/actions/userProfile.ts | profiles + 통계 + 아이콘 |

**두 함수가 거의 동일한 데이터를 fetch!**

```typescript
// getFullUserData (shared/actions/user.ts) - ~109줄
{
  id, email, nickname, username,
  level, exp, points,
  icon_id, icon_url, icon_name,
  postCount, commentCount,
  is_admin,
  session
}

// getSidebarUserProfile (sidebar/actions/userProfile.ts) - ~124줄
{
  id, nickname, email,
  level, exp, points,
  icon_id, icon_url, icon_name,
  postCount, commentCount,
  is_admin
}
```

### 3.3 개선안

```typescript
// 1. AuthSection이 layout.tsx에서 전달받은 데이터 사용
// layout.tsx에서:
const authSection = <AuthSection userData={fullUserData} />;

// 2. getSidebarUserProfile 삭제
// 3. ServerUserProfile도 props로 데이터 받기
```

---

## 4. 페이지별 분석

### 4.1 boards/[slug]/page.tsx (290줄) - 개선 필요

**문제점:**
1. 290줄로 너무 긺
2. 데이터 fetch가 너무 많음:
   - `getBoardPageData()`
   - `fetchPosts()`
   - `getBoardPopularPosts()`
   - `getNotices()` (최대 2번)
   - `getSupabaseServer()` 직접 호출
3. 데이터 변환 로직이 페이지에 포함됨
4. 공지사항 처리 로직이 복잡함

**개선안:**
```typescript
// 1. 단일 서버 액션으로 통합
const pageData = await getBoardPageAllData(slug, page, params);

// 2. 데이터 변환은 utils로 분리
// 3. 페이지는 데이터 전달만 담당
return <BoardDetailLayout {...pageData} />;
```

### 4.2 livescore/football/page.tsx (117줄) - 양호

**잘된 점:**
- 단일 데이터 fetch
- 명확한 에러 처리
- 적절한 길이

---

## 5. 서버/클라이언트 분리 분석

### 5.1 현재 상태

```
서버 컴포넌트:
├── layout.tsx (루트)
├── page.tsx (대부분의 페이지)
├── AuthSection.tsx
├── ServerUserProfile.tsx
└── 기타 Server* 파일들

클라이언트 컴포넌트 ('use client'):
├── RootLayoutClient.tsx
├── 모든 Context 파일
├── 모든 hooks 파일
├── admin/ 페이지 전체
├── 대부분의 폼 컴포넌트
└── 인터랙티브 컴포넌트들
```

### 5.2 문제점

#### 문제: 명명 규칙 불일치

```
현재:
├── ServerUserProfile.tsx    ← Server 접두사
├── ClientUserProfile.tsx    ← Client 접두사
├── UserProfileClient.tsx    ← Client 접미사
├── PostList.tsx             ← 표시 없음 (클라이언트)
├── BoardList.tsx            ← 표시 없음 (서버? 클라이언트?)
```

**개선안:**
```
규칙 1 (권장): 클라이언트만 표시
├── UserProfile.tsx          ← 서버 (기본값)
├── UserProfile.client.tsx   ← 클라이언트 명시

규칙 2: 접미사 통일
├── UserProfileServer.tsx
├── UserProfileClient.tsx
```

---

## 6. Next.js + Supabase 최신 방식 준수

### 6.1 잘 준수한 부분 ✅

| 항목 | 상태 | 설명 |
|------|------|------|
| App Router | ✅ | 완전히 마이그레이션됨 |
| 서버 컴포넌트 | ✅ | 기본으로 사용 |
| 서버 액션 | ✅ | API 라우트 대신 사용 |
| async/await params | ✅ | Next.js 15 방식 준수 |
| Supabase SSR | ✅ | @supabase/ssr 패키지 사용 |
| 동적 렌더링 | ✅ | force-dynamic 적절히 사용 |

### 6.2 개선 필요 부분 ❌

| 항목 | 현재 | 권장 |
|------|------|------|
| 레거시 API 라우트 | 일부 존재 (/api/rss, /api/sync-teams) | 서버 액션으로 마이그레이션 |
| Streaming | 미사용 | Suspense + loading.tsx 활용 |
| Parallel Routes | 미사용 | 복잡한 레이아웃에서 활용 가능 |
| Route Groups | 일부 사용 | 더 활용 가능 |

---

## 7. 확장성/유지보수 관점 문제

### 7.1 발목 잡힐 구조들

#### 문제 1: 거대 페이지 컴포넌트

```typescript
// boards/[slug]/page.tsx - 290줄
// - 데이터 fetch 로직
// - 데이터 변환 로직
// - 조건부 렌더링 로직
// 모두 한 파일에...
```

**영향:**
- 새 기능 추가 시 290줄 파일 수정
- 테스트 어려움
- 버그 발생 가능성 높음

#### 문제 2: 중복 타입 정의

```
같은 데이터, 다른 타입:
├── HeaderUserData (shared/types/user.ts)
├── SidebarUserProfile (sidebar/actions/userProfile.ts)
├── FullUserData (shared/types/user.ts)
```

**영향:**
- 타입 변경 시 여러 곳 수정
- 불일치 버그 가능성

#### 문제 3: 도메인 간 강한 결합

```typescript
// boards/actions/getPostDetails.ts
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';

// → boards 도메인이 livescore에 의존
```

**영향:**
- livescore 변경이 boards에 영향
- 도메인 분리 의미 감소

---

## 8. 서버 액션 호출 빈도 / 캐시 전략 / 불필요한 렌더링

### 8.1 캐시 사용 현황

**React `cache()` 사용률:**
```
boards 도메인:     1/28 액션 (3.6%)
livescore 도메인:  ~5/20 액션 (25%)
전체 프로젝트:     ~10/100 액션 (10%)
```

**문제점:**
- 대부분의 서버 액션이 `cache()` 미사용
- 같은 요청 내에서도 중복 fetch 발생 가능
- `revalidatePath`/`revalidateTag` 사용이 불규칙

**개선 필요 액션:**
| 액션 | 현재 | 권장 |
|------|------|------|
| `getBoardPageData` | cache 없음 | `cache()` 적용 |
| `fetchPosts` | cache 없음 | React Query or cache |
| `getPopularPosts` | cache 없음 | `cache()` + 5분 revalidate |

### 8.2 불필요한 렌더링

**Context 사용 현황:**
```typescript
// AuthContext - 모든 하위 컴포넌트 리렌더링 유발 가능
// IconContext - 아이콘 변경 시 전체 리렌더링
// UIThemeContext - 테마 변경 시 전체 리렌더링
```

**권장:**
- Zustand로 마이그레이션 (이미 일부 사용 중)
- Context를 더 세분화하거나 memo 적용

---

## 9. Supabase 및 외부 API 비용

### 9.1 Supabase 호출 분석

**페이지별 DB 쿼리 수:**
| 페이지 | 현재 | 개선 후 |
|--------|------|---------|
| 루트 layout.tsx | 5회 | 3회 (통합 가능) |
| boards/[slug] | 6-7회 → 1회 | ✅ 완료 |
| 게시글 상세 | 4-5회 | 2회 가능 |

**RPC 사용:**
```
- increment_board_view_count
- increment_post_view_count
- update_user_exp
```

### 9.2 외부 API 비용 (api-sports.io)

**사용 파일: 40+ 개**
```
├── livescore/actions/       (~15개)
├── livescore/constants/     (~10개)
├── livescore/components/    (~15개)
└── shared/api/              (2개)
```

**비용 절감 방안:**
1. **캐싱 강화**: 실시간 경기 외에는 5-15분 캐시
2. **조건부 fetch**: 라이브 경기만 짧은 간격으로 새로고침
3. **배치 요청**: 여러 리그/팀 정보를 하나의 요청으로

**예상 비용 영향:**
```
현재: 모든 페이지 로드 시 라이브스코어 fetch
개선: 라이브스코어 페이지에서만 + 15분 캐시
→ API 호출 70% 이상 절감 가능
```

---

## 10. UX/사용자 플로우 분석

### 10.1 로딩 상태 처리

**현재 상태:**
```
loading.tsx 파일: 0개 ❌
Suspense 사용: 미미함
로딩 스피너: 일부 컴포넌트만
```

**문제점:**
- 페이지 전환 시 빈 화면 표시
- 데이터 로딩 중 사용자 피드백 없음
- Streaming/Progressive rendering 미활용

**개선안:**
```
src/app/
├── loading.tsx              ← 추가 필요 (전역 폴백)
├── boards/
│   ├── loading.tsx          ← 추가 필요
│   └── [slug]/
│       └── loading.tsx      ← 추가 필요
├── livescore/
│   └── loading.tsx          ← 추가 필요
```

### 10.2 에러 처리

**현재 상태:**
```
error.tsx 파일: 1개 (루트만)
not-found.tsx: 일부 존재
try-catch: 서버 액션에서 사용
```

**개선 필요:**
- 도메인별 error.tsx 추가
- 사용자 친화적 에러 메시지
- 재시도 버튼 제공

### 10.3 첫 진입 경험

**현재:**
- 첫 로딩 시 모든 데이터 동시 fetch (layout.tsx)
- 초기 로딩이 느릴 수 있음

**개선안:**
- Critical path만 먼저 로드
- 라이브스코어는 lazy load
- Above-the-fold 콘텐츠 우선

---

## 11. 보안/권한/데이터 안전

### 11.1 인증 검증

**잘된 점:**
```typescript
// 서버 액션에서 인증 확인
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Unauthorized');
```

**개선 필요:**
```typescript
// 일부 액션에서 인증 검사 누락 가능성
// 권한 레벨 검사 (admin only) 일관성 필요
```

### 11.2 RLS (Row Level Security)

**상태: 활성화됨**
```sql
-- boards, posts, comments 테이블에 RLS 적용
-- 사용자는 자신의 데이터만 수정 가능
```

### 11.3 XSS/Injection 방지

**Tiptap 에디터:**
- HTML 새니타이징 필요
- 현재 sanitize-html 사용 중 (확인 필요)

**SQL Injection:**
- Supabase 쿼리 빌더 사용 → 안전
- 직접 SQL 없음

---

## 12. 테스팅/안정성

### 12.1 테스트 현황

**현재 상태: 0개 테스트 파일 ❌**
```
*.test.ts:     0개
*.spec.ts:     0개
__tests__/:    폴더 없음
e2e/:          설정만 있음
```

**문제점:**
- 리팩토링 시 회귀 버그 위험
- 배포 전 검증 불가
- 코드 품질 보장 없음

**우선순위 테스트 대상:**
| 순위 | 대상 | 유형 |
|------|------|------|
| 1 | 인증 flow | E2E |
| 2 | 게시글 CRUD | 통합 |
| 3 | 서버 액션 | 단위 |
| 4 | 유틸 함수 | 단위 |

### 12.2 권장 테스트 커버리지

```
단기 목표: 핵심 기능 30%
중기 목표: 전체 60%
장기 목표: 80%+
```

---

## 13. 배포/운영

### 13.1 환경 설정

**현재 상태:**
```
.env.local          ← 로컬
.env.production     ← 프로덕션 (Vercel)
```

### 13.2 모니터링

**현재:**
- Vercel Analytics (기본)
- 에러 트래킹: 없음 ❌

**권장:**
- Sentry 또는 LogRocket 도입
- API 응답 시간 모니터링
- 사용자 행동 분석

### 13.3 CI/CD

**현재:**
- Vercel 자동 배포
- PR Preview

**개선:**
- GitHub Actions로 테스트 자동화
- 빌드 전 린트/타입 체크

---

## 14. UI 일관성 / 디자인 시스템

### 14.1 현재 상태

**UI 가이드라인 문서:**
- `docs/UI_GUIDELINES.md` (597줄) - 상세하지만 준수율 낮음

**정의된 디자인 토큰:**
```css
/* 배경 */
Primary:    bg-white dark:bg-[#1D1D1D]
Secondary:  bg-[#F5F5F5] dark:bg-[#262626]
Tertiary:   bg-[#EAEAEA] dark:bg-[#333333]

/* 텍스트 */
Primary:    text-gray-900 dark:text-[#F0F0F0]
Secondary:  text-gray-700 dark:text-gray-300
Tertiary:   text-gray-500 dark:text-gray-400

/* 테두리 */
Primary:    border-black/7 dark:border-white/0
Secondary:  border-black/5 dark:border-white/10
```

### 14.2 예상 문제점

**색상 불일치:**
```css
/* 같은 용도인데 다르게 작성된 케이스 */
dark:bg-[#1D1D1D]  vs  dark:bg-gray-900  vs  dark:bg-zinc-900
bg-slate-800       vs  bg-gray-800       vs  bg-black
```

**컴포넌트 패턴 불일치:**
```tsx
// 버튼 스타일이 파일마다 다름
bg-slate-800 dark:bg-[#3F3F3F]    // 파일 A
bg-gray-800 dark:bg-gray-700       // 파일 B
bg-black text-white                // 파일 C
```

**호버 효과 불일치:**
```css
hover:bg-gray-100      /* 가이드라인 위반 */
hover:bg-[#EAEAEA]     /* 올바른 패턴 */
hover:text-blue-600    /* 금지된 파란색 호버 */
```

### 14.3 분석 필요 항목

| 항목 | 검사 내용 |
|------|----------|
| 다크모드 색상 | `dark:bg-gray-*`, `dark:bg-zinc-*` 사용 여부 |
| 호버 색상 | `hover:text-blue-*`, `hover:bg-blue-*` 사용 여부 |
| 버튼 스타일 | 통일되지 않은 버튼 패턴 |
| 간격/패딩 | `p-*`, `px-*`, `py-*` 일관성 |
| ContainerHeader | 직접 div로 작성한 헤더 |
| 탭 버튼 | 공통 TabButton 미사용 |

### 14.4 권장 작업

1. **UI 위반 검색 스크립트** 작성
2. **컴포넌트별 위반 목록** 생성
3. **우선순위별 수정** (가장 많이 사용되는 컴포넌트부터)
4. **UI_GUIDELINES.md 정리** (중복 제거, 구조화)

---

## 15. 우선순위별 개선 작업 (재정리)

### 15.1 완료된 작업 ✅

| # | 작업 | 상태 |
|---|------|------|
| 1 | getSidebarUserProfile 제거 | ✅ 완료 |
| 2 | AuthSection 리팩토링 (props) | ✅ 완료 |
| 3 | boards/[slug]/page.tsx 분할 | ✅ 완료 |
| 4 | ProfileSidebar 클라이언트 DB 제거 | ✅ 완료 |
| 5 | UserProfile.tsx 삭제 | ✅ 완료 |

### 15.2 즉시 진행 (이번 주)

| # | 작업 | 영향도 | 난이도 | 카테고리 |
|---|------|--------|--------|----------|
| 6 | **loading.tsx 추가** | UX 대폭 개선 | 하 | UX |
| 7 | **UI 위반 검색/분석** | 일관성 파악 | 하 | UI |
| 8 | **cache() 적용 (boards)** | DB 호출 절감 | 중 | 캐시 |

### 15.3 단기 (1-2주)

| # | 작업 | 영향도 | 난이도 | 카테고리 |
|---|------|--------|--------|----------|
| 9 | UI 불일치 수정 (Top 20 파일) | 시각적 일관성 | 중 | UI |
| 10 | error.tsx 도메인별 추가 | 에러 UX 개선 | 하 | UX |
| 11 | 외부 API 캐싱 강화 | 비용 70% 절감 | 중 | 비용 |
| 12 | 핵심 서버 액션 테스트 | 안정성 | 중 | 테스트 |

### 15.4 중기 (2-4주)

| # | 작업 | 영향도 | 난이도 | 카테고리 |
|---|------|--------|--------|----------|
| 13 | boards 도메인 분할 | 149 → 50 파일 | 상 | 구조 |
| 14 | livescore 도메인 분할 | 160 → 50 파일 | 상 | 구조 |
| 15 | UI_GUIDELINES.md 재정리 | 가이드 품질 | 중 | UI |
| 16 | Sentry 도입 | 에러 모니터링 | 중 | 운영 |

### 15.5 장기 (1개월+)

| # | 작업 | 영향도 | 난이도 | 카테고리 |
|---|------|--------|--------|----------|
| 17 | E2E 테스트 (인증 flow) | 안정성 | 상 | 테스트 |
| 18 | Streaming/Suspense 전면 도입 | 성능 | 상 | 성능 |
| 19 | 디자인 토큰 CSS 변수화 | 유지보수 | 중 | UI |
| 20 | 컴포넌트 명명 규칙 통일 | 일관성 | 중 | 구조 |

---

## 16. 다음 진행 권장 순서

```
Phase 1: 빠른 UX 개선 (즉시)
├── loading.tsx 추가 (3-4개 파일)
├── UI 위반 검색/분석
└── cache() 적용

Phase 2: UI 일관성 (1-2주)
├── 가장 많이 위반된 패턴 수정
├── error.tsx 추가
└── UI_GUIDELINES.md 정리

Phase 3: 구조 개선 (2-4주)
├── boards 도메인 분할
├── livescore 도메인 분할
└── 타입 정의 통합

Phase 4: 안정성/모니터링 (장기)
├── 테스트 코드 작성
├── Sentry 도입
└── CI/CD 개선
```

**권장 시작점:** Phase 1의 loading.tsx 추가 (영향도 높음, 난이도 낮음)

---

## 17. 즉시 수정 가능한 작업 (기록용)

### 17.1 getSidebarUserProfile 중복 제거

**현재 문제:**
```
layout.tsx: getFullUserData() → 사용자 데이터 fetch
AuthSection.tsx: getSidebarUserProfile() → 같은 데이터 또 fetch!
```

**해결 방법:**
```typescript
// 1. layout.tsx에서 AuthSection에 props 전달
const authSection = <AuthSection userData={fullUserData} />;

// 2. AuthSection.tsx 수정
export default function AuthSection({ userData }: { userData: FullUserDataWithSession | null }) {
  return userData ? (
    <ServerUserProfile userData={userData} />
  ) : (
    <GuestAuthSection />
  );
}

// 3. ServerUserProfile.tsx 수정 (props 받기)
export default function ServerUserProfile({ userData }: { userData: FullUserDataWithSession }) {
  return <ClientUserProfile profileData={userData} />;
}

// 4. getSidebarUserProfile() 함수 삭제
```

**효과:**
- DB 호출 1회 감소
- 코드 ~124줄 삭제

---

## 18. 종합 평가

### 18.1 점수

**기본 항목 (1-7)**
| 항목 | 점수 | 설명 |
|------|------|------|
| 전체 구조 | 8/10 | 도메인 분리 잘됨, 크기 조절 필요 |
| 데이터 흐름 | 7/10 | 중복 fetch 해결됨, 일부 개선 필요 |
| 서버/클라이언트 분리 | 7/10 | 잘 분리됨, 명명 규칙 통일 필요 |
| 최신 방식 준수 | 8/10 | 대부분 준수, 일부 레거시 |
| 확장성 | 6/10 | 거대 파일/도메인 문제 |
| 유지보수성 | 7/10 | 구조 좋음, 중복 제거 필요 |

**추가 항목 (8-14)**
| 항목 | 점수 | 설명 |
|------|------|------|
| 캐시 전략 | 4/10 | cache() 사용률 ~10%, 대부분 미적용 |
| API 비용 | 5/10 | 외부 API 40+ 파일 사용, 캐싱 부족 |
| UX/로딩 | 3/10 | loading.tsx 0개, Streaming 미사용 |
| 보안 | 7/10 | RLS 활성화, 일부 검증 개선 필요 |
| 테스팅 | 1/10 | 테스트 파일 0개 ❌ |
| 배포/운영 | 6/10 | Vercel 연동됨, 모니터링 부족 |
| UI 일관성 | ?/10 | 분석 필요 (가이드라인 597줄 존재, 준수율 미확인) |

### 18.2 총평

**강점:**
- 도메인 주도 설계로 기능별 명확한 분리
- 서버 액션 중심의 현대적 아키텍처
- TypeScript + Supabase 타입 안정성

**개선 필요:**
- 중복 데이터 fetch 제거 (가장 시급)
- 거대 도메인 세분화
- 거대 페이지 컴포넌트 분할
- 명명 규칙 표준화

---

## 19. 다음 단계

1. ~~**즉시**: getSidebarUserProfile 중복 제거~~ ✅ 완료
2. ~~**이번 주**: AuthSection/ServerUserProfile 리팩토링~~ ✅ 완료
3. ~~**다음**: boards/[slug]/page.tsx 분할~~ ✅ 완료
4. **이후**: 도메인 세분화 계획 수립

---

## 20. 완료된 개선 사항

### 20.1 중복 fetch 문제 해결 (2026-01-17)

**삭제된 파일/함수:**
- `src/domains/sidebar/actions/userProfile.ts` (~124줄)
- `src/domains/sidebar/components/auth/ServerUserProfile.tsx` (~25줄)

**수정된 파일:**
- `src/app/layout.tsx`: AuthSection에 fullUserData props 전달
- `src/domains/sidebar/components/auth/AuthSection.tsx`: userData props로 변경

**결과:**
- DB 호출 4회 → 1회 (getFullUserData만 호출)
- 중복 코드 ~149줄 삭제
- 데이터 흐름 단순화

### 20.2 boards/[slug]/page.tsx 분할 (2026-01-18)

**생성된 파일:**
- `src/domains/boards/actions/getHoverMenuData.ts` (59줄)
- `src/domains/boards/actions/getBoardPageAllData.ts` (153줄)
- `src/domains/boards/utils/notice/noticeUtils.ts` (117줄)

**수정된 파일:**
- `src/app/boards/[slug]/page.tsx`: 290줄 → 142줄 (148줄 감소)
- `src/domains/boards/actions/posts/notices.ts`: `getNoticesForBoard()` 추가

**결과:**
- 페이지 내 fetch 6-7회 → 1회 (getBoardPageAllData)
- 공지사항/HoverMenu 로직 분리
- 단일 책임 원칙 적용

### 20.3 Profile/Auth 리팩토링 (2026-01-18)

**수정된 파일:**
- `src/domains/sidebar/components/ProfileSidebar.tsx`: 235줄 → 176줄
- `src/domains/sidebar/components/auth/ClientUserProfile.tsx`: showActions prop 추가
- `src/shared/components/AuthStateManager.tsx`: fullUserData prop 추가
- `src/app/RootLayoutClient.tsx`: fullUserData 전달

**삭제된 파일:**
- `src/domains/sidebar/components/auth/UserProfile.tsx` (258줄)

**결과:**
- 클라이언트 DB 호출 제거 (서버에서 props로 전달)
- 중복 타입 정의 제거
- useEffect 체인 → useMemo로 변경

---

## 21. 상세 분석 문서

| 문서 | 내용 |
|------|------|
| [boards-domain-refactoring.md](./boards-domain-refactoring.md) | boards 도메인 세분화 계획 (149파일 → 4개 도메인) |
| [boards-page-refactoring.md](./boards-page-refactoring.md) | boards/[slug]/page.tsx 분할 상세 |
| [profile-auth-refactoring.md](./profile-auth-refactoring.md) | Profile/Auth 리팩토링 상세 |
| [../UI_GUIDELINES.md](../UI_GUIDELINES.md) | UI 디자인 시스템 가이드라인 (597줄) |

---

*작성일: 2026-01-17*
*마지막 업데이트: 2026-01-18*
*검토 범위: 전체 코드베이스 (774개 파일)*
*추가 분석 기준: 서버 액션/캐시, API 비용, UX, 보안, 테스팅, 배포*
