# 09. 최종 검증 체크리스트

## Sitemap

```txt
/sitemap.xml
  - 200
  - application/xml
  - <urlset>
  - loc 수 1,000개 이상
  - livescore team/player/match URL은 slug 포함
```

과거 sitemap URL은 모두 `/sitemap.xml`로 301 redirect되어야 한다.

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

## Robots And AI Files

```txt
/robots.txt
  - 200
  - Sitemap: https://4590football.com/sitemap.xml 하나만 포함
  - Disallow: /cdn-cgi/ 포함

/ai.txt
  - Sitemap: https://4590football.com/sitemap.xml 하나만 포함
  - Disallow: /cdn-cgi/ 포함

/llms.txt
  - Sitemap: https://4590football.com/sitemap.xml 하나만 포함
```

## 서버 안정성

- `/robots.txt`, `/sitemap.xml`, `/ads.txt`는 Googlebot UA와 일반 요청 모두 200이어야 한다.
- Vercel Firewall의 SEO 파일 bypass 룰에는 `robots.txt`, `ads.txt`, `sitemap.xml`, `sitemap-*.xml`, `/sitemaps/*`가 포함되어야 한다.
- Googlebot UA 요청이 429/challenge에 걸리지 않아야 한다.
- Cloudflare Speed Brain을 끈 뒤 503이 감소하는지 1시간/24시간 단위로 비교한다.

## Search Console

- Search Console에는 `/sitemap.xml` 하나만 제출한다.
- `/sitemap-index.xml` 또는 `/sitemaps/*`는 새로 제출하지 않는다.
- 과거 sitemap URL은 301 redirect로 자연스럽게 정리되도록 둔다.
