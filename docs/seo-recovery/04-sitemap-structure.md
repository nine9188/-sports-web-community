# 04. sitemap 구조 재설계

## 공식 문서 기준 결론

현재 구조가 완전히 잘못된 것은 아닙니다. Next.js는 `generateSitemaps()`로 여러 sitemap을 만들 수 있고, 각 sitemap은 `/.../sitemap/[id].xml` 형태로 노출될 수 있습니다.

다만 현재 복구 국면에서는 운영과 Search Console 진단을 쉽게 하기 위해 root `/sitemap.xml`을 **sitemap index**로 바꾸는 편이 더 좋습니다.

권장 결론:

```txt
/sitemap.xml = sitemap index
/sitemaps/{type}/sitemap.xml = 단일 sitemap
/sitemaps/{type}/sitemap/0.xml = 분할 sitemap
robots.txt = Sitemap: https://4590football.com/sitemap.xml 하나만 안내
Search Console = /sitemap.xml 하나를 대표 제출
```

공식 문서:

- Google sitemap 생성/제출: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google sitemap index: https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps
- Google lastmod 안내: https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping
- Next.js sitemap: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Next.js generateSitemaps: https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
- Next.js caching/revalidate: https://nextjs.org/docs/app/guides/caching-without-cache-components

---

## 현재 구조

현재 형태:

```txt
/sitemap.xml
/boards/sitemap.xml
/boards/posts/sitemap/0.xml
/livescore/football/leagues/sitemap.xml
/livescore/football/team/sitemap/0.xml
/livescore/football/player/sitemap/0.xml
/livescore/football/match/sitemap/0.xml
/transfers/sitemap.xml
/shop/sitemap.xml
```

`0.xml`만 있는 이유:

- 코드상 `SITEMAP_PAGE_SIZE = 50000`
- 각 유형별 URL 수가 5만 개 미만
- 그래서 `0.xml`만 생성됨
- `1.xml`이 404인 것은 현재 구조에서는 정상

Next.js 공식 문서도 `generateSitemaps()`로 sitemap을 나누는 예시에서 50,000 URL 단위 분할을 설명합니다.

---

## 현재 구조의 아쉬운 점

- root `/sitemap.xml`이 전체 sitemap index가 아니라 static URL 11개짜리 `urlset`
- 실제 대량 sitemap은 robots.txt와 Search Console 개별 제출에 의존
- Search Console에서 어떤 sitemap이 어떤 URL을 발견했는지 추적이 분산됨
- `감지된 참조 사이트맵 없음` 같은 메시지가 더 헷갈리게 보일 수 있음
- robots.txt가 매 요청마다 sitemap count를 DB에서 계산
- 하위 sitemap route들이 `force-dynamic` 기반
- sitemap 재평가 시점에 DB 지연/실패가 있으면 처리 안정성이 떨어질 수 있음

현재 구조는 동작할 수는 있지만, 복구 국면에서는 진단과 안정성 면에서 불리합니다.

---

## 권장 구조

root `/sitemap.xml`을 sitemap index로 만듭니다.

Search Console에는 대표로 아래 하나만 제출합니다.

```txt
https://4590football.com/sitemap.xml
```

robots.txt에도 대표 sitemap 하나만 둡니다.

```txt
Sitemap: https://4590football.com/sitemap.xml
```

권장 하위 구조:

```txt
/sitemap.xml
/sitemaps/static/sitemap.xml
/sitemaps/boards/sitemap.xml
/sitemaps/posts/sitemap/0.xml
/sitemaps/leagues/sitemap.xml
/sitemaps/teams/sitemap/0.xml
/sitemaps/players/sitemap/0.xml
/sitemaps/matches/sitemap/0.xml
/sitemaps/transfers/sitemap.xml
/sitemaps/shop/sitemap.xml
```

---

## sitemap index 예시

Google 공식 문서 기준으로 sitemap index의 필수 태그는 `sitemapindex`, `sitemap`, `loc`입니다. `lastmod`는 선택 태그지만 crawl scheduling에 도움이 될 수 있습니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://4590football.com/sitemaps/static/sitemap.xml</loc>
    <lastmod>2026-05-16T00:00:00+09:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://4590football.com/sitemaps/boards/sitemap.xml</loc>
    <lastmod>2026-05-16T00:00:00+09:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://4590football.com/sitemaps/posts/sitemap/0.xml</loc>
    <lastmod>2026-05-16T00:00:00+09:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://4590football.com/sitemaps/players/sitemap/0.xml</loc>
    <lastmod>2026-05-16T00:00:00+09:00</lastmod>
  </sitemap>
