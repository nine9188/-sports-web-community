# 02. 서버 연결 실패와 Googlebot 안정성

## 왜 가장 위험한가

Search Console 기준 서버 연결 실패 비율이 높습니다. 이 상태가 지속되면 Googlebot이 사이트를 불안정한 사이트로 판단할 가능성이 있습니다.

예상 영향:

- crawl budget 감소
- 신규 URL 색인 지연
- 기존 URL 제거 가속
- sitemap 재처리 지연
- 전체 색인 회복 지연

## 현재 구조상 위험 요소

- Next.js SSR
- 외부 football API
- 실시간 데이터
- dynamic routes 대량
- `generateMetadata` 동적 생성
- Supabase 조회
- Vercel function cold start / timeout 가능성
- Cloudflare 또는 Vercel challenge / rate limit 가능성

## 확인 필요

- Vercel function timeout
- 5xx 로그
- cold start 빈도
- Edge runtime / Serverless runtime fetch 실패
- Googlebot 요청 시 응답 시간
- Googlebot이 WAF / bot challenge / rate limit에 걸리는지
- sitemap, robots, 주요 상세 URL의 TTFB

## 우선순위

```txt
서버 연결 실패 제거 > sitemap 구조 개선 > 색인 회복 요청
```

서버가 불안정하면 sitemap을 아무리 잘 만들어도 Google이 적극적으로 회복하지 않습니다.

## 검증 기준

- Googlebot 요청이 challenge/429에 걸리지 않음
- 주요 URL이 안정적으로 200 응답
- `/robots.txt` 빠른 200
- `/sitemap.xml` 빠른 200
- Search Console 서버 연결 실패율 감소
