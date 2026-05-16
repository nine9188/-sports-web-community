# 08. 에이전트별 작업 분배

## 작업 1. 게시글 상세 내부 링크 clean URL화

목표:

게시판 목록에서 게시글을 클릭할 때 더 이상 `?page=`, `?from=`이 붙지 않게 합니다.

담당 파일:

```txt
src/domains/boards/components/post/postlist/utils.ts
```

검증:

- 게시글 링크 href에 `page=` 없음
- 게시글 링크 href에 `from=` 없음
- href는 `/boards/{slug}/{postNumber}` 형태

## 작업 2. listPage 단일화

목표:

게시글 상세 하단 목록에서 `listPage`만 사용하고 기존 query를 제거합니다.

담당 파일:

```txt
src/domains/boards/components/layout/PostDetailRelatedList.tsx
```

검증:

- `?page=N&listPage=M` 생성 금지
- `?from=...&listPage=M` 생성 금지
- pagination 후 URL은 `?listPage=N`만 유지

## 작업 3. 이전글/다음글 clean URL화

목표:

이전글/다음글 링크가 query를 전파하지 않게 합니다.

담당 파일:

```txt
src/app/(site)/boards/[slug]/[postNumber]/page.tsx
src/domains/boards/components/post/PostNavigation.tsx
```

검증:

- 이전글 href에 query 없음
- 다음글 href에 query 없음
- `page`, `from`, `sort`, `listPage` 전파 없음

## 작업 4. sitemap index 재설계

목표:

root `/sitemap.xml`을 sitemap index로 바꾸고, Search Console 제출 구조를 단순화합니다.

담당 파일 후보:

```txt
src/app/sitemap.ts
src/app/sitemap.xml/route.ts
src/app/robots.txt/route.ts
src/shared/seo/sitemap.ts
```

권장:

- `src/app/sitemap.ts` 방식 대신 `src/app/sitemap.xml/route.ts`에서 sitemap index XML 직접 반환
- 기존 `src/app/sitemap.ts`와 충돌하지 않게 정리
- robots.txt는 대표 sitemap 하나만 노출

검증:

- `/sitemap.xml` 응답이 `<sitemapindex>`여야 함
- Search Console에는 `/sitemap.xml` 하나만 대표 제출 가능
- 하위 sitemap은 모두 200
- 하위 sitemap은 canonical indexable URL만 포함

## 작업 5. sitemap/robots 안정화

목표:

sitemap과 robots가 DB 지연/실패에 흔들리지 않게 합니다.

담당 파일:

```txt
src/shared/seo/sitemap.ts
src/app/robots.txt/route.ts
src/app/(site)/boards/posts/sitemap.ts
src/app/(site)/livescore/football/player/sitemap.ts
src/app/(site)/livescore/football/team/sitemap.ts
src/app/(site)/livescore/football/match/sitemap.ts
```

검증:

- `/robots.txt` 빠른 200
- `/sitemap.xml` 빠른 200
- 하위 sitemap 빠른 200
- Supabase 일시 실패 시 빈 sitemap 또는 sitemap 목록 누락 방지

## 작업 6. old -> new redirect 샘플링 검사

목표:

구 URL이 정확한 새 URL로 이전되는지 확인합니다.

검증 형태:

```txt
old-url -> 301/308 -> exact-new-url -> 200
```

실패 유형:

- 홈으로 redirect
- 404
- redirect chain
- canonical mismatch
- robots 차단으로 redirect 확인 불가

## 작업 7. generateMetadata 병목 점검

목표:

Googlebot 요청 시 metadata 생성 때문에 HTML 응답이 늦어지는지 확인합니다.

담당 후보:

```txt
src/app/(site)/boards/[slug]/[postNumber]/page.tsx
src/app/(site)/livescore/football/player/[id]/[slug]/page.tsx
src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx
src/app/(site)/livescore/football/match/[id]/[slug]/page.tsx
```

검증:

- metadata에서 외부 API 직접 호출 최소화
- timeout/fallback 존재
- 실패 시에도 빠른 기본 metadata 반환

## 작업 8. Googlebot 서버 안정성 점검

목표:

Search Console의 서버 연결 실패율을 낮춥니다.

확인:

- Vercel runtime logs
- timeout
- 5xx
- cold start
- WAF / bot challenge
- Googlebot user-agent 요청
- sitemap/robots/상세 URL TTFB

검증:

- Googlebot 요청이 challenge/429에 걸리지 않음
- 주요 URL 200 응답 안정
- sitemap/robots 200 응답 안정
- Search Console 서버 연결 실패율 감소
