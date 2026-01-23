# SEO 통합 감사 보고서

> **작성일**: 2026-01-24
> **도메인**: 4590football.com
> **문제 현상**: Safari 모바일 제안에서 메인페이지 대신 서브페이지 표시, OG 이미지 대신 icon 표시

---

## 1. 핵심 문제 요약

### 1.1 증상

- Safari 모바일에서 `4590football.com` 입력 시 메인페이지가 아닌 "전체글", "이용약관" 등 서브페이지 제안
- OG 이미지 대신 favicon/apple-touch-icon 표시
- 다른 사이트(naver.com, op.gg, lolchess.gg)는 정상 작동

### 1.2 근본 원인: URL/SEO 값의 분산 관리

**현재 상태**: URL, OG 이미지, canonical 등의 설정이 여러 곳에 흩어져 있음

```
환경변수 (.env.local)     → NEXT_PUBLIC_SITE_URL
DB (seo_settings)        → site_url, og_image
코드 기본값              → 'https://4590football.com' (하드코딩)
각 페이지 generateMetadata → 개별적으로 URL 조합
```

**분산 관리의 문제점**:

| 문제 | 영향 |
|-----|------|
| 도메인/OG/캐노니컬이 파일마다 불일치 | SEO 신뢰도↓, 중복/누락↑ |
| 리다이렉트/메일 링크/OG 이미지가 서로 다른 URL로 생성 | Safari 제안 혼란 |
| 변경 시 수정 포인트가 너무 많음 | 실수·누락 발생 |
| 환경변수/DB/코드 기본값 충돌 | 배포마다 결과가 달라짐 |
| 디버깅이 어려움 | 어디 값이 우선인지 파악이 힘듦 |

---

## 2. 기술적 원인 분석

### 2.1 OG 태그 비표준 출력 (🔴 심각)

**문제 코드** (`metadataNew.ts`):
```typescript
// Next.js의 other 필드는 name 속성으로 렌더링됨
other: {
  'og:image:secure_url': ogImage,  // → <meta name="og:image:secure_url">
  'og:image:type': imageType,
  ...
}
```

**실제 출력 (잘못됨)**:
```html
<meta name="og:image:secure_url" content="https://4590football.com/og-image.png">
```

**표준 OG 태그 (올바름 - OP.GG 예시)**:
```html
<meta property="og:image" content="https://c-lol-web.op.gg/images/reverse.rectangle.png">
```

→ Safari는 `name="og:*"` 형식을 OG 태그로 인식하지 않고 무시
→ 결과: OG 이미지 대신 apple-touch-icon/favicon 표시

### 2.2 metadataBase 미설정 (🔴 심각)

- Next.js에서 `metadataBase`가 없으면 상대 URL 처리가 불안정
- OG 이미지, canonical URL 등에 영향

### 2.3 robots.txt Sitemap 미노출 (🟡 중요)

- `Sitemap:` 행이 주석 처리되어 있음
- 크롤러가 사이트 구조를 제대로 학습 못함
- Safari가 메인 페이지를 루트로 인식하지 못하는 원인 중 하나

### 2.4 canonical URL 불일치 (✅ 해결됨)

- 이전 vercel 도메인(`sports-web-community.vercel.app`)이 혼재되어 있었음
- `.env.local`, `sitemap.ts`, DB `seo_settings` 수정 완료

---

## 3. 페이지별 SEO 문제점

### 3.1 OG 이미지 누락 (공유 시 프리뷰 빈 값 가능)

| 파일 | 문제 |
|-----|------|
| `src/app/boards/[slug]/page.tsx` | `openGraph.images` 없음 |
| `src/app/boards/[slug]/[postNumber]/page.tsx` | `openGraph.images` 없음 |
| `src/app/boards/(hotdeal)/hotdeal/page.tsx` | `openGraph.images` 없음 |
| `src/app/boards/(hotdeal)/hotdeal-appliance/page.tsx` | 동일 |
| `src/app/boards/(hotdeal)/hotdeal-apptech/page.tsx` | 동일 |
| `src/app/boards/(hotdeal)/hotdeal-beauty/page.tsx` | 동일 |
| `src/app/boards/(hotdeal)/hotdeal-food/page.tsx` | 동일 |
| `src/app/boards/(hotdeal)/hotdeal-living/page.tsx` | 동일 |
| `src/app/boards/(hotdeal)/hotdeal-mobile/page.tsx` | 동일 |
| `src/app/boards/(hotdeal)/hotdeal-sale/page.tsx` | 동일 |