</sitemapindex>
```

주의:

`lastmod` 예시 날짜는 실제 구현 시 고정값으로 쓰면 안 됩니다. 각 sitemap 파일의 실제 변경 시각 또는 해당 shard 안의 canonical URL 중 가장 최근 의미 있는 수정 시각을 사용해야 합니다.

---

## lastmod 정책

### 공식 문서 기준

Google 문서 기준으로 `lastmod`는 필수는 아닙니다.

하지만 Google은 `lastmod`를 이미 발견한 URL의 재크롤 일정을 잡는 신호로 사용할 수 있다고 설명합니다. 따라서 정확하게 넣을 수 있다면 넣는 것이 좋습니다.

핵심은 다음입니다.

```txt
lastmod는 무조건 오늘 날짜로 넣는 태그가 아니다.
정확하고 일관되게 현실과 맞을 때 도움이 된다.
```

Google 공식 블로그의 요지는 다음과 같습니다.

- `lastmod`는 crawl scheduling 신호로 사용될 수 있음
- 지원되는 날짜 형식이어야 함
- 실제 변경일과 일관되게 맞아야 함
- 페이지가 7년 전에 바뀌었는데 어제 바뀐 것처럼 쓰면 Google이 신뢰하지 않게 됨
- 모든 페이지에 써도 되고, 자신 있는 페이지만 써도 됨
- 홈페이지나 카테고리처럼 변경일을 명확히 알기 어려운 페이지는 생략해도 됨
- 의미 있는 수정일만 반영해야 함
- footer/sidebar 같은 사소한 변경은 `lastmod` 갱신 대상이 아님
- 본문, 구조화 데이터, 주요 링크 변경은 `lastmod` 갱신 대상

### 우리 사이트 권장 정책

`lastmod`는 넣는 방향이 좋습니다. 단, 정확한 값만 넣습니다.

권장:

```txt
게시글 URL: posts.updated_at || posts.created_at
선수 URL: player_seo.updated_at 또는 player row updated_at
팀 URL: team row updated_at
경기 URL: fixture updated_at || match_date
게시판 목록 URL: board.updated_at 또는 해당 게시판 최신 게시글 updated_at
static URL: 실제 페이지 수정일을 알 수 없으면 생략하거나 배포 시각을 신중히 사용
```

금지:

```txt
모든 URL에 new Date() 사용
모든 URL에 sitemap 생성 시각 사용
매 요청마다 lastmod가 오늘로 바뀌는 구조
의미 없는 footer/sidebar 수정으로 전체 URL lastmod 갱신
```

### sitemap index의 lastmod

sitemap index 안의 `lastmod`는 해당 sitemap 파일 자체가 수정된 시각입니다.

실무적으로는 다음 중 하나를 씁니다.

```txt
1. 해당 sitemap shard 안 URL들의 max(lastmod)
2. cron으로 정적 sitemap 파일을 다시 생성한 실제 파일 수정 시각
3. 해당 sitemap 내용이 실제로 바뀐 시각
```

우리 사이트는 DB 기반 동적 sitemap이므로 우선 `max(updated_at)` 방식이 가장 자연스럽습니다.

---

## changefreq / priority 정책

Google 공식 블로그 기준으로 Google은 `changefreq`와 `priority`를 사용하지 않습니다.

따라서 복구 국면에서는 다음처럼 가는 편이 더 낫습니다.

권장:

```txt
loc + lastmod 중심
```

비권장:

```txt
changefreq / priority에 많은 의미 부여
```

Next.js는 `changeFrequency`, `priority` 필드를 지원하지만, Google SEO 복구 목적에서는 우선순위가 낮습니다.

---

## revalidate란 무엇인가

Next.js App Router에서 `revalidate`는 캐시된 결과를 얼마 동안 재사용할지 정하는 시간 기반 재검증 값입니다.

예:

```ts
export const revalidate = 3600;
```

의미:

```txt
최대 3600초 동안 캐시된 route 결과를 재사용하고,
이후 요청에서 재생성/재검증할 수 있게 한다.
```

fetch에는 다음처럼 쓸 수 있습니다.

```ts
await fetch(url, { next: { revalidate: 3600 } });
```

DB query처럼 fetch가 아닌 함수는 `unstable_cache`의 `revalidate` 옵션을 사용할 수 있습니다.

```ts
import { unstable_cache } from 'next/cache';

