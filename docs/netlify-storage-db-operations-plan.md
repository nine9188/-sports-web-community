# 4590fb 배포/이미지/DB 운영 전환 계획

작성일: 2026-06-22

## 결론

현재 현실적인 운영 구조는 다음 방향이다.

```text
웹 앱: Netlify 또는 Node 서버 호스팅
DB/Auth: Supabase 유지
이미지/파일: Supabase Storage에서 분리, R2 또는 Bunny로 이전
CDN/WAF/DNS: Cloudflare 유지
작은 서버 기능: Cloudflare Worker 또는 Netlify Functions
```

Cloudflare Worker에 Next 앱 전체를 올리는 전략은 현재 프로젝트 규모에서는 맞지 않는다. Worker는 작은 API, 이미지 프록시, 업로드 URL 발급, 캐시, cron 같은 보조 역할로만 쓴다.

## 현재 확인된 사실

### Netlify 배포

Netlify 테스트 사이트를 만들고 실제 production 배포까지 성공했다.

- Site: `4590fb-web2-test`
- Production URL: `https://4590fb-web2-test.netlify.app`
- Primary custom domain: `https://4590fb.com`
- WWW redirect: `https://www.4590fb.com` -> `https://4590fb.com`
- Unique deploy URL: `https://6a38fb40af6748906b534027--4590fb-web2-test.netlify.app`
- Build logs: `https://app.netlify.com/projects/4590fb-web2-test/deploys/6a38fb40af6748906b534027`
- Staging custom domain: `https://netlify.4590fb.com`

확인 결과:

- `https://4590fb.com/` -> 200
- `https://www.4590fb.com/` -> `https://4590fb.com/` 301 리다이렉트 정상
- `https://4590fb.com/boards/soccer` -> 200
- `https://4590fb.com/boards/soccer/create` -> 비로그인 상태에서 `/signin?...` 307 리다이렉트 정상
- `https://4590fb.com/sitemap.xml` -> 200
- `https://4590fb.com/robots.txt` -> 200
- `https://4590fb.com/rss.xml` -> 200
- `https://4590fb.com/auth/callback` -> code 없이 접근하면 `/signin?...인증 정보가 없습니다` 307 리다이렉트 정상
- Netlify Next.js Runtime `v5.15.12` 감지
- server handler function 번들링 성공
- edge middleware 번들링 성공

주의:

- 로컬 CLI 배포 시 `.env.local` 파일이 함수 zip에 들어갈 수 있다.
- 이를 막기 위해 `next.config.js`에 `outputFileTracingExcludes`를 추가했다.
- 실제 안전한 CLI 배포는 `.env.local`을 임시로 작업 폴더 밖으로 빼고, 프로세스 env로 값을 주입해서 수행해야 한다.
- 마지막 production 배포 산출물 기준 함수 zip 안에 `.env.local`이 없음을 확인했다.

### Netlify local CLI 배포의 한계

Netlify에 secret으로 저장한 값은 CLI에서 조회하면 `**********`로 마스킹된다. 로컬 CLI build/deploy 중 Netlify 사이트 env가 우선 적용되면 build-time sitemap 생성에서 Supabase key가 마스킹값으로 들어가 `Invalid API key` 경고가 날 수 있다.

현재 영향:

- 앱 SSR/라우팅 자체는 뜬다.
- 일부 build-time sitemap 데이터가 비거나 동적 fallback으로 처리될 수 있다.

처리 방향:

- 운영 배포는 Git 기반 Netlify Build로 전환한다.
- 또는 sitemap DB 조회를 build-time prerender가 아니라 runtime route 처리로 정리한다.
- sitemap 생성은 서비스 복구 이후 별도 안정화 작업으로 둔다.

### Cloudflare Worker

OpenNext 산출물 기준 Next 앱 전체를 Cloudflare Worker로 올리는 것은 현재 구조에서는 어렵다.

확인된 크기:

- `.open-next` 전체 약 `86MB`
- `.open-next/server-functions/default` 약 `64MB`
- 핵심 서버 핸들러 약 `16.9MB`