### 3.2 메타데이터 불완전 (OG/Twitter/Canonical 없음)

| 파일 | 현재 상태 |
|-----|----------|
| `src/app/shop/[category]/page.tsx` | title, description만 있음 |

### 3.3 OG 이미지 크기 부적합

권장 크기: **1200x630** (summary_large_image 카드용)

| 파일 | 현재 크기 | 문제 |
|-----|----------|------|
| `src/app/livescore/football/team/[id]/page.tsx` | 120x120 | 너무 작음 |
| `src/app/livescore/football/player/[id]/page.tsx` | 120x120 | 너무 작음 |
| `src/app/livescore/football/match/[id]/page.tsx` | 80x80 | 너무 작음 |

### 3.4 인덱싱 통제 누락

robots.txt에서는 차단하지만 **메타태그 `noindex`가 없는 페이지들**:

| 파일 | 문제 |
|-----|------|
| `src/app/search/page.tsx` | `robots: { index: false }` 없음 |
| `src/app/boards/[slug]/create/page.tsx` | `robots: { index: false }` 없음 |
| `src/app/boards/[slug]/[postNumber]/edit/page.tsx` | `robots: { index: false }` 없음 |

> **참고**: robots.txt 차단만으로는 불완전함. 외부 링크로 직접 접근 시 인덱싱될 수 있음.
> 메타 `noindex`와 robots.txt 둘 다 설정하는 것이 권장됨.

### 3.5 비표준 메타태그 출력

| 파일 | 위치 | 문제 |
|-----|------|------|
| `src/shared/utils/metadataNew.ts` | 76-84행 | `other` 필드 → `name="og:*"` 비표준 |
| `src/shared/utils/metadataNew.ts` | 139-147행 | 동일 |
| `src/shared/utils/metadataNew.ts` | 192-201행 | 동일 |

### 3.6 robots.txt 문제

| 파일 | 위치 | 문제 |
|-----|------|------|
| `public/robots.txt` | 38행 | `Sitemap:` 주석 처리됨 |

### 3.7 seo_settings.og_image 절대 URL 처리 문제

| 파일 | 위치 | 문제 |
|-----|------|------|
| `src/shared/utils/metadataNew.ts` | `buildUrl()` | DB에 절대 URL 저장 시 URL이 깨질 수 있음 |

```typescript
// 문제: og_image가 이미 절대 URL이면 buildUrl이 잘못된 URL 생성
const ogImage = buildUrl(siteUrl, ogImagePath);
// 예: buildUrl('https://4590football.com', 'https://example.com/image.png')
// → 'https://4590football.com/https://example.com/image.png' (잘못됨)
```

---

## 4. 도메인 설정 현황

### 4.1 완료된 항목

| 항목 | 파일/위치 | 이전 값 | 변경 값 |
|-----|----------|--------|--------|
| 환경변수 | `.env.local` | `https://sports-web-community.vercel.app` | `https://4590football.com` |
| Sitemap fallback | `src/app/sitemap.ts` | `https://example.com` | `https://4590football.com` |
| DB SEO 설정 | `seo_settings.site_url` | `https://sports-web-community.vercel.app` | `https://4590football.com` |

### 4.2 수동 설정 필요

| 항목 | 위치 | 설정 값 |
|-----|------|--------|
| Vercel 환경변수 | Vercel Dashboard > Settings > Environment Variables | `NEXT_PUBLIC_SITE_URL=https://4590football.com` |
| Vercel 도메인 | Vercel Dashboard > Settings > Domains | `4590football.com` 추가 |
| Supabase Auth | Supabase > Authentication > URL Configuration | Site URL: `https://4590football.com` |
| Supabase Redirect | Supabase > Authentication > URL Configuration | `https://4590football.com/**` 추가 |
| 카카오 로그인 | 카카오 개발자 콘솔 > 앱 설정 | Redirect URI: `https://4590football.com/auth/callback` |

---

## 5. 해결 방안: 공통 관리 모듈 도입

### 5.1 현재 문제

```
metadataNew.ts     → seoSettings?.site_url || defaultSiteUrl
layout.tsx         → seoSettings?.site_url || 'https://4590football.com'
sitemap.ts         → seoSettings?.site_url || 'https://4590football.com'
(auth)/layout.tsx  → process.env.NEXT_PUBLIC_SITE_URL || 'https://4590football.com'
auth/callback      → process.env.NEXT_PUBLIC_SITE_URL
각 페이지          → 개별적으로 URL 조합
```

