# 사이트맵 간소화 점검 기록

목표:

- DB `sitemap_snapshots` 의존 제거
- `/sitemap.xml`을 가벼운 sitemap index로 전환
- 선수/경기처럼 얇거나 대량인 URL은 색인 회복 전까지 sitemap에서 제외
- 도메인 이전 전 canonical/sitemap 꼬임 위험 줄이기

## 2026-06-01 현재 확인값

현재 DB에 저장된 `sitemap_snapshots.key = main`:

- 생성 시각: `2026-06-01T11:30:14.419+00:00`
- 저장된 URL 수: `3,967`

저장된 XML의 URL 타입별 분포:

| 타입 | URL 수 |
| --- | ---: |
| static | 7 |
| boards | 15 |
| posts | 239 |
| leagues | 5 |
| teams | 109 |
| players | 3,122 |
| matches | 374 |
| transfers | 96 |
| shop | 0 |
| other | 0 |

DB 기준 후보 규모:

| 후보 | 수 |
| --- | ---: |
| 공개 게시글 전체 | 3,819 |
| active 팀 전체 | 2,817 |
| active 선수 전체 | 10,661 |
| 90일 경기 전체 | 6,748 |
| 게시판 전체 | 176 |
| active shop item | 338 |
| 주요 리그 팀 | 415 |

추가 확인:

- 현재 저장 스냅샷은 선수 URL 비중이 매우 큼: `3,122 / 3,967`
- 스냅샷 방식은 도메인 이전 시 예전 도메인 XML이 남을 수 있음
- `/sitemap.xml`이 스냅샷만 바라보면 스냅샷 누락/실패 시 검색엔진에 오래된 상태가 계속 노출됨

## 결정

스냅샷을 제거하고 `/sitemap.xml`을 sitemap index로 바꾼다.

새 index 구성:

- `/sitemaps/static.xml`
- `/sitemaps/boards.xml`
- `/sitemaps/recent-posts.xml`
- `/sitemaps/livescore-leagues.xml`
- `/sitemaps/livescore-teams.xml`
- `/sitemaps/livescore-players.xml`
- `/sitemaps/livescore-matches.xml`
- `/sitemaps/transfers.xml`

제외:

- 팀 전체 sitemap
- 오래된 게시글 전체 sitemap
- 이모티콘 스튜디오/상점 카테고리/상품 sitemap

유지:

- 최근 게시글 최대 1,000개
- 게시판 URL
- 주요 리그 URL
- 주요 리그 팀 URL
- 주요 리그 팀 소속 선수 URL
- 주요 리그 경기 URL
- 이적 팀 URL
- 상점 메인 URL
- 정적 핵심 페이지

색인 제외 확인:

- 상점: `/shop/emoticon-studio`, `/shop/[category]`
  - robots.txt에서 막지 않고 페이지 메타 `noindex, follow`로 제외한다.
  - 이유: 이미 발견된 URL이 있으면 검색엔진이 페이지를 읽고 noindex를 반영할 수 있어야 한다.
- 인증/회원: `/signin`, `/signup`, `/social-signup`, `/auth/*`
- 개인화/계정: `/notifications`, `/settings/*`, `/user/[publicId]`
- 관리자: `/admin/*`
- 작성/도구성 화면: `/boards/[slug]/create`, `/livescore/football/player-ui-preview`
- 정책 페이지: `/privacy`, `/terms`
- API/시스템: `/api/*`, `/rss.xml`, `/ai.txt`, `/llms.txt`, `.well-known/*`

예상 효과:

- 선수/경기 대량 URL 제거
- sitemap URL 품질을 핵심 URL 중심으로 재정렬
- 도메인 변경 시 스냅샷 재생성 누락 리스크 제거
- 검색엔진에 제출할 sitemap 구조를 명확하게 분리

## 구현 메모

