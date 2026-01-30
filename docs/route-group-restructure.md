# Root Layout API 호출 완전 제거 - Route Group 재구조화

## 📋 현재 문제 상황

### 문제점
```
app/
├── layout.tsx (Root Layout)
│   └── RootLayoutClient
│       └── AuthStateManager
│           └── HeaderClient → fetchTodayMatchCount() ❌ API 호출!
│           └── LeagueStandings → fetchStandingsData() ❌ API 호출!
└── not-found.tsx → redirect('/not-found') ❌ 잘못된 접근
```

**발생하는 문제:**
1. `/abc` (존재하지 않는 URL) 접근
2. Root Layout 실행 → RootLayoutClient → HeaderClient 렌더링
3. `fetchTodayMatchCount()` 실행 → **API 호출 발생!**
4. `redirect('/not-found')` 실행 (이미 너무 늦음)

**결과:**
- ❌ 404 페이지에서도 API 호출 발생
- ❌ 봇 크롤링 시에도 API 비용 발생
- ❌ 빌드 시에도 API 호출 가능성

---

## 🎯 목표

**404 및 모든 에러 페이지에서 외부 API 호출 0개 달성**

- Root Layout: 완전히 무해 (Supabase DB 쿼리만, 외부 API 0)
- 일반 페이지: 헤더/사이드바 정상 작동 (API 호출 허용)
- 404/에러 페이지: API 호출 0개

---

## ✅ 해결 방안: Route Group 재구조화

### 핵심 아이디어

**Root Layout을 완전히 무해하게 만들고, 실제 사이트 레이아웃은 `(site)` route group으로 분리**

### 중요 원칙 ⚠️

**무해한 Provider는 Root에 유지해도 됨:**
- ✅ `QueryClientProvider` - 자체적으로 API 호출 안 함, 단순 컨텍스트 제공
- ✅ `ThemeProvider` - 테마 상태 관리만, API 호출 없음
- ✅ `AuthProvider` - 인증 상태 관리만, API 호출 없음
- ✅ `IconProvider` - 아이콘 상태 관리만, API 호출 없음
- ✅ `ToastContainer` - UI 라이브러리, API 호출 없음

**Root에서 제거해야 하는 것:**
- ❌ DB 쿼리 (`getFullUserData`, `getBoardsForNavigation` 등)
- ❌ 외부 API 호출 (`fetchMultiDayMatches`, `fetchStandingsData` 등)
- ❌ 데이터를 fetch하는 컴포넌트 (`HeaderClient`, `LeagueStandings` 등)

**왜 이렇게?**
- 404, 에러 페이지도 React Query를 사용할 수 있어야 함
- Provider 자체는 무해하므로 Root에 두는 게 안전
- 실제 데이터 fetch만 `(site)` layout으로 분리

### 목표 구조

```
app/
├── layout.tsx                    → 완전히 무해 (html/body, globals.css, providers만)
├── not-found.tsx                 → 독립 페이지 (redirect 없이 직접 렌더)
│
├── (auth)/                       → 인증 route group
│   ├── layout.tsx               → 인증 레이아웃 (로고만)
│   ├── signin/page.tsx
│   ├── signup/page.tsx
│   └── social-signup/page.tsx
│
├── (site)/                       → 메인 사이트 route group ★★★
│   ├── layout.tsx               → 사이트 레이아웃 (헤더/사이드바/푸터)
│   ├── page.tsx                 → 메인 페이지 (/)
│   ├── boards/
│   ├── shop/
│   ├── livescore/
│   ├── settings/
│   └── ... (기타 모든 일반 페이지)
│
└── admin/                        → 어드민 (독립 레이아웃)
    └── layout.tsx
```

### 작동 원리

**404 페이지 (`/abc` 접근):**
```
1. Root layout.tsx 실행 (무해, API 0)
2. not-found.tsx 렌더링 (독립 페이지)
3. 결과: API 호출 0개 ✅
```

**일반 페이지 (`/boards/all` 접근):**
```
1. Root layout.tsx 실행 (무해, API 0)
2. (site)/layout.tsx 실행 (헤더/사이드바 렌더링, API 호출)
3. (site)/boards/all/page.tsx 렌더링
4. 결과: 정상적으로 API 호출 ✅
```

---

## 📝 상세 작업 단계

### Phase 1: Route Group 생성

#### 1.1. `(site)` Route Group 생성
```bash
mkdir -p src/app/(site)
```

