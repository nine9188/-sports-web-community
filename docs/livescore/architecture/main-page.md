# 메인페이지 (`/`) 아키텍처 검토

> `docs/livescore/architecture.md` 표준 대비 실제 코드 검증 결과.

**검토일**: 2026-03-01 (P4-1/P4-2/P4-4 반영)

---

## 검토 요약

| 아키텍처 항목 | 상태 | 비고 |
|:-------------|:----:|:-----|
| §2 API 호출 래퍼 | ✅ | `fetchFromFootballApi()` 경유 |
| §3 캐시 계층 (L1/L3/L4) | ✅ | L2는 해당 없음 (FT 캐시 불필요) |
| §4 Query Key 관리 | ✅ | `shared/constants/queryKeys.ts`에서 import |
| §5 Hydration 패턴 | ✅ | CacheSeeder (§5.2 예외 패턴) |
| §7 폴링 정책 | ✅ | 폴링 없음 (메인 위젯은 정적 서버 렌더링) |
| §8 이미지 파이프라인 | ✅ | 4590 표준 완전 준수 |
| §12 force-dynamic | ✅ | 사용 안 함 (정상) |

---

## 수정된 사항

### 1. `fetchLiveScoreData()` dead code 제거

**파일**: `LiveScoreWidgetV2Server.tsx`

| 항목 | Before | After |
|------|--------|-------|
| `fetchLiveScoreData()` 함수 | export 함수로 존재 (132~140행) | **삭제** |
| `fetchMultiDayMatches` import | 사용됨 (fetchLiveScoreData 내부) | **import 제거** |
| fallback 로직 | `initialData ?? await fetchLiveScoreData()` | `initialData ?? []` |

**이유**:
- `fetchLiveScoreData()`는 외부에서 import하는 곳이 **0곳** (docs 참조만 존재)
- `page.tsx`가 항상 `initialData`를 전달하므로 fallback이 실행되지 않음
- 불필요한 `fetchMultiDayMatches` import가 코드 의존성을 복잡하게 만듦
- 제거 후 위젯 컴포넌트는 순수 렌더링 역할만 담당 (데이터 fetch 책임은 page.tsx)

---

## 데이터 흐름

```
page.tsx (서버)
  │
  ├─ fetchMultiDayMatches()          ← API 3회 병렬 (어제/오늘/내일)
  │   └─ resolveMatchImages()        ← Supabase 이미지 해결
  │
  ├─ multiDayData (raw)
  │   │
  │   ├──→ transformToWidgetLeagues(multiDayData)
  │   │     └─ BIG_MATCH_LEAGUES 필터 → convertToMatch → groupMatchesByLeague
  │   │     └─ WidgetLeague[] (위젯 전용 타입) → <LiveScoreWidgetV2 initialData={...}>
  │   │
  │   └──→ <LiveScoreCacheSeeder data={multiDayData} />
  │         └─ setQueryData(liveScoreKeys.multiDay(), multiDayData)
  │             │
  │             ├──→ HeaderClient → useTodayMatchCount() → 초록점 배지
  │             └──→ LiveScoreModalClient → useMultiDayMatches() → 모달 경기목록
```

### 소비자 3곳

| 소비자 | 위치 | 데이터 전달 방식 | 사용하는 데이터 |
|--------|------|-----------------|----------------|
| **LiveScoreWidgetV2** | page.tsx 자식 | `initialData` props (변환된 `WidgetLeague[]`) | 빅매치 리그만 필터링된 경기 목록 |
| **HeaderClient** | layout.tsx 자식 | CacheSeeder → `useTodayMatchCount()` | 오늘 경기 수 (초록점 배지) |
| **LiveScoreModalClient** | layout.tsx 자식 | CacheSeeder → `useMultiDayMatches()` | 어제/오늘/내일 전체 경기 |

---

## 항목별 상세 검증

### §2 API 호출 래퍼 — ✅ 정상

**표준**: 모든 API-Sports 호출은 `fetchFromFootballApi()`를 경유해야 한다.

```
page.tsx
  → fetchMultiDayMatches()           (footballApi.ts, cache 래핑)
    → fetchMatchesByDateRaw() × 3    (3일치 병렬)
      → fetchFromFootballApi()       (표준 래퍼)
```

- endpoint별 `next: { revalidate: 60 }` 자동 적용 (fixtures)
- 파라미터 알파벳순 정렬 → 캐시 키 안정성 보장

---

### §3 캐시 계층 — ✅ 정상

| 계층 | 적용 | 상세 |
|------|:----:|------|
| L1 (Data Cache) | ✅ | `fetchFromFootballApi()` → `revalidate: 60` |
| L2 (match_cache) | — | 메인 위젯은 FT 개별 경기 캐시 불필요 |
| L3 (React cache) | ✅ | `fetchMultiDayMatches = cache(async () => ...)` |
| L4 (React Query) | ✅ | CacheSeeder → `staleTime: 5분`, `gcTime: 10분` |

