# 선수 데이터 캐시 구조 문서

> 테스트 선수: S. Lammens (ID: 162511) 기준 실제 데이터

---

## 1. 선수 기본 정보 (playerInfo)

**크기**: ~287 bytes

```json
{
  "id": 162511,
  "name": "S. Lammens",
  "firstname": "Senne",
  "lastname": "Lammens",
  "age": 23,
  "birth": {
    "date": "2002-07-07",
    "place": "Zottegem",
    "country": "Belgium"
  },
  "nationality": "Belgium",
  "height": "193",
  "weight": "70",
  "injured": false,
  "photo": "https://media.api-sports.io/football/players/162511.png"
}
```

**변경 빈도**: 거의 없음 (나이만 연 1회 변경, injured 수시)

---

## 2. 시즌별 통계 (statistics)

**크기**: ~3,320 bytes (4개 리그 기준)
**구조**: 시즌당 리그별 1개 객체

```json
[
  {
    "team": { "id": 33, "name": "Manchester United", "logo": "..." },
    "league": { "id": 39, "name": "Premier League", "country": "England", "logo": "...", "season": 2025 },
    "games": { "appearences": 17, "lineups": 17, "minutes": 1530, "position": "Goalkeeper", "rating": "6.81", "captain": false },
    "substitutes": { "in": 0, "out": 0, "bench": 0 },
    "goals": { "total": 0, "assists": 0, "saves": 37, "conceded": 23, "cleansheets": 0 },
    "shots": { "total": 0, "on": 0 },
    "passes": { "total": 514, "key": 0, "accuracy": "", "cross": 0 },
    "dribbles": { "attempts": 0, "success": 0, "past": 0 },
    "duels": { "total": 6, "won": 6 },
    "tackles": { "total": 1, "blocks": 0, "interceptions": 0, "clearances": 0 },
    "fouls": { "drawn": 2, "committed": 0 },
    "cards": { "yellow": 0, "yellowred": 0, "red": 0 },
    "penalty": { "won": 0, "commited": 0, "scored": 0, "missed": 0, "saved": 0 }
  }
  // ... 리그별 반복 (Belgium U21, Antwerp/Jupiler, FA Cup 등)
]
```

**변경 빈도**: 현재 시즌 - 매 경기 후 / 지난 시즌 - 불변

---

## 3. 시즌 목록 (seasons)

**크기**: ~101 bytes
**구조**: 연도 배열 (내림차순)

```json
[2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008]
```

**참고**: 이 목록은 선수 개인이 아닌 API Football 전체 시즌 목록 + 선수 시즌 병합
**변경 빈도**: 연 1회 (새 시즌 추가)

---

## 4. 경기별 통계 (fixtures)

**크기**: 경기 수에 따라 다름 (~10-50 KB)
**구조**: 경기당 1개 객체

```json
[
  {
    "fixture": { "id": 123456, "date": "2025-01-15T20:00:00+00:00" },
    "league": { "id": 39, "name": "Premier League", "country": "England", "logo": "..." },
    "teams": {
      "home": { "id": 33, "name": "Manchester United", "logo": "...", "winner": true },
      "away": { "id": 40, "name": "Liverpool", "logo": "...", "winner": false },
      "playerTeamId": 33
    },
    "goals": { "home": "2", "away": "1" },
    "statistics": {
      "games": { "minutes": 90, "number": 1, "position": "G", "rating": "7.2", "captain": false, "substitute": false },
      "goals": { "total": 0, "conceded": 1, "assists": 0, "saves": 5 },
      "shots": { "total": 0, "on": 0 },
      "passes": { "total": 30, "key": 0, "accuracy": "80%" },
      "tackles": { "total": 0, "blocks": 0, "interceptions": 1 },
      "duels": { "total": 2, "won": 2 },
      "dribbles": { "attempts": 0, "success": 0, "past": null },
      "fouls": { "drawn": 1, "committed": 0 },
      "cards": { "yellow": 0, "red": 0 },
      "penalty": { "won": null, "commited": null, "scored": 0, "missed": 0, "saved": 0 }
    }
  }
]
```

**참고**: 현재 테스트에서 fixtures_count=0 (시즌 초기 or 캐시 이슈)
**변경 빈도**: 현재 시즌 - 매 경기 후 추가 / 지난 시즌 - 불변

---

## 5. 트로피 (trophies)

**크기**: ~1,367 bytes (11개 트로피 기준)
**구조**: 트로피별 1개 객체

