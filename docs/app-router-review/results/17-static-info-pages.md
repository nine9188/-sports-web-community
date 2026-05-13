# 17. Static / info pages

대상 route:
- `/about`
- `/contact`
- `/guide`
- `/privacy`
- `/terms`

관련 파일:
- `src/app/(site)/_components/StandalonePageHeader.tsx`
- `src/app/(site)/about/page.tsx`
- `src/app/(site)/about/AboutPageClient.tsx`
- `src/app/(site)/about/demoAssets.ts`
- `src/app/(site)/about/faq.ts`
- `src/app/(site)/contact/page.tsx`
- `src/app/(site)/guide/page.tsx`
- `src/app/(site)/guide/GuidePageClient.tsx`
- `src/app/(site)/guide/demoAssets.ts`
- `src/app/(site)/privacy/page.tsx`
- `src/app/(site)/terms/page.tsx`
- `src/proxy.ts`
- `src/app/sitemap.ts`
- `src/app/robots.txt/route.ts`
- `src/app/ai.txt/route.ts`
- `src/shared/utils/metadataNew.ts`

문서 작성 / 확인 기준:
- 이 문서는 UTF-8로 작성한다.
- 검증 명령은 bash 터미널 기준으로 기록한다.
- Windows PowerShell 전용 명령은 검증 절차에 넣지 않는다.

## 점검 기준

- 안내성 route가 기본적으로 Server Component인지 확인한다.
- 정적 본문이 불필요하게 큰 client boundary 안으로 들어가지 않는지 확인한다.
- `/about`, `/guide`, `/contact`의 index / sitemap / robots 정책이 서로 맞는지 확인한다.
- `/privacy`, `/terms`의 `noindex` 정책이 의도와 맞는지 확인한다.
- JSON-LD가 실제 화면 본문과 불일치하지 않는지 확인한다.
- 정적 안내 페이지가 렌더링 중 DB/API/이미지 캐싱 side effect를 만들지 않는지 확인한다.
- 내부 이동에는 `Link`와 `prefetch={false}`가 필요한 곳에 적용되어 있는지 확인한다.
- standalone route가 `(site)` 공통 layout fetch를 건너뛰는지 확인한다.

## 발견한 문제

### 1. `/about` FAQ JSON-LD와 화면 FAQ가 중복 관리됐다

`about/page.tsx`의 `FAQ_ITEMS`와 `AboutPageClient.tsx`의 inline FAQ 배열이 따로 있었다.
두 데이터의 질문/답변 표현이 달라 구조화 데이터와 visible content가 어긋날 수 있었다.

### 2. `/about`, `/guide`가 안내 페이지 렌더링 중 asset cache 경로를 탔다

두 page가 데모 로고/사진을 만들기 위해 다음 서버 함수를 호출했다.
- `getTeamLogoUrls`
- `getLeagueLogoUrls`
- `getPlayerPhotoUrl`
- `getPlayerPhotoUrls`

이 경로는 정적 파일 hit 시 빠르지만, miss 시 `ensureAssetsCached()`를 통해 Supabase `asset_cache` 조회와 외부 이미지 캐싱 side effect로 이어질 수 있었다.
정적 안내 페이지의 데모 asset은 실제 서비스 데이터 조회와 분리하는 편이 맞다.

### 3. `/guide` 상세 본문이 기본 SSR HTML에 거의 없었다

`GuidePageClient`의 `activeSection` 초기값이 `null`이고, 각 상세 섹션은 `activeSection === '...'` 조건으로만 렌더링됐다.
그 결과 `/guide` 기본 HTML에는 히어로와 목차만 있고, `HowTo` JSON-LD가 설명하는 주요 상세 본문은 클릭 이후에야 생겼다.

### 4. standalone 안내 페이지 로고 영역이 반복됐다

`/about`, `/guide`, `/contact`, `/privacy`, `/terms`가 같은 로고 링크 마크업을 각 파일에 반복하고 있었다.
로고 이미지 정책, `prefetch={false}`, `priority` 여부를 한 곳에서 관리하는 편이 안전하다.

### 5. `/contact`는 indexable이지만 route-level ContactPage JSON-LD가 없었다

`/contact`는 root sitemap에 포함되는 공개 안내 페이지다.
본문에는 대표 이메일과 문의 유형이 있지만, route 자체의 `ContactPage` JSON-LD는 없었다.

### 6. `/privacy`, `/terms`의 noindex 기본값이 `follow: false`였다

`buildMetadata({ noindex: true })`는 `{ index: false, follow: false }`를 만든다.
법적 문서를 sitemap에는 넣지 않더라도 footer에서 공개 링크로 제공하므로, 비색인 정책을 유지한다면 `follow: true`가 더 적절하다.

## 수정 내용

### 1. standalone header 공통화 완료

새 파일:
- `src/app/(site)/_components/StandalonePageHeader.tsx`

