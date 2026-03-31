# 라이브스코어 위젯 아키텍처

## 전체 구조 요약

라이브스코어 데이터는 **오늘 경기만 서버에서 fetch**하고, 어제/내일은 **모달 탭 클릭 시 lazy fetch**합니다.

| 소비자 | 위치 | 데이터 | 방식 |
|--------|------|--------|------|
| `LiveScoreWidgetV2Server` | 홈 페이지 본문 | 오늘 빅매치 | SSR |
| `HeaderClient` | 레이아웃 헤더 | 오늘 경기 수 | CacheSeeder → RQ |
| `LiveScoreModalClient` | 헤더 모달 | 오늘: 캐시 / 어제·내일: lazy | RQ |

---

## 데이터 흐름도

```
┌─────────────────── 서버 ───────────────────────────────────┐
│                                                             │
│  page.tsx                                                   │
│    └─ <Suspense fallback={<LiveScoreSkeleton />}>           │
│       └─ LiveScoreWidgetStreaming()                         │
│          │                                                  │
│          ├─ await fetchTodayMatches()                       │
│          │   ├─ fetchMatchesByDateRaw(오늘)                 │
│          │   │        ↓                                     │
│          │   │   API-Football (revalidate: 2분)             │
│          │   │        ↓                                     │
│          │   └─ resolveMatchImages()                        │
│          │        ├─ getTeamLogoUrls()    (unstable_cache 1h)│
│          │        └─ getLeagueLogoUrls() (unstable_cache 1h)│
│          │                                                  │
│          ├─ <LiveScoreCacheSeeder data={todayData} />      │
│          │   └─ queryClient.setQueryData() → React Query   │
│          │                                                  │
│          └─ <LiveScoreWidgetV2Server initialData={leagues}/>│
│              └─ SSR HTML 생성 (오늘 빅매치만)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                    │
                    │  HTML Streaming
                    ▼
┌─────────────────── 클라이언트 ──────────────────────────────┐
│                                                             │
│  ┌─ HeaderClient ─────────────────────────────────────┐    │
│  │  useTodayMatchCount()                               │    │
│  │    └─ useTodayMatches()                             │    │
│  │       └─ React Query 캐시 HIT (Seeder가 주입)      │    │
│  │       → 오늘 경기 수 뱃지 표시                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─ LiveScoreModalClient ─────────────────────────────┐    │
│  │                                                     │    │
│  │  [오늘 탭] useTodayMatches()                        │    │
│  │    → CacheSeeder 캐시 HIT (추가 fetch 없음)        │    │
│  │                                                     │    │
│  │  [어제 탭 클릭] useDateMatches('yesterday', true)   │    │
│  │    → fetchMatchesByDateLabel('yesterday')           │    │
│  │    → Spinner → 데이터 표시                          │    │
│  │                                                     │    │
│  │  [내일 탭 클릭] useDateMatches('tomorrow', true)    │    │
│  │    → fetchMatchesByDateLabel('tomorrow')            │    │
│  │    → Spinner → 데이터 표시                          │    │
│  │                                                     │    │
│  │  * 한번 fetch한 데이터는 RQ 캐시 (10분)            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─ LiveScoreWidget (SSR HTML) ───────────────────────┐    │
│  │  서버에서 이미 렌더링 완료                           │    │
│  │  클라이언트 훅 없음 → 새로고침 전까지 정적           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 캐싱 레이어 (3단계)

### 1단계: Next.js Data Cache (서버)

| 대상 | revalidate | 설명 |
|------|-----------|------|
| fixtures (경기) | **120초 (2분)** | API-Football → Next.js fetch cache |
| events (이벤트) | 15초 | 실시간 경기 이벤트 |
| standings (순위) | 3600초 (1시간) | 순위표 |
| transfers (이적) | 86400초 (24시간) | 이적 정보 |

**동작**: 새로고침해도 2분 이내면 캐시된 응답 반환. 2분 경과 후 stale-while-revalidate로 백그라운드 갱신.

### 2단계: React `cache()` (서버 렌더링 사이클)

```typescript
export const fetchTodayMatches = cache(async () => { ... });
```

- 같은 렌더링 요청 내 중복 호출 방지 (deduplication)
- 요청 간에는 공유되지 않음

### 3단계: React Query (클라이언트)

```typescript
// useTodayMatches 설정 (오늘 데이터)
{
  staleTime: 60초,              // 1분 후 stale 처리
  gcTime: 300초,                // 5분 후 캐시 삭제
  refetchOnWindowFocus: true,   // 탭 복귀 시 refetch
}

