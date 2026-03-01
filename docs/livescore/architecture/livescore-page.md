# 라이브스코어 페이지 (`/livescore/football`) 아키텍처 검토

> `docs/livescore/architecture.md` 표준 대비 실제 코드 검증 결과.

**검토일**: 2026-02-27

---

## 검토 요약

| 아키텍처 항목 | 상태 | 비고 |
|:-------------|:----:|:-----|
| §2 API 호출 래퍼 | ✅ | `fetchFromFootballApi()` 경유 |
| §3 캐시 계층 (L1/L3/L4) | ✅ | 서버 cache() + 클라이언트 React Query |
| §4 Query Key 관리 | ✅ | `shared/constants/queryKeys.ts`에서 import |
| §5 Hydration 패턴 | ✅ | initialData props (§5.1 표준) |
| §7 폴링 정책 | ✅ | LIVE 30초 / 오늘 60초 / 나머지 없음 |
| §8 이미지 파이프라인 | ✅ | 4590 표준 완전 준수 |
| §12 force-dynamic | ⚠️→✅ | 중복 선언 **제거됨** |

---

## 수정된 사항

### 1. `force-dynamic` 중복 제거

**파일**: `src/app/(site)/livescore/football/page.tsx`

| Before | After |
|--------|-------|
| `export const dynamic = 'force-dynamic';` | **삭제** |

**이유**:
- 이 페이지는 `searchParams`를 사용 (`await searchParamsPromise`)
- Next.js 15에서 `searchParams` 사용 시 **자동으로 dynamic 렌더링** 적용
- `force-dynamic`은 중복 선언이며, 제거해도 동작 동일
- 아키텍처 §12: "searchParams 사용 시 이미 자동 dynamic → 중복 선언 불필요"

### 2. production console.log 제거

**파일**: `src/domains/livescore/hooks/useLiveScoreQueries.ts`

| 위치 | 내용 | 처리 |
|------|------|------|
| `useMatches` queryFn 내 | `console.log('🔴 [CLIENT] API 호출:', formattedDate)` | **삭제** |
| `useLiveScore` getInitialDataForDate 내 | `console.log('✅ [SERVER] ...')` × 3 + `console.log('⚠️ ...')` × 1 | **삭제** |

**파일**: `src/domains/livescore/components/football/MainView/LiveScoreView.tsx`

| 위치 | 내용 | 처리 |
|------|------|------|
| useEffect (dev 통계) | `console.log('📊 [LiveScore] 서버 프리로드 통계:', ...)` | **useEffect 전체 삭제** |

**이유**:
- `useMatches`, `useLiveScore`의 console.log는 `NODE_ENV` 분기 없이 프로덕션에서 노출
- `LiveScoreView`는 `NODE_ENV` 체크가 있었지만, 기능적 역할 없는 개발용 로그 → 정리

---

## 데이터 흐름

```
page.tsx (서버, searchParams → 자동 dynamic)
  ├─ Promise.all([
  │    fetchMatchesByDateCached(yesterday),
  │    fetchMatchesByDateCached(today),         ← cache() 래핑
  │    fetchMatchesByDateCached(tomorrow),
  │  ])
  ├─ transformMatches() × 3 → Match[]
  └─ <LiveScoreView
       initialYesterday / initialToday / initialTomorrow    (3개 데이터)
       initialDate / yesterdayDate / tomorrowDate            (3개 날짜)
     />

LiveScoreView (클라이언트)
  └─ useLiveScore(selectedDate, { initial* })
       ├─ getInitialDataForDate(date) → 날짜별 initialData 매핑
       ├─ useMatches(date, { initialData, showLiveOnly })
       │    ├─ queryKey: liveScoreKeys.matches(date)
       │    ├─ queryFn: fetchMatchesByDate → transformMatches
       │    └─ 폴링: LIVE 30초 / 오늘 60초 / 나머지 없음
       └─ useTodayLiveCount(!isToday)
            └─ 다른 날짜 볼 때만 오늘 라이브 카운트 별도 조회
```

---

## 항목별 상세 검증

### §2 API 호출 래퍼 — ✅ 정상

**서버 (page.tsx)**:
```
fetchMatchesByDateCached(date)
  → fetchMatchesByDate(date)
    → fetchMatchesByDateRaw(date)
      → fetchFromFootballApi('fixtures', { date })    ← 표준 래퍼
    → resolveMatchImages()                             ← 4590 이미지 해결
```

**클라이언트 (useMatches queryFn)**:
```
fetchMatchesByDate(date)     ← Server Action 직접 호출
  → fetchMatchesByDateRaw(date)
    → fetchFromFootballApi()  ← 표준 래퍼
```

서버는 `cache()` 래핑 버전, 클라이언트는 일반 버전 사용. 정상 — `cache()`는 서버 렌더 사이클 전용.

---

### §3 캐시 계층 — ✅ 정상

| 계층 | 적용 | 상세 |
|------|:----:|------|
| L1 (Data Cache) | ✅ | `fetchFromFootballApi()` → `revalidate: 60` (fixtures) |
| L2 (match_cache) | — | 리스트 뷰에서는 FT 개별 캐시 불필요 |
| L3 (React cache) | ✅ | `fetchMatchesByDateCached = cache(...)` |
| L4 (React Query) | ✅ | staleTime 5분, gcTime 30분 |