적용 route:
- `/about`
- `/guide`
- `/contact`
- `/privacy`
- `/terms`

로고 링크, 로고 이미지 크기, `prefetch={false}`, `priority` 옵션을 공통 서버 컴포넌트에서 관리하도록 바꿨다.

### 2. `/about` FAQ 단일 source 적용 완료

새 파일:
- `src/app/(site)/about/faq.ts`

수정 내용:
- FAQ 데이터를 `ABOUT_FAQ_ITEMS`로 분리했다.
- `about/page.tsx`의 FAQPage JSON-LD와 `AboutPageClient`의 화면 FAQ가 같은 배열을 사용한다.
- `AboutPageClient`는 `faqItems` prop을 받아 렌더링한다.

### 3. `/about`, `/guide` 데모 asset fetch 제거 완료

새 파일:
- `src/app/(site)/about/demoAssets.ts`
- `src/app/(site)/guide/demoAssets.ts`

수정 내용:
- `about/page.tsx`와 `guide/page.tsx`에서 livescore image action 호출을 제거했다.
- 데모 이미지는 고정 CDN manifest에서 가져온다.
- 안내 페이지 렌더링 중 `ensureAssetsCached()` 계열로 들어갈 수 있는 경로를 끊었다.

확인:
- `about/page.tsx`, `guide/page.tsx`에서 `getTeamLogoUrls`, `getLeagueLogoUrls`, `getPlayerPhotoUrl`, `getPlayerPhotoUrls` 참조가 사라졌다.

### 4. `/guide` 기본 HTML에 상세 본문 노출 완료

수정 파일:
- `src/app/(site)/guide/GuidePageClient.tsx`

수정 내용:
- `isSectionVisible(id)` helper를 추가했다.
- `activeSection === null`이면 모든 주요 가이드 섹션이 렌더링되도록 바꿨다.
- hash 또는 목차 클릭으로 특정 섹션을 선택하면 해당 섹션만 보여주는 기존 interaction은 유지했다.

이제 `/guide` 기본 렌더 결과에 주요 가이드 본문이 포함된다.

### 5. `/contact` ContactPage JSON-LD 추가 완료

수정 파일:
- `src/app/(site)/contact/page.tsx`

수정 내용:
- 대표 이메일을 `CONTACT_EMAIL` 상수로 분리했다.
- `ContactPage` JSON-LD를 추가했다.
- 문의 유형별 `ContactPoint`를 `contactCategories`에서 생성한다.

### 6. `/privacy`, `/terms` robots 정책 조정 완료

수정 파일:
- `src/app/(site)/privacy/page.tsx`
- `src/app/(site)/terms/page.tsx`

수정 내용:
- `noindex: true` 대신 `robots: { index: false, follow: true }`를 명시했다.
- sitemap 제외와 비색인 정책은 유지하되, 공개 링크 추적은 허용한다.

## 확인 결과

- `/contact`, `/privacy`, `/terms` page는 Server Component다.
- `/about`, `/guide` page 자체도 Server Component이며, 안내용 이미지 manifest를 동기 데이터로 넘긴다.
- `/about`, `/guide`, `/contact`는 root sitemap에 포함되어 있다.
- `/privacy`, `/terms`는 sitemap에 없다.
- `/privacy`, `/terms`는 `noindex, follow` 정책이다.
- `robots.txt`는 `/about`, `/guide`, `/contact`를 명시적으로 Allow한다.
- `ai.txt`는 `/about`, `/guide`, `/contact`, `/privacy`, `/terms`를 Allow한다.
- `src/proxy.ts`는 `/about`, `/contact`, `/guide`, `/privacy`, `/terms`에 `x-skip-site-layout: 1`을 붙인다.
- `src/app/(site)/layout.tsx`는 이 header가 있으면 공통 site shell fetch 없이 `children`만 반환한다.

## 검증

bash 기준으로 실행했다.

```bash
npm run typecheck
npm run build
```

결과:
- `npm run typecheck` 통과
- `npm run build` 통과

빌드 중 sitemap, AllPostsWidget, API-Football 외부 fetch 경고가 있었다.
해당 경고는 기존 빌드 시점 외부 fetch / 네트워크 접근 문제이며, 이번 17번 안내 페이지 수정으로 인한 빌드 실패는 아니다.

문서 인코딩은 bash에서 다음 기준으로 확인한다.

```bash
file -bi docs/app-router-review/results/17-static-info-pages.md
iconv -f UTF-8 -t UTF-8 docs/app-router-review/results/17-static-info-pages.md >/dev/null && echo "utf-8 ok"
```

## 결론

17번 정적/안내 페이지 수정 완료.

핵심 수정은 standalone header 공통화, `/about` FAQ 단일화, `/about`과 `/guide` 데모 asset의 서버 fetch 제거, `/guide` 상세 본문 기본 HTML 노출, `/contact` JSON-LD 추가, `/privacy`와 `/terms`의 `noindex, follow` 명시다.