Cloudflare Workers는 스크립트 크기 제한이 있어, 현재 앱 전체 SSR을 Worker 하나에 올리는 전략은 무료 조건에서 불가능하다고 본다.

Worker의 적합한 역할:

- R2 업로드 URL 발급
- 이미지 프록시/CDN 캐시
- 봇 차단/WAF 보조
- 작은 cron/API
- match-cache 같은 독립 캐시 서비스

Worker의 부적합한 역할:

- 현재 Next 앱 전체 SSR
- 모든 게시판/라이브스코어/admin/settings/API를 한 Worker에 통합

## 현재 문제가 되는 비용 구조

기존 의도는 맞았다.

- API-Sports 같은 외부 API 호출 횟수를 줄이기 위해 이미지를 Storage에 캐시했다.
- 선수/팀/리그 이미지를 매번 외부 API나 원본 URL에서 가져오지 않으려는 목적은 타당하다.

문제는 캐시 저장소가 Supabase Storage라는 점이다.

현재 이미지 흐름은 대략 다음과 같다.

```text
사용자 브라우저
  -> cdn.4590fb.com
  -> Cloudflare storage-cdn Worker
  -> cache HIT이면 Cloudflare 응답
  -> cache MISS이면 Supabase Storage 원본 fetch
```

즉 `cdn.4590fb.com`을 쓰고 있어도 원본이 Supabase Storage이면 MISS 때마다 Supabase egress가 계속 발생한다.

Supabase는 DB/Auth로는 계속 쓸 수 있지만, 파일 egress가 커지면 비용 통제가 어렵다. 파일 저장/전송 계층은 분리해야 한다.

## 현재 Supabase Storage 사용처

코드상 Supabase Storage는 일부 기능이 아니라 넓게 깔려 있다.

주요 사용처:

- 게시글 이미지: `post-images`
- 게시글 동영상: `post-videos`
- 게시글 썸네일 캐싱
- 선수 사진: `players`
- 팀 로고: `teams`
- 리그 로고: `leagues`
- 감독 사진: `coachs`
- 경기장 이미지: `venues`
- 프로필 아이콘: `profile-icons`
- 이모티콘 제출/상점 이미지: `emoticon-submissions`
- 라인업 공유 이미지

관련 코드:

- `src/domains/boards/components/post/post-edit-form/utils/uploadPostImageFile.ts`
- `src/domains/boards/components/post/post-edit-form/utils/uploadPostVideoFile.ts`
- `src/domains/boards/actions/posts/cacheThumbnail.ts`
- `src/domains/livescore/actions/images/ensureAssetCached.ts`
- `src/domains/livescore/components/football/match/tabs/lineups/Formation.tsx`
- `src/shared/images/urls.ts`

`src/shared/images/urls.ts`와 여러 도메인 코드에는 "Storage URL" 전제가 강하게 박혀 있다. 이전 시에는 개별 파일을 전부 직접 고치기보다 공통 URL 생성 레이어를 정리해야 한다.

## 큰 구성요소

운영을 나눠서 봐야 할 축은 다음이다.

1. 웹 배포
2. 이미지/파일 저장소
3. DB
4. Auth/session
5. 서버 액션/API
6. CDN/WAF/DNS
7. 백그라운드 작업/cron
8. 로그/모니터링

### 1. 웹 배포

우선순위:

1. Netlify
2. 저렴한 Node 서버 호스팅/VPS
3. Vercel 새 계정은 임시 응급처치로만 검토
4. Cloudflare Worker 전체 이전은 제외

Netlify는 현재 테스트 기준 실제 배포가 가능하다. 우선은 Netlify로 서비스를 살리고, 비용이나 제한이 다시 문제가 되면 Node 서버 호스팅으로 이동한다.

### 2. 이미지/파일

목표:

- Supabase Storage 신규 쓰기 중단
- 신규 파일은 R2 또는 Bunny로 저장
- 기존 파일은 큰 버킷부터 이전

