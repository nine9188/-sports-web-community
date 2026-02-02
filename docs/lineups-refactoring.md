# 라인업(Lineups) 코드 리팩토링 계획

> **상태**: ✅ 완료 (2024-02-02)
>
> ## 완료된 작업 요약
> - API 호출 통합: 3개 함수 → 1개 통합 함수 (`fetchAllPlayerStats`)
> - 모달 로딩 제거: 클라이언트 fetch → 서버 프리로드 데이터 사용
> - 타입 통합: `types/lineup.ts`에 모든 타입 정의
> - 미사용 파일 삭제: `usePlayerStats.tsx`, `useTeamCache.tsx`, `PlayerStatsModal.tsx.bak`
> - 선수 통계 데이터 1회 호출로 평점, 주장, 전체 통계 모두 획득

---

## 1. 현재 문제점 상세 분석

### 1.1 API 중복 호출 문제 (심각)

#### 현재 상태
`playerStats.ts`에서 **동일한 API 엔드포인트**를 호출하는 함수가 3개 존재:

```typescript
// 모두 동일한 API: fixtures/players?fixture=${matchId}

// 1. 평점만 추출 (하위 호환용)
export const fetchPlayerRatings = cache(fetchPlayerRatingsInternal);

// 2. 평점 + 주장 정보 추출
export const fetchPlayerRatingsAndCaptains = cache(fetchPlayerRatingsAndCaptainsInternal);

// 3. 개별 선수 풀 통계
export const fetchCachedPlayerStats = cache(fetchPlayerStats);
```

#### 문제점
1. React의 `cache()`는 **함수 단위**로 적용되어 서로 다른 캐시 키를 가짐
2. 동일 경기에서 최대 **3번의 API 호출** 발생 가능
3. `fetchPlayerRatingsAndCaptains`에서 전체 선수 데이터를 받지만 **평점/주장만 추출하고 나머지 버림**
4. 모달에서 `fetchCachedPlayerStats` 호출 시 **같은 데이터를 다시 fetch**

#### 호출 흐름
```
page.tsx
  └─ fetchPlayerRatingsAndCaptains() → API 호출 #1
      └─ 전체 선수 데이터 받음 → 평점/주장만 추출 → 나머지 버림!

PlayerStatsModal.tsx (모달 열릴 때)
  └─ fetchCachedPlayerStats() → API 호출 #2
      └─ 같은 전체 데이터를 다시 받음 → 특정 선수만 필터링
```

---

### 1.2 서버 → 클라이언트 데이터 전달 부족 (심각)

#### 현재 데이터 흐름
```
[서버] page.tsx
  ├─ fetchMatchFullData() → events, lineups, stats, standings
  ├─ fetchPlayerRatingsAndCaptains() → 평점, 주장 ID
  └─ 전달: matchData, initialPlayerRatings

[클라이언트] Lineups.tsx
  └─ 평점/주장 데이터 사용 OK

[클라이언트] PlayerStatsModal.tsx
  └─ useQuery로 fetchCachedPlayerStats() 호출 → 또 API 호출!
```

#### 문제점
1. 서버에서 이미 전체 선수 통계 데이터를 가져올 수 있음
2. 하지만 클라이언트에 **전달하지 않음**
3. 모달 열 때마다 **클라이언트에서 Server Action 호출** → 로딩 발생

#### 다른 탭과의 비교
| 탭 | 데이터 전달 방식 | 클라이언트 로딩 |
|---|---|---|
| Events | 서버에서 fetchMatchEvents → props 전달 | 없음 |
| Stats | 서버에서 fetchMatchStats → props 전달 | 없음 |
| Lineups 테이블 | 서버에서 fetchMatchLineups → props 전달 | 없음 |
| **Lineups 모달** | **클라이언트에서 fetch** | **있음 (문제!)** |

---

### 1.3 캐싱 전략 혼란 (중간)

#### 현재 캐싱 레이어
1. **React `cache()`** - SSR 요청 중복 제거 (같은 렌더링 사이클 내)
2. **Next.js `fetch` 캐시** - `next: { revalidate: 120 }` (2분)
3. **DB 캐시 (Supabase)** - 종료된 경기 영구 캐시
4. **React Query** - 클라이언트 상태 캐시

