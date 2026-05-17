# 07. metadata와 SSR 안정화

## 핵심 방향

이 문서의 목적은 SSR을 줄이거나 overview 데이터를 제거하는 것이 아니다.

SEO 페이지는 SSR을 적극 사용해야 한다. 다만 SSR이 매 요청마다 외부 football API 응답에 끝까지 묶이면 Googlebot 재크롤 burst 때 timeout, server connection failed, soft 404 위험이 커진다.

올바른 방향은 다음과 같다.

```txt
SSR 유지
데이터 제거 금지
DB/cache 우선
DB/cache에 없으면 API fallback
API 성공 시 DB/cache write-back
API 실패는 페이지 전체가 아니라 블록 단위로 격리
```

즉, "SSR 의존도를 줄인다"는 말은 SSR을 없앤다는 뜻이 아니다. "외부 API 실시간 호출 하나가 SSR 전체를 막지 않게 한다"는 뜻이다.

## generateMetadata 병목 가능성

Next.js에서 흔한 SEO 병목입니다.

`generateMetadata` 안에서 외부 fetch/API 호출이 많으면 다음 문제가 생길 수 있습니다.

- HTML 응답 지연
- head 생성 지연
- Googlebot timeout
- 서버 연결 실패 증가
- crawl budget 감소

## 점검 대상

```txt
src/app/(site)/boards/[slug]/[postNumber]/page.tsx
src/app/(site)/livescore/football/player/[id]/[slug]/page.tsx
src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx
src/app/(site)/livescore/football/match/[id]/[slug]/page.tsx
src/app/(site)/livescore/football/leagues/[id]/[slug]/page.tsx
```

## 권장

- metadata fetch 최소화
- 외부 football API 직접 호출은 DB/cache miss 때만 fallback으로 사용
- DB summary/cache/shell 사용
- API fallback 성공 시 최소 shell을 DB/cache에 저장
- API temporary failure 시 빠르게 fallback metadata 반환
- real missing과 temporary failure 구분
- metadata에 필요한 데이터와 본문 렌더링 데이터를 분리
- timeout을 짧게 두고 실패하면 기본 title/description 반환

## SSR + 외부 API 의존도 문제

Googlebot 요청 시 다음 병목이 발생할 수 있습니다.

- football API 응답 지연
- Supabase 응답 지연
- lineups/statistics/events fetch 지연
- tab별 데이터 fetch
- dynamic route cold start
- metadata와 본문이 같은 외부 데이터에 의존

## 권장 SSR 정책

- SSR은 유지한다.
- 첫 HTML에 필요한 핵심 SEO 텍스트는 서버 HTML에 포함한다.
- 페이지 단위 ISR이 어려운 dynamic route는 데이터 단위 `unstable_cache`, React `cache`, DB shell을 사용한다.
- stale-while-revalidate 전략을 사용한다.
- DB/cache를 먼저 읽고, 없을 때만 API fallback을 호출한다.
- API fallback 성공 시 다음 요청을 위해 최소 shell을 저장한다.
- timeout은 짧게 설정한다.
- API temporary failure 시에도 DB shell이 있으면 200 HTML과 기본 콘텐츠를 반환한다.
- DB shell도 없고 API에서도 실제 missing이면 404 또는 noindex missing metadata를 반환한다.
- skeleton만 반환하지 말 것
- overview preview는 필요한 데이터라면 SSR에 유지한다.
- 전체 목록, 상세 탭, 실시간성이 강한 데이터는 탭 SSR, client lazy, 또는 별도 cached API로 분리할 수 있다.

## overview 데이터 처리 기준

overview가 무겁다는 이유만으로 필요한 데이터를 제거하면 안 된다.

대신 데이터를 중요도와 실패 허용 범위로 나눈다.

```txt
1. 핵심 shell
   팀/선수/경기/리그 이름, slug, 날짜, 점수, 국가, 리그, 로고 등
   SSR 필수, DB/cache 우선, 없으면 API fallback

2. overview preview
   최근 경기, 예정 경기, 순위 preview, 선수 랭킹 preview, 이적 preview 등
   SSR 유지 가능, 블록별 cache/TTL/실패 격리 필요

3. 상세/전체 데이터
   전체 스쿼드, 전체 이적 내역, 전체 시즌 경기, 라인업, 이벤트, 세부 통계 등
   탭 SSR, client lazy, 별도 cached API로 분리 가능
```

overview preview는 `Promise.all` 하나로 전체를 묶기보다 블록별 실패를 격리하는 구조가 좋다.

```txt
recent matches 실패 -> recent block만 fallback
standings 성공 -> standings block 표시
player rankings 성공 -> rankings block 표시
team shell 성공 -> 페이지 200 유지
```

## 200 fallback 기준

무조건 200을 반환하면 안 된다.

```txt
200 fallback이 맞는 경우:
- DB shell이 있음
- URL 대상은 실제로 존재한다고 볼 수 있음
- 외부 API가 일시적으로 실패함
- 일부 overview block만 실패함

404 또는 noindex가 맞는 경우:
- id가 잘못됨
- DB shell도 없음
- API에서도 대상을 찾지 못함
- slug가 의미 없는 placeholder이고 복구 가능한 canonical도 없음
```

## 현재 우선순위

| Route | 현재 방향 | 우선순위 |
| --- | --- | --- |
| `boards/[slug]/[postNumber]` | metadata용 board/post meta cache 사용 | 낮음 |
| `player/[id]/[slug]` | player shell-first 적용, 상세 탭은 API/cache 유지 | 중간 |
| `team/[id]/[slug]` | team shell-first 적용, overview preview SSR 유지 필요 | 높음 |
| `match/[id]/[slug]` | match shell-first 적용, 이벤트/라인업/통계는 API/cache 유지 | 중간 |
| `leagues/[id]/[slug]` | cache miss 시 league API 의존도가 남아 있음 | 높음 |