후보:

- Cloudflare R2: Cloudflare와 붙이기 좋고 egress 비용 예측이 쉽다.
- Bunny Storage/CDN: 이미지 CDN 운영 관점에서 단순할 수 있다.

권장 방향:

```text
신규 업로드:
  브라우저 -> 작은 API에서 업로드 URL 발급 -> R2/Bunny 직접 업로드

조회:
  브라우저 -> 이미지 CDN 도메인 -> R2/Bunny 원본
```

하지 말아야 할 것:

```text
브라우저 -> Cloudflare Worker -> Supabase Storage
```

이 구조는 캐시 MISS 때 Supabase egress가 계속 나간다.

### 3. DB

Supabase DB는 유지한다.

이유:

- 이미 게시글, 유저, 댓글, 경기 데이터, 권한, RLS, Auth와 연결돼 있다.
- 지금 돈이 새는 핵심은 DB 자체보다 Storage egress 가능성이 높다.
- DB까지 동시에 이전하면 리스크가 너무 크다.

단기 목표:

- Supabase는 DB/Auth 중심으로 남긴다.
- Storage 의존도를 줄인다.
- 리스트/위젯/검색에서 불필요한 큰 JSON/content select를 피한다.

이미 일부 코드는 `thumbnail_url`, `summary` 중심으로 egress를 줄이는 방향이 들어가 있다. 이 방향을 유지한다.

### 4. Auth/session

Supabase Auth 유지.

Netlify 운영 시 확인할 것:

- Supabase Auth Redirect URLs에 실제 운영 도메인 추가
- Kakao/Naver OAuth redirect URL 확인
- `NEXT_PUBLIC_SITE_URL`을 최종 도메인으로 유지
- Netlify 기본 도메인으로 테스트할 때는 OAuth callback이 실제 도메인과 다를 수 있음

현재 `NEXT_PUBLIC_SITE_URL`은 `https://4590fb.com` 기준으로 유지하는 것이 맞다. 최종 도메인을 Netlify로 붙인 뒤 callback을 확인한다.

### 5. 서버 액션/API

Netlify Functions로 Next server actions/API routes가 동작하는지 기본 확인은 됐다.

추가 확인 필요:

- 로그인 후 글쓰기
- 이미지 업로드
- 댓글 작성
- 투표
- 알림
- 관리자 페이지 접근
- cron API
- 내부 API route 권한

이미지 업로드는 장기적으로 Supabase Storage 직접 업로드에서 분리해야 한다.

### 6. CDN/WAF/DNS

Cloudflare는 계속 쓴다.

역할:

- DNS
- WAF
- bot 차단
- 캐시
- rate limiting
- 이미지 CDN 앞단

주의:

- Cloudflare Worker로 전체 앱을 돌리는 것과 Cloudflare를 DNS/WAF/CDN으로 쓰는 것은 다르다.
- 전체 앱은 Netlify/Node 서버에서 돌리고, Cloudflare는 앞단 방어와 캐시 역할로 쓰는 것이 현실적이다.

### 7. 백그라운드 작업/cron

현재 후보:

- Netlify Scheduled Functions
- Cloudflare Workers Cron Triggers
- 외부 cron이 Netlify API route 호출

당장 유지할 것:

- `CRON_SECRET` 기반 보호
- 하이라이트 동기화
- sitemap/IndexNow
- RSS enrichment
- entity summary generation

비용 압박이 있으면 cron 빈도를 줄이고, 이미지 캐싱성 작업을 일단 멈춘다.

### 8. 로그/모니터링

필수로 봐야 할 것:

- Netlify function invocation
- Netlify bandwidth/credits
- Supabase Storage egress
- Supabase DB egress
- Cloudflare cache HIT/MISS
- `storage-cdn` Worker origin fetch 횟수

현재 `storage-cdn` Worker는 `X-Cache` 헤더는 붙이지만, HIT/MISS를 집계하기 위한 로그가 부족하다. 비용을 관리하려면 origin MISS 로그 또는 analytics를 추가해야 한다.