```json
[
  {
    "league": "Cup",
    "country": "Belgium",
    "season": "2023/2024",
    "place": "준우승",
    "leagueLogo": "https://media.api-sports.io/football/leagues/220.png"
  },
  {
    "league": "Super Cup",
    "country": "Belgium",
    "season": "2023",
    "place": "우승",
    "leagueLogo": "https://media.api-sports.io/football/leagues/529.png"
  },
  {
    "league": "First Division A",
    "country": "Belgium",
    "season": "2021/2022",
    "place": "우승",
    "leagueLogo": null
  }
  // ...
]
```

**변경 빈도**: 시즌 종료 시에만 추가

---

## 6. 이적 (transfers)

**크기**: ~980 bytes (4건 기준)
**구조**: 이적 건별 1개 객체

```json
[
  {
    "date": "2025-09-01",
    "type": "Transfer",
    "teams": {
      "from": { "id": 740, "name": "Antwerp", "logo": "..." },
      "to": { "id": 33, "name": "Manchester United", "logo": "..." }
    }
  },
  {
    "date": "2023-06-15",
    "type": "Free",
    "teams": {
      "from": { "id": 569, "name": "Club Brugge KV", "logo": "..." },
      "to": { "id": 740, "name": "Antwerp", "logo": "..." }
    }
  }
]
```

**참고**: 중복 이적 기록 존재 가능 (2025-08-30, 31, 09-01 동일 이적 3건)
**변경 빈도**: 이적 시에만 (연 1~2회)

---

## 7. 부상 (injuries)

**크기**: 부상 수에 따라 다름
**구조**: 부상 건별 1개 객체

```json
[
  {
    "fixture": { "date": "2024-10-15" },
    "league": { "name": "Premier League", "season": 2024 },
    "team": { "id": 33, "name": "Manchester United", "logo": "..." },
    "type": "결장",
    "reason": "허벅지 부상"
  }
]
```

**참고**: 현재 테스트에서 injuries=[] (부상 기록 없음)
**변경 빈도**: 부상 발생 시 (수시)

---

## 데이터 크기 요약

| 데이터 | 크기 | 항목 수 | 변경 빈도 |
|--------|------|---------|-----------|
| 선수 기본 정보 | 287 B | 1 | 거의 없음 |
| 시즌별 통계 | 3,320 B | 4개 리그 | 현재 시즌: 매 경기 |
| 시즌 목록 | 101 B | 20개 | 연 1회 |
| 경기별 통계 | 10~50 KB | ~40경기 | 현재 시즌: 매 경기 |
| 트로피 | 1,367 B | 11개 | 시즌 종료 시 |
| 이적 | 980 B | 4건 | 연 1~2회 |
| 부상 | ~500 B | 가변 | 수시 |
| **합계** | **~15-55 KB** | - | - |

---

## 캐시 전략 요약

### 영구 캐시 (지난 시즌 = 절대 안변함)
- 시즌별 통계 (지난 시즌)
- 경기별 통계 (지난 시즌)
- 트로피 (지난 시즌 이전)
- 이적 기록 (과거 이적)

### 주기적 갱신 (현재 시즌)
- 시즌별 통계 → 4시간마다
- 경기별 통계 → 4시간마다
- 선수 기본 정보 → 24시간마다
- 부상 기록 → 4시간마다

### 저빈도 갱신
- 트로피 → 24시간마다
- 이적 → 24시간마다
- 시즌 목록 → 24시간마다 (기존 로직 유지)

---

## 구현 완료 (2026-01-28)

### Supabase 테이블

```
player_cache (
  id          bigint PK (auto),
  player_id   integer NOT NULL,
  data_type   text NOT NULL,     -- 'info','stats','fixtures','trophies','transfers','injuries','seasons'
  season      integer NOT NULL DEFAULT 0,  -- 0=시즌 무관, 2025=특정 시즌
  data        jsonb NOT NULL,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(player_id, data_type, season)
)
```

### 캐시 흐름

```
요청 → L1(인메모리 Map, 10분) → L2(Supabase) → API → L1+L2 저장
```

- **L1 hit**: 0ms (인메모리 즉시 반환)
- **L2 hit**: ~50ms (Supabase 조회)
- **L2 miss → API**: 2~30초 (API 호출 후 L1+L2에 저장)
- **지난 시즌**: L2에서 영구 반환 (갱신 안 함)
- **현재 시즌**: TTL 초과 시 API 재호출

### 관련 파일

- `src/domains/livescore/actions/player/playerCache.ts` — Supabase 읽기/쓰기 헬퍼
- `src/domains/livescore/actions/player/data.ts` — withCache 래퍼로 L2 연동
- `src/app/test/player-cache/raw/route.ts` — 테스트 엔드포인트