#### 1.2. `(site)/layout.tsx` 생성
- 현재 `RootLayoutClient.tsx`의 내용을 이동
- 헤더, 사이드바, 푸터 포함
- `isIndependentLayout` 로직 유지

---

### Phase 2: 기존 페이지 이동

#### 2.1. 메인 페이지 이동
```bash
mv src/app/page.tsx src/app/(site)/page.tsx
```

#### 2.2. 기타 페이지 디렉토리 이동
```bash
mv src/app/boards src/app/(site)/boards
mv src/app/shop src/app/(site)/shop
mv src/app/livescore src/app/(site)/livescore
mv src/app/settings src/app/(site)/settings
mv src/app/prediction src/app/(site)/prediction
mv src/app/search src/app/(site)/search
```

#### 2.3. API 라우트는 유지
```
src/app/api/ → 그대로 유지 (이동하지 않음)
```

---

### Phase 3: Root Layout 간소화

#### 3.1. `app/layout.tsx` 수정

**현재 (복잡):**
```typescript
// 외부 API 호출, DB 쿼리, 사용자 데이터, 게시판 데이터 등 많은 로직
const [fullUserData, headerBoardsData, uiTheme, seoSettings] = await Promise.all([...]);
return <RootLayoutClient ...많은 props... />;
```

**수정 후 (무해):**
```typescript
'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { AuthProvider } from '@/shared/context/AuthContext';
import { IconProvider } from '@/shared/context/IconContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // QueryClient 생성 (무해 - API 호출 안 함)
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    },
  }), []);

  return (
    <html lang="ko" className={inter.className}>
      <body className="w-full h-full overflow-x-hidden">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <IconProvider>
                {children}
                <ToastContainer />
              </IconProvider>
            </AuthProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

**변경 사항:**
- ✅ DB 쿼리 제거 (getFullUserData, getBoardsForNavigation 등)
- ✅ 외부 API 호출 제거 (이미 제거했지만 확인)
- ✅ RootLayoutClient 제거 → (site)/layout.tsx로 이동
- ✅ **무해한 Provider는 유지** (QueryClientProvider, ThemeProvider, AuthProvider, IconProvider)
  - 이들은 자체적으로 API를 호출하지 않음
  - 404 페이지 등에서도 안전하게 사용 가능
  - React Query 사용하는 모든 페이지에서 필요

---

### Phase 4: `(site)/layout.tsx` 생성

#### 4.1. 파일 생성 및 내용 작성

**위치:** `src/app/(site)/layout.tsx`

**내용:**
```typescript
import React from 'react';
import BoardNavigation from '@/domains/sidebar/components/board/BoardNavigation';
import AuthSection from '@/domains/sidebar/components/auth/AuthSection';
import LeagueStandings from '@/domains/sidebar/components/league/LeagueStandings';
import { RightSidebar } from '@/domains/sidebar/components';
import { getBoardsForNavigation } from '@/domains/layout/actions';
import { getFullUserData } from '@/shared/actions/user';
import SiteLayoutClient from './SiteLayoutClient';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // 서버 컴포넌트에서 데이터 fetch (Supabase만 - 외부 API 없음!)
  const [fullUserData, headerBoardsData] = await Promise.all([
    getFullUserData(),
    getBoardsForNavigation({ includeTotalPostCount: true }),
  ]);

  // 컴포넌트 생성
  const boardNav = <BoardNavigation />;
  const authSection = <AuthSection userData={fullUserData} />;
  const leagueStandingsComponent = <LeagueStandings initialLeague="premier" />;

  return (
    <SiteLayoutClient
      boardNavigation={boardNav}
      rightSidebar={<RightSidebar />}
      authSection={authSection}
      leagueStandingsComponent={leagueStandingsComponent}
      fullUserData={fullUserData}
      headerBoards={headerBoardsData.boardData}
      headerIsAdmin={headerBoardsData.isAdmin}
      headerTotalPostCount={headerBoardsData.totalPostCount}
    >
      {children}
    </SiteLayoutClient>
  );
}
```

**중요:**
- ❌ QueryClientProvider 제거 (Root에 이미 있음)
- ❌ AuthProvider, IconProvider 제거 (Root에 이미 있음)
- ❌ ToastContainer 제거 (Root에 이미 있음)
- ✅ Supabase DB 쿼리만 수행 (외부 API 없음)
- ✅ 헤더/사이드바 컴포넌트 생성 및 전달

#### 4.2. `SiteLayoutClient.tsx` 생성

**위치:** `src/app/(site)/SiteLayoutClient.tsx`

**내용:** 현재 `RootLayoutClient.tsx`의 내용을 복사하되 다음 수정:

**제거할 것:**
- ❌ `QueryClientProvider` - Root에 이미 있음
- ❌ `AuthProvider` - Root에 이미 있음
- ❌ `IconProvider` - Root에 이미 있음
- ❌ `ThemeProvider` - Root에 이미 있음
- ❌ `ToastContainer` - Root에 이미 있음

**유지할 것:**
- ✅ `isIndependentLayout` 로직 (admin, help 등)
- ✅ 사이드바 토글 로직
- ✅ `AuthStateManager` 컴포넌트
- ✅ 헤더/사이드바/푸터 레이아웃 구조

**핵심:**
- 이 파일은 순수하게 "사이트 레이아웃 UI"만 담당
- Provider는 이미 Root에 있으므로 여기서는 사용만 함 (useAuth, useIcon 등)

---

### Phase 5: `not-found.tsx` 수정

#### 5.1. Redirect 제거, 직접 렌더링

**현재:**
```typescript
import { redirect } from 'next/navigation';