## 당장 처리 순서

### 0. 보안

이번 작업 중 Netlify env import 출력에 secret 값이 터미널에 노출됐다. 운영상 다음을 권장한다.

- Supabase service role key 재발급
- OpenAI key 재발급
- SMTP password 재발급
- Solapi secret 재발급
- OAuth client secret 재발급 검토
- Netlify env는 secret으로 재등록

이 문서와 git에는 값 자체를 남기지 않는다.

### 1. Netlify 기본 도메인 안정성 확인

확인 URL:

- `https://4590fb-web2-test.netlify.app/`
- `https://4590fb-web2-test.netlify.app/boards/soccer`
- `https://4590fb-web2-test.netlify.app/signin`
- `https://4590fb-web2-test.netlify.app/boards/soccer/create`

확인 항목:

- 홈 렌더링
- 게시판 목록
- 상세 게시글
- 로그인 페이지
- 로그인 후 세션 유지
- 글쓰기 페이지 진입
- 이미지 삽입
- 게시글 작성

### 2. Supabase Auth redirect 정리

Supabase Dashboard에서 다음 URL을 추가/확인한다.

```text
https://4590fb.com/auth/callback
https://4590fb.com/auth/naver/callback
https://4590fb-web2-test.netlify.app/auth/callback
https://4590fb-web2-test.netlify.app/auth/naver/callback
```

최종 도메인을 Netlify로 붙인 뒤 테스트 도메인은 제거해도 된다.

### 3. 도메인 전환 상태

2026-06-23 현재 `4590fb.com` 루트 도메인은 Netlify site `4590fb-web2-test`로 연결됐다.

현재 상태:

- 루트 도메인 HTTPS 정상
- `www`는 루트 도메인으로 301 리다이렉트
- Cloudflare proxy를 다시 켜서 `4590fb.com`/`www.4590fb.com` 웹 트래픽은 Cloudflare를 경유함
- 게시판 목록 SSR 정상
- 비로그인 글쓰기 접근 시 signin 리다이렉트 정상
- sitemap/robots/rss 응답 정상

아직 남은 검증:

- 실제 OAuth 로그인
- 로그인 후 세션 유지
- 게시글 작성
- 이미지 삽입/업로드
- 댓글/투표
- 관리자 페이지
- cron/API route

2026-06-23 Cloudflare 방어 재적용:

- Cloudflare `4590fb.com` A 레코드 proxy를 다시 켰다.
- Cloudflare `www.4590fb.com` CNAME 레코드 proxy를 다시 켰다.
- 일반 요청 확인: `https://4590fb.com/` -> 200, `server: cloudflare`
- `www` 확인: `https://www.4590fb.com/` -> `https://4590fb.com/` 301
- GPTBot User-Agent 확인: `/livescore/football/match/1544361/qatar-vs-el-salvador` -> 403, `server: cloudflare`
- Cloudflare WAF/ruleset API는 현재 토큰 권한 부족으로 룰 목록 조회/수정 불가. Dashboard에서 관리한다.

2026-06-23 DNS/Netlify 정리:

- Cloudflare `4590fb.com` A 레코드: `75.2.60.5`
- Cloudflare `www.4590fb.com` CNAME 레코드: `4590fb-web2-test.netlify.app`
- `www` CNAME에 있던 `.ap` 오타를 `.app`으로 수정했다.
- 루트 A 레코드의 오래된 Vercel 주석을 Netlify 주석으로 정리했다.
- Netlify `domain_aliases`에서 중복 `www.4590fb.com` alias를 제거했다.
- Netlify `domain_aliases`에는 staging 확인용 `netlify.4590fb.com`만 남겼다.
- 확인 결과 `https://4590fb.com/` 응답 header의 `server`는 `Netlify`.
- 확인 결과 `https://www.4590fb.com/`은 `https://4590fb.com/`으로 301 리다이렉트.

2026-06-22 진행:

