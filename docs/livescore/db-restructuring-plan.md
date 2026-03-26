# 라이브스코어 DB 전체 재설계 계획서

> **작성일**: 2026-03-26
> **목적**: 현재 라이브스코어 시스템의 DB 구조, 데이터 저장 방식, 캐싱 전략을 전면 재설계
> **참고**: [API-Football 공식 가이드](https://www.api-football.com/news/post/how-to-get-started-with-api-football-the-complete-beginners-guide)

---

## 목차

1. [왜 재설계가 필요한가?](#1-왜-재설계가-필요한가)
2. [현재 구조의 문제점 상세](#2-현재-구조의-문제점-상세)
3. [새로운 DB 설계](#3-새로운-db-설계)
4. [각 테이블별 상세 설명](#4-각-테이블별-상세-설명)
5. [페이지별 데이터 흐름 상세](#5-페이지별-데이터-흐름-상세)
6. [데이터 흐름 설계](#6-데이터-흐름-설계)
7. [캐싱 전략](#7-캐싱-전략)
8. [관리자 기능](#8-관리자-기능)
9. [마이그레이션 계획](#9-마이그레이션-계획)
10. [작업 순서](#10-작업-순서)

---

## 1. 왜 재설계가 필요한가?

### 쉬운 비유로 설명

지금 우리 시스템은 **"냉장고 없이 매번 마트에 가서 장을 보는 집"** 같은 상태입니다.

- 손님(사용자)이 올 때마다 마트(API-Football)에 가서 재료를 삽니다
- 마트에는 하루 방문 횟수 제한이 있는데(API 할당량), 우리는 그걸 확인도 안 합니다
- 냉장고(DB)에 같은 음식이 여러 개 들어있습니다(중복 인덱스 14개) — 공간 낭비
- 유통기한 지난 음식(만료 데이터)을 버리는 사람이 없어서 냉장고가 계속 차오릅니다
- 냉장고에 뭐가 있는지 확인하는 방법이 없습니다(관리 도구 없음)

### 핵심 문제 3줄 요약

1. **비효율**: 중복 인덱스 14개가 저장 공간을 낭비하고, 쿼리에 필요한 복합 인덱스는 부족
2. **낭비**: API를 불필요하게 자주 호출하고, 저장해야 할 것은 저장 안 하고, 저장하면 안 되는 방식으로 저장
3. **관리 불가**: 잘못된 데이터가 들어가면 고칠 방법이 없고, 쌓이는 데이터를 정리할 방법도 없음

---

## 2. 현재 구조의 문제점 상세

### 2.1 인덱스 문제 — "있긴 한데 중복이고, 필요한 건 없다"

**실제 DB 조회 결과** (2026-03-26 Supabase 직접 확인):
- 10개 테이블 모두 PK, Unique Constraint가 **정상적으로 존재**
- 하지만 **중복 인덱스가 14개** (Unique 인덱스와 동일한 일반 인덱스가 따로 생성됨)
- 실제 쿼리 패턴에 맞는 **복합 인덱스는 부족**

| 문제 | 상세 |
|------|------|
| 중복 인덱스 14개 | Unique 인덱스와 동일한 일반 인덱스가 따로 존재 → 공간 낭비 (~8.7MB) |
| 불필요한 단독 인덱스 | korean_name, name, position, checked_at 등 단독 조회 안 하는 컬럼에 인덱스 |
| 복합 인덱스 부족 | (is_active, league_id), (type, status) 등 실제 쿼리 패턴에 맞는 인덱스 없음 |

> **참고**: 상세 인덱스 현황은 [phase-execution-log.md](./phase-execution-log.md)에서 테이블별로 확인 가능

### 2.2 API를 잘못 쓰고 있다 — "마트에서 장 잘못 보기"

API-Football 공식 가이드와 비교했을 때 우리가 잘못하고 있는 것들:

#### (1) 에러 확인을 안 한다

API-Football은 HTTP 200(성공) 응답을 보내면서도 안에 에러 메시지를 넣을 수 있습니다.

```
예시: API가 보내는 응답
{
  "errors": { "rateLimit": "일일 한도 초과" },   ← 이걸 확인해야 함!
  "results": 0,
  "response": []
}
```

우리 코드는 HTTP 200이면 무조건 성공으로 처리합니다. 그래서 API 한도가 초과돼도, 빈 데이터를 정상 데이터로 취급해서 화면에 "경기 없음"으로 표시될 수 있습니다.

#### (2) API 사용량을 추적하지 않는다

API-Football은 매 응답 헤더에 "오늘 남은 호출 횟수"를 알려줍니다:
- `x-ratelimit-requests-remaining: 847` → "오늘 847번 더 호출 가능"

우리는 이 숫자를 전혀 확인하지 않습니다. 할당량이 다 떨어져도 모르고 계속 호출하다가, 갑자기 전체 서비스의 라이브 스코어가 멈출 수 있습니다.

#### (3) 라이브 경기 조회 방식이 비효율적이다

| | 우리 방식 | 가이드 권장 방식 |
|---|---------|---------------|
| 방법 | `?date=2026-03-26` (오늘 전체 경기) | `?live=39-140-2` (진행 중인 경기만) |
| 응답 크기 | 오늘 전체 50경기 데이터 | 현재 진행 중인 3경기만 |
| API 호출당 비용 | 1회 (같음) | 1회 (같음) |
| 데이터 양 | 불필요하게 큼 | 필요한 만큼만 |

라이브 스코어 갱신에는 "지금 진행 중인 경기"만 필요한데, 우리는 "오늘 전체 경기"를 매번 다시 가져옵니다.

추가로, 가이드에서는 여러 경기를 한 번에 조회할 수 있는 **배치 조회**(`?ids=123-456-789`, 최대 20개)를 권장하는데, 우리는 이것도 사용하지 않습니다.

#### (4) 데이터 갱신 주기가 맞지 않다

API-Football은 각 데이터가 실제로 얼마나 자주 업데이트되는지 알려줍니다:

| 데이터 | 실제 업데이트 주기 | 우리의 갱신 주기 | 문제 |
|--------|-----------------|----------------|------|
| 순위표 | **1시간**마다 | 30분마다 조회 | 2배 낭비 (변한 게 없는데 또 물어봄) |
| 부상 정보 | **4시간**마다 | 1시간마다 조회 | 4배 낭비 |
| 이적 정보 | 거의 안 바뀜 | 24시간마다 재조회 | 한번 가져오면 다시 안 물어봐도 됨 |
| 트로피 정보 | 거의 안 바뀜 | 24시간마다 재조회 | 한번 가져오면 다시 안 물어봐도 됨 |
| 경기 이벤트 | **15초**마다 | 30초마다 | 라이브 골 알림이 30초 늦을 수 있음 |

### 2.3 저장 로직이 잘못되어 있다

#### (1) 팀 동기화할 때 전체 삭제

```
현재 방식:
1. football_teams 테이블 전체 삭제 (1000개+ 팀 데이터 한 순간에 사라짐)
2. API에서 리그별로 팀 데이터 가져와서 하나씩 저장
3. 중간에 API 에러 나면? → 해당 리그 팀 데이터 영구 손실!
```

비유하면: 옷장 정리한다고 옷을 전부 버린 다음, 새 옷을 하나씩 사러 가는 것. 중간에 가게가 문 닫으면 옷이 없는 상태로 남습니다.

**올바른 방식**: 새 옷을 먼저 사서 들고 온 다음, 헌 옷과 교체합니다 (upsert).

#### (2) 컵 결승 우승팀 감지 실패

```typescript
// 현재 코드: FT(정규 시간 종료)만 확인
if (finalMatch.fixture?.status?.short === 'FT') { ... }
```

문제: 컵 결승은 연장전(AET)이나 승부차기(PEN)로 끝나는 경우가 많습니다!
- UCL 결승이 승부차기로 끝나면 → 우승팀 감지 못 함 → null 반환
- 올바른 코드: `['FT', 'AET', 'PEN']` 세 가지 모두 체크

#### (3) 미시작 경기 점수를 0-0으로 표시

```typescript
// 현재: null을 0으로 변환
goals: { home: match.goals?.home ?? 0 }
```

경기가 아직 시작 안 했으면 점수는 `null`(아직 없음)이어야 합니다.
`0`으로 바꿔버리면 UI에서 "0 vs 0"으로 보여서, 사용자는 "0-0으로 진행 중인가?" 혹은 "아직 시작 안 한 건가?" 구분이 안 됩니다.

### 2.4 캐시가 영원히 남고 관리할 수 없다

#### match_cache — "영구 캐시"의 함정

종료된 경기 데이터를 DB에 영구 저장하는 것 자체는 좋은 아이디어입니다 (종료된 경기 결과는 안 바뀌니까).
**하지만** 잘못된 데이터가 저장되면 영원히 잘못된 채로 남습니다.

예시:
- API 일시 오류로 라인업이 비어있는 상태에서 캐시됨 → 영원히 "라인업 없음"
- 현재는 이걸 고칠 수 있는 관리 도구가 없음

#### asset_cache — 이미지 에러가 고착됨

이미지 다운로드 실패 → `error` 상태로 표시 → 1시간 동안 재시도 안 함 → 1시간 후에도 조건이 안 맞으면 계속 에러

사용자는 계속 placeholder 이미지만 보게 됩니다. 관리자가 "이 팀 로고 다시 다운로드해" 할 수 있는 방법이 없습니다.

#### 만료 데이터가 쌓인다

| 테이블 | 쌓이는 데이터 | 정리 방법 |
|--------|-------------|----------|
| match_ai_predictions | 만료(expires_at) 지난 AI 예측 | 없음! 계속 쌓임 |
| asset_cache | error 상태 레코드 | 없음! 계속 쌓임 |
| match_predictions | 3개월 전 종료 경기의 예측 | 없음! 계속 쌓임 |
| match_support_comments | hidden_until 만료된 댓글 | 숨김 해제 안 됨 |

### 2.5 클라이언트(사용자 브라우저) 문제

#### 탭 전환하면 점수 갱신 멈춤

```typescript
refetchIntervalInBackground: false  // ← 이 설정 때문
```

사용자가 라이브 스코어를 보다가 다른 탭으로 갔다 돌아오면, 그 사이에 골이 들어가도 점수가 안 바뀌어 있습니다. 사용자가 수동으로 새로고침해야 합니다.

#### 자정이 넘어도 어제 경기가 보임

```typescript
// 쿼리 캐시 키에 날짜가 없음
multiDay: () => [...liveScoreKeys.all, 'multiDay'] as const
```

캐시 키가 날짜를 포함하지 않아서, 자정이 넘어도 "어제/오늘/내일" 데이터가 하루 전 기준으로 남아있을 수 있습니다.

---

## 3. 새로운 DB 설계

### 3.1 데이터의 3가지 성격 — 모든 설계의 기준

축구 데이터를 다루려면, 먼저 **"이 데이터가 바뀌는 성격인지"**를 구분해야 합니다.
이 구분이 "어디에, 어떻게 저장할지"를 결정하는 핵심 원칙입니다.

#### 성격 1: 불변 데이터 — "절대 안 바뀌는 사실"

한번 정해지면 바뀔 일이 없는 데이터입니다.

```
예시 (손흥민):
  • 이름: Son Heung-Min → 바뀔 일 없음
  • 국적: South Korea → 바뀔 일 없음
  • 생년월일: 1992-07-08 → 바뀔 일 없음
  • 한국어 이름: 손흥민 → API에 없어서 우리가 매핑, 바뀔 일 없음

예시 (경기):
  • 2025-03-15 맨유 2-1 리버풀 → 종료된 경기 결과는 절대 안 바뀜
  • 23분 라시포드 골 → 종료된 경기의 이벤트도 안 바뀜

예시 (팀):
  • team_id: 33 = Manchester United → 바뀔 일 없음
  • 경기장: Old Trafford → 거의 안 바뀜
```

**→ 저장 방식: DB 영구 저장. 한 번 넣으면 다시 API 호출 안 해도 됨.**

#### 성격 2: 추가형 데이터 — "과거는 안 바뀌고, 새 항목만 추가됨"

이미 일어난 일은 변하지 않지만, 새로운 일이 생기면 목록에 추가됩니다.

```
예시 (손흥민 이적 기록):
  • 2015: 레버쿠젠 → 토트넘    ← 이 사실은 영원히 안 바뀜
  • 2025: 토트넘 → LAFC        ← 새로 추가된 기록!

  "토트넘이었다"는 사실은 변하지 않지만, "LAFC로 이적했다"는 새로 추가됨

예시 (손흥민 트로피):
  • 2019: 아시안컵 준우승       ← 안 바뀜
  • 2025: MLS컵 우승           ← LAFC에서 수상하면 새로 추가!

예시 (하이라이트):
  • 종료 경기 하이라이트 영상   ← 한번 올라오면 안 바뀜
  • 새 경기 하이라이트          ← 새 경기 끝나면 추가됨
```

**그런데, "새 기록이 추가됐는지" 어떻게 알 수 있을까?**

API-Football은 "이적 발생했어요!"라고 알려주는 기능(webhook, 푸시 알림)이 **없습니다.**
그래서 우리가 할 수 있는 건 **주기적으로 API에 물어보는 것**뿐입니다.

```
사용자가 손흥민 선수 페이지를 열면:
  1. API에 "손흥민 이적 기록 전체 줘" 요청
  2. API가 과거 기록 + 새 기록 전부 응답
  3. 그 응답을 캐시에 24시간 저장
  4. 24시간 내에 다른 사용자가 같은 페이지 열면 → 캐시에서 바로 반환 (API 안 부름)
  5. 24시간 지나면 → 다시 API 호출해서 새 이적 있는지 확인
```

**"그러면 결국 API를 호출하는 건데, DB에 저장하는 의미가 뭐야?"**

**→ 추가형 데이터는 DB에 저장하지 않습니다. 캐시만으로 충분합니다.**

DB에 저장해야 하는 건 **"API에서 가져올 수 없는 우리만의 데이터"**뿐입니다:
- 한국어 이름 → API에 없음, 우리가 매핑한 것 → DB 필요
- 이적 기록 → API에서 가져오면 됨 → DB 불필요, 캐시로 충분

**→ 저장 방식: 캐시 24시간 (DB 아님). 사용자가 페이지 열면 API에서 가져오고, 24시간 동안 메모리에 보관. 24시간 지나면 자동으로 다시 확인.**

#### 성격 3: 변동형 데이터 — "수시로 바뀜"

현재 상태를 나타내는 데이터로, 언제든 바뀔 수 있습니다.

```
예시 (손흥민):
  • 현재 소속팀: LAFC           ← 이적하면 바뀜 (루이스 디아즈 문제!)
  • 시즌 스탯: 10골 5도움       ← 경기할 때마다 바뀜
  • 부상 여부: 건강              ← 수시로 바뀜
  • 포지션: Forward             ← 감독 전술에 따라 바뀔 수 있음

예시 (리그):
  • 순위표: 맨시티 1위           ← 경기 끝날 때마다 바뀜
  • 라이브 스코어: 1-0 (52분)   ← 1분마다 바뀜

예시 (경기):
  • 진행 중 경기 상태            ← 실시간으로 바뀜
```

**→ 저장 방식: 캐시 짧게 (30초~1시간). DB에 영구 저장 절대 안 함. 시간 지나면 자동으로 API에서 최신 데이터를 가져옴.**

> **루이스 디아즈 문제가 생긴 이유**: 소속팀(성격 3: 변동형)을 DB 영구 저장(성격 1 취급)으로 처리했기 때문.
> DB에 "리버풀"이라고 적어놓으니 이적해도 안 바뀌고, 수동으로 DB를 삭제해야만 갱신됐음.
> **캐시(1시간)로 처리하면** 이적 후 최대 1시간 이내에 자동으로 새 팀으로 변경됨.

---

### 3.2 핵심 질문 — "그러면 DB에 뭘 넣는 거야?"

정리하면, **DB에 넣어야 하는 데이터는 생각보다 적습니다.**

```
DB에 넣는 기준:
  "API에서 가져올 수 없거나, 매번 API를 호출하면 할당량이 심하게 낭비되는 것"

DB에 안 넣는 기준:
  "API에서 가져올 수 있고, 캐시로 충분한 것"
```

| 데이터 | DB? | 이유 |
|--------|-----|------|
| 한국어 이름 (손흥민) | **DB** | API에 없는 우리만의 데이터 |
| 팀 기본 정보 (이름, 경기장) | **DB** | API 할당량 절약 (1000개 팀을 매번 가져오면 낭비) |
| 종료 경기 전체 데이터 | **DB** | API 할당량 절약 (같은 경기를 1000명이 봐도 API 1번) |
| 이미지 다운로드 상태 | **DB** | ready/pending/error 추적 필요 |
| AI 예측 | **DB (임시)** | OpenAI 비용 절약 ($0.02/건) |
| 사용자 투표/댓글 | **DB** | 사용자가 만든 데이터, API에 없음 |
| | | |
| 이적 기록 | **캐시** | API에서 가져오면 됨 |
| 트로피 | **캐시** | API에서 가져오면 됨 |
| 순위표 | **캐시** | API에서 가져오면 됨 |
| 선수 소속팀/스탯 | **캐시** | API에서 가져오면 됨 |
| 라이브 스코어 | **캐시** | API에서 가져오면 됨 |
| 부상 정보 | **캐시** | API에서 가져오면 됨 |

### 3.3 저장 위치 정리

#### (1) DB 영구 저장 — "API에 없거나, 할당량 절약이 큰 것"

| 데이터 | 예시 | 왜 DB? |
|--------|------|--------|
| 종료 경기 결과 | 맨유 2-1 리버풀 | 한번 저장하면 API 다시 안 불러도 됨 (할당량 대폭 절약) |
| 팀 기본 정보 | 맨유 = Manchester United | 1000개 팀을 매번 API로 가져오면 낭비 |
| 한국어 이름 매핑 | 306 = 손흥민 | API에 아예 없는 데이터 |
| 이미지 캐시 상태 | 맨유 로고 = ready | 다운로드 상태 추적 필요 |

#### (2) DB 임시 저장 — "유효기간 있는 것"

| 데이터 | 유지 기간 | 왜 DB? |
|--------|----------|--------|
| AI 경기 예측 | 경기 후 7일 | OpenAI 비용 절약 (캐시로는 서버 재시작 시 사라짐) |
| 사용자 투표 | 90일 후 삭제 | 사용자가 만든 데이터 (API에 없음) |
| 응원 댓글 | 삭제 안 함 | 사용자가 만든 데이터 |
| API 사용 로그 | 90일 후 삭제 | 우리가 만든 데이터 |

#### (3) 캐시 (DB 아님) — "API에서 가져올 수 있는 모든 것"

| 데이터 | 캐시 유지 시간 | 왜 캐시? |
|--------|--------------|---------|
| 라이브 스코어 | 30~60초 | 수시로 바뀜 |
| 순위표 | 1시간 | 경기 끝나면 바뀜 |
| 선수 소속팀/스탯 | 1시간 | 이적/경기마다 바뀜 |
| 부상 정보 | 4시간 | 수시로 바뀜 |
| 이적 기록 | 24시간 | 새 이적 추가 가능 |
| 트로피 | 24시간 | 새 수상 추가 가능 |

### 3.3 설계 원칙

| 원칙 | 설명 | 예시 |
|------|------|------|
| **불변 데이터만 DB 영구 저장** | 바뀔 수 있는 건 절대 영구 저장 안 함 | 경기 결과 O, 소속팀 X |
| **추가형 데이터는 24시간 캐시** | 과거 안 바뀌지만 새 항목 확인 필요 | 이적, 트로피 |
| **변동형 데이터는 짧은 캐시** | 30초~1시간, 자동 갱신 | 순위, 스탯, 소속팀 |
| **DB 임시 저장은 만료일 필수** | 유통기한 없는 데이터 금지 | AI 예측 7일, 투표 90일 |
| **모든 테이블에 적절한 인덱스** | 자주 검색하는 열에 인덱스 | match_id, player_id 등 |
| **관리 도구 필수** | 잘못된 데이터 수정 가능 | 캐시 삭제, 강제 갱신 |

### 3.4 테이블 구조 전체 그림

```
┌─────────────────────────────────────────────────────────┐
│                    레퍼런스 데이터 (거의 안 바뀜)              │
│                                                         │
│  football_teams     : 팀 정보 (이름, 로고, 경기장 등)       │
│  football_players   : 선수 정보 (이름, 한국어 이름만 — 소속팀/포지션은 API에서) │
│  asset_cache        : 이미지 캐시 상태 (로고, 선수 사진)      │
│  api_usage_log      : API 사용량 추적 [신규]               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    경기 데이터 (경기별)                      │
│                                                         │
│  match_cache        : 종료 경기 전체 데이터 (영구)           │
│  match_highlights   : 경기 하이라이트 YouTube 링크           │
│  match_ai_predictions : AI 경기 예측                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    사용자 데이터 (유저 활동)                  │
│                                                         │
│  match_predictions      : 사용자 승부 예측 투표              │
│  match_prediction_stats : 투표 집계                        │
│  match_support_comments : 응원 댓글                        │
│  match_comment_likes    : 댓글 좋아요/싫어요                 │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 각 테이블별 상세 설명

### 4.1 `football_teams` — 팀 정보 저장소

#### 무엇을 저장하는가?

API-Football에서 가져온 모든 팀의 기본 정보를 저장합니다.

| 컬럼 | 설명 | 예시 |
|------|------|------|
| team_id | API-Football에서 부여한 고유 번호 | 33 (맨유), 85 (PSG) |
| name | 팀 영문명 | "Manchester United" |
| name_ko | 팀 한국어명 | "맨체스터 유나이티드" |
| display_name | 화면에 표시할 이름 | "맨유" |
| code | 3글자 약칭 | "MUN" |
| logo_url | API-Football 원본 로고 URL | (보관용, 직접 사용 안 함) |
| league_id | 소속 리그 번호 | 39 (프리미어리그) |
| league_name | 소속 리그명 | "Premier League" |
| country | 소속 국가 | "England" |
| venue_* | 경기장 정보 (이름, 도시, 수용 인원 등) | "Old Trafford", 76212 |
| current_season | 현재 시즌 | 2025 |
| is_active | 활성 상태 | true |
| popularity_score | 인기도 점수 (검색 정렬용) | 100 |
| search_keywords | 검색용 키워드 배열 | ["Manchester United", "MUN", "맨유"] |
| api_data | API 원본 응답 전체 (JSON) | {...} |
| last_api_sync | 마지막 API 동기화 시각 | "2026-03-26T10:00:00Z" |

> **`current_position`, `is_winner` 컬럼 제거**
>
> 기존에는 이 테이블에 `current_position`(리그 순위)과 `is_winner`(우승팀 여부)를 저장했습니다.
> 하지만 **순위는 경기가 끝날 때마다 바뀌는 데이터**입니다.
> 이 테이블은 "주 1회 동기화"하는 팀 기본 정보 저장소이므로, 매일 바뀌는 순위를 여기에 저장하면
> **항상 오래된 순위**를 보여주게 됩니다.
>
> 실제 순위가 필요한 곳(리그 페이지, 경기 상세 사이드바 등)에서는
> 이미 `standings` API를 1시간마다 실시간으로 가져오고 있으므로,
> 이 테이블에 중복 저장할 필요가 없습니다.
>
> - **순위 표시**: `standings` API → Next.js Data Cache (1시간 갱신)
> - **검색 정렬**: `popularity_score` 사용 (사용자 관심도 기반, 순위보다 검색에 적합)
> - **우승팀 표시**: `standings` API 결과에서 시즌 완료 + 1위 여부로 판정

#### 왜 저장하는가?

API-Football 가이드에서 명확히 권장합니다:
> "Team IDs persist across all competitions and seasons — store them permanently"
> (팀 ID는 모든 대회와 시즌에서 같으니, 영구 저장하세요)

매번 API를 호출해서 팀 이름, 로고를 가져오면 API 할당량을 낭비합니다. 팀 정보는 거의 바뀌지 않으므로, **주 1회 동기화**하면 충분합니다.

**이 테이블에 저장하는 것**: 팀 이름, 로고, 경기장, 소속 리그 등 **거의 안 바뀌는 정보**
**이 테이블에 저장하지 않는 것**: 순위, 우승 여부, 폼(최근 성적) 등 **경기마다 바뀌는 정보**

#### 현재 문제와 수정 사항

| 문제 | 수정 |
|------|------|
| 동기화 시 전체 삭제 후 재삽입 | upsert로 변경 (기존 데이터 유지하면서 업데이트) |
| current_position이 주 1회만 갱신되어 항상 오래됨 | 컬럼 제거, standings API에서 실시간 조회 |
| is_winner가 시즌 중에도 1위=우승 | 컬럼 제거, standings API에서 시즌 완료 시에만 판정 |
| 검색이 ILIKE (느림) | search_vector (Full-Text Search) 활용 |
| 중복 인덱스 2개 | `idx_football_teams_team_id` (unique와 동일), `idx_football_teams_popularity` (불완전) → 삭제 |

#### 인덱스 현황 (DB 직접 조회)

이미 존재:
- `football_teams_pkey`: UNIQUE (id) — PK
- `football_teams_team_id_key`: UNIQUE (team_id) — 핵심 조회용

삭제 대상 (중복/불필요):
- `idx_football_teams_team_id`: unique 인덱스와 동일 → 삭제
- `idx_football_teams_popularity`: is_active 없이 단독 → 삭제

추가 필요 (복합 인덱스):
```sql
CREATE INDEX idx_football_teams_active_league ON football_teams (is_active, league_id);
CREATE INDEX idx_football_teams_active_popularity ON football_teams (is_active, popularity_score DESC);
```

---

### 4.2 `football_players` — 선수 정보 저장소

#### 실제 겪은 문제: 루이스 디아즈 사례

루이스 디아즈가 리버풀에서 바르셀로나로 이적했는데, 우리 사이트에서는 계속 리버풀 소속으로 표시됐습니다.
스탯도 리버풀 것만 나오고, 경기 결과도 리버풀 것만 나왔습니다.
DB에서 해당 선수 데이터를 직접 삭제하니까 그제서야 API에서 새로 가져와서 바르셀로나로 바뀌었습니다.

**왜 이런 일이 생겼는가?**

```
문제의 흐름:

1. football_players 테이블에 team_id: 리버풀 저장됨
2. 선수가 바르셀로나로 이적
3. 하지만 DB에는 여전히 team_id: 리버풀
4. API도 Next.js 캐시(1시간)에 이전 응답이 남아있음
5. 결과: 이적 후에도 리버풀 데이터가 계속 표시

해결했던 방법:
→ DB에서 해당 선수 삭제 → 캐시도 날아감 → API 새로 호출 → 바르셀로나 데이터 표시
```

이 문제의 근본 원인: **자주 바뀌는 데이터(현재 소속팀)를 거의 안 바뀌는 데이터(이름, 국적)와 같은 테이블에 저장**했기 때문입니다.

#### 무엇을 저장하는가? — 변경 후

이 테이블에는 **절대 안 바뀌거나, 우리가 직접 관리하는 데이터**만 저장합니다.

**저장하는 것 (안 바뀌는 정보)**:

| 컬럼 | 설명 | 예시 | 왜 DB에? |
|------|------|------|---------|
| player_id | API-Football 선수 번호 | 306 | 고유 식별자, 절대 안 바뀜 |
| name | 영문명 | "Son Heung-Min" | 거의 안 바뀜 |
| korean_name | 한국어명 | "손흥민" | API에 없음, 우리가 직접 매핑 |
| nationality | 국적 | "South Korea" | 거의 안 바뀜 |
| nationality_ko | 국적 한국어 | "대한민국" | API에 없음, 우리가 직접 매핑 |

**저장하지 않는 것 (자주 바뀌는 정보)** — 제거할 컬럼:

| 컬럼 | 왜 제거? | 대신 어디서 가져오나? |
|------|---------|-------------------|
| ~~team_id~~ | 이적하면 바뀜 | API `players?id=306` 응답의 `statistics[0].team` |
| ~~team_name~~ | 이적하면 바뀜 | 위와 동일 |
| ~~position~~ | 감독 전술에 따라 바뀔 수 있음 | API 응답의 `statistics[0].games.position` |
| ~~number~~ | 시즌마다 바뀔 수 있음 | API 응답의 `statistics[0].games.number` |
| ~~age~~ | 매년 바뀜 | API 응답의 `player.age` |
| ~~height, weight~~ | 가끔 바뀜 | API 응답의 `player.height/weight` |
| ~~photo_url~~ | 시즌마다 바뀔 수 있음 | 4590 표준으로 asset_cache에서 관리 |
| ~~api_data~~ | 거대한 JSON, 금방 오래됨 | API 직접 호출 |

#### 왜 이렇게 나누는가?

```
[변경 전] football_players에 모든 것 저장
  └── 문제: team_id가 이적 시점에 안 바뀜
  └── 문제: 수동으로 DB 삭제해야 갱신됨
  └── 문제: 스탯, 포지션 등 다 오래된 정보

[변경 후] 역할 분리
  ├── football_players = "전화번호부" (이름과 한국어 이름만)
  │   └── 목적: API에 없는 한국어 이름 매핑
  │   └── 갱신 주기: 거의 안 해도 됨 (이름이 바뀔 일이 없으니까)
  │
  └── API 직접 호출 = "실시간 정보" (소속팀, 스탯, 포지션 등)
      └── 목적: 항상 최신 데이터 제공
      └── 갱신 주기: Next.js 캐시 1시간 (자동)
```

비유하면: **전화번호부에는 이름과 전화번호만 적고, 그 사람이 지금 어디서 일하는지는 직접 물어봐야** 합니다. 전화번호부에 "삼성전자 근무"라고 적어놨는데, 그 사람이 이직하면 전화번호부가 틀린 정보가 되니까요.

#### 스탯, 이적, 경기결과는 어떻게?

이것들은 **DB에 저장하지 않고, API에서 직접 가져옵니다**:

| 데이터 | 현재 코드 | 캐시 방식 | DB 저장? |
|--------|----------|----------|---------|
| 선수 기본 정보 + 시즌 스탯 | `fetchPlayerData()` → API `players?id=306` | Next.js Data Cache (1시간) | X |
| 경기 결과 | `fetchPlayerFixtures()` → API `fixtures?...` | Next.js Data Cache (2분) | X |
| 이적 기록 | `fetchPlayerTransfers()` → API `transfers?player=306` | Next.js Data Cache (24시간*) | X |
| 부상 정보 | `fetchPlayerInjuries()` → API `injuries?player=306` | Next.js Data Cache (4시간) | X |
| 트로피 | `fetchPlayerTrophies()` → API `trophies?player=306` | Next.js Data Cache (영구*) | X |

> *24시간: 이적/트로피의 **과거 기록**은 절대 안 바뀌므로 다시 가져올 필요 없음 (가이드 권장).
> 하지만 **새로운 이적이나 수상**이 추가될 수 있으므로 24시간마다 갱신하여 새 기록을 반영합니다.
> (이적 시즌에는 매일 새 이적이 발표되므로, 24시간이 적절합니다)

**현재 소속팀**은 `fetchPlayerData()` API 응답의 `statistics[0].team`에서 옵니다.
이건 Next.js Data Cache로 1시간마다 자동 갱신되므로, 이적 후 **최대 1시간 이내에 자동으로 새 팀으로 변경**됩니다. DB를 수동으로 삭제할 필요가 없어집니다.

#### 인덱스 현황 (DB 직접 조회)

이미 존재:
- `football_players_pkey`: UNIQUE (id) — PK
- `football_players_player_id_key`: UNIQUE (player_id) — 핵심 조회용
- `idx_football_players_team_id`: (team_id) — 팀별 조회

삭제 대상 (중복/불필요):
- `idx_football_players_player_id`: unique 인덱스와 동일 → 삭제
- `idx_football_players_korean_name`: korean_name 단독 검색 없음 → 삭제
- `idx_football_players_name`: ILIKE 검색에 btree 인덱스 무효 → 삭제
- `idx_football_players_position`: position 단독 검색 없음 → 삭제

---

### 4.3 `match_cache` — 종료 경기 영구 캐시

#### 무엇을 저장하는가?

**종료된 경기**(FT, AET, PEN)의 전체 데이터를 JSON으로 저장합니다.

| 컬럼 | 설명 | 예시 |
|------|------|------|
| match_id | 경기 고유 번호 | 868078 |
| data_type | 데이터 종류 | 'full' 또는 'matchPlayerStats' |
| data | 전체 경기 데이터 (JSON) | {match, events, lineups, stats, ...} |
| match_status | 종료 상태 | 'FT', 'AET', 'PEN' |
| created_at | 최초 저장 시각 | [신규 컬럼] |
| is_verified | 데이터 검증 완료 여부 | [신규 컬럼] |
| updated_at | 마지막 수정 시각 | "2026-03-26T10:00:00Z" |

#### 왜 저장하는가?

API-Football 가이드 권장:
> "Post-match: fetch once after final whistle"
> (경기 종료 후 1번만 가져오세요)

종료된 경기의 결과, 이벤트(골, 카드), 라인업, 통계는 **절대 바뀌지 않습니다**.
한 번 저장하면 다시는 API를 호출할 필요가 없어서, API 할당량을 크게 절약합니다.

#### data_type별 저장 내용

**'full'** — 경기 전체 데이터:
```json
{
  "success": true,
  "match": {
    "id": 868078,
    "status": { "code": "FT" },
    "teams": { "home": { "name": "맨유", "id": 33 }, "away": { ... } },
    "goals": { "home": 2, "away": 1 }
  },
  "events": [
    { "type": "Goal", "team": "home", "player": "라시포드", "time": 23 },
    { "type": "Yellow Card", "player": "브루노", "time": 45 }
  ],
  "lineups": { "home": { "formation": "4-2-3-1", "startXI": [...] }, "away": { ... } },
  "stats": [
    { "team": "home", "statistics": [{ "type": "Ball Possession", "value": "56%" }] }
  ]
}
```

**'matchPlayerStats'** — 선수 개인 통계:
```json
{
  "success": true,
  "allPlayersData": [
    { "player": "라시포드", "rating": 8.2, "goals": 1, "assists": 0, "passes": 34 }
  ],
  "ratings": { "33": { "player1Id": 8.2, "player2Id": 7.1 } }
}
```

#### 현재 문제와 수정 사항

| 문제 | 수정 |
|------|------|
| 중복 인덱스 `idx_match_cache_lookup` | unique 인덱스와 동일 → 삭제 |
| 잘못된 데이터 삭제 불가 | 관리자 삭제/강제갱신 API 추가 |
| created_at 없어서 언제 저장됐는지 모름 | created_at 컬럼 추가 |
| 데이터 완전성 확인 불가 | is_complete 컬럼 추가 |

#### 인덱스 현황 (DB 직접 조회)

이미 존재:
- `match_cache_pkey`: UNIQUE (id) — PK
- `match_cache_match_id_data_type_key`: UNIQUE (match_id, data_type) — 핵심 조회용

삭제 대상:
- `idx_match_cache_lookup`: (match_id, data_type) — unique 인덱스와 완전 동일 → 삭제

추가 필요:
```sql
-- sitemap 쿼리용: .eq('data_type', 'full').order('updated_at', desc)
CREATE INDEX idx_match_cache_datatype_updated ON match_cache (data_type, updated_at DESC);
```

---

### 4.4 `asset_cache` — 이미지 캐시 관리

#### 무엇을 저장하는가?

API-Football의 이미지(팀 로고, 리그 로고, 선수 사진 등)를 우리 Supabase Storage에 WebP로 변환해서 저장한 뒤, 그 상태를 추적하는 테이블입니다.

**이미지 자체는 Supabase Storage에 저장**하고, 이 테이블에는 **"이 이미지가 준비됐는지, 에러났는지"** 상태만 기록합니다.

| 컬럼 | 설명 | 예시 |
|------|------|------|
| type | 이미지 종류 | 'team_logo', 'league_logo', 'player_photo' |
| entity_id | 대상 번호 | 33 (맨유 로고) |
| storage_path | Storage 저장 경로 | "md/33.webp" |
| source_url | 원본 API-Football URL | "https://media.api-sports.io/football/teams/33.png" |
| status | 상태 | 'ready' / 'pending' / 'error' |
| error_message | 에러 내용 | "Download failed: 404" |
| checked_at | 마지막 확인 시각 | "2026-03-26T10:00:00Z" |

#### 왜 저장하는가?

API-Football 가이드 권장:
> "Download logos once and serve from your own storage; the media CDN has per-second/per-minute rate limits"
> (로고는 한 번 다운로드해서 자체 저장소에서 제공하세요. 미디어 CDN에는 초당/분당 제한이 있습니다)

매 페이지 로드마다 API-Football CDN에서 로고를 가져오면:
- CDN 속도 제한에 걸릴 수 있고
- 해외 서버라 느리고
- 우리가 통제할 수 없는 외부 의존성이 됩니다

#### 상태 흐름도

```
이미지 요청 들어옴
    │
    ▼
asset_cache에서 상태 확인
    │
    ├── status='ready' → Storage URL 바로 반환 (빠름!)
    │
    ├── status='pending' → 다른 요청이 다운로드 중
    │   └── 0.5초 대기 → 다시 확인 → ready면 반환, 아니면 placeholder
    │
    ├── status='error' → 이전에 실패함
    │   ├── 1시간 안 지남 → placeholder 반환 (재시도 안 함)
    │   └── 1시간 지남 → 재시도
    │
    └── 레코드 없음 → 처음 요청
        └── 다운로드 시작:
            1. status='pending'으로 잠금 (다른 요청이 중복 다운로드 방지)
            2. API-Football에서 PNG 다운로드
            3. sharp로 WebP 변환 (sm: 64px, md: 128px)
            4. Supabase Storage에 업로드
            5. status='ready'로 변경
            6. Storage URL 반환
```

#### 현재 문제와 수정 사항

| 문제 | 수정 |
|------|------|
| 중복 인덱스 `idx_asset_cache_type_entity` | unique 인덱스와 동일 → 삭제 |
| 불필요 인덱스 `idx_asset_cache_checked_at` | 단독 조회 없음 → 삭제 |
| 불필요 인덱스 `idx_asset_cache_status` | 단독 조회 없음 → 삭제 (type+status 복합으로 대체) |
| error 상태 영구 고착 가능 | 30일 지난 error 자동 삭제 |
| 관리자 강제 재다운로드 불가 | forceRefreshAsset() 함수 추가 |

#### 인덱스 현황 (DB 직접 조회)

이미 존재:
- `asset_cache_pkey`: UNIQUE (id) — PK
- `asset_cache_type_entity_unique`: UNIQUE (type, entity_id) — 핵심 조회용

삭제 대상:
- `idx_asset_cache_type_entity`: unique와 동일 (3,744 KB 낭비!)
- `idx_asset_cache_checked_at`: 단독 조회 없음 (2,096 KB 낭비!)
- `idx_asset_cache_status`: 단독 조회 없음 (672 KB 낭비!)

추가 필요:
```sql
-- 관리자 상태별 조회: .eq('type', ...).eq('status', 'error')
CREATE INDEX idx_asset_cache_type_status ON asset_cache (type, status);
```

---

### 4.5 `api_usage_log` — API 사용량 추적 [신규 테이블]

#### 무엇을 저장하는가?

API-Football 호출마다 사용량을 기록합니다.

| 컬럼 | 설명 | 예시 |
|------|------|------|
| id | 자동 증가 | 1 |
| endpoint | 호출한 엔드포인트 | "fixtures" |
| params | 파라미터 | {"date": "2026-03-26"} |
| remaining_daily | 일일 잔여 횟수 | 847 |
| remaining_minute | 분당 잔여 횟수 | 28 |
| response_has_error | 응답에 에러 있었는지 | false |
| response_results | 결과 개수 | 45 |
| created_at | 호출 시각 | "2026-03-26T10:00:00Z" |

#### 왜 저장하는가?

1. **할당량 모니터링**: "오늘 API를 몇 번 호출했고, 얼마나 남았는지" 확인
2. **이상 감지**: 갑자기 사용량이 급증하면 무한 루프나 버그 의심
3. **비용 최적화**: 어떤 엔드포인트를 가장 많이 호출하는지 분석 → 캐싱 전략 개선
4. **디버깅**: "이 경기 데이터가 왜 비어있지?" → 해당 시점 API 응답 확인

API-Football 가이드:
> "Check headers in every response — especially on free plan where 100/day disappears quickly"

#### 필요한 인덱스

```sql
-- 일별 사용량 조회
CREATE INDEX idx_api_usage_log_created ON api_usage_log (created_at DESC);

-- 엔드포인트별 분석
CREATE INDEX idx_api_usage_log_endpoint ON api_usage_log (endpoint, created_at DESC);
```

---

### 4.6 `match_highlights` — 경기 하이라이트 캐시

#### 무엇을 저장하는가?

경기별 YouTube 하이라이트 영상 정보를 캐시합니다.

| 컬럼 | 설명 | 예시 |
|------|------|------|
| fixture_id | 경기 번호 | 868078 |
| video_id | YouTube 영상 ID | "dQw4w9WgXcQ" |
| video_title | 영상 제목 | "맨유 vs 리버풀 하이라이트" |
| channel_name | 채널명 | "SPOTV" |
| thumbnail_url | 썸네일 | "https://i.ytimg.com/vi/..." |

#### 왜 저장하는가?

하이라이트 검색은 YouTube API를 사용하는데, YouTube API도 할당량이 있습니다. 같은 경기 하이라이트를 100명이 보러 오면 100번 YouTube를 검색하는 대신, 1번만 검색하고 결과를 DB에 저장합니다.

#### 인덱스 현황 (DB 직접 조회)

이미 존재:
- `match_highlights_pkey`: UNIQUE (id) — PK
- `match_highlights_fixture_id_key`: UNIQUE (fixture_id) — 핵심 조회용

삭제 대상:
- `idx_match_highlights_fixture`: unique 인덱스와 동일 → 삭제

---

### 4.7 `match_predictions` — 사용자 승부 예측 투표

#### 무엇을 저장하는가?

"이 경기 누가 이길까?" 사용자 투표를 저장합니다.

| 컬럼 | 설명 | 예시 |
|------|------|------|
| match_id | 경기 번호 | "868078" |
| user_id | 투표한 사용자 | "uuid-..." |
| prediction_type | 예측 | "home" / "draw" / "away" |

#### 왜 저장하는가?

- 사용자가 자기 예측을 확인할 수 있어야 함
- 전체 투표 집계를 보여줘야 함 (65% 홈 승, 20% 무승부, 15% 원정 승)
- 같은 경기에 중복 투표 방지

#### 현재 문제와 수정 사항

| 문제 | 수정 |
|------|------|
| 종료 경기 투표 무한 축적 | 90일 지난 데이터 자동 삭제 |

#### 인덱스 현황 (DB 직접 조회)

이미 존재 — **전부 정상, 변경 불필요**:
- `match_predictions_pkey`: UNIQUE (id) — PK
- `match_predictions_user_id_match_id_key`: UNIQUE (user_id, match_id) — 중복 투표 방지
- `idx_match_predictions_match_id`: (match_id) — 집계 쿼리용

삭제 대상:
- `idx_match_predictions_user_id`: user_id 단독 조회 없음 (unique가 user_id 선두로 커버) → 삭제

---

### 4.8 `match_prediction_stats` — 투표 집계 캐시

#### 무엇을 저장하는가?

match_predictions의 투표를 미리 집계해둔 캐시 테이블입니다.

| 컬럼 | 설명 | 예시 |
|------|------|------|
| match_id | 경기 번호 (PK) | "868078" |
| home_votes | 홈 승 투표 수 | 130 |
| draw_votes | 무승부 투표 수 | 40 |
| away_votes | 원정 승 투표 수 | 30 |
| total_votes | 전체 투표 수 | 200 |

#### 왜 저장하는가?

투표 집계를 보여줄 때마다 match_predictions 테이블 전체를 COUNT하면 느립니다.
미리 계산한 결과를 저장해두면 바로 보여줄 수 있습니다.

투표가 추가/변경/삭제될 때마다 이 테이블도 같이 업데이트합니다.

#### 인덱스 현황 (DB 직접 조회)

- `match_prediction_stats_pkey`: **match_id가 PK** — 이것만으로 충분, 추가 인덱스 불필요

> **참고**: predictions.ts에서 upsert에 onConflict가 없지만, match_id가 PK이므로 정상 동작합니다.

---

### 4.9 `match_support_comments` — 응원 댓글

#### 무엇을 저장하는가?

라이브 경기 중 "홈팀 응원" / "원정팀 응원" 댓글을 저장합니다.

| 컬럼 | 설명 | 예시 |
|------|------|------|
| match_id | 경기 번호 | "868078" |
| user_id | 작성자 | "uuid-..." |
| content | 댓글 내용 | "손흥민 화이팅!" |
| team_type | 응원 팀 | "home" / "away" / "neutral" |
| likes_count | 좋아요 수 | 5 |
| is_hidden | 숨김 여부 (신고) | false |
| hidden_until | 임시 숨김 해제 시각 | "2026-03-27T10:00:00Z" |

#### 인덱스 현황 (DB 직접 조회)

이미 존재:
- `match_support_comments_pkey`: UNIQUE (id) — PK
- `idx_match_support_comments_match_id`: (match_id) — 경기별 조회
- `idx_match_support_comments_user_id`: (user_id) — 사용자별 조회

삭제 대상:
- `idx_match_support_comments_team_type`: team_type 단독 조회 없음 → 삭제

> **참고**: `idx_match_support_comments_match_id`는 match_id 단독 인덱스.
> 댓글 조회 시 `.eq('match_id', ...).order('created_at', desc)` 패턴에는
> (match_id, created_at DESC) 복합 인덱스가 더 효율적이지만, 현재 데이터 3건이라 영향 미미.
> 데이터가 늘어나면 복합 인덱스로 교체 검토.

---

### 4.10 `match_comment_likes` — 댓글 좋아요

#### 무엇을 저장하는가?

응원 댓글에 대한 좋아요/싫어요를 저장합니다.

| 컬럼 | 설명 | 예시 |
|------|------|------|
| comment_id | 댓글 번호 | "uuid-..." |
| user_id | 좋아요 누른 사용자 | "uuid-..." |
| type | 종류 | "like" / "dislike" |

#### 왜 저장하는가?

- 같은 댓글에 같은 사용자가 중복 좋아요 방지
- "내가 이 댓글에 좋아요 눌렀는지" 확인

#### 인덱스 현황 (DB 직접 조회)

이미 존재:
- `match_comment_likes_pkey`: UNIQUE (id) — PK
- `match_comment_likes_user_id_comment_id_key`: UNIQUE (user_id, comment_id) — 중복 좋아요 방지
- `idx_match_comment_likes_comment_id`: (comment_id) — 댓글별 좋아요 조회

삭제 대상:
- `idx_match_comment_likes_user_id`: user_id 단독 조회 없음 (unique가 user_id 선두로 커버) → 삭제

---

### 4.11 `match_ai_predictions` — AI 경기 예측

#### 무엇을 저장하는가?

OpenAI로 생성한 경기 분석/예측을 캐시합니다.

| 컬럼 | 설명 | 예시 |
|------|------|------|
| fixture_id | 경기 번호 | 868078 |
| prediction_summary | AI 예측 요약 (JSON) | { "home": 60, "draw": 25, "away": 15 } |
| ai_analysis | AI 분석 본문 | "맨유는 최근 5경기 4승으로..." |
| expires_at | 만료 시각 | 경기 후 7일 |
| generation_cost_usd | 생성 비용 | 0.02 |
| view_count | 조회수 | 1523 |

#### 왜 저장하는가?

AI 예측 1건 생성에 ~$0.02 비용이 듭니다. 같은 경기를 1000명이 보면 $20가 드는데, 한 번 생성한 결과를 저장해두면 $0.02로 1000명에게 제공할 수 있습니다.

#### 현재 문제와 수정 사항

| 문제 | 수정 |
|------|------|
| 만료된 예측이 삭제 안 됨 | is_active=false로 자동 변경 + 30일 후 삭제 |

#### 인덱스 현황 (DB 직접 조회)

이미 존재:
- `match_ai_predictions_pkey`: UNIQUE (id) — PK
- `match_ai_predictions_fixture_id_key`: UNIQUE (fixture_id) — 핵심 조회용
- `idx_match_ai_predictions_popularity`: (popularity_score DESC, created_at DESC) — 인기순
- `idx_match_ai_predictions_expires_at`: (expires_at) — 만료 체크
- `idx_match_ai_predictions_match_date`: (match_date) — 날짜 필터

삭제 대상:
- `idx_match_ai_predictions_fixture_id`: unique 인덱스와 동일 → 삭제

---

## 5. 페이지별 데이터 흐름 상세

각 페이지에서 **어떤 데이터를, 어디서 가져오고, DB에 저장하는지 안 하는지** 전부 정리합니다.

### 5.1 라이브스코어 메인 (`/livescore/football`)

어제/오늘/내일 경기 목록을 보여주는 페이지.

```
사용자가 라이브스코어 메인 열음
│
├─ [서버] 3일치 경기 데이터
│   └─ fetchMultiDayMatches()
│       ├─ API: fixtures?date=어제  ─┐
│       ├─ API: fixtures?date=오늘  ─┼─ 캐시 60초
│       └─ API: fixtures?date=내일  ─┘
│
├─ [서버] 이미지 URL 일괄 조회
│   ├─ getTeamLogoUrls([모든 팀 ID])      → DB: asset_cache
│   ├─ getLeagueLogoUrls([리그 ID])       → DB: asset_cache
│   └─ getLeagueLogoUrls([리그 ID, 다크]) → DB: asset_cache
│
└─ [클라이언트] 폴링으로 실시간 갱신
    └─ useLiveScore() → React Query
        ├─ 라이브 경기: 30초마다 갱신
        ├─ 오늘 경기:  60초마다 갱신
        └─ 어제/내일:  갱신 안 함
```

| 데이터 | 출처 | DB 저장? | 캐시 시간 |
|--------|------|---------|----------|
| 경기 목록 (점수, 상태, 시간) | API `fixtures?date=` | X | 서버 60초 + 클라이언트 30~60초 |
| 팀 로고 URL | DB `asset_cache` → Supabase Storage | **O (영구)** | 서버 1시간 |
| 리그 로고 URL | DB `asset_cache` → Supabase Storage | **O (영구)** | 서버 1시간 |

---

### 5.2 경기 상세 (`/livescore/football/match/[id]`)

특정 경기의 이벤트, 라인업, 통계, 순위, 응원 등을 보여주는 페이지.
**DB를 가장 많이 활용하는 페이지**입니다.

```
사용자가 맨유 vs 리버풀 경기 상세 열음
│
├─ [서버] 경기 전체 데이터
│   └─ fetchCachedMatchFullData(matchId)
│       │
│       ├─ Step 1: DB 확인 — match_cache에 있나? (종료 경기만)
│       │   └─ 있고 완전하면 → DB에서 바로 반환 (API 호출 0!)
│       │
│       └─ Step 2: 없으면 → API 4개 병렬 호출
│           ├─ API: fixtures?id=matchId          (기본 정보)  캐시 60초
│           ├─ API: fixtures/events?fixture=      (골/카드)   캐시 15초
│           ├─ API: fixtures/lineups?fixture=     (라인업)    캐시 5분
│           └─ API: fixtures/statistics?fixture=  (통계)      캐시 5분
│               │
│               └─ 종료 경기(FT/AET/PEN)면 → DB match_cache에 저장!
│                  (다음에 같은 경기 열면 Step 1에서 바로 반환)
│
├─ [서버] 사이드바 — 사용자 활동 데이터 (전부 DB)
│   ├─ DB: match_predictions → 사용자 투표 집계 (65% 홈 승, 20% 무승부...)
│   ├─ DB: match_support_comments → 응원 댓글
│   └─ DB: posts + boards → 관련 커뮤니티 게시글
│
├─ [서버] 전력 비교 (H2H)
│   └─ API: fixtures/headtohead?h2h=33-40    캐시 5분
│
├─ [서버] 선수 평점
│   ├─ 종료 경기: DB match_cache에서 조회 (API 안 부름)
│   └─ 진행 중: API fixtures/players?fixture=  캐시 60초
│
├─ [서버] 하이라이트
│   ├─ DB: match_highlights에 있으면 바로 반환
│   └─ 없으면: YouTube 검색 → 결과를 DB에 저장
│
├─ [서버] 한국어 이름 (22명 선수)
│   └─ DB: football_players에서 korean_name 조회
│
├─ [서버] 이미지
│   ├─ getTeamLogoUrls([홈팀, 어웨이팀, 순위표 팀들]) → DB: asset_cache
│   └─ getLeagueLogoUrl(리그ID, 라이트+다크)          → DB: asset_cache
│
└─ [클라이언트] 탭 전환 (Events / Lineups / Stats / Standings / Power / Support)
    └─ 서버에서 모든 탭 미리 로드 완료
    └─ 탭 전환 = useState만 바꿈 (추가 API 호출 없음, 로딩 없음)
```

| 데이터 | 출처 | DB 저장? | 캐시 시간 |
|--------|------|---------|----------|
| 경기 기본 정보 (점수, 상태) | API `fixtures` | **종료 경기만** (match_cache) | 서버 60초 |
| 이벤트 (골, 카드, 교체) | API `fixtures/events` | **종료 경기만** (match_cache에 포함) | 서버 15초 |
| 라인업 (선발 11명, 후보) | API `fixtures/lineups` | **종료 경기만** (match_cache에 포함) | 서버 5분 |
| 통계 (점유율, 슈팅 등) | API `fixtures/statistics` | **종료 경기만** (match_cache에 포함) | 서버 5분 |
| 선수 평점 | API `fixtures/players` | **종료 경기만** (match_cache) | 서버 60초 |
| 순위표 | API `standings` | X | 서버 1시간 |
| 전력 비교 (H2H) | API `fixtures/headtohead` | X | 서버 5분 |
| 하이라이트 영상 | YouTube 검색 | **O** (match_highlights) | DB 영구 |
| 한국어 선수 이름 | DB `football_players` | **O** (영구) | 직접 DB 조회 |
| 사용자 투표 | DB `match_predictions` | **O** (사용자 데이터) | 직접 DB 조회 |
| 응원 댓글 | DB `match_support_comments` | **O** (사용자 데이터) | 직접 DB 조회 |
| 팀/리그 로고 | DB `asset_cache` → Storage | **O** (영구) | 서버 1시간 |

> **종료 경기 캐시의 효과**: 2025년 3월 15일 맨유 vs 리버풀 경기를 1000명이 보러 와도,
> 처음 1명에게만 API 호출(4번), 나머지 999명은 DB에서 바로 반환. API 할당량 3996번 절약.

---

### 5.3 선수 상세 (`/livescore/football/player/[id]`)

선수 프로필, 시즌 스탯, 경기 기록, 이적, 트로피, 부상, 랭킹을 보여주는 페이지.
**DB 저장이 거의 없는 페이지** — 한국어 이름과 이미지만 DB, 나머지 전부 API 캐시.

```
사용자가 손흥민 선수 페이지 열음
│
├─ [서버] 선수 전체 데이터 (6개 탭 한번에 로드)
│   └─ fetchPlayerFullData(306)
│       ├─ API: players?id=306&season=2025     (기본 정보+스탯)  캐시 1시간
│       ├─ API: players?id=306&season=2024     (작년 시즌)       캐시 1시간
│       ├─ API: fixtures?...&player=306        (경기 기록)       캐시 2분
│       ├─ API: trophies?player=306            (트로피)          캐시 24시간
│       ├─ API: transfers?player=306           (이적 기록)       캐시 24시간
│       ├─ API: injuries?player=306            (부상 기록)       캐시 4시간
│       └─ API: players?league=39&season=2025  (랭킹)           캐시 1시간
│
│       전부 API에서 가져옴. DB 저장 없음.
│       캐시 시간 내에 다른 사용자가 같은 선수 보면 API 재호출 안 함.
│
├─ [서버] 한국어 이름
│   ├─ getPlayerKoreanName(306) → "손흥민"     DB: football_players
│   └─ getPlayersKoreanNames([랭킹 선수들])    DB: football_players
│
├─ [서버] 이미지
│   ├─ getPlayerPhotoUrl(306)                  → DB: asset_cache
│   ├─ getTeamLogoUrls([스탯의 팀들])           → DB: asset_cache
│   ├─ getLeagueLogoUrls([스탯의 리그들])       → DB: asset_cache
│   └─ getPlayerPhotoUrls([랭킹 선수들])        → DB: asset_cache
│
└─ [클라이언트] 탭 전환 (Stats / Fixtures / Trophies / Transfers / Injuries / Rankings)
    └─ 모든 탭 미리 로드 완료 → 탭 전환 시 추가 호출 없음
```

| 데이터 | 출처 | DB 저장? | 캐시 시간 |
|--------|------|---------|----------|
| 선수 기본 정보 (이름, 나이, 국적) | API `players` | X | 서버 1시간 |
| **현재 소속팀** | API `players` → statistics[0].team | **X (캐시!)** | 서버 1시간 |
| 시즌 스탯 (골, 도움, 평점) | API `players` | X | 서버 1시간 |
| 경기 기록 | API `fixtures` | X | 서버 2분 |
| 이적 기록 | API `transfers` | X | 서버 24시간 |
| 트로피 | API `trophies` | X | 서버 24시간 |
| 부상 기록 | API `injuries` | X | 서버 4시간 |
| 랭킹 | API `players` (리그별) | X | 서버 1시간 |
| 한국어 이름 | DB `football_players` | **O (영구)** | 직접 DB 조회 |
| 선수/팀/리그 이미지 | DB `asset_cache` → Storage | **O (영구)** | 서버 1시간 |

> **소속팀이 DB가 아닌 캐시인 이유 (루이스 디아즈 교훈)**:
> API 응답의 `statistics[0].team`에서 현재 소속팀을 가져옴.
> 캐시 1시간이므로 이적 후 최대 1시간 이내에 자동으로 새 팀 반영.
> DB에 저장하면 수동 삭제 전까지 영원히 옛날 팀으로 표시됨.

---

### 5.4 팀 상세 (`/livescore/football/team/[id]`)

팀 정보, 경기 일정, 순위, 선수단, 통계, 이적을 보여주는 페이지.
선수 페이지와 마찬가지로 **DB 저장이 거의 없음**.

```
사용자가 맨유 팀 페이지 열음
│
├─ [서버] 팀 전체 데이터 (5개 탭 한번에 로드)
│   └─ fetchTeamFullData(33)
│       ├─ API: teams?id=33                    (팀 기본 정보)    캐시 1시간
│       ├─ API: fixtures?team=33               (경기 일정/결과)  캐시 2분
│       ├─ API: players/squads?team=33         (선수단 로스터)   캐시 1시간
│       ├─ API: players?team=33&season=2025    (선수 스탯)       캐시 1시간
│       ├─ API: standings?league=39&season=2025(순위표)          캐시 1시간
│       └─ API: transfers?team=33              (이적)            캐시 24시간
│
├─ [서버] 한국어 이름
│   └─ getPlayersKoreanNames([선수단 + 이적 선수들]) → DB: football_players
│
├─ [서버] 이미지
│   ├─ getTeamLogoUrls([맨유 + 상대팀들])      → DB: asset_cache
│   ├─ getPlayerPhotoUrls([선수단 전원])        → DB: asset_cache
│   ├─ getCoachPhotoUrls([감독])                → DB: asset_cache
│   ├─ getLeagueLogoUrls([소속 리그])           → DB: asset_cache
│   └─ getVenueImageUrl(경기장 ID)              → DB: asset_cache
│
└─ [클라이언트] 탭 전환 (Overview / Fixtures / Standings / Squad / Stats)
    └─ 모든 탭 미리 로드 → 탭 전환 시 추가 호출 없음
```

| 데이터 | 출처 | DB 저장? | 캐시 시간 |
|--------|------|---------|----------|
| 팀 기본 정보 (이름, 창단, 경기장) | API `teams` | X | 서버 1시간 |
| 경기 일정/결과 | API `fixtures` | X | 서버 2분 |
| 선수단 (로스터) | API `players/squads` | X | 서버 1시간 |
| 선수 시즌 스탯 | API `players` | X | 서버 1시간 |
| 순위표 | API `standings` | X | 서버 1시간 |
| 이적 기록 | API `transfers` | X | 서버 24시간 |
| 한국어 이름 | DB `football_players` | **O (영구)** | 직접 DB 조회 |
| 모든 이미지 (로고, 선수, 감독, 경기장) | DB `asset_cache` → Storage | **O (영구)** | 서버 1시간 |

---

### 5.5 리그 목록 (`/livescore/football/leagues`)

```
├─ [서버] 리그 목록 데이터 → 코드에 하드코딩된 상수 (API 호출 없음)
├─ [서버] 리그 로고
│   ├─ getLeagueLogoUrls([전체 리그], 라이트) → DB: asset_cache
│   └─ getLeagueLogoUrls([전체 리그], 다크)   → DB: asset_cache
└─ ISR 1시간 (정적 페이지)
```

| 데이터 | 출처 | DB 저장? | 캐시 시간 |
|--------|------|---------|----------|
| 리그 목록 (이름, ID) | 코드 상수 | X | 빌드 시 고정 |
| 리그 로고 | DB `asset_cache` → Storage | **O (영구)** | 서버 1시간 |

---

### 5.6 리그 상세 (`/livescore/football/leagues/[id]`)

```
├─ [서버] API: leagues?id=39                (리그 정보)    캐시 1시간
├─ [서버] API: standings?league=39          (순위표)       캐시 1시간
├─ [서버] 이미지
│   ├─ getLeagueLogoUrl(39, 라이트+다크)    → DB: asset_cache
│   └─ getTeamLogoUrls([순위표 팀들])       → DB: asset_cache
```

| 데이터 | 출처 | DB 저장? | 캐시 시간 |
|--------|------|---------|----------|
| 리그 정보 (이름, 국가, 시즌) | API `leagues` | X | 서버 1시간 |
| 순위표 | API `standings` | X | 서버 1시간 |
| 리그/팀 로고 | DB `asset_cache` → Storage | **O (영구)** | 서버 1시간 |

---

### 5.7 라이브스코어 모달 (헤더에서 열리는 모달)

모든 페이지의 헤더에서 열 수 있는 오늘 경기 모달.
**추가 API 호출 없이** 이미 로드된 캐시 데이터를 재활용합니다.

```
[페이지 로드 시]
├─ RootLayout에서 fetchMultiDayMatches() 호출 (3일치)
├─ LiveScoreCacheSeeder가 React Query 캐시에 주입
│
[헤더]
├─ useTodayMatchCount() → 캐시에서 오늘 경기 수 추출 → "오늘 경기 12"
│
[모달 열 때]
└─ useMultiDayMatches() → 캐시에서 바로 반환 (추가 API 호출 없음!)
    └─ 어제/오늘/내일 탭으로 경기 표시
```

| 데이터 | 출처 | DB 저장? | 캐시 시간 |
|--------|------|---------|----------|
| 3일치 경기 | 페이지 로드 시 이미 가져온 캐시 재활용 | X | 클라이언트 5분 |

---

### 5.8 최종 정리: 뭐가 DB고 뭐가 캐시인가?

#### DB에 저장하는 것 — API에서 가져올 수 없거나, 할당량 절약이 큰 것

| 테이블 | 왜 DB에? | 사용 페이지 |
|--------|---------|------------|
| **match_cache** | 종료 경기를 매번 API 호출하면 할당량 심하게 낭비 | 경기 상세 |
| **asset_cache** | 이미지 다운로드 상태 추적 (ready/pending/error) | 모든 페이지 |
| **football_players** | 한국어 이름은 API에 없음 | 경기/선수/팀 상세 |
| **match_highlights** | YouTube 검색 결과 캐시 (YouTube API 할당량 절약) | 경기 상세 |

#### DB에 저장하는 사용자 데이터 — 사용자가 만든 것 (API 무관)

| 테이블 | 내용 | 사용 페이지 |
|--------|------|------------|
| match_predictions | 승부 예측 투표 | 경기 상세 사이드바 |
| match_prediction_stats | 투표 집계 (65% 홈 승...) | 경기 상세 사이드바 |
| match_support_comments | 응원 댓글 | 경기 상세 사이드바 |
| match_comment_likes | 댓글 좋아요/싫어요 | 경기 상세 사이드바 |
| match_ai_predictions | AI 예측 (OpenAI 비용 절약) | 경기 예측 |

#### API에서 가져오고 캐시만 하는 것 — DB에 저장 안 함

| 데이터 | API 엔드포인트 | 캐시 시간 | 사용 페이지 |
|--------|---------------|----------|------------|
| 경기 목록 (라이브) | `fixtures?date=` | 60초 | 메인, 모달 |
| 경기 이벤트 (골, 카드) | `fixtures/events` | 15초 | 경기 상세 |
| 라인업 | `fixtures/lineups` | 5분 | 경기 상세 |
| 경기 통계 | `fixtures/statistics` | 5분 | 경기 상세 |
| 선수 평점 | `fixtures/players` | 60초 | 경기 상세 |
| 순위표 | `standings` | 1시간 | 경기/리그/팀 상세 |
| H2H 전력 비교 | `fixtures/headtohead` | 5분 | 경기 상세 |
| 선수 기본 정보 + 스탯 | `players?id=` | 1시간 | 선수 상세 |
| 선수 경기 기록 | `fixtures` (선수 필터) | 2분 | 선수 상세 |
| 이적 기록 | `transfers` | 24시간 | 선수/팀 상세 |
| 트로피 | `trophies` | 24시간 | 선수 상세 |
| 부상 정보 | `injuries` | 4시간 | 선수 상세 |
| 팀 기본 정보 | `teams` | 1시간 | 팀 상세 |
| 선수단 (로스터) | `players/squads` | 1시간 | 팀 상세 |
| 리그 정보 | `leagues` | 1시간 | 리그 상세 |

---

### 5.9 전력(Power) 탭 심층 분석

전력 탭은 경기 상세 페이지에서 **API를 가장 많이 호출하는 탭**입니다.
다른 탭은 1개씩인데, 전력 탭 하나가 7개를 호출합니다.

#### 전력 탭이 보여주는 것

```
┌──────────────────────────────────────────────┐
│              전력 분석 (Power)                 │
│                                              │
│  [팀 비교]         맨유 3위  vs  리버풀 5위    │
│  [평균 득점/실점]   1.8 / 0.9  vs  2.1 / 1.2  │
│                                              │
│  [홈팀 최근 5경기]  W W D W L                  │
│  [어웨이팀 최근 5경기]  W L W W D              │
│                                              │
│  [양팀 맞대결 최근 5경기]                       │
│    2025.01 맨유 2-1 리버풀                     │
│    2024.10 리버풀 0-0 맨유                     │
│    ...                                       │
│                                              │
│  [득점 순위]  라시포드 12골, 호일룬 8골 ...     │
│  [도움 순위]  브루노 10도움, 가르나초 6도움 ... │
└──────────────────────────────────────────────┘
```

#### 현재 API 호출 구조

```
getCachedPowerData(홈팀ID, 어웨이팀ID)
│
├─ 1. fetchHeadToHead()
│   └─ API: fixtures/headtohead?h2h=33-40&last=5&status=FT
│      → 양팀 맞대결 최근 5경기
│
├─ 2. fetchTeamRecentForm(홈팀)
│   └─ API: fixtures?team=33&last=10&status=FT
│      → 홈팀 최근 경기 (10개 가져와서 5개 추출)
│
├─ 3. fetchTeamRecentForm(어웨이팀)
│   └─ API: fixtures?team=40&last=10&status=FT
│      → 어웨이팀 최근 경기
│
├─ 4. fetchTeamTopPlayers(홈팀)
│   ├─ API: 선수 통계 (players 엔드포인트)
│   └─ API: 스쿼드 (players/squads 엔드포인트)
│      → 홈팀 득점/도움 Top 5
│
├─ 5. fetchTeamTopPlayers(어웨이팀)
│   ├─ API: 선수 통계
│   └─ API: 스쿼드
│      → 어웨이팀 득점/도움 Top 5
│
├─ DB: getPlayersKoreanNames()  → 한국어 이름
├─ DB: getPlayerPhotoUrls()     → 선수 사진
└─ DB: getTeamLogoUrls()        → 팀 로고

총: API 7번 + DB 3번
```

이게 경기 상세 페이지의 다른 API 호출과 합쳐지면:

```
경기 상세 페이지 전체 API 호출 (캐시 미스, 최악의 경우):

  경기 기본 (이벤트/라인업/통계):  4개
  전력 탭:                        7개
  선수 평점:                      1개
  ──────────────────────────────
  합계:                          12개!

  이 중 전력 탭이 절반 이상 차지.
```

#### 문제 1: 종료 경기인데도 매번 7번 호출

```
현재 (종료 경기):

  경기 기본 데이터 → match_cache에 저장됨 → API 0번 ✅
  선수 평점       → match_cache에 저장됨 → API 0번 ✅
  전력 데이터     → 저장 안 됨!          → 매번 API 7번 ❌

  같은 종료 경기 100명 방문 = 7 × 100 = 700번 API 호출
```

#### 해결: 전력 데이터도 종료 경기에 저장

전력 데이터는 종료 경기 시점의 "스냅샷"이므로 안 바뀝니다.

```
"2025-03-15 맨유 vs 리버풀" 경기 시점의 전력 분석:

  H2H:      이 경기 이전의 맞대결 5경기 → 불변
  최근 폼:   이 경기 이전의 각 팀 최근 5경기 → 불변
  득점 순위: 이 경기 시점의 시즌 스탯 → 불변

  → 전부 "그 시점의 기록"이라 나중에 바뀌지 않음
  → 오히려 매번 API를 호출하면 "현재 시점" 데이터가 와서 부정확
     (3월 경기를 6월에 보면 6월 기준 데이터가 나옴 = 잘못된 정보!)
```

```
변경 후 (종료 경기):

  최초 1명: API 7번 호출 → match_cache에 저장
  이후 99명: match_cache에서 바로 반환 → API 0번!
```

#### 문제 2: 7개 중 하나라도 실패하면 전체 에러

```
현재 코드 (Promise.all):

  API 1 (H2H)       ──── ✅
  API 2 (최근폼 A)   ──── ✅
  API 3 (최근폼 B)   ──── ❌ 타임아웃!
  API 4 (선수스탯 A)  ──── ✅
  API 5 (선수스탯 B)  ──── ✅
  API 6 (스쿼드 A)   ──── ✅
  API 7 (스쿼드 B)   ──── ✅

  → Promise.all: 3번 실패 → 전체 에러!
  → 나머지 6개 성공했는데 전부 버려짐
  → 전력 탭 = "전력 분석 없음" 표시
```

#### 해결: Promise.allSettled + Retry

```
변경 후 (Promise.allSettled + 재시도):

  API 1 (H2H)       ──── ✅ 성공       → 사용
  API 2 (최근폼 A)   ──── ✅ 성공       → 사용
  API 3 (최근폼 B)   ──── ❌ 1차 실패
                      └── ✅ 재시도 성공  → 사용
  API 4 (선수스탯 A)  ──── ✅ 성공       → 사용
  API 5 (선수스탯 B)  ──── ❌ 1차 실패
                      └── ❌ 재시도도 실패 → 빈 배열로 대체
  API 6 (스쿼드 A)   ──── ✅ 성공       → 사용
  API 7 (스쿼드 B)   ──── ✅ 성공       → 사용

  결과: 전력 탭 대부분 정상 표시
        어웨이팀 득점 순위만 비어있음
        사용자는 나머지 데이터를 정상적으로 볼 수 있음
```

#### 문제 3: 불완전한 데이터가 영구 저장되는 위험

7개 중 일부가 실패해서 불완전한 데이터가 저장되면,
그 상태로 영구히 남아서 수정할 방법이 없음.

#### 해결: is_complete 플래그

```
저장 시 완전성 체크:

  h2h 5건 ✅ + 최근폼A 5건 ✅ + 최근폼B 5건 ✅ + 득점TopA ✅ + 득점TopB ❌
  → is_complete = false (1개 빠짐)

  동작 방식:
  ┌─────────────────────────────────────────────────┐
  │ is_complete = true                               │
  │   → 다음 요청에서 DB 반환 (API 안 부름)           │
  │   → 완벽한 데이터 제공                            │
  │                                                  │
  │ is_complete = false                              │
  │   → 다음 요청에서 API 재호출 시도                  │
  │   → 성공하면: 덮어쓰기 (is_complete = true)       │
  │   → 또 실패하면: 기존 불완전 데이터라도 보여줌      │
  │     (빈 화면보다는 불완전해도 있는 게 나음)         │
  │                                                  │
  │ 관리자 페이지에서도 확인 가능:                      │
  │   "경기 #868078: is_complete=false, h2h 누락"     │
  │   [강제 갱신] 버튼으로 수동 복구 가능              │
  └─────────────────────────────────────────────────┘
```

> **이 is_complete 방식은 전력 탭뿐 아니라 기존 match_cache(이벤트/라인업/통계)에도 동일하게 적용해야 합니다.**
> 현재는 검증 실패 시 아예 저장 안 함 → 매번 API 재호출. is_complete를 쓰면 불완전한 데이터라도 보여주면서 자동 복구 시도.

#### 문제 4: 12개 API 로드 동안 사용자는 빈 화면

현재 경기 상세 페이지는 **모든 탭 데이터를 서버에서 전부 로드한 후** 화면을 보여줍니다.

```
현재:
  0.0초 ─────────────── 1.2초: 로딩...
                         1.2초: 전체 화면 한번에 표시

  → 1.2초 동안 사용자는 아무것도 못 봄
```

#### 해결: Suspense 스트리밍 — 준비된 부분부터 보여주기

Next.js App Router의 Suspense를 활용하면, 데이터가 준비된 부분부터 먼저 화면에 표시할 수 있습니다.

```
변경 후:
  0.0초: 스켈레톤 (로딩 뼈대)
  0.2초: 경기 헤더 (점수, 팀명) 먼저 표시  ← 사용자가 가장 먼저 보고 싶은 것!
  0.5초: 전력 탭 표시
  0.7초: 사이드바 표시

  총 시간은 비슷하지만, 사용자가 0.2초 만에 경기 점수를 볼 수 있음.
```

```tsx
// 변경 후 page.tsx 구조 (개념)
<MatchHeader match={matchData.match} />               // ← 바로 표시

<Suspense fallback={<PowerSkeleton />}>
  <PowerTabLoader homeId={homeId} awayId={awayId} />  // ← 준비되면 표시
</Suspense>

<Suspense fallback={<SidebarSkeleton />}>
  <SidebarLoader matchId={matchId} />                  // ← 준비되면 표시
</Suspense>
```

#### 발견된 추가 버그

| # | 문제 | 위치 | 영향 |
|---|------|------|------|
| 1 | H2H/최근폼에서 `status: 'FT'`만 필터 — **AET/PEN 경기 빠짐** | headtohead.ts:173, 215 | UCL 결승 승부차기 경기가 맞대결에 안 나옴 |
| 2 | H2H 경기의 리그 로고가 **API-Sports URL 직접 사용** (4590 미적용) | headtohead.ts:190 | 로고가 외부 CDN에서 로드, 다른 로고와 불일치 |
| 3 | `last * 2`로 **2배 데이터** 가져와서 자름 | headtohead.ts:214 | 불필요한 API 응답 크기 |

#### 전력 탭 개선 작업 우선순위

| 순위 | 작업 | 난이도 | 효과 |
|------|------|--------|------|
| **1** | `Promise.all` → `Promise.allSettled` + Retry | 낮음 | 부분 실패해도 나머지 데이터 표시 |
| **2** | 종료 경기 전력 데이터 match_cache 저장 + is_complete 플래그 | 중간 | API 7번 → 0번 (종료 경기) |
| **3** | AET/PEN 상태 필터 추가 | 낮음 | 승부차기 경기 누락 복구 |
| **4** | H2H 리그 로고 4590 표준 적용 | 낮음 | 이미지 일관성 |
| **5** | Suspense 스트리밍 분리 (경기 헤더 / 전력 / 사이드바) | 중간 | 체감 로딩 속도 향상 |

---

## 6. 데이터 흐름 설계

### 6.1 데이터별 최적 전략

API-Football 가이드를 기반으로 정리한 **데이터별 최적 전략**:

#### 절대 안 바뀌는 데이터 → DB에 저장, 다시 안 물어봄

| 데이터 | 저장 위치 | 갱신 주기 | 이유 |
|--------|----------|----------|------|
| 팀 기본 정보 | football_teams | 주 1회 동기화 | 팀 이름, 로고는 거의 안 바뀜 |
| 선수 한국어 이름 매핑 | football_players | 수동 관리 | API에 없는 한국어 이름만 저장 (소속팀/포지션은 API에서 실시간) |
| 종료 경기 결과 | match_cache | 1회 저장, 영구 | 종료 경기 점수는 절대 안 바뀜 |
| 이적 기록 | Next.js 캐시 (24시간) | 24시간마다 갱신 | 과거 기록 불변, 새 이적 반영 |
| 트로피/수상 | Next.js 캐시 (영구) | 1회 fetch | 과거 수상은 안 바뀜 |
| 팀/리그 로고 | Supabase Storage | 1회 다운로드 | 로고는 거의 안 바뀜 (4590 표준) |

#### 가끔 바뀌는 데이터 → 적절한 주기로 캐시

| 데이터 | 캐시 위치 | 갱신 주기 | 이유 |
|--------|----------|----------|------|
| 리그 순위표 | Next.js Data Cache | **1시간** | 가이드: "standings update hourly" |
| 부상 정보 | Next.js Data Cache | **4시간** | 가이드: "injuries update every 4 hours" |
| 경기 일정 (미시작) | Next.js Data Cache | **1일** | 가이드: "once-per-day fetch sufficient" |
| AI 예측 | match_ai_predictions | 경기 종료 + 7일 | 비용 절감 + 만료 관리 |

#### 자주 바뀌는 데이터 → 짧은 주기로 폴링

| 데이터 | 캐시 위치 | 갱신 주기 | 이유 |
|--------|----------|----------|------|
| 라이브 스코어 | React Query (클라이언트) | **30초** (진행 중 경기만) | 가이드: "15-60s polling" |
| 경기 이벤트 | Next.js Data Cache | **15초** | 가이드: "events update every 15 seconds" |
| 경기 통계 | Next.js Data Cache | **60초** | 가이드: "stats update per minute" |
| 라인업 | Next.js Data Cache | **킥오프 30분 전부터** | 가이드: "20-40 min before kickoff" |

### 6.2 라이브 경기 데이터 흐름 (변경 후)

```
[현재 방식 - 비효율]

사용자가 라이브 스코어 봄
  → 30초마다: fetchFromFootballApi('fixtures', { date: '2026-03-26' })
  → 오늘 전체 50경기 다시 가져옴 (라이브 3경기만 필요한데)
  → API 할당량 낭비


[변경 후 - 효율적]

사용자가 라이브 스코어 봄
  │
  ├── [초기 로드] 서버에서 3일치 전체 가져옴 (1회)
  │   └── fetchMultiDayMatches() → 어제/오늘/내일 전체
  │
  └── [폴링] 진행 중인 경기만 갱신 (30초마다)
      ├── Step 1: 현재 진행 중인 경기 ID 목록 추출
      │   예: [868078, 868079, 868080] (3경기)
      │
      ├── Step 2: 배치 API 호출 (1회로 3경기 갱신)
      │   fetchFromFootballApi('fixtures', { ids: '868078-868079-868080' })
      │
      └── Step 3: 변경된 경기만 UI 업데이트
```

### 6.3 경기 상세 페이지 데이터 흐름

```
사용자가 경기 #868078 상세 페이지 열음
  │
  ├── [Step 1] match_cache 확인 (DB)
  │   └── 종료 경기이고 캐시 데이터가 완전하면 → 바로 반환 (API 호출 0)
  │
  ├── [Step 2] 캐시 없으면 → API 병렬 호출 (4개)
  │   ├── fixtures?id=868078        (기본 정보)
  │   ├── fixtures/events?fixture=868078  (이벤트)
  │   ├── fixtures/lineups?fixture=868078 (라인업)
  │   └── fixtures/statistics?fixture=868078 (통계)
  │
  ├── [Step 3] 이미지 URL 일괄 조회 (asset_cache)
  │   ├── 홈/어웨이 팀 로고 2개
  │   ├── 리그 로고 1개 (라이트 + 다크)
  │   └── 순위표 팀 로고 N개
  │
  ├── [Step 4] 종료 경기면 → match_cache에 저장
  │   └── 다음에 같은 경기 열면 Step 1에서 바로 반환
  │
  └── [Step 5] 클라이언트에 데이터 전달
      └── 진행 중 경기면 → React Query 폴링 시작 (30초)
```

---

## 7. 캐싱 전략

### 7.1 4단계 캐시 — 각 단계의 역할

```
요청 들어옴
    │
    ▼
[L1] React Query 캐시 (브라우저)
    │  "이미 가지고 있으면 바로 보여줌"
    │  - staleTime 동안은 API 호출 안 함
    │  - 이후에는 백그라운드에서 조용히 갱신
    │
    ▼ (캐시 만료 시)
[L2] React cache() (서버 요청 단위)
    │  "같은 요청 안에서 중복 호출 방지"
    │  - 같은 페이지에서 같은 데이터 2번 필요해도 1번만 fetch
    │
    ▼
[L3] Next.js Data Cache (서버 전역)
    │  "같은 데이터를 여러 사용자가 공유"
    │  - 사용자 A가 가져온 데이터를 사용자 B도 사용
    │  - revalidate 시간까지 캐시 유지
    │
    ▼ (캐시 만료 시)
[L4] Supabase DB (영구 저장)
    │  "종료 경기, 이미지 등 영구 데이터"
    │  - match_cache: 종료 경기
    │  - asset_cache: 이미지 상태
    │
    ▼ (DB에도 없을 때만)
[외부] API-Football 호출
```

### 7.2 변경되는 설정값

```typescript
// React Query (클라이언트) — 변경 전 vs 변경 후

// 변경 전
{
  staleTime: 5 * 60 * 1000,           // 5분
  gcTime: 10 * 60 * 1000,             // 10분
  refetchIntervalInBackground: false,  // 탭 전환 시 폴링 중단
}

// 변경 후
{
  staleTime: 60 * 1000,               // 1분 (더 빨리 갱신)
  gcTime: 5 * 60 * 1000,              // 5분
  refetchIntervalInBackground: true,   // 탭 전환해도 폴링 유지
}
```

```typescript
// Next.js Data Cache (서버) — 변경 전 vs 변경 후

// 변경 전                              // 변경 후
fixtures:   revalidate 120초    →      fixtures:   revalidate 60초
events:     revalidate 30초     →      events:     revalidate 15초
standings:  revalidate 1800초   →      standings:  revalidate 3600초
injuries:   revalidate 3600초   →      injuries:   revalidate 14400초
transfers:  revalidate 86400초  →      transfers:  revalidate 86400초 (24시간, 유지)
trophies:   revalidate 86400초  →      trophies:   revalidate 86400초 (24시간, 유지)
```

### 7.3 쿼리 키 변경 — 날짜 포함

```typescript
// 변경 전: 날짜 없음 → 자정 넘어도 같은 캐시 사용 가능
multiDay: () => ['liveScore', 'multiDay'] as const

// 변경 후: 날짜 포함 → 자정 넘으면 새 데이터 fetch
multiDay: () => {
  const today = new Date().toISOString().split('T')[0];
  return ['liveScore', 'multiDay', today] as const;
}
```

---

## 8. 관리자 기능

### 8.1 캐시 관리 페이지 (`/admin/cache-management/`)

현재는 DB에 뭐가 들어있는지 확인할 방법이 전혀 없습니다. 다음 관리 페이지들이 필요합니다:

#### (1) 경기 캐시 관리

```
/admin/cache-management/match-cache/
├── 전체 캐시 현황 (총 N건, 용량 M MB)
├── 경기 검색 (match_id로)
├── 캐시 내용 미리보기 (JSON 뷰어)
├── 개별 캐시 삭제 (잘못된 데이터 제거)
└── 강제 갱신 (API 재호출 후 덮어쓰기)
```

#### (2) 이미지 캐시 관리

```
/admin/cache-management/asset-cache/
├── 상태별 현황 (ready: N, pending: N, error: N)
├── 에러 목록 (에러 메시지 포함)
├── 개별 강제 재다운로드
├── 에러 일괄 재시도
└── 특정 타입 전체 재다운로드 (예: 모든 팀 로고)
```

#### (3) API 사용량 대시보드

```
/admin/cache-management/api-usage/
├── 오늘 사용량 / 잔여량
├── 시간대별 사용량 그래프
├── 엔드포인트별 사용량
├── 에러 발생 이력
└── 할당량 소진 경고 설정
```

#### (4) 데이터 정리

```
/admin/cache-management/cleanup/
├── 만료된 AI 예측 정리 (N건)
├── 오래된 에러 로그 정리 (N건)
├── 종료 경기 투표 정리 (90일+, N건)
├── 수동 정리 실행 버튼
└── 마지막 정리 실행 이력
```

### 8.2 자동 정리 스케줄러

주기적으로 실행되어야 하는 DB 정리 작업:

| 작업 | 주기 | 내용 |
|------|------|------|
| AI 예측 만료 | 매일 1회 | expires_at 지난 예측 비활성화 |
| 에러 이미지 정리 | 매주 1회 | 30일 이상 에러 상태인 asset_cache 삭제 |
| 오래된 투표 정리 | 매월 1회 | 90일 이상 된 match_predictions 삭제 |
| 숨김 댓글 복원 | 매시간 | hidden_until 지난 댓글 숨김 해제 |
| API 사용 로그 정리 | 매월 1회 | 90일 이상 된 api_usage_log 삭제 |

```sql
-- Supabase에서 pg_cron으로 스케줄링
SELECT cron.schedule('cleanup-daily', '0 4 * * *', $$
  SELECT cleanup_expired_data();
$$);
```

---

## 9. 마이그레이션 계획

### 9.1 실행 방식

**Supabase MCP `apply_migration`으로 직접 실행**합니다. SQL 파일(`docs/database/20260326_livescore_indexes.sql`)은 기록용으로 보관.

| 방식 | 용도 |
|------|------|
| `apply_migration` (MCP) | **실제 실행** — 마이그레이션 이력 관리, 롤백 가능 |
| SQL 파일 | **기록용** — 무엇을 실행했는지 문서로 남김 |

상세 실행 계획은 [phase-execution-log.md](./phase-execution-log.md) 참고.

### 9.2 마이그레이션 SQL

실제 DB 조회 결과를 기반으로 작성.

```sql
-- ============================================
-- Section 1: 중복/불필요 인덱스 14개 삭제
-- (Unique 인덱스와 동일한 일반 인덱스, 사용 안 하는 단독 인덱스)
-- ============================================

DROP INDEX IF EXISTS idx_match_cache_lookup;              -- unique와 동일
DROP INDEX IF EXISTS idx_asset_cache_type_entity;          -- unique와 동일 (3.7MB!)
DROP INDEX IF EXISTS idx_asset_cache_checked_at;           -- 단독 조회 없음 (2MB!)
DROP INDEX IF EXISTS idx_asset_cache_status;               -- 단독 조회 없음
DROP INDEX IF EXISTS idx_football_players_player_id;       -- unique와 동일
DROP INDEX IF EXISTS idx_football_players_korean_name;     -- 단독 검색 없음
DROP INDEX IF EXISTS idx_football_players_name;            -- ILIKE에 btree 무효
DROP INDEX IF EXISTS idx_football_players_position;        -- 단독 검색 없음
DROP INDEX IF EXISTS idx_football_teams_team_id;           -- unique와 동일
DROP INDEX IF EXISTS idx_football_teams_popularity;        -- is_active 없이 불완전
DROP INDEX IF EXISTS idx_match_highlights_fixture;         -- unique와 동일
DROP INDEX IF EXISTS idx_match_predictions_user_id;        -- unique가 user_id 선두로 커버
DROP INDEX IF EXISTS idx_match_support_comments_team_type; -- 단독 조회 없음
DROP INDEX IF EXISTS idx_match_ai_predictions_fixture_id;  -- unique와 동일


-- ============================================
-- Section 2: 필요한 복합 인덱스 4개 추가
-- ============================================

-- match_cache: sitemap 쿼리용
CREATE INDEX IF NOT EXISTS idx_match_cache_datatype_updated
  ON match_cache (data_type, updated_at DESC);

-- asset_cache: 관리자 상태별 조회용
CREATE INDEX IF NOT EXISTS idx_asset_cache_type_status
  ON asset_cache (type, status);

-- football_teams: 검색 필터용
CREATE INDEX IF NOT EXISTS idx_football_teams_active_league
  ON football_teams (is_active, league_id);

-- football_teams: 검색 정렬용
CREATE INDEX IF NOT EXISTS idx_football_teams_active_popularity
  ON football_teams (is_active, popularity_score DESC);


-- ============================================
-- Section 3: match_cache 컬럼 추가
-- ============================================

ALTER TABLE match_cache
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE match_cache
  ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT TRUE;

-- 기존 데이터는 validateCacheData() 통과한 것 → is_complete = TRUE
UPDATE match_cache SET is_complete = TRUE WHERE is_complete IS NULL;


-- ============================================
-- Section 4: api_usage_log 테이블 생성 (신규)
-- ============================================

CREATE TABLE IF NOT EXISTS api_usage_log (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  endpoint        TEXT NOT NULL,
  params          JSONB,
  status_code     INTEGER,
  remaining_daily INTEGER,
  remaining_minute INTEGER,
  response_has_error BOOLEAN DEFAULT FALSE,
  response_results INTEGER DEFAULT 0,
  error_details   JSONB,
  response_time_ms INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_log_created
  ON api_usage_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_endpoint_created
  ON api_usage_log (endpoint, created_at DESC);


-- ============================================
-- Section 5: 만료 데이터 자동 정리 함수
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB := '{}';
  affected INTEGER;
BEGIN
  -- 1. 만료된 AI 예측 비활성화
  UPDATE match_ai_predictions
  SET is_active = FALSE
  WHERE is_active = TRUE AND expires_at < NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  result := result || jsonb_build_object('ai_predictions_deactivated', affected);

  -- 2. 비활성 + 30일 지난 AI 예측 완전 삭제
  DELETE FROM match_ai_predictions
  WHERE is_active = FALSE
    AND expires_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS affected = ROW_COUNT;
  result := result || jsonb_build_object('ai_predictions_deleted', affected);

  -- 3. 30일 이상 된 에러 asset_cache 삭제
  DELETE FROM asset_cache
  WHERE status = 'error'
    AND checked_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS affected = ROW_COUNT;
  result := result || jsonb_build_object('asset_errors_cleaned', affected);

  -- 4. 90일 이상 된 종료 경기 예측 삭제
  DELETE FROM match_predictions
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS affected = ROW_COUNT;
  result := result || jsonb_build_object('old_predictions_cleaned', affected);

  -- 5. hidden_until 만료된 댓글 숨김 해제
  UPDATE match_support_comments
  SET is_hidden = FALSE, hidden_until = NULL
  WHERE is_hidden = TRUE
    AND hidden_until IS NOT NULL
    AND hidden_until < NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  result := result || jsonb_build_object('comments_unhidden', affected);

  -- 6. 90일 이상 된 API 사용 로그 삭제
  DELETE FROM api_usage_log
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS affected = ROW_COUNT;
  result := result || jsonb_build_object('api_logs_cleaned', affected);

  RETURN result;
END;
$$;
```

---

## 10. 작업 순서

### Phase 1 — DB 인덱스 정리 및 최적화 ✅ 완료 (2026-03-26)

> 상세: [phase-execution-log.md](./phase-execution-log.md)

| # | 작업 | 상태 | 결과 |
|---|------|------|------|
| 1-1 | 중복/불필요 인덱스 14개 삭제 | ✅ | ~8.7MB 절약 |
| 1-2 | 필요한 복합 인덱스 4개 추가 | ✅ | 검색/필터 쿼리 성능 개선 |
| 1-3 | match_cache에 created_at, is_complete 컬럼 추가 | ✅ | 기존 데이터 is_complete=TRUE로 backfill |
| 1-4 | api_usage_log 테이블 생성 | ✅ | 테이블 + 인덱스 + RLS |
| 1-5 | cleanup_expired_data() 함수 생성 | ✅ | 만료 AI 예측 38건 비활성화, 2건 삭제 |

### Phase 2 — API 래퍼 수정 ✅ 완료 (2026-03-26)

> 상세: [phase-execution-log.md](./phase-execution-log.md#phase-2-api-래퍼-수정)

| # | 작업 | 상태 | 결과 |
|---|------|------|------|
| 2-1 | response.errors 확인 추가 | ✅ | 200이어도 body 에러 시 throw |
| 2-2 | Rate limit 헤더 확인 + api_usage_log 기록 | ✅ | fire-and-forget 로깅, 잔여 100 미만 시 warn |
| 2-3 | 폴링 주기 조정 | ✅ | events 30→15초, standings 30분→1시간, injuries 1시간→4시간 |
| 2-4 | 이적/트로피 | ✅ | 변경 없음 (24시간 유지) |

### Phase 3 — 저장 로직 + 전력 탭 + Suspense 스트리밍 ✅ 완료 (2026-03-27)

> 상세: [phase-execution-log.md](./phase-execution-log.md#phase-3-저장-로직--전력-탭-통합-개선)

| 파일 | 작업 내용 | 상태 |
|------|----------|------|
| `footballTeamsSync.ts` | 전체삭제 → upsert 방식 변경 | ✅ |
| `matchCache.ts` | power 타입 + is_complete + 관리 함수 | ✅ |
| `headtohead.ts` | allSettled + Retry + AET/PEN + 리그 로고 4590 | ✅ |
| `ensureAssetCached.ts` | forceRefreshAsset 함수 추가 | ✅ |
| `match/[id]/page.tsx` | Suspense 스트리밍 + 전력 데이터 캐시 저장/조회 | ✅ |

**제외된 작업과 사유:**

| # | 작업 | 제외 사유 |
|---|------|----------|
| ~~3-1~~ | 컵 결승 AET/PEN | `fetchCupFinal`, `fetchCupWinner`가 프로젝트 어디서도 호출 안 됨 (dead code) |
| ~~3-2~~ | goals null 유지 | goals를 직접 렌더링하는 UI 18+개 파일이 number 타입 가정. null 변경 시 대량 에러 |
| ~~3-4~~ | current_position 제거 | searchTeams.ts에서 정렬 기준으로 사용 중. 제거하면 검색 정렬 깨짐 |
| ~~3-5~~ | football_players 축소 | 급하지 않음. 별도 Phase에서 UI 사용 여부 확인 후 진행 |

### Phase 4 — 클라이언트 수정 ✅ 완료 (2026-03-26)

> 상세: [phase-execution-log.md](./phase-execution-log.md#phase-4-클라이언트-수정)

| # | 작업 | 상태 | 결과 |
|---|------|------|------|
| 4-1 | refetchIntervalInBackground: true | ✅ | 2곳 변경 (useMatches, useTodayLiveCount) |
| 4-2 | multiDay 쿼리키에 KST 날짜 추가 | ✅ | 자정 넘으면 새 캐시 자동 생성 |
| 4-3 | staleTime 1분, gcTime 5분, refetchOnWindowFocus true | ✅ | 탭 복귀 시 갱신 |

### Phase 5 — 라이브 폴링 최적화 ⏸ 보류

> 상세: [phase-execution-log.md](./phase-execution-log.md#phase-5-라이브-폴링-최적화)

**보류 사유**:
- `?live=` 전면 교체 → 미시작/종료 경기 사라짐 (불가)
- LIVE 버튼 한정 분기 → 결국 이중 호출 (버튼 ON/OFF 시 각각 호출)
- Next.js Data Cache가 이미 실제 API 호출을 120초에 1번으로 제한
- 효과 대비 복잡도가 높음. api_usage_log 모니터링 후 재검토.

### Phase 6 — 관리자 캐시 관리 페이지 ✅ 완료 (2026-03-26)

> 상세: [phase-execution-log.md](./phase-execution-log.md#phase-6-관리자-캐시-관리-페이지)

| # | 작업 | 상태 |
|---|------|------|
| 6-1 | 캐시 관리 메인 (통계 요약) | ✅ `/admin/cache-management/` |
| 6-2 | 경기 캐시 관리 + cleanup | ✅ `/admin/cache-management/matches/` |
| 6-3 | 이미지 캐시 관리 | ✅ `/admin/cache-management/assets/` |
| 6-4 | API 사용량 대시보드 | ✅ `/admin/cache-management/api-usage/` |

### Phase 7 — 자동화 ⏸ 보류

- cleanup은 관리자 페이지에서 수동 실행 가능 (Phase 6에서 구현)
- 팀 동기화는 시즌 초에 수동으로 충분
- API 할당량은 api_usage_log 관리자 페이지에서 확인 가능 (Phase 6)

---

## 부록: API-Football 가이드 핵심 요약

### 엔드포인트별 캐시 권장 (가이드 원문 기준)

| 분류 | 캐시 기간 | 해당 데이터 |
|------|----------|-----------|
| 영구 저장 | 변하지 않음 | timezone, 팀 ID, 종료 경기 |
| 일간 갱신 (과거 불변, 신규 추가) | 24시간 | 이적 기록, 트로피 (과거 기록 안 바뀜, 새 기록 추가 가능) |
| 주간 갱신 | 1주 | 국가, 리그 카탈로그 |
| 일간 갱신 | 1일 | 현재 리그, 로스터, 경기 일정 |
| 시간 갱신 | 1-4시간 | 순위표(1h), 부상(4h), 예측(1h), 배당(3h) |
| 실시간 | 15-60초 | 라이브 스코어, 이벤트, 통계, 선수 평점 |
| 사용 안 함 | N/A | 경기 종료 후 배당, 만료된 예측 |

### 반드시 지켜야 할 규칙

1. **매 응답마다 `errors` 배열 확인** — 200이어도 에러일 수 있음
2. **`paging.total` 확인** — 확인 안 하면 데이터 95% 누락 가능
3. **Rate limit 헤더 모니터링** — 소진되면 전체 서비스 중단
4. **`coverage` 플래그 확인** — 지원 안 하는 데이터 요청 방지
5. **`?live=` 엔드포인트 활용** — 라이브 경기만 효율적으로 갱신
6. **`?ids=` 배치 조회 활용** — 최대 20개 경기를 1회 호출로 갱신
7. **로고는 자체 Storage** — CDN 속도 제한 회피 (우리는 이미 잘 하고 있음)
