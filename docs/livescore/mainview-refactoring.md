# MainView 리팩토링 가이드

> 작성일: 2026-01-14
> 위치: `src/domains/livescore/components/football/MainView/`

## 1. 현재 구조

### 파일 구성

```
MainView/
├── LiveScoreView.tsx      # 메인 컴포넌트 (315줄)
├── actions.ts             # Server Actions (155줄)
├── NavigationBar/
│   └── index.tsx          # 상단 네비게이션 바 (317줄)
├── LeagueMatchList/
│   └── index.tsx          # 리그별 경기 목록 (85줄)
└── MatchCard/
    └── index.tsx          # 개별 경기 카드 (182줄)
```

### 데이터 흐름

```
page.tsx (SSR)
    ↓ initialMatches, initialDate
LiveScoreView.tsx
    ↓ props
NavigationBar (날짜 선택, 검색, LIVE 필터)
LeagueMatchList → MatchCard (경기 표시)
```

---

## 2. 발견된 문제점

### 2.1 중복 코드: 라이브 경기 상태 체크 (심각도: 높음)

**동일한 로직이 3곳에 중복됨:**

```typescript
// 위치 1: calculateLiveMatchCount 함수 (Line 38-46)
const calculateLiveMatchCount = (matches: Match[]) => {
  return matches.filter(match =>
    match.status.code === 'LIVE' ||
    match.status.code === 'IN_PLAY' ||
    match.status.code === '1H' ||
    match.status.code === '2H' ||
    match.status.code === 'HT'
  ).length;
};

// 위치 2: fetchTodayLiveCount useEffect 내 (Line 59-65)
const liveCount = todayMatches.filter((match: MatchData) =>
  match.status.code === 'LIVE' ||
  match.status.code === 'IN_PLAY' ||
  match.status.code === '1H' ||
  match.status.code === '2H' ||
  match.status.code === 'HT'
).length;

// 위치 3: filteredMatches 필터링 (Line 221-226)
const isLive = match.status.code === 'LIVE' ||
              match.status.code === 'IN_PLAY' ||
              match.status.code === '1H' ||
              match.status.code === '2H' ||
              match.status.code === 'HT';
```

**해결 방안:**
```typescript
// shared/constants/matchStatus.ts
export const LIVE_STATUS_CODES = ['LIVE', 'IN_PLAY', '1H', '2H', 'HT'] as const;

export function isLiveMatch(statusCode: string): boolean {
  return LIVE_STATUS_CODES.includes(statusCode as any);
}
```

---

### 2.2 LIVE 버튼 클릭 시 중복 날짜 설정 (심각도: 중간)

**현재 문제:**
```typescript
// NavigationBar props에서:
onLiveClick={() => {
  setShowLiveOnly(!showLiveOnly);
  if (!showLiveOnly) {
    setSelectedDate(new Date()); // 여기서 날짜 설정
  }
}}

// LiveScoreView.tsx의 useEffect (Line 211-215)
useEffect(() => {
  if (showLiveOnly) {
    fetchMatches(new Date(), false); // 여기서도 오늘 날짜로 데이터 fetch
  }
}, [showLiveOnly, fetchMatches]);
```

- `showLiveOnly`가 `true`가 되면 `setSelectedDate(new Date())`로 날짜 변경
- 날짜 변경으로 `selectedDate` useEffect가 트리거되어 `fetchMatches` 호출
- 동시에 `showLiveOnly` useEffect도 트리거되어 `fetchMatches` 다시 호출
- **결과: 동일 API 2번 호출**

**해결 방안:**
- `showLiveOnly` useEffect 제거
- 날짜 변경 useEffect에서 통합 처리

---

### 2.3 과도한 useEffect 사용 (심각도: 높음)

**현재 7개의 useEffect:**

| # | 목적 | 의존성 | 비고 |
|---|------|--------|------|
| 1 | 초기 라이브 경기 수 계산 | `[initialMatches]` | |
| 2 | 오늘 라이브 경기 수 30초 폴링 | `[]` | 새로 추가됨 |
| 3 | 날짜별 경기 데이터 fetch | `[selectedDate, fetchMatches, initialDate]` | |
| 4 | KST 자정 롤오버 | `[]` | 복잡한 타이머 로직 |
| 5 | 인접 날짜 프리페칭 | `[selectedDate]` | |
| 6 | LIVE 모드 데이터 fetch | `[showLiveOnly, fetchMatches]` | 2번과 중복 가능 |
| 7 | (미사용) | - | - |

**문제:**
- Side effect 간 상호 의존성 파악 어려움
- 디버깅 복잡성 증가
- 불필요한 리렌더링 발생 가능

**해결 방안:**
- Custom Hook으로 관련 로직 분리
- 통합 가능한 useEffect 병합