→ 우선순위가 불명확하고, 변경 시 수정 포인트가 너무 많음

### 5.2 권장 구조: siteConfig 단일 모듈

```typescript
// src/shared/config/site.ts
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://4590football.com';

export const siteConfig = {
  url: siteUrl,
  name: '4590 Football',
  defaultOgImage: `${siteUrl}/og-image.png`,

  // URL 빌더
  getUrl: (path: string) => `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`,
  getOgImage: (path?: string) => path
    ? (path.startsWith('http') ? path : `${siteUrl}${path}`)
    : `${siteUrl}/og-image.png`,
  getCanonical: (path: string) => `${siteUrl}${path}`,
};
```

**사용 예시**:
```typescript
// 어디서든 동일하게 사용
import { siteConfig } from '@/shared/config/site';

// 메타데이터
metadataBase: new URL(siteConfig.url),
canonical: siteConfig.getCanonical('/boards/free'),
ogImage: siteConfig.getOgImage('/og-image.png'),

// 이메일 링크
const resetUrl = siteConfig.getUrl(`/reset-password?token=${token}`);

// 리다이렉트
redirect(siteConfig.getUrl('/signin'));
```

### 5.3 공통 관리의 장점

| 항목 | 효과 |
|-----|------|
| 단일 소스 | 도메인 변경 시 1곳만 수정 |
| 일관성 | 모든 URL이 동일한 로직으로 생성 |
| 타입 안전성 | TypeScript로 오타/누락 방지 |
| 테스트 용이 | 환경별 URL 검증 쉬움 |
| 디버깅 용이 | 문제 발생 시 원인 파악 쉬움 |

---

## 6. 수정 계획

### 6.1 즉시 수정 (Safari 문제 해결) 🔴

| 순서 | 파일 | 수정 내용 |
|-----|------|----------|
| 1 | `src/shared/utils/metadataNew.ts` | `other` 필드 3곳 제거 |
| 2 | `src/app/layout.tsx` | `metadataBase: new URL(...)` 추가 |
| 3 | `public/robots.txt` | `Sitemap: https://4590football.com/sitemap.xml` 활성화 |

### 6.2 권장 수정 (SEO 품질 개선) 🟡

| 순서 | 파일 | 수정 내용 |
|-----|------|----------|
| 4 | `src/app/search/page.tsx` | `robots: { index: false, follow: true }` 추가 |
| 5 | `src/app/boards/[slug]/create/page.tsx` | `robots: { index: false }` 추가 |
| 6 | `src/app/boards/[slug]/[postNumber]/edit/page.tsx` | `robots: { index: false }` 추가 |
| 7 | `src/app/boards/[slug]/page.tsx` | `openGraph.images` 추가 |
| 8 | `src/app/boards/[slug]/[postNumber]/page.tsx` | `openGraph.images` 추가 |
| 9 | `src/app/boards/(hotdeal)/*.tsx` (8개) | `openGraph.images` 추가 |
| 10 | `src/app/shop/[category]/page.tsx` | openGraph, twitter, alternates.canonical 추가 |

### 6.3 구조 개선 (장기) 🟢

| 순서 | 작업 | 내용 |
|-----|------|------|
| 11 | `src/shared/config/site.ts` 생성 | 공통 URL/SEO 설정 모듈 |
| 12 | 기존 코드 마이그레이션 | siteConfig 사용으로 통일 |
| 13 | livescore 페이지 OG 개선 | 기본 OG 이미지 fallback 추가 |

---

## 7. 수정 상세 가이드

### 7.1 metadataNew.ts - other 필드 제거

**제거할 코드** (3곳):
```typescript
// 제거: 76-84행, 139-147행, 192-201행
other: {
  'og:image:secure_url': ogImage,
  'og:image:type': imageType,
  'og:image:width': '1200',
  'og:image:height': '630',
  'og:image:alt': title,
  'twitter:image': ogImage,
  'image': ogImage,
},
```

**이유**: Next.js의 `openGraph.images`와 `twitter.images`가 이미 표준 형식(`property`)으로 출력함. `other` 필드는 중복이며 비표준 `name` 속성으로 출력되어 Safari가 무시함.

### 7.2 layout.tsx - metadataBase 추가