- Netlify site `4590fb-web2-test`에 custom domain `netlify.4590fb.com`을 등록했다.
- Cloudflare DNS에 `netlify.4590fb.com` CNAME을 추가했다.
- CNAME target: `4590fb-web2-test.netlify.app`
- Proxy status: DNS only
- TTL: 300
- HTTP 확인: `http://netlify.4590fb.com/` -> 200
- HTTPS 초기 상태: 인증서가 아직 `netlify.4590fb.com`을 포함하지 않아 curl 인증서 검증 실패
- Netlify TLS provision API는 초기에는 `Unprocessable Entity`를 반환했다. DNS 전파 또는 Netlify 도메인 검증 대기 후 재시도 대상이었다.

이 서브도메인은 실도메인 전환 전 검증용으로 만들었다. 루트 도메인 연결 이후에도 staging/비교 확인용으로 잠시 유지한다.

도메인 확인 명령:

```bash
curl -I https://4590fb.com/
curl -I https://www.4590fb.com/
curl -I https://4590fb.com/boards/soccer
curl -I https://4590fb.com/boards/soccer/create
curl -I https://4590fb.com/sitemap.xml
curl -I https://4590fb.com/robots.txt
curl -I https://4590fb.com/rss.xml
curl -I http://netlify.4590fb.com/
curl -I https://netlify.4590fb.com/
```

HTTPS가 계속 실패하면 Netlify Dashboard에서 다음을 확인한다.

```text
Project -> Domain management -> Custom domains -> netlify.4590fb.com
Project -> Domain management -> HTTPS -> Provision certificate / Renew certificate
```

### 4. 이미지 신규 저장 중단/제한

비용 압박이 크면 즉시 제한한다.

우선 제한:

- 라인업 이미지 자동 업로드 제한
- 게시글 이미지 최대 용량 더 축소
- 동영상 업로드 임시 비활성화 검토
- `cacheThumbnailToStorage()` 신규 저장 중단
- `ensureAssetCached()` 신규 캐싱 중단 또는 관리자 수동 실행만 허용

### 5. 이미지 저장소 이전

이전 순서:

1. `teams`, `leagues`: 작고 자주 쓰임. 먼저 옮기기 좋다.
2. `players`: 개수가 많고 조회가 많다.
3. `post-images`: 사용자 업로드라 용량과 egress 영향이 크다.
4. `post-videos`: 가장 비용 위험이 높다. 가능하면 별도 정책 필요.
5. `profile-icons`, `emoticon-submissions`: 기능 영향도 확인 후 이전.

공통 URL 레이어:

- `src/shared/images/urls.ts`를 중심으로 provider 분기 추가
- DB에는 가능하면 provider-neutral path를 저장
- 표시할 때만 CDN base URL을 붙인다

예:

```text
저장값: players/md/123.webp
표시값: https://img.4590fb.com/players/md/123.webp
```

### 6. R2/Bunny 선택

Cloudflare R2가 적합한 경우:

- Cloudflare DNS/WAF/CDN과 같이 관리하고 싶다.
- Worker로 업로드 URL 발급/API를 만들 계획이다.
- egress 비용 예측을 우선한다.

Bunny가 적합한 경우:

- 이미지 CDN/스토리지 관리 UI가 단순한 쪽을 원한다.
- Worker를 덜 쓰고 싶다.
- CDN 운영을 파일 저장소와 함께 단순화하고 싶다.

둘 다 Supabase Storage보다 파일 전송 비용 통제에는 낫다. 단, 어떤 선택이든 기존 파일 마이그레이션과 URL 레이어 정리가 필요하다.

## Netlify CLI 배포 메모

안전한 로컬 CLI 배포 방식:

```bash
NETLIFY=/home/kim/.npm/_npx/b3ca12a867cd0704/node_modules/.bin/netlify
SITE_ID=8fb1f3c7-4ae4-4f90-b228-44b3bc9e206b

TMP_ENV=/tmp/web2-env-local-save-$$
mv .env.local "$TMP_ENV"

restore_env() {
  if [ -f "$TMP_ENV" ]; then mv "$TMP_ENV" .env.local; fi
}
trap restore_env EXIT

# 필요한 env를 프로세스 환경변수로 export한 뒤:
"$NETLIFY" deploy --prod --build --skip-functions-cache --site "$SITE_ID"
```