---

### 2.4 30초 폴링 비효율 (심각도: 중간)

**현재 구현:**
```typescript
// 30초마다 전체 경기 데이터를 가져와서 라이브 개수만 계산
const todayMatches = await fetchMatchesByDate(today);
const liveCount = todayMatches.filter(...).length;
```

**문제:**
- 라이브 경기 "개수"만 필요한데 전체 경기 데이터를 fetch
- 하루에 100+ 경기가 있을 수 있음
- 불필요한 대역폭 낭비

**해결 방안 (옵션):**

1. **경량 API 엔드포인트 추가:**
   ```typescript
   // Server Action
   export async function fetchLiveMatchCount(): Promise<number> {
     // 최소 필드만 요청하거나 COUNT 쿼리 사용
   }
   ```

2. **캐시된 데이터 활용:**
   - 이미 오늘 날짜가 선택된 경우 기존 데이터에서 계산

3. **WebSocket/SSE 고려 (장기):**
   - 실시간 업데이트가 필요하다면 푸시 기반 아키텍처

---

### 2.5 actions.ts의 월간 데이터 fetch 문제 (심각도: 높음)

**현재 구현 (`fetchMonthlyMatches` 함수):**
```typescript
export async function fetchMonthlyMatches(month: string): Promise<Map<string, MatchData[]>> {
  // 각 날짜별로 개별 API 호출
  for (let day = 1; day <= daysInMonth; day++) {
    const dayMatches = await fetchMatchesByDate(dateString);
    // ...
  }
}
```

**문제:**
- 한 달 = 최대 31번의 API 호출
- 순차 실행으로 인한 느린 응답
- API rate limit 위험

**해결 방안:**
```typescript
// 병렬 처리 + 배치
export async function fetchMonthlyMatches(month: string) {
  const dates = generateDatesInMonth(month);

  // 병렬 처리 (5개씩 배치)
  const batchSize = 5;
  const results = new Map();

  for (let i = 0; i < dates.length; i += batchSize) {
    const batch = dates.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(date => fetchMatchesByDate(date))
    );
    // 결과 병합
  }

  return results;
}
```

---

## 3. 리팩토링 계획

### Phase 1: 상수/유틸리티 추출 (예상: 빠른 수정)

1. `LIVE_STATUS_CODES` 상수 생성
2. `isLiveMatch()` 유틸리티 함수 생성
3. 3곳의 중복 코드를 유틸리티로 교체

**파일 위치:** `src/domains/livescore/constants/matchStatus.ts`

### Phase 2: useEffect 정리 (예상: 중간 수정)

1. LIVE 버튼 중복 fetch 문제 해결
2. 관련 useEffect 병합
3. Custom Hook 추출 고려:
   - `useLiveMatchCount()`: 라이브 경기 수 관리
   - `useMatchData()`: 날짜별 경기 데이터 관리

### Phase 3: 폴링 최적화 (예상: 중간 수정)

1. 경량 API 엔드포인트 추가 검토
2. 조건부 폴링 (오늘 날짜일 때만)
3. 폴링 간격 조정 가능하게

### Phase 4: 월간 데이터 fetch 최적화 ✅ 이미 최적화됨

**현재 구현 확인 결과**: `actions.ts`의 `fetchMonthMatchDates`는 이미 배치 처리(10개씩 병렬)로 최적화되어 있음.

- `processBatch`: 10개씩 `Promise.allSettled`로 병렬 처리
- 배치 간 50ms 지연으로 API rate limit 방지
- 31일 = 4배치, 총 ~150ms 지연 + API 응답 시간

---

## 4. 라이브 기능 개선 제안

### 4.1 실시간 데이터 업데이트

현재: 30초 폴링으로 라이브 경기 "개수"만 업데이트

**개선안:**
- 오늘 날짜 선택 시 전체 경기 데이터도 주기적 업데이트
- 업데이트 간격: 60초 (스코어 변경 반영)
- 사용자에게 마지막 업데이트 시간 표시

```typescript
// 예시 구현
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

// UI에 표시
<span className="text-xs text-gray-400">
  마지막 업데이트: {lastUpdated ? format(lastUpdated, 'HH:mm:ss') : '-'}
</span>
```

### 4.2 LIVE 모드 개선

현재: LIVE 버튼 클릭 시 오늘로 이동 + 진행 중 경기만 필터

**개선안:**
- LIVE 모드에서는 자동 새로고침 활성화 (30초)
- LIVE 모드 해제 시 자동 새로고침 중지
- 경기 종료 시 자동으로 목록에서 제거 또는 상태 업데이트

### 4.3 경기 상태 시각화 강화