---

### §4 Query Key 관리 — ✅ 정상

| 파일 | import 경로 | 사용하는 키 |
|------|------------|------------|
| `useLiveScoreQueries.ts:9` | `@/shared/constants/queryKeys` | `liveScoreKeys.matches(date)` |

`useMatches`와 `useTodayLiveCount` 모두 shared 키 사용. 로컬 키 정의 없음.

---

### §5 Hydration 패턴 — ✅ 정상 (initialData props)

**§5.1 표준 패턴 적용**:
- 서버에서 3일치 데이터 fetch → `transformMatches()` 변환
- `initialData` props로 클라이언트에 전달
- `useLiveScore` → `getInitialDataForDate()` → 날짜별 매핑 → `useMatches({ initialData })`

---

### §7 폴링 정책 — ✅ 정상

| 조건 | 설정값 | 아키텍처 표준 | 일치 |
|------|--------|-------------|:----:|
| LIVE 모드 (showLiveOnly=true) | 30초 | 30초 | ✅ |
| 오늘 날짜 (KST) | 60초 | 60초 | ✅ |
| 과거/미래 날짜 | `false` | 없음 | ✅ |
| 탭 비활성 | `refetchIntervalInBackground: false` | 중지 | ✅ |
| 마운트 시 | `refetchOnMount: false` | — | ✅ |
| 포커스 시 | `refetchOnWindowFocus: false` | — | ✅ |
| 재연결 시 | `refetchOnReconnect: false` | — | ✅ |

`useTodayLiveCount`:
- 60초 폴링 (오늘 기준 라이브 카운트)
- 다른 날짜 조회 시에만 `enabled` → 오늘이면 `useMatches`에서 카운트 파생

---

### §8 이미지 파이프라인 (4590 표준) — ✅ 정상

**팀 로고** (`MatchCard/index.tsx`):
- `UnifiedSportsImageClient` 사용 (line 5)
- `match.teams.home.img` → `resolveMatchImages()`에서 Storage URL 설정
- placeholder: `/images/placeholder-team.svg`

**리그 로고** (`LeagueMatchList/index.tsx`):
- `UnifiedSportsImageClient` 사용 (line 7)
- `srcDark={group.logoDark}` 다크모드 지원
- placeholder: `/images/placeholder-league.svg`

---

### §12 force-dynamic — ✅ 수정 완료

| Before | After | 이유 |
|--------|-------|------|
| `export const dynamic = 'force-dynamic'` | 삭제 | `searchParams` 사용으로 이미 자동 dynamic |

---

## 알려진 기술부채 (§13 참고)

### P4-3. useLiveScore 6-prop code smell

```typescript
<LiveScoreView
  initialYesterday={...}  initialToday={...}  initialTomorrow={...}
  initialDate={...}       yesterdayDate={...}  tomorrowDate={...}
/>
```

데이터(3)와 날짜(3)가 분리되어 매칭 실수 가능. 목표:
```typescript
type PreloadedDay = { matches: Match[]; date: string };
<LiveScoreView yesterday={...} today={...} tomorrow={...} />
```

### STATUS_MAP 중복

| 파일 | 위치 |
|------|------|
| `MainView/MatchCard/index.tsx` | 라이브스코어 경기 카드 |
| `live-score-widget/MatchCardServer.tsx` | 메인 위젯 경기 카드 |

동일한 상태 매핑이 2곳에 정의됨. 공통 상수로 추출 가능.

### KST 날짜 유틸 중복

| 파일 | 함수명 | 동일 로직 |
|------|--------|----------|
| `page.tsx:19` | `getKstDateString()` | ✅ |
| `useLiveScoreQueries.ts:12` | `getTodayKst()` | ✅ |
| `footballApi.ts` | `toKstDateString()` | ✅ |

3곳에서 같은 KST 날짜 변환 로직 사용. shared 유틸로 통합 가능.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/app/(site)/livescore/football/page.tsx` | 라이브스코어 서버 컴포넌트 |
| `src/domains/livescore/components/football/MainView/LiveScoreView.tsx` | 메인 뷰 클라이언트 컴포넌트 |
| `src/domains/livescore/hooks/useLiveScoreQueries.ts` | `useMatches`, `useLiveScore`, `useTodayLiveCount` |
| `src/domains/livescore/utils/transformMatch.ts` | `transformMatches()` 변환 |
| `src/domains/livescore/types/match.ts` | `Match` 타입 정의 |
| `src/domains/livescore/components/football/MainView/NavigationBar/index.tsx` | 날짜 네비게이션 + LIVE 필터 |
| `src/domains/livescore/components/football/MainView/LeagueMatchList/index.tsx` | 리그별 경기 그룹 렌더링 |
| `src/domains/livescore/components/football/MainView/MatchCard/index.tsx` | 경기 카드 (UnifiedSportsImageClient) |
| `src/domains/livescore/components/football/MainView/LiveScoreSkeleton.tsx` | 로딩 스켈레톤 |