```typescript
// src/app/layout.tsx
export async function generateMetadata() {
  const seoSettings = await getSeoSettings();
  const siteUrl = seoSettings?.site_url || 'https://4590football.com';

  const metadata = await generatePageMetadata('/');

  return {
    metadataBase: new URL(siteUrl),  // 추가
    ...metadata,
    // ... 기존 코드
  };
}
```

### 7.3 robots.txt - Sitemap 활성화

**변경 전**:
```
# Sitemap: https://yourdomain.com/sitemap.xml
```

**변경 후**:
```
Sitemap: https://4590football.com/sitemap.xml
```

### 7.4 인덱싱 통제 추가

```typescript
// src/app/search/page.tsx
export async function generateMetadata() {
  return {
    ...generatePageMetadataWithDefaults('/search', {...}),
    robots: {
      index: false,
      follow: true,
    },
  };
}
```

### 7.5 OG 이미지 추가 (boards, hotdeal 등)

```typescript
// openGraph 객체에 images 추가
openGraph: {
  title,
  description,
  url,
  type: 'website',
  siteName,
  locale: 'ko_KR',
  images: [{
    url: `${siteUrl}/og-image.png`,
    width: 1200,
    height: 630,
    alt: title,
  }],
},
```

---

## 8. 검증 방법

### 8.1 메타태그 확인

1. 브라우저 개발자 도구 > Elements > `<head>` 태그 확인
2. `<meta property="og:image">` 형식인지 확인 (`name` 아님)
3. `<meta name="og:*">` 태그가 없는지 확인

### 8.2 OG 디버거

- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

### 8.3 Safari 제안 테스트

1. Safari 모바일에서 주소창에 `4590football.com` 입력
2. 제안 목록에서 메인페이지 + OG 이미지 표시 확인

> **참고**: Safari 캐시로 인해 변경 사항 반영까지 시간이 걸릴 수 있음

---