```typescript
// 현재 상태 코드별 표시 개선
const STATUS_DISPLAY = {
  '1H': { text: '전반', color: 'green', pulse: true },
  'HT': { text: '하프타임', color: 'yellow', pulse: false },
  '2H': { text: '후반', color: 'green', pulse: true },
  'FT': { text: '종료', color: 'gray', pulse: false },
  // ...
};
```

---

## 5. 추가 고려사항

### 5.1 에러 처리

현재 에러 발생 시 빈 배열만 설정하고 사용자에게 알림 없음.

```typescript
} catch (error) {
  console.error('경기 데이터 불러오기 오류:', error);
  setMatches([]);  // 사용자에게 에러 상태 표시 필요
}
```

**개선:** 에러 상태 추가 및 UI 피드백

### 5.2 로딩 상태

현재 스켈레톤 UI 제공됨 (양호)

**개선 가능:** 부분 로딩 (기존 데이터 유지하면서 새 데이터 fetch)

### 5.3 접근성

- LIVE 버튼에 aria-label 추가
- 경기 상태에 screen reader 친화적 텍스트

---

## 6. 참고 파일

- `src/domains/livescore/components/football/MainView/LiveScoreView.tsx`
- `src/domains/livescore/components/football/MainView/actions.ts`
- `src/domains/livescore/components/football/MainView/NavigationBar/index.tsx`
- `src/domains/livescore/types/match.ts`
- `src/domains/livescore/actions/footballApi.ts`

---

## 7. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-14 | 초기 문서 작성 |
| 2026-01-14 | Phase 1~4 리팩토링 완료 |

### 완료된 작업 상세

**Phase 1: 라이브 상태 상수/유틸리티 추출** ✅
- `constants/match-status.ts` 신규 생성
- `LIVE_STATUS_CODES`, `isLiveMatch()`, `countLiveMatches()` 구현
- 3곳의 중복 코드를 유틸리티로 교체

**Phase 2: useEffect 정리** ✅
- 중복 `showLiveOnly` useEffect 제거 (7개 → 6개)
- LIVE 버튼 클릭 시 중복 API 호출 문제 해결

**Phase 3: 폴링 최적화** ✅

**변경 전 (Before):**
```
[사용자가 어떤 날짜를 보든 상관없이]
  ↓
30초마다 오늘 경기 데이터 전체 fetch (fetchMatchesByDate)
  ↓
라이브 경기 수만 추출하여 업데이트

문제점:
- 오늘 날짜를 보고 있으면 fetchMatches + 폴링 = 동일 데이터 2번 fetch
- 30초 간격은 너무 빈번함
- 100+ 경기 데이터를 가져와서 개수만 세는 비효율
```

**변경 후 (After):**
```
[오늘 날짜를 보는 경우]
  ↓
fetchMatches에서 데이터 가져올 때 라이브 카운트도 함께 계산
  ↓
별도 폴링 없음 (API 호출 절약)

[다른 날짜를 보는 경우 (예: 어제, 내일)]
  ↓
60초마다 오늘 경기 데이터 fetch
  ↓
라이브 카운트 업데이트
```

**구체적인 코드 변경:**

1. `fetchMatches` 함수에 라이브 카운트 업데이트 추가:
```typescript
// 오늘 날짜를 조회한 경우 라이브 카운트도 업데이트
const today = format(new Date(), 'yyyy-MM-dd');
if (formattedDate === today) {
  setLiveMatchCount(countLiveMatches(processedMatches));
}
```

2. 폴링 useEffect에 조건 추가:
```typescript
useEffect(() => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const selected = format(selectedDate, 'yyyy-MM-dd');

  // 오늘을 보고 있으면 fetchMatches에서 업데이트하므로 폴링 불필요
  if (today === selected) {
    return; // 폴링 안 함
  }

  // 다른 날짜일 때만 60초 폴링
  const intervalId = setInterval(fetchTodayLiveCount, 60000);
  return () => clearInterval(intervalId);
}, [selectedDate]);
```

**효과:**
| 시나리오 | 변경 전 | 변경 후 |
|---------|--------|--------|
| 오늘 보기 (1분간) | 메인 fetch 1회 + 폴링 2회 = **3회** | 메인 fetch 1회 = **1회** |
| 어제 보기 (1분간) | 메인 fetch 1회 + 폴링 2회 = **3회** | 메인 fetch 1회 + 폴링 1회 = **2회** |
| 폴링 간격 | 30초 | 60초 |

**API 호출 절감 효과:**
- 오늘 날짜 조회 시: **67% 감소** (3회 → 1회)
- 다른 날짜 조회 시: **33% 감소** (3회 → 2회)

**Phase 4: 월간 데이터 fetch** ✅
- 확인 결과 이미 배치 처리로 최적화되어 있음