// useDateMatches 설정 (어제/내일 lazy fetch)
{
  enabled: false → true,        // 탭 클릭 시 활성화
  staleTime: 120초,             // 2분 후 stale 처리
  gcTime: 600초,                // 10분 후 캐시 삭제
}
```

---

## 캐시 키 구조

```typescript
// src/shared/constants/queryKeys.ts
export const liveScoreKeys = {
  all: ['liveScore'],
  matches: (date: string) => [...all, 'matches', date],     // 날짜별 (어제/내일 lazy용)
  liveCount: () => [...all, 'liveCount'],
  multiDay: () => [...all, 'multiDay', todayKST],           // 오늘 데이터 (위젯/헤더 공유)
};
```

- `multiDay` 키에 **오늘 날짜(KST)** 포함 → 자정에 자동 무효화
- 위젯, 헤더가 `liveScoreKeys.multiDay()` 공유
- 어제/내일은 `liveScoreKeys.matches('yesterday'|'tomorrow')` 별도 키

---

## CacheSeeder 패턴

**문제**: 위젯은 `page.tsx`에 있고, 헤더/모달은 `layout.tsx`에 있어서 props 전달 불가.

**해결**: `LiveScoreCacheSeeder`가 서버 데이터를 React Query 캐시에 주입.

```typescript
// LiveScoreCacheSeeder.tsx
export default function LiveScoreCacheSeeder({ data }: { data: TodayMatchesResult }) {
  const queryClient = useQueryClient();
  const seeded = useRef(false);

  if (!seeded.current && data) {
    queryClient.setQueryData(liveScoreKeys.multiDay(), data);
    seeded.current = true;
  }
  return null;
}
```

---

## 전용 라이브스코어 페이지와의 차이

| | 메인 페이지 위젯 | /livescore/football 페이지 |
|---|---|---|
| **데이터 훅** | `useTodayMatches()` | `useMatches(date)` |
| **초기 fetch** | 오늘만 | 선택 날짜 전체 |
| **자동 폴링** | 없음 | 30초 (라이브) / 60초 (오늘) |
| **백그라운드 폴링** | 없음 | 있음 |
| **갱신 트리거** | 새로고침 / 탭 복귀 | 자동 |
| **데이터 범위** | 빅매치만 | 전체 리그 |

---

## 관련 파일 목록

| 파일 | 경로 | 역할 |
|------|------|------|
| API 래퍼 | `src/domains/livescore/actions/footballApi.ts` | 서버 fetch + 캐싱 |
| 공유 훅 | `src/domains/livescore/hooks/useLiveScoreData.ts` | React Query 훅 |
| 캐시 시더 | `src/shared/components/LiveScoreCacheSeeder.tsx` | SSR→RQ 캐시 주입 |
| 쿼리 키 | `src/shared/constants/queryKeys.ts` | 캐시 키 팩토리 |
| 캐시 전략 | `src/shared/constants/cacheConfig.ts` | 사전정의 캐시 설정 |
| RQ 전역설정 | `src/app/RootLayoutProvider.tsx` | React Query 기본값 |
| 위젯 (서버) | `src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2Server.tsx` | SSR 위젯 |
| 위젯 토글 | `src/domains/widgets/components/live-score-widget/LeagueToggleClient.tsx` | 펼침/접기 |
| 위젯 매치카드 | `src/domains/widgets/components/live-score-widget/MatchCardServer.tsx` | 개별 경기 |
| 위젯 리그헤더 | `src/domains/widgets/components/live-score-widget/LeagueHeader.tsx` | 리그 로고/이름 |
| 위젯 헤더 | `src/domains/widgets/components/live-score-widget/WidgetHeader.tsx` | "빅매치" 타이틀 |
| 헤더 | `src/domains/layout/components/HeaderClient.tsx` | 경기 수 뱃지 |
| 모달 | `src/domains/layout/components/livescoremodal/LiveScoreModalClient.tsx` | 탭별 lazy fetch |
| 모달 콘텐츠 | `src/domains/layout/components/livescoremodal/LiveScoreContent.tsx` | 경기 목록 렌더링 |
| 홈 페이지 | `src/app/(site)/page.tsx` | Suspense 진입점 |