#### 문제점
1. `playerStats.ts`에서 DB 캐시 저장은 `fetchCachedPlayerStats`에서만 함
2. `fetchPlayerRatingsAndCaptains`에서는 **DB 캐시 저장 안 함** → 데이터 버림
3. 캐시 키 불일치:
   - DB 캐시: `matchPlayerStats`
   - React Query: `['playerStats', matchId, playerId, matchStatus]`

#### DB 캐시 타입 혼란
```typescript
// matchCache.ts
type DataType = 'full' | 'events' | 'lineups' | 'stats' |
                'power' | 'playerRatings' | 'matchPlayerStats';

// playerRatings vs matchPlayerStats 구분이 명확하지 않음
```

---

### 1.4 타입 정의 중복 (중간)

#### Player 인터페이스 중복 (4곳)

**Lineups.tsx:16-24**
```typescript
interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string | null;
  captain?: boolean;
  photo?: string;
}
```

**Formation.tsx:28-36** - 동일
**Player.tsx:29-36** - 동일
**lineupData.ts:6-14** - 동일

#### TeamData 인터페이스 중복 (2곳)
- `Formation.tsx:38-57`
- `Player.tsx:39-57`

#### 문제점
1. 타입 변경 시 **4곳 모두 수정 필요**
2. 불일치 발생 가능성
3. 코드 중복

---

### 1.5 훅/유틸 중복 및 미사용 (중간)

#### useMediaQuery 중복 정의 (3곳)
```typescript
// Formation.tsx:10-26
function useMediaQuery(query: string) { ... }

// Field.tsx:유사한 위치
function useMediaQuery(query: string) { ... }

// Player.tsx:13-27
function useMediaQuery(query: string) { ... }
```

#### 미사용 훅
| 파일 | 상태 |
|---|---|
| `usePlayerStats.tsx` | 정의만 있고 **import 없음** |
| `useTeamCache.tsx` | 정의만 있고 **import 없음** |

#### 불필요한 파일
- `PlayerStatsModal.tsx.bak` - 백업 파일 (160+ 줄)

---

### 1.6 성능 이슈 (낮음)

#### PlayerEvents 메모이제이션 없음
```typescript
// PlayerEvents.tsx:25-36
const playerEvents = events.filter(event => {
  // 매 렌더링마다 전체 events 배열 필터링
});
```

#### 리스트 key 문제
```typescript
// Lineups.tsx - 인덱스 기반 key
key={`startXI-${index}`}
key={`subs-${index}`}
```

---

## 2. 리팩토링 계획

### 2.1 Phase 1: API 통합 및 캐시 전략 정리

#### 목표
- 동일 API 중복 호출 제거
- 한 번의 API 호출로 모든 데이터 활용

#### 변경 사항

**playerStats.ts 리팩토링**
```typescript
// 변경 전: 3개의 독립 함수
fetchPlayerRatings()
fetchPlayerRatingsAndCaptains()
fetchCachedPlayerStats()

// 변경 후: 1개의 통합 함수 + 헬퍼
fetchAllPlayerStats(matchId, matchStatus)  // 전체 데이터 fetch + DB 캐시
  └─ 반환: { allPlayersData, ratings, captainIds }

// 개별 선수 조회는 캐시된 데이터에서 필터링
getPlayerStatsFromCache(allPlayersData, playerId)
```

**캐시 전략 통일**
```
1. 서버 렌더링 시: fetchAllPlayerStats() 호출
2. DB 캐시 확인 (FT 경기)
3. 캐시 미스 → API 호출 → DB 캐시 저장
4. 전체 데이터를 클라이언트에 전달
5. 모달: 전달받은 데이터에서 필터링 (API 호출 없음)
```

---

### 2.2 Phase 2: 서버 데이터 전달 구조 개선

#### 목표
- 모달에서 클라이언트 fetch 제거
- 로딩 없는 즉시 표시

#### 변경 사항

**page.tsx**
```typescript
// 변경 전
const initialPlayerRatings = await fetchPlayerRatingsAndCaptains(matchId);

// 변경 후
const allPlayerStats = await fetchAllPlayerStats(matchId, matchStatus);
// allPlayerStats = { allPlayersData, ratings, captainIds }
```

