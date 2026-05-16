# 09. 최종 검증 체크리스트

## URL 정책 검증

```txt
/boards/foreign-news?page=2
  - 허용
  - 게시판 목록 2페이지

/boards/foreign-news/4468
  - 허용
  - 게시글 상세 clean URL

/boards/foreign-news/4468?page=2
  - 내부 링크에서 생성 금지
  - 외부 요청 시 clean URL로 301 권장

/boards/foreign-news/4468?from=root
  - 내부 링크에서 생성 금지
  - 외부 요청 시 clean URL로 301 권장

/boards/foreign-news/4468?listPage=2
  - 필요 시 허용
  - canonical은 clean URL
  - robots는 noindex, follow

/boards/foreign-news/4468?page=2&listPage=3
  - 생성 금지
  - 발견 시 page 제거 또는 clean URL 정리 필요
```

## sitemap 검증

```txt
/sitemap.xml
  - 권장: sitemap index
  - Search Console 대표 제출 대상

/sitemaps/posts/sitemap/0.xml
  - 게시글 canonical URL만 포함

/sitemaps/players/sitemap/0.xml
  - 선수 canonical URL만 포함

/sitemaps/teams/sitemap/0.xml
  - 팀 canonical URL만 포함

/sitemaps/matches/sitemap/0.xml
  - 경기 canonical URL만 포함

/robots.txt
  - 대표 sitemap index 하나만 안내 권장
```

## 서버 안정성 검증

- `/robots.txt` 빠른 200
- `/sitemap.xml` 빠른 200
- 주요 하위 sitemap 빠른 200
- 게시글 상세 URL 빠른 200
- 선수/팀/경기 상세 URL 빠른 200
- Googlebot user-agent 요청이 429/challenge에 걸리지 않음
- Vercel function timeout 없음
- Search Console 서버 연결 실패율 감소

## Search Console 검증

- `/sitemap.xml` 대표 제출
- 하위 sitemap 발견 확인
- sitemap 읽기 성공 확인
- `리디렉션 포함 페이지` 신규 증가 중단
- `사용자가 선택한 표준이 없는 중복 페이지` 신규 증가 중단
- `크롤링됨 - 현재 색인이 생성되지 않음` 증가세 둔화
- indexed URL 회복 추세 확인

## 최종 목표

게시판 목록의 `?page=N`은 유지하되, 게시글 상세 URL은 clean URL을 기본으로 합니다.

sitemap은 root `/sitemap.xml` 하나가 전체 하위 sitemap을 대표하는 sitemap index 구조로 정리합니다.