주의:

- `.env.local`이 작업 폴더에 있으면 Netlify 함수 zip에 포함될 수 있다.
- 배포 전후로 zip 내부에 `.env.local`이 없는지 확인한다.
- 장기적으로는 로컬 CLI 배포보다 Git 기반 Netlify Build가 낫다.

## Netlify 관련 남은 작업

- `netlify.toml`을 저장소에 명시적으로 추가할지 결정
- Git 기반 배포 연결
- production/deploy-preview env 정리
- secret 재발급 및 재등록
- sitemap build-time Supabase key 경고 해결
- 도메인 연결
- Cloudflare DNS 전환
- Supabase Auth/OAuth redirect 확인

## Vercel 새 계정 전환 메모

2026-06-23 진행:

- 새 Vercel 계정/팀으로 CLI 로그인 완료
- Vercel team: `4590`
- 새 Vercel project: `web2`
- 새 Vercel project ID: `prj_Z0R2paKW7GxDpcLrYJvzrNwDU2iU`
- 새 Vercel org/team ID: `team_s8rmvP3vOrCCLDRifOkMGV4l`
- 기존 `.vercel/project.json`은 `.vercel/project.old-vercel-team.json`으로 백업
- 현재 `.vercel/project.json`은 새 Vercel project `web2`를 가리킴
- GitHub repository 연결은 새 Vercel 계정에 GitHub login connection이 없어 실패
- 새 Vercel project env는 아직 비어 있음

Vercel Firewall 선적용:

- Rule: `Block AI and SEO crawlers`
- Status: production publish 완료
- Condition: User-Agent regex
- Action: deny
- 대상:
  - `GPTBot`
  - `ChatGPT-User`
  - `OAI-SearchBot`
  - `ClaudeBot`
  - `Claude-SearchBot`
  - `PerplexityBot`
  - `Perplexity-User`
  - `CCBot`
  - `Bytespider`
  - `Amazonbot`
  - `Applebot-Extended`
  - `Google-Extended`
  - `FacebookBot`
  - `meta-externalagent`
  - `MJ12bot`
  - `SemrushBot`
  - `AhrefsBot`
  - `DotBot`
  - `SERankingBot`
  - `SERankingBacklinksBot`

Vercel rate limit 상태:

- `/livescore/football/match/` rate limit rule은 draft 생성까지 가능했지만 현재 plan 제한 때문에 제외
- `/api/` rate limit도 plan 제한 가능성이 있어 제외
- 현재 무료/현 plan에서는 custom deny rule 중심으로 먼저 운영
- rate limiting이 필요하면 Vercel plan 업그레이드 또는 Cloudflare rate limiting 병행 필요

Vercel 전환 전 남은 순서:

1. 새 Vercel project에 production env 등록
2. preview/prod build 확인
3. 임시 Vercel URL에서 로그인/글쓰기/이미지 업로드 확인
4. Vercel managed rules에서 `ai_bots`, `bot_protection`, `owasp` 사용 가능 여부 확인
5. `4590fb.com` 도메인 추가
6. Cloudflare DNS를 Vercel 권장값으로 전환
7. Netlify 도메인 제거 또는 Netlify site 보호/삭제

## 최종 목표 구조

```text
사용자
  -> Cloudflare DNS/WAF/CDN
  -> Netlify Next app
  -> Supabase DB/Auth

이미지/파일:
  사용자 -> Cloudflare/Bunny CDN -> R2/Bunny Storage

작은 API:
  Cloudflare Worker 또는 Netlify Function
  - upload URL 발급
  - cache purge
  - cron
  - 이미지 프록시
```

이 구조에서 Supabase는 핵심 데이터와 인증을 담당하고, 파일 전송 비용은 별도 이미지 저장소/CDN으로 분리한다.