export default function NotFound() {
  redirect('/not-found');
}
```

**수정 후:**
```typescript
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] dark:bg-[#000000] flex items-center justify-center py-8">
      <div className="w-full max-w-3xl px-6 space-y-4">
        {/* 404 카드 */}
        <div className="bg-white dark:bg-[#1D1D1D] border border-black/5 dark:border-white/5 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-black/5 dark:border-white/5">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">
              페이지를 찾을 수 없습니다
            </h1>
          </div>
          <div className="p-12">
            <div className="text-center space-y-6">
              <div className="text-8xl font-bold text-gray-200 dark:text-gray-700">404</div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-[#F0F0F0]">
                  요청하신 페이지를 찾을 수 없습니다
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.
                </p>
              </div>
              <div className="flex justify-center pt-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  메인페이지로 돌아가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**변경 사항:**
- ❌ Redirect 제거
- ✅ 독립적인 페이지로 직접 렌더링
- ✅ 자체 레이아웃 포함 (배경색, 중앙 정렬 등)

---

### Phase 6: 불필요한 파일 제거

```bash
# (error) route group 제거
rm -rf src/app/(error)

# 기존 RootLayoutClient.tsx 제거 (내용은 SiteLayoutClient로 이동했으므로)
rm src/app/RootLayoutClient.tsx
```

---

## 📂 파일별 변경 사항 요약

| 파일 | 작업 | 내용 |
|------|------|------|
| `app/layout.tsx` | 수정 | 완전히 간소화, 무해하게 (API 0) |
| `app/RootLayoutClient.tsx` | 삭제 | → `(site)/SiteLayoutClient.tsx`로 이동 |
| `app/not-found.tsx` | 수정 | Redirect 제거, 독립 페이지로 |
| `app/(site)/layout.tsx` | 생성 | 사이트 레이아웃 (헤더/사이드바) |
| `app/(site)/SiteLayoutClient.tsx` | 생성 | RootLayoutClient 내용 이동 |
| `app/(site)/page.tsx` | 이동 | `app/page.tsx` → 여기로 |
| `app/(site)/boards/` | 이동 | `app/boards/` → 여기로 |
| `app/(site)/shop/` | 이동 | `app/shop/` → 여기로 |
| `app/(site)/livescore/` | 이동 | `app/livescore/` → 여기로 |
| `app/(site)/settings/` | 이동 | `app/settings/` → 여기로 |
| `app/(site)/prediction/` | 이동 | `app/prediction/` → 여기로 |
| `app/(site)/search/` | 이동 | `app/search/` → 여기로 |
| `app/(error)/` | 삭제 | 불필요해짐 |

---

## 🧪 검증 방법

### 1. 로컬 테스트

#### 404 페이지 테스트
```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 테스트
http://localhost:3000/abc
http://localhost:3000/nonexistent-page

# Chrome DevTools → Network 탭
# 필터: "api-sports.io"
# 결과: 0개 요청 ✅
```

#### 일반 페이지 테스트
```bash
# 메인 페이지
http://localhost:3000

# 게시판
http://localhost:3000/boards/all

# Network 탭에서 확인:
# - 헤더/사이드바 정상 렌더링 ✅
# - fetchTodayMatchCount 호출 확인 ✅
# - fetchStandingsData 호출 확인 ✅
```

#### 인증 페이지 테스트
```bash
http://localhost:3000/signin

# 확인:
# - (auth) 레이아웃 적용 ✅
# - 헤더/사이드바 없음 ✅
# - API 호출 없음 ✅
```

---

### 2. 빌드 테스트

```bash
npm run build

# 빌드 로그 확인:
# - API 호출 발생하지 않아야 함
# - 모든 페이지 정상 빌드되어야 함
```

---

### 3. 배포 후 테스트

```bash
# 배포 후 production 환경에서 테스트
https://your-domain.com/abc

# api-football 대시보드 확인:
# - 404 접근 시 API 호출 0개 확인
```

---

## 🔄 롤백 방법

### Git을 사용하는 경우

```bash
# 변경 전 커밋 생성
git add -A
git commit -m "Before route group restructure"

# 문제 발생 시 롤백
git reset --hard HEAD~1
```

### 수동 롤백

1. `(site)` 폴더의 모든 내용을 `app/` 루트로 이동
2. `app/layout.tsx` 복구 (백업에서)
3. `app/RootLayoutClient.tsx` 복구
4. `app/not-found.tsx` 복구 (redirect 버전)
5. `(site)` 폴더 삭제

---

## 📊 예상 결과

### Before (현재)

```
봇이 /abc 접근:
  ├─ Root Layout 실행
  │   ├─ getFullUserData() → Supabase
  │   ├─ getBoardsForNavigation() → Supabase
  │   └─ RootLayoutClient
  │       └─ HeaderClient → fetchTodayMatchCount() → API 1회 ❌
  └─ redirect('/not-found')

총 외부 API: 1회 ❌
```

### After (재구조화 후)

```
봇이 /abc 접근:
  ├─ Root Layout 실행 (무해)
  │   └─ ThemeProvider만
  └─ not-found.tsx 렌더링 (독립)

총 외부 API: 0회 ✅
```

```
사용자가 / 접근:
  ├─ Root Layout 실행 (무해)
  ├─ (site)/layout.tsx 실행
  │   ├─ getFullUserData() → Supabase
  │   ├─ getBoardsForNavigation() → Supabase
  │   └─ SiteLayoutClient
  │       └─ HeaderClient → fetchTodayMatchCount() → API 1회 ✅
  └─ (site)/page.tsx 렌더링

총 외부 API: 1회 (정상) ✅
```

---

## ⚠️ 주의사항

### 1. URL 경로는 변경되지 않음

Route Group `(site)`는 URL에 영향을 주지 않습니다:
- ✅ `app/(site)/boards/page.tsx` → `/boards` (URL 동일)
- ✅ `app/(site)/page.tsx` → `/` (URL 동일)

### 2. import 경로 확인

페이지 이동 후 상대 경로 import가 있다면 조정 필요:
```typescript
// Before: app/boards/page.tsx
import Component from '../components/Something'; // ❌ 깨질 수 있음

// After: app/(site)/boards/page.tsx
import Component from '@/shared/components/Something'; // ✅ 절대 경로 사용
```

### 3. Metadata 함수 확인

`generateMetadata`, `generateStaticParams` 등이 있는 페이지는 정상 작동하는지 확인 필요

### 4. API 라우트는 이동하지 않음

`app/api/` 폴더는 그대로 유지 (Route Group으로 이동하면 안 됨)

---

## 🎯 성공 기준

1. ✅ 404 페이지에서 외부 API 호출 **0개**
2. ✅ 일반 페이지에서 헤더/사이드바 **정상 작동**
3. ✅ 빌드 시 외부 API 호출 **0개**
4. ✅ 배포 후 봇 크롤링 시 API 비용 **발생하지 않음**
5. ✅ 모든 기존 기능 **정상 작동**
6. ✅ URL 경로 **변경 없음**
7. ✅ SEO 영향 **없음**

---

## 📅 작업 순서

1. ✅ 문서 작성 및 검토
2. Git 커밋 (백업)
3. `(site)` route group 생성
4. `(site)/layout.tsx` 및 `SiteLayoutClient.tsx` 생성
5. 페이지 파일 이동 (`page.tsx`, `boards/`, `shop/` 등)
6. Root `layout.tsx` 간소화
7. `not-found.tsx` 수정
8. 불필요한 파일 제거 (`RootLayoutClient.tsx`, `(error)/`)
9. 로컬 테스트
10. 빌드 테스트
11. 커밋 및 배포
12. Production 환경 검증

---

*이 문서는 Root Layout에서 외부 API 호출을 완전히 제거하기 위한 Route Group 재구조화 계획입니다.*