- `/sitemap.xml`: sitemap index XML 반환
- `src/shared/seo/sitemapSnapshot.ts`: 제거
- `/api/generate-sitemap`: 스냅샷 저장 대신 현재 sitemap index/섹션 카운트 확인용으로 변경
- `robots.txt`: 대표 sitemap은 `/sitemap.xml` 하나만 안내
- `robots.txt`: Google/Bing/Yeti/Yandex/AI crawler 그룹의 인증, 검색, 관리자, 개인화, 작성/수정 URL 차단 규칙 정렬
- `next.config.js`: 기존 sitemap URL 패턴은 `/sitemap.xml`로 영구 리디렉션 정규화
- `next.config.js`: 제거된 `/sitemaps/livescore.xml`도 `/sitemap.xml`로 영구 리디렉션 정규화
- `src/proxy.ts`: `/sitemap.xml`, `/sitemaps/*`, `robots.txt`, `rss.xml`, `ai.txt`, `llms.txt`는 proxy matcher에서 제외됨
- `src/proxy.ts`: Vercel preview/prod 보조 도메인 리디렉션 host는 `NEXT_PUBLIC_SITE_URL` 기준으로 처리
- `ai.txt`, `llms.txt`, IndexNow, JSON-LD 일부 하드코딩 URL을 `siteConfig.url` 또는 `NEXT_PUBLIC_SITE_URL` 기준으로 정렬
- `scripts/verify-sitemaps.js`: sitemap index를 따라가서 하위 urlset 총 URL 수를 검증하도록 변경

## 적용 후 로컬 검증 결과

로컬 서버 `http://localhost:3004` 기준:

| 경로 | 형식 | URL 수 |
| --- | --- | ---: |
| `/sitemap.xml` | sitemapindex | 8 sections |
| `/sitemaps/static.xml` | urlset | 10 |
| `/sitemaps/boards.xml` | urlset | 176 |
| `/sitemaps/recent-posts.xml` | urlset | 1,000 |
| `/sitemaps/livescore-leagues.xml` | urlset | 7 |
| `/sitemaps/livescore-teams.xml` | urlset | 325 |
| `/sitemaps/livescore-players.xml` | urlset | 4,110 |
| `/sitemaps/livescore-matches.xml` | urlset | 515 |
| `/sitemaps/transfers.xml` | urlset | 325 |

총 하위 URL 수:

- `6,468`

기존 스냅샷 대비:

- 기존: `3,967`
- 변경 후: `6,468`
- 증가: `2,501`
- 주요 변화: 라이브스코어 팀 URL을 이적시장 팀 범위와 맞춰 `325`개 포함, 선수 전체 대신 핵심 리그 선수 `4,110`개만 포함, 경기 URL은 핵심 리그/기존 날짜 범위 기준 `515`개 포함

라이브스코어 섹션 기준:

- 리그: 핵심 리그 7개
  - Premier League `39`
  - La Liga `140`
  - Bundesliga `78`
  - Serie A `135`
  - Ligue 1 `61`
  - K League 1 `292`
  - K League 2 `293`
- 팀: 이적시장 팀 그룹 기준 `325`개 포함
- 선수: 위 핵심 리그 팀 소속 active 선수 중 기존 `isWorthlessSitemapPlayer` 필터 통과 URL만 포함
- 경기: 위 핵심 리그 기준, 기존 `matchDateWindow()` 범위인 60일 전부터 30일 후 경기만 포함

핵심 리그 선수 재확인:

- 핵심 리그 팀 수: `138`
- 핵심 리그 팀 소속 active 선수: `4,110`
- 기존 필터 기준 통과: `4,110`
- 실제 sitemap 생성 URL: `4,110`

핵심 리그 경기 재확인:

- 날짜 범위: 현재 시각 기준 `-60일 ~ +30일`
- 확인 시점 기준 범위: `2026-04-02 ~ 2026-07-01`
- 기존 전체 `MATCH_LEAGUE_IDS` 기준 생성 가능 경기 URL: `1,511`
- 핵심 리그 7개 기준 생성 가능 경기 URL: `515`

검증 명령:

```bash
npm run typecheck
npm run build
env SITE_URL=http://localhost:3004 npm run verify:sitemaps
```

검증 결과:

- TypeScript 통과
- Next build 통과
- sitemap verifier 통과

## 도메인 이전 전 확인할 것

- `/sitemap.xml`이 `<sitemapindex>`인지 확인
- index 안 loc가 모두 현재 `NEXT_PUBLIC_SITE_URL` 기준인지 확인
- 하위 sitemap 안 loc가 모두 같은 도메인인지 확인
- match URL은 핵심 리그/날짜 범위 안의 경기만 들어가는지 확인
- player URL은 핵심 리그 선수만 들어가는지 확인
- `robots.txt`가 `/sitemap.xml` 하나만 안내하는지 확인