## 9. 참고 자료

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js metadataBase](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [OP.GG 메타태그 예시](view-source:https://op.gg) - Safari 제안 정상 작동 참고

---

## 10. 수정 완료 내역

### 10.1 1단계: Safari 문제 해결 (2026-01-24) ✅

#### metadataNew.ts - other 필드 제거

**문제**: `other` 필드가 `name="og:*"` 비표준 형식으로 출력되어 Safari가 OG 태그로 인식하지 못함

**수정 전**:
```typescript
// src/shared/utils/metadataNew.ts (3곳에서 동일 패턴)
return {
  // ... openGraph, twitter 설정 ...
  alternates: {
    canonical: canonicalUrl,
  },
  other: {
    'og:image:secure_url': ogImage,
    'og:image:type': imageType,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': title,
    'twitter:image': ogImage,
    'image': ogImage,
  },
};
```

**수정 후**:
```typescript
return {
  // ... openGraph, twitter 설정 ...
  alternates: {
    canonical: canonicalUrl,
  },
  // other 필드 제거됨
};
```

**제거 위치**: 76-84행, 139-147행, 192-201행 (총 3곳)

**효과**: Next.js의 `openGraph.images`와 `twitter.images`가 이미 표준 `property` 속성으로 출력하므로 중복 제거

---

#### layout.tsx - metadataBase 추가

**문제**: `metadataBase` 미설정으로 상대 URL 처리가 불안정

**수정 전**:
```typescript
// src/app/layout.tsx
export async function generateMetadata() {
  const metadata = await generatePageMetadata('/');

  return {
    ...metadata,
    icons: { ... },
  };
}
```

**수정 후**:
```typescript
export async function generateMetadata() {
  const seoSettings = await getSeoSettings();
  const siteUrl = seoSettings?.site_url || process.env.NEXT_PUBLIC_SITE_URL || 'https://4590football.com';
  const metadata = await generatePageMetadata('/');

  return {
    metadataBase: new URL(siteUrl),
    ...metadata,
    icons: { ... },
  };
}
```

**효과**: 모든 상대 URL이 `metadataBase` 기준으로 절대 URL로 변환됨

---

#### robots.txt - Sitemap 활성화

**문제**: Sitemap URL이 주석 처리되어 검색엔진이 사이트 구조를 파악하지 못함

**수정 전**:
```
# 사이트맵 위치 (있는 경우)
# Sitemap: https://yourdomain.com/sitemap.xml
```

**수정 후**:
```
# 사이트맵 위치
Sitemap: https://4590football.com/sitemap.xml
```

**효과**: 검색엔진이 sitemap.xml을 통해 사이트 구조를 학습

---

### 10.2 2단계: SEO 품질 개선 (2026-01-24) ✅

| 상태 | 파일 | 작업 |
|-----|------|------|
| ✅ | `search/page.tsx` | `robots: { index: false, follow: true }` 추가 |
| ✅ | `boards/[slug]/create/page.tsx` | `robots: { index: false, follow: false }` 추가 |
| ✅ | `boards/[slug]/[postNumber]/edit/page.tsx` | `robots: { index: false, follow: false }` 추가, `generateMetadata` 함수 생성 |
| ✅ | `boards/[slug]/page.tsx` | `openGraph.images`, `twitter.images` 추가 |
| ✅ | `boards/[slug]/[postNumber]/page.tsx` | `openGraph.images`, `twitter.images` 추가 |
| ✅ | `boards/(hotdeal)/hotdeal/page.tsx` | `openGraph.images`, `twitter.images` 추가 |
| ✅ | `boards/(hotdeal)/hotdeal-appliance/page.tsx` | `openGraph.images`, `twitter.images` 추가 |
| ✅ | `boards/(hotdeal)/hotdeal-apptech/page.tsx` | `openGraph.images`, `twitter.images` 추가 |
| ✅ | `boards/(hotdeal)/hotdeal-beauty/page.tsx` | `openGraph.images`, `twitter.images` 추가 |
| ✅ | `boards/(hotdeal)/hotdeal-food/page.tsx` | `openGraph.images`, `twitter.images` 추가 |
| ✅ | `boards/(hotdeal)/hotdeal-living/page.tsx` | `openGraph.images`, `twitter.images` 추가 |
| ✅ | `boards/(hotdeal)/hotdeal-mobile/page.tsx` | `openGraph.images`, `twitter.images` 추가 |
| ✅ | `boards/(hotdeal)/hotdeal-sale/page.tsx` | `openGraph.images`, `twitter.images` 추가 |
| ✅ | `shop/[category]/page.tsx` | openGraph, twitter, canonical 추가, `getSeoSettings` 연동 |

#### 2단계 수정 내용 상세

**noindex 추가 (검색엔진 인덱싱 방지)**:
- `search/page.tsx`: 검색 페이지 (`follow: true` - 검색 결과 링크는 따라감)
- `boards/[slug]/create/page.tsx`: 글 작성 페이지 (`follow: false` - 폼 페이지)
- `boards/[slug]/[postNumber]/edit/page.tsx`: 글 수정 페이지 (`follow: false` - 폼 페이지)

```typescript
// 예시: search/page.tsx (검색 결과 링크는 따라감)
robots: { index: false, follow: true }

// 예시: create/edit 페이지 (폼 페이지라 링크 없음)
robots: { index: false, follow: false }
```

**OG 이미지 추가 (SNS 공유 시 미리보기)**:
- 모든 게시판 페이지와 핫딜 페이지에 OG 이미지 추가
- 1200x630 권장 크기 사용

```typescript
// 예시: 모든 페이지 공통 패턴
const ogImage = `${siteUrl}/og-image.png`;

openGraph: {
  // ... 기존 설정
  images: [{
    url: ogImage,
    width: 1200,
    height: 630,
    alt: title,
  }],
},
twitter: {
  // ... 기존 설정
  images: [ogImage],
},
```

**shop/[category]/page.tsx 완전 재구성**:
- `getSeoSettings` import 및 연동
- openGraph, twitter 객체 추가
- canonical URL 추가
- 에러 핸들링 추가

---

### 10.3 3단계: 구조 개선 (2026-01-24) ✅

| 상태 | 작업 |
|-----|------|
| ✅ | `src/shared/config/site.ts` 생성 - 공통 URL/SEO 설정 모듈 |
| ✅ | 기존 코드 마이그레이션 - siteConfig 사용으로 통일 |
| ✅ | livescore 페이지 OG 개선 - 기본 OG 이미지(1200x630) fallback 추가 |

#### 3단계 수정 내용 상세

**siteConfig 모듈 생성** (`src/shared/config/site.ts`):
```typescript
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://4590football.com';

export const siteConfig = {
  url: siteUrl,
  name: '4590 Football',
  defaultOgImage: `${siteUrl}/og-image.png`,
  locale: 'ko_KR',

  getUrl: (path: string) => `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`,
  getOgImage: (path?: string | null) => path?.startsWith('http') ? path : `${siteUrl}${path || '/og-image.png'}`,
  getCanonical: (path: string) => `${siteUrl}${path}`,
  getDefaultOgImageObject: (alt?: string) => ({
    url: `${siteUrl}/og-image.png`,
    width: 1200,
    height: 630,
    alt: alt || '4590 Football',
  }),
} as const;
```

**마이그레이션된 파일**:
- `src/app/layout.tsx` - `metadataBase`, `websiteSchema` 부분
- `src/app/sitemap.ts` - `baseUrl` 부분
- `src/app/(auth)/layout.tsx` - 전체 metadata 설정

**livescore 페이지 OG 개선**:
- `team/[id]/page.tsx` - 120x120 팀 로고 → 1200x630 기본 OG 이미지
- `player/[id]/page.tsx` - 120x120 선수 사진 → 1200x630 기본 OG 이미지
- `match/[id]/page.tsx` - 80x80 리그 로고 → 1200x630 기본 OG 이미지
- twitter:card도 `summary` → `summary_large_image`로 변경

---

## 11. 변경 이력

| 날짜 | 항목 | 변경 내용 |
|-----|------|----------|
| 2026-01-24 | 도메인 설정 | `.env.local`, `sitemap.ts`, DB `seo_settings` 도메인 변경 |
| 2026-01-24 | 문서 작성 | SEO 감사 보고서 초안 작성 |
| 2026-01-24 | 문서 업데이트 | 근본 원인 분석, 공통 관리 방안, 누락 페이지 추가 |
| 2026-01-24 | 1단계 수정 완료 | `metadataNew.ts` other 필드 제거, `layout.tsx` metadataBase 추가, `robots.txt` Sitemap 활성화 |
| 2026-01-24 | 2단계 수정 완료 | noindex 추가 (3개 페이지), OG 이미지 추가 (11개 페이지), shop 메타데이터 완성 |
| 2026-01-24 | 3단계 수정 완료 | `siteConfig` 모듈 생성, 주요 파일 마이그레이션, livescore OG 이미지 개선 |
| 2026-01-24 | 문서 보완 | OG 중복 분석 (15개 파일), 배포 후 체크리스트 추가 |
| 2026-01-24 | OG 중복 리팩토링 | 15개 파일 siteConfig 사용으로 통일 (하드코딩 제거) |

---

## 12. OG 이미지 중복 설정 분석 및 리팩토링

### 12.1 문제점

15개 파일이 `metadataNew.ts` 유틸 함수를 사용하지 않고 직접 OG 이미지 설정을 하고 있었음:
- 하드코딩된 URL (`'https://4590football.com'`)
- 하드코딩된 locale (`'ko_KR'`)
- 수동 OG 이미지 객체 생성

### 12.2 리팩토링 완료 (2026-01-24) ✅

모든 15개 파일이 `siteConfig` 모듈을 사용하도록 수정됨:

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `boards/[slug]/page.tsx` | ✅ siteConfig 사용 |
| 2 | `boards/[slug]/[postNumber]/page.tsx` | ✅ siteConfig 사용 |
| 3 | `boards/(hotdeal)/hotdeal/page.tsx` | ✅ siteConfig 사용 |
| 4 | `boards/(hotdeal)/hotdeal-appliance/page.tsx` | ✅ siteConfig 사용 |
| 5 | `boards/(hotdeal)/hotdeal-apptech/page.tsx` | ✅ siteConfig 사용 |
| 6 | `boards/(hotdeal)/hotdeal-beauty/page.tsx` | ✅ siteConfig 사용 |
| 7 | `boards/(hotdeal)/hotdeal-food/page.tsx` | ✅ siteConfig 사용 |
| 8 | `boards/(hotdeal)/hotdeal-living/page.tsx` | ✅ siteConfig 사용 |
| 9 | `boards/(hotdeal)/hotdeal-mobile/page.tsx` | ✅ siteConfig 사용 |
| 10 | `boards/(hotdeal)/hotdeal-sale/page.tsx` | ✅ siteConfig 사용 |
| 11 | `shop/[category]/page.tsx` | ✅ siteConfig 사용 |
| 12 | `livescore/football/team/[id]/page.tsx` | ✅ siteConfig 사용 |
| 13 | `livescore/football/player/[id]/page.tsx` | ✅ siteConfig 사용 |
| 14 | `livescore/football/match/[id]/page.tsx` | ✅ siteConfig 사용 |
| 15 | `(auth)/layout.tsx` | ✅ 이미 siteConfig 사용 중 |

### 12.3 적용된 패턴

**변경 전 (하드코딩)**:
```typescript
const siteUrl = seoSettings?.site_url || 'https://4590football.com';
const siteName = seoSettings?.site_name || '4590 Football';
const ogImage = `${siteUrl}/og-image.png`;

openGraph: {
  locale: 'ko_KR',
  images: [{
    url: ogImage,
    width: 1200,
    height: 630,
    alt: title,
  }],
},
twitter: {
  images: [ogImage],
},
```

**변경 후 (siteConfig 사용)**:
```typescript
import { siteConfig } from '@/shared/config';

const siteUrl = seoSettings?.site_url || siteConfig.url;
const siteName = seoSettings?.site_name || siteConfig.name;

openGraph: {
  locale: siteConfig.locale,
  images: [siteConfig.getDefaultOgImageObject(title)],
},
twitter: {
  images: [siteConfig.defaultOgImage],
},
```

### 12.4 metadataNew.ts 유틸 함수 사용 파일 (18개) - 정상

| # | 파일 |
|---|------|
| 1 | `layout.tsx` (루트) |
| 2 | `page.tsx` (메인) |
| 3 | `search/page.tsx` |
| 4 | `boards/all/page.tsx` |
| 5 | `boards/popular/page.tsx` |
| 6 | `shop/page.tsx` |
| 7 | `livescore/football/page.tsx` |
| 8 | `livescore/football/leagues/page.tsx` |
| 9 | `transfers/page.tsx` |
| 10 | `privacy/page.tsx` |
| 11 | `terms/page.tsx` |
| 12-18 | `(auth)/*.tsx` (7개 페이지) |

### 12.5 요약

| 분류 | 개수 | 상태 |
|-----|------|------|
| siteConfig 사용 (리팩토링 완료) | **15개** | ✅ 완료 |
| metadataNew.ts 사용 | **18개** | ✅ 정상 |

> **결과**: 이제 도메인/OG 이미지 변경 시 `shared/config/siteConfig.ts` 한 곳만 수정하면 됨.

---

## 13. 배포 후 체크리스트

### 13.1 필수 확인 사항 (4가지)

```bash
# 1. 메인페이지 og:image 하나만 존재하는지
curl -s https://4590football.com | grep -o 'property="og:image"' | wc -l
# 예상 결과: 1

# 2. name="og:*" 완전 제거되었는지
curl -s https://4590football.com | grep 'name="og:'
# 예상 결과: 아무것도 안 나옴

# 3. canonical이 4590football.com인지
curl -s https://4590football.com | grep 'rel="canonical"'
# 예상 결과: href="https://4590football.com"

# 4. sitemap.xml URL 확인
curl -s https://4590football.com/sitemap.xml | head -20
# 예상 결과: 모든 URL이 https://4590football.com으로 시작
```

### 13.2 외부 서비스 설정 확인

| 서비스 | 확인 항목 | 설정 값 |
|--------|----------|---------|
| Vercel | 환경변수 | `NEXT_PUBLIC_SITE_URL=https://4590football.com` |
| Vercel | 도메인 | `4590football.com` 추가됨 |
| Supabase | Site URL | `https://4590football.com` |
| Supabase | Redirect URLs | `https://4590football.com/**` |
| 카카오 로그인 | Redirect URI | `https://4590football.com/auth/callback` |

### 13.3 OG 디버거 테스트

배포 후 아래 도구에서 메인페이지 URL 테스트:

- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

### 13.4 Safari 모바일 테스트

1. Safari 모바일에서 주소창에 `4590football.com` 입력
2. 제안 목록에서 메인페이지 + OG 이미지 표시 확인
3. 서브페이지(전체글, 이용약관 등)가 아닌 메인페이지가 우선 제안되는지 확인

> **참고**: Safari 캐시로 인해 변경 사항 반영까지 수일 걸릴 수 있음

---

## 14. metadataNew.ts와 siteConfig 통일 (2026-01-24) ✅ 완료

### 14.1 현황 요약

| 항목 | 상태 | 설명 |
|------|------|------|
| metadataNew.ts 리팩토링 | ✅ 완료 | siteConfig 사용으로 통일 |
| OG 이미지 절대 URL 처리 | ✅ 완료 | `siteConfig.getOgImage()` 사용 |
| 개별 페이지 canonical/url 빌드 | ✅ 완료 | 14개 파일 모두 `siteConfig.getCanonical()` 사용 |
| 하드코딩 fallback | ✅ 완료 | `siteConfig.name` 사용으로 변경 |

### 14.2 완료된 작업: metadataNew.ts

**삭제된 코드**:
```typescript
// 삭제됨
const defaultSiteName = '4590 Football';
const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://4590football.com';
const defaultOgImage = '/og-image.png';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');
const buildUrl = (baseUrl: string, path: string) => { ... };
```

**추가된 코드**:
```typescript
import { siteConfig } from '@/shared/config';

const getImageType = (path: string): string => {
  return path.endsWith('.jpg') || path.endsWith('.jpeg')
    ? 'image/jpeg'
    : 'image/png';
};
```

**변경된 패턴** (metadataNew.ts 내부):
| 변경 전 | 변경 후 |
|---------|---------|
| `buildUrl(siteUrl, ogImagePath)` | `siteConfig.getOgImage(seoSettings?.og_image)` |
| `buildUrl(siteUrl, pagePath)` | `siteConfig.getCanonical(pagePath)` |
| `locale: 'ko_KR'` | `locale: siteConfig.locale` |

### 14.3 완료된 작업: 개별 페이지 URL 빌드 통일 (2026-01-24) ✅

**14개 파일** 모두 `siteConfig.getCanonical()` 사용으로 변경 완료:

```typescript
// 변경 전 (직접 문자열 조합)
const siteUrl = seoSettings?.site_url || siteConfig.url;
const url = `${siteUrl}/livescore/football/team/${id}`;

// 변경 후 (siteConfig 사용)
const url = siteConfig.getCanonical(`/livescore/football/team/${id}`);
```

**수정된 파일 목록**:

| # | 파일 | 상태 |
|---|------|------|
| 1 | `livescore/football/team/[id]/page.tsx` | ✅ |
| 2 | `livescore/football/player/[id]/page.tsx` | ✅ |
| 3 | `livescore/football/match/[id]/page.tsx` | ✅ |
| 4 | `boards/[slug]/page.tsx` | ✅ |
| 5 | `boards/[slug]/[postNumber]/page.tsx` | ✅ |
| 6 | `shop/[category]/page.tsx` | ✅ |
| 7 | `boards/(hotdeal)/hotdeal/page.tsx` | ✅ |
| 8 | `boards/(hotdeal)/hotdeal-appliance/page.tsx` | ✅ |
| 9 | `boards/(hotdeal)/hotdeal-apptech/page.tsx` | ✅ |
| 10 | `boards/(hotdeal)/hotdeal-beauty/page.tsx` | ✅ |
| 11 | `boards/(hotdeal)/hotdeal-food/page.tsx` | ✅ |
| 12 | `boards/(hotdeal)/hotdeal-living/page.tsx` | ✅ |
| 13 | `boards/(hotdeal)/hotdeal-mobile/page.tsx` | ✅ |
| 14 | `boards/(hotdeal)/hotdeal-sale/page.tsx` | ✅ |

### 14.4 완료된 작업: 하드코딩 fallback 제거 (2026-01-24) ✅

```typescript
// 변경 전 (boards/[slug]/[postNumber]/page.tsx)
const siteUrl = seoSettings?.site_url || 'https://4590football.com';  // 하드코딩
const siteName = seoSettings?.site_name || '4590 Football';           // 하드코딩

// 변경 후
const siteName = seoSettings?.site_name || siteConfig.name;
const postUrl = siteConfig.getCanonical(`/boards/${slug}/${postNumber}`);
```

### 14.5 최종 효과

- ✅ `siteUrl` 변수 선언 불필요 (코드 간결화)
- ✅ URL 빌드 로직이 `siteConfig` 단일 소스로 관리
- ✅ 슬래시 정규화 등 일관된 처리 보장
- ✅ 도메인 변경 시 `siteConfig` 한 곳만 수정

### 14.6 검증 결과

- ✅ 빌드 테스트 통과 (`npm run build` - Exit code: 0)
- ✅ metadataNew.ts 절대 URL 처리 정상 동작
- ✅ 개별 페이지 URL 빌드 통일 완료 (14개 파일)
- ✅ 하드코딩 fallback 제거 완료 (1개 파일)