---

### §4 Query Key 관리 — ✅ 정상

| 파일 | import 경로 | 사용하는 키 |
|------|------------|------------|
| `LiveScoreCacheSeeder.tsx` | `@/shared/constants/queryKeys` | `liveScoreKeys.multiDay()` |
| `useLiveScoreData.ts` | `@/shared/constants/queryKeys` | `liveScoreKeys.multiDay()` |

로컬 키 정의 없음. shared에서 올바르게 import.

---

### §5 Hydration 패턴 — ✅ 정상 (CacheSeeder 예외)

**page→layout 경계 문제**:
- HeaderClient, LiveScoreModalClient는 `layout.tsx` 자식 → page에서 props 전달 불가
- HydrationBoundary도 page.tsx 안에서 선언 → layout 자식에 도달 안 함
- CacheSeeder가 유일한 해법

**CacheSeeder 안전장치**:
- `useRef(false)` 가드로 1회만 실행
- `liveScoreKeys.multiDay()` → `['liveScore', 'multiDay']`
- `useTodayMatchCount()`는 같은 캐시에서 `data?.data?.today?.matches?.length` 파생 → 추가 API 없음

---

### §7 폴링 정책 — ✅ 정상 (해당 없음)

메인 위젯은 **서버 렌더링 전용** — 클라이언트 폴링 없음.

- `useMultiDayMatches()`: `refetchOnWindowFocus: false`, 폴링 없음
- `useTodayMatchCount()`: 캐시에서 파생, 추가 fetch 없음

---

### §8 이미지 파이프라인 (4590 표준) — ✅ 정상

**팀 로고**:
```
resolveMatchImages()
  → getTeamLogoUrls([...ids])       ← Supabase Storage URL 일괄 조회
  → applyImageUrls()                ← match.teams.home.logo = StorageURL
  → MatchCardServer
    → UnifiedSportsImageClient       ← Storage URL 렌더링
```

**리그 로고** (다크모드 포함):
```
resolveMatchImages()
  → getLeagueLogoUrls([...ids], false)  ← 라이트 모드
  → getLeagueLogoUrls([...ids], true)   ← 다크 모드
  → applyImageUrls()
    → match.league.logo / logoDark = StorageURL
  → LeagueHeader
    → MutationObserver 다크모드 감지
    → UnifiedSportsImageClient
```

- API-Sports 원본 URL이 클라이언트에 도달하지 않음 ✅
- LCP 최적화: 첫 리그만 `priorityImages={true}` ✅

---

### §12 force-dynamic — ✅ 정상

메인페이지는 `force-dynamic` 미사용. `cookies()` 사용으로 자동 dynamic 렌더링.

---

## 알려진 기술부채 (§13 참고)

아키텍처 준수 여부와는 무관한 **프로젝트 레벨 개선 사항**.

### ~~P4-1. convertToMatch vs transformMatches 로직 중복~~ — ✅ 해결

`resolveMatchNames()` 공통 유틸리티 추출 완료 (`livescore/utils/resolveMatchNames.ts`).
`transformMatches()`와 `convertToMatch()` 모두 이 유틸을 사용하여 한국어 이름 매핑 단일 소스 유지.

### ~~P4-2. Match 타입 이름 충돌~~ — ✅ 해결

위젯 타입을 네임스페이스 분리 완료:

| Before | After |
|--------|-------|
| `Match` | `WidgetMatch` |
| `Team` | `WidgetTeam` |
| `League` | `WidgetLeague` |

### ~~P4-4. 메인→라이브스코어 이동 시 오늘 데이터 이중 fetch~~ — ✅ P2에서 해결

라이브스코어 HydrationBoundary 전환으로 클라이언트 React Query 캐시 공유 가능.
L1 캐시 히트 + 클라이언트 캐시 히트로 중복 fetch 방지.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/app/(site)/page.tsx` | 메인 페이지 서버 컴포넌트 |
| `src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2Server.tsx` | 위젯 서버 (변환 + 렌더링) |
| `src/domains/widgets/components/live-score-widget/MatchCardServer.tsx` | 경기 카드 (UnifiedSportsImageClient) |
| `src/domains/widgets/components/live-score-widget/LeagueHeader.tsx` | 리그 헤더 (다크모드 로고 전환) |
| `src/domains/widgets/components/live-score-widget/LeagueToggleClient.tsx` | 펼침/접기 토글 |
| `src/domains/widgets/components/live-score-widget/types.ts` | 위젯 전용 타입 |
| `src/shared/components/LiveScoreCacheSeeder.tsx` | RQ 캐시 주입 |
| `src/domains/livescore/hooks/useLiveScoreData.ts` | `useMultiDayMatches`, `useTodayMatchCount` |
| `src/domains/livescore/actions/footballApi.ts` | `fetchMultiDayMatches`, `resolveMatchImages` |
