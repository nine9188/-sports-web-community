# 04. Sitemap 구조

## 현재 운영 정책

운영 sitemap은 root `/sitemap.xml` 하나만 사용한다.

```txt
/sitemap.xml = 전체 URL을 담은 단일 urlset
robots.txt = Sitemap: https://4590football.com/sitemap.xml 하나만 안내
Search Console = /sitemap.xml 하나만 제출
```

현재 전체 URL 수가 5만 개 미만이므로 sitemap index와 하위 sitemap 분할이 필요하지 않다.

## 제거한 구조

아래 하위 sitemap route는 더 이상 운영 sitemap으로 사용하지 않는다.

```txt
/sitemap-index.xml
/sitemap-*.xml
/sitemaps/*
/boards/sitemap.xml
/boards/posts/sitemap/*
/livescore/football/leagues/sitemap.xml
/livescore/football/team/sitemap/*
/livescore/football/player/sitemap/*
/livescore/football/match/sitemap/*
/shop/sitemap.xml
/transfers/sitemap.xml
```

과거에 Googlebot 또는 외부 크롤러가 발견한 URL은 404로 두지 않고 `/sitemap.xml`로 301 redirect한다.

## 관련 파일

```txt
src/app/sitemap.xml/route.ts
src/app/robots.txt/route.ts
src/app/ai.txt/route.ts
src/app/llms.txt/route.ts
next.config.js
scripts/verify-sitemaps.js
```

## 검증 기준

```txt
GET /sitemap.xml                         -> 200 application/xml
GET /sitemap-index.xml                   -> 301 /sitemap.xml
GET /sitemap-static.xml                  -> 301 /sitemap.xml
GET /sitemaps/teams/sitemap/0.xml        -> 301 /sitemap.xml
GET /sitemaps/teams/sitemap/0.xm         -> 301 /sitemap.xml
GET /boards/posts/sitemap/0.xml          -> 301 /sitemap.xml
GET /livescore/football/team/sitemap/0.xml -> 301 /sitemap.xml
GET /shop/sitemap.xml                    -> 301 /sitemap.xml
GET /transfers/sitemap.xml               -> 301 /sitemap.xml
```

`robots.txt`, `ai.txt`, `llms.txt`는 모두 `https://4590football.com/sitemap.xml`만 안내해야 한다.