**Lineups.tsx props 추가**
```typescript
interface LineupsProps {
  // 기존
  initialPlayerRatings?: PlayerRatingsAndCaptains;

  // 추가
  allPlayerStats?: AllPlayerStatsData;  // 전체 선수 통계
}
```

**PlayerStatsModal 변경**
```typescript
// 변경 전: useQuery로 fetch
const { data, isLoading } = useQuery({
  queryFn: () => fetchCachedPlayerStats(matchId, playerId, matchStatus)
});

// 변경 후: props에서 데이터 찾기
const playerStats = allPlayerStats?.find(p => p.player.id === playerId);
// isLoading 제거, 즉시 표시
```

---

### 2.3 Phase 3: 타입 및 코드 중복 제거

#### 목표
- 공통 타입 파일로 통합
- 중복 훅 제거

#### 변경 사항

**타입 통합**
```
src/domains/livescore/types/
  └─ lineup.ts (신규)
      ├─ Player
      ├─ TeamLineup
      ├─ TeamData
      ├─ PlayerStats
      └─ AllPlayerStatsData
```

**훅 통합**
```
src/shared/hooks/
  └─ useMediaQuery.ts (기존 또는 신규)

삭제:
- Formation.tsx 내 useMediaQuery
- Field.tsx 내 useMediaQuery
- Player.tsx 내 useMediaQuery
```

**미사용 파일 삭제**
```
삭제 대상:
- usePlayerStats.tsx (미사용)
- useTeamCache.tsx (미사용)
- PlayerStatsModal.tsx.bak (백업)
```

---

### 2.4 Phase 4: 성능 최적화

#### 목표
- 불필요한 재렌더링 방지
- 메모이제이션 적용

#### 변경 사항

**PlayerEvents 메모이제이션**
```typescript
// useMemo 적용
const playerEvents = useMemo(() =>
  events.filter(event => ...),
  [events, player.id]
);
```

**리스트 key 개선**
```typescript
// 변경 전
key={`startXI-${index}`}

// 변경 후
key={`player-${player.id}`}
```

---

## 3. 파일별 변경 목록

| 파일 | 변경 유형 | 설명 |
|---|---|---|
| `playerStats.ts` | 리팩토링 | API 통합, 캐시 전략 정리 |
| `page.tsx` (match) | 수정 | 전체 선수 데이터 fetch 및 전달 |
| `Lineups.tsx` | 수정 | props 추가, 모달에 데이터 전달 |
| `PlayerStatsModal.tsx` | 리팩토링 | useQuery 제거, props 기반으로 변경 |
| `types/lineup.ts` | 신규 | 공통 타입 정의 |
| `useMediaQuery.ts` | 이동/통합 | shared/hooks로 이동 |
| `usePlayerStats.tsx` | 삭제 | 미사용 |
| `useTeamCache.tsx` | 삭제 | 미사용 |
| `PlayerStatsModal.tsx.bak` | 삭제 | 불필요 |
| `PlayerEvents.tsx` | 수정 | useMemo 적용 |

---

## 4. 예상 효과

### 성능 개선
- API 호출: 3회 → 1회 (67% 감소)
- 모달 로딩: 있음 → 없음 (즉시 표시)
- FT 경기 재방문: DB 캐시 히트 (API 호출 0회)

### 코드 품질
- 타입 정의: 4곳 → 1곳
- useMediaQuery: 3곳 → 1곳
- 미사용 파일: 3개 삭제

### 유지보수성
- 데이터 흐름 단순화
- 캐시 전략 명확화
- 타입 변경 시 1곳만 수정

---

## 5. 작업 순서

1. **타입 파일 생성** (`types/lineup.ts`)
2. **playerStats.ts 리팩토링** (API 통합)
3. **page.tsx 수정** (데이터 전달)
4. **Lineups.tsx 수정** (props 추가)
5. **PlayerStatsModal.tsx 리팩토링** (useQuery 제거)
6. **훅 통합** (useMediaQuery)
7. **미사용 파일 삭제**
8. **성능 최적화** (메모이제이션)
9. **빌드 테스트**
10. **기능 테스트**
