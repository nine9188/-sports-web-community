# Phase 2: Livescore 폴링 & 캐싱

> 상태: ✅ 완료

---

## 개요

LiveScoreView와 LeagueStandings에서 수동으로 구현한 폴링과 캐싱을 React Query로 대체합니다.

| 파일 | 현재 패턴 | 작업 내용 | 상태 |
|------|---------|---------|------|
| `LiveScoreView.tsx` | useState + setInterval 폴링 | useQuery refetchInterval | ✅ 완료 |
| `LeagueStandings.tsx` | useState + Map 캐싱 | useQuery 캐싱 | ✅ 완료 |
| `useTeamCache.tsx` | 로컬 상수 조회 | 마이그레이션 불필요 | ✅ 평가 완료 |

---

## useLiveScoreQueries.ts 생성 ✅

### Before (수동 폴링)

```typescript
// 현재 패턴 (복잡함) - LiveScoreView.tsx
const [matches, setMatches] = useState<Match[]>(initialMatches);
const [loading, setLoading] = useState(false);

// 60초마다 폴링
useEffect(() => {
  const intervalId = setInterval(fetchTodayLiveCount, 60000);
  return () => clearInterval(intervalId);
}, [selectedDate]);

// 날짜 변경 시 데이터 로드
useEffect(() => {
  fetchMatches(selectedDate, true);
}, [selectedDate, fetchMatches, initialDate]);
```

### After (React Query)

```typescript
// React Query로 자동 폴링 + 캐싱
const { data: matches, isLoading } = useQuery({
  queryKey: ['matches', formattedDate],
  queryFn: () => fetchMatchesByDate(formattedDate),
  initialData: initialMatches,
  refetchInterval: showLiveOnly ? 30000 : 60000, // 라이브 모드일 때 더 자주
  staleTime: 1000 * 30,
});
```

### 구현된 훅

- [x] `useMatches` (refetchInterval 지원: LIVE 30초, 오늘 60초)
- [x] `useTodayLiveCount` (다른 날짜 조회 시 오늘 라이브 카운트)
- [x] `usePrefetchAdjacentDates` (인접 날짜 프리페치)
- [x] `useLiveScore` (통합 훅)

---

## LiveScoreView.tsx 마이그레이션 ✅

- [x] useState + setInterval 수동 폴링 제거
- [x] React Query refetchInterval 자동 폴링 적용
- [x] 수동 prefetch → queryClient.prefetchQuery로 전환

---

## useLeagueQueries.ts 생성 ✅

### Before (Map 캐싱)

```typescript
// 현재 패턴 - LeagueStandings.tsx
const clientCache = new Map<string, { data: StandingsData; timestamp: number; }>();
const CACHE_DURATION = 10 * 60 * 1000;

const [standings, setStandings] = useState<StandingsData | null>(initialStandings);
const [loading, setLoading] = useState(false);
```

### After (React Query)

```typescript
const { data: standings, isLoading } = useQuery({
  queryKey: ['league', 'standings', leagueId, season],
  queryFn: () => fetchLeagueStandings(leagueId, season),
  staleTime: 10 * 60 * 1000, // 10분
  gcTime: 30 * 60 * 1000, // 30분
});
```

### 구현된 훅

- [x] `useLeagueStandings` (10분 staleTime, 30분 gcTime)

---

## LeagueStandings.tsx 마이그레이션 ✅

- [x] Map 캐시 (clientCache) 제거
- [x] loadingRef 중복 요청 방지 로직 제거
- [x] useState + useEffect → useLeagueStandings 훅 사용

---

## useTeamCache.tsx 평가 ✅

- 로컬 상수 조회 (getTeamById) - API 호출 아님
- React Query 마이그레이션 불필요 (useMemo로 간소화 가능하나 현재 동작에 문제 없음)

---

## 결과

| 항목 | Before | After |
|------|--------|-------|
| 폴링 방식 | 수동 setInterval | 자동 refetchInterval |
| 캐싱 방식 | 수동 Map 캐시 | 자동 React Query 캐시 |
| 중복 요청 방지 | loadingRef로 수동 관리 | React Query 자동 관리 |
| 코드 복잡도 | 높음 | 낮음 |