export const getCachedSitemapData = unstable_cache(
  async () => {
    return getSitemapDataFromDatabase();
  },
  ['sitemap-data'],
  { revalidate: 3600 }
);
```

### 현재 코드와의 차이

현재 하위 sitemap route에는 `force-dynamic`이 있습니다.

```ts
export const dynamic = 'force-dynamic';
```

이 의미는 매 요청마다 동적으로 렌더링하는 쪽에 가깝습니다. sitemap처럼 Googlebot이 반복적으로 읽는 파일에는 불리할 수 있습니다.

권장 방향:

```ts
export const revalidate = 3600;
```

또는:

```ts
export const revalidate = 21600; // 6시간
```

게시글이 매우 자주 생기면 1시간, 선수/팀/경기처럼 덜 급한 sitemap은 6~24시간도 검토할 수 있습니다.

주의:

Next.js 16에서 `cacheComponents` 플래그를 사용하면 기존 route segment `revalidate` 모델이 달라집니다. 현재 `next.config.js` 기준으로는 `cacheComponents`가 켜져 있지 않으므로 기존 `revalidate` 모델을 문서 기준으로 검토할 수 있습니다.

---

## Next.js 구현 방향

### 1. root sitemap index

기존 `src/app/sitemap.ts`는 urlset을 반환했습니다.

root `/sitemap.xml`을 sitemap index로 만들려면 일반 route handler가 더 명확합니다.

권장 후보:

```txt
src/app/sitemap.xml/route.ts
```

주의:

기존 `src/app/sitemap.ts`와 `/sitemap.xml` route가 충돌하지 않게 하나의 방식만 남겨야 합니다.

### 2. 하위 sitemap

권장 후보:

```txt
src/app/sitemaps/static/sitemap.ts
src/app/sitemaps/boards/sitemap.ts
src/app/sitemaps/posts/sitemap.ts
src/app/sitemaps/players/sitemap.ts
src/app/sitemaps/teams/sitemap.ts
src/app/sitemaps/matches/sitemap.ts
```

또는 현재 Next.js `generateSitemaps()` 구조를 유지하되, root sitemap index에서 현재 하위 URL을 참조하는 방식도 가능합니다.

단기 안정화:

```txt
/sitemap.xml index가 기존 하위 sitemap URL들을 참조
```

장기 정리:

```txt
/sitemaps/{type}/sitemap.xml
/sitemaps/{type}/sitemap/0.xml
```

Next.js 공식 `generateSitemaps()`를 사용하면 분할 sitemap URL은 `/.../sitemap/[id].xml` 형태로 생성됩니다. 그래서 `posts-0.xml`보다 `/sitemaps/posts/sitemap/0.xml` 형태가 Next 공식 방식에 더 가깝습니다.

---

## robots.txt 정책

현재 robots.txt는 여러 하위 sitemap을 직접 나열합니다.

권장:

```txt
Sitemap: https://4590football.com/sitemap.xml
```

하나만 남깁니다.

이렇게 하면 Search Console과 robots.txt가 같은 대표 sitemap을 바라보게 됩니다.

---

## 구현 우선순위

1. `/sitemap.xml`을 sitemap index로 변경
2. sitemap index에 모든 하위 sitemap `loc` 추가
3. sitemap index의 `lastmod`를 하위 sitemap별 실제 변경일 기준으로 추가
4. 하위 sitemap URL에는 canonical/indexable URL만 포함
5. 하위 sitemap URL별 `lastmod` 추가
6. `force-dynamic` 제거 검토
7. sitemap route에 `revalidate` 또는 `unstable_cache` 적용
8. robots.txt는 대표 `/sitemap.xml` 하나만 안내
9. Search Console에는 `/sitemap.xml` 하나를 대표 제출

---

## 최종 검증 기준

```txt
GET /sitemap.xml
  - 200
  - Content-Type: application/xml 또는 text/xml
  - root tag: sitemapindex
  - 하위 sitemap loc 포함
  - 하위 sitemap lastmod 포함

GET /sitemaps/posts/sitemap/0.xml
  - 200
  - root tag: urlset
  - canonical 게시글 URL만 포함
  - redirect/noindex/query duplicate URL 없음
  - 가능한 URL에 정확한 lastmod 포함

GET /robots.txt
  - 200
  - Sitemap: https://4590football.com/sitemap.xml
  - 하위 sitemap 직접 나열은 제거 권장
```

Search Console 기준:

```txt
/sitemap.xml 제출 성공
하위 sitemap 발견 성공
lastmod 오류 없음
sitemap 읽기 실패 없음
```
