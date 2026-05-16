# 07. metadata와 SSR 병목

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
- 외부 football API 직접 호출 지양
- DB summary/cache 사용
- 실패 시에도 빠르게 fallback metadata 반환
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

- ISR/revalidate 적극 사용
- stale-while-revalidate 전략 사용
- fallback HTML 우선 반환
- timeout 짧게 설정
- API 실패 시에도 200 HTML과 기본 콘텐츠 반환
- skeleton만 반환하지 말 것
- 핵심 SEO 텍스트는 서버 HTML에 포함
- 무거운 실시간 데이터는 client 또는 lazy 영역으로 분리
