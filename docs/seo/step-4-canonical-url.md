# Step 4: Canonical URL 구현

## 개요

Canonical URL은 동일하거나 유사한 콘텐츠가 여러 URL로 접근 가능할 때, 검색 엔진에게 "대표 URL"을 알려주는 역할을 합니다. 이를 통해 SEO 점수가 분산되는 것을 방지합니다.

## 현재 상태

**미구현** - canonical URL이 설정되어 있지 않음

## 문제 시나리오

```
# 같은 콘텐츠가 여러 URL로 접근 가능
https://example.com/boards/free/123
https://example.com/boards/free/123?page=1
https://example.com/boards/free/123?sort=latest
https://example.com/boards/free/123#comments

# HTTP/HTTPS, www 차이
http://example.com/page
https://example.com/page
https://www.example.com/page
```

검색 엔진이 이들을 별개 페이지로 인식하면 SEO 점수가 분산됩니다.

---

## 4.1 메타데이터 유틸에 Canonical 추가

### 수정 파일
`src/shared/utils/metadataNew.ts`

### 수정 코드

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export function generateCanonicalUrl(path: string): string {
  // 쿼리 파라미터 제거
  const cleanPath = path.split('?')[0].split('#')[0];

  // 끝 슬래시 정규화 (제거)
  const normalizedPath = cleanPath.endsWith('/') && cleanPath !== '/'
    ? cleanPath.slice(0, -1)
    : cleanPath;

  return `${BASE_URL}${normalizedPath}`;
}

// 메타데이터 생성 함수에 canonical 추가
export async function generatePageMetadata(
  path: string,
  overrides?: Partial<PageSeoOverride>
): Promise<Metadata> {
  const settings = await getSeoSettings();
  const canonicalUrl = generateCanonicalUrl(path);

  // ... 기존 코드 ...

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      // ...
      url: canonicalUrl,
    },
    // ...
  };
}
```

---

## 4.2 각 페이지에 Canonical 적용

### Post 페이지
`src/app/boards/[slug]/[postNumber]/page.tsx`

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, postNumber } = await params;

  const canonicalUrl = `${BASE_URL}/boards/${slug}/${postNumber}`;

  return {
    title: post.title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      url: canonicalUrl,
      // ...
    },
  };
}
```

### Match 페이지
`src/app/livescore/football/match/[id]/page.tsx`

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const canonicalUrl = `${BASE_URL}/livescore/football/match/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      url: canonicalUrl,
      // ...
    },
  };
}
```

### Team 페이지
`src/app/livescore/football/team/[id]/page.tsx`

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const canonicalUrl = `${BASE_URL}/livescore/football/team/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      url: canonicalUrl,
      // ...
    },
  };
}
```

---

## 4.3 페이지네이션 Canonical 처리

페이지네이션이 있는 목록 페이지의 경우, 모든 페이지를 첫 페이지로 canonical 설정하면 안 됩니다.

### 권장 방식

```typescript
// 게시판 목록 페이지
export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await searchParams;

  const currentPage = parseInt(page || '1', 10);

  // 페이지네이션이 있어도 각 페이지가 자신의 canonical을 가짐
  const canonicalUrl = currentPage > 1
    ? `${BASE_URL}/boards/${slug}?page=${currentPage}`
    : `${BASE_URL}/boards/${slug}`;

  return {
    alternates: {
      canonical: canonicalUrl,
    },
    // ...
  };
}
```

---

## 4.4 next.config.js에서 Trailing Slash 설정

URL 끝의 슬래시(/)를 일관되게 처리합니다.

### 수정 파일
`next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 끝 슬래시 제거 (권장)
  trailingSlash: false,

  // 또는 끝 슬래시 항상 추가
  // trailingSlash: true,

  // 기존 설정들...
  images: {
    remotePatterns: [
      // ...
    ],
  },
};

module.exports = nextConfig;
```

---

## 4.5 HTTP → HTTPS 리다이렉트

### Vercel 배포 시
Vercel은 자동으로 HTTP → HTTPS 리다이렉트 처리

### 직접 서버 배포 시
`next.config.js`에 리다이렉트 추가:

```javascript
const nextConfig = {
  async redirects() {
    return [
      // www → non-www 리다이렉트
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.your-domain.com' }],
        destination: 'https://your-domain.com/:path*',
        permanent: true,
      },
    ];
  },
};
```

---

## 4.6 Canonical Helper 함수

### 파일 생성
`src/shared/utils/canonical.ts`

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

/**
 * 정규화된 canonical URL 생성
 * - 쿼리 파라미터 제거 (허용 목록 제외)
 * - 해시 제거
 * - 끝 슬래시 제거
 */
export function getCanonicalUrl(
  path: string,
  options?: {
    allowedParams?: string[];
    searchParams?: Record<string, string>;
  }
): string {
  // 기본 경로 정리
  let cleanPath = path.split('?')[0].split('#')[0];

  // 끝 슬래시 제거
  if (cleanPath.endsWith('/') && cleanPath !== '/') {
    cleanPath = cleanPath.slice(0, -1);
  }

  // 허용된 쿼리 파라미터만 포함
  const params = new URLSearchParams();
  if (options?.allowedParams && options?.searchParams) {
    for (const param of options.allowedParams) {
      const value = options.searchParams[param];
      if (value) {
        params.set(param, value);
      }
    }
  }

  const queryString = params.toString();
  const fullPath = queryString ? `${cleanPath}?${queryString}` : cleanPath;

  return `${BASE_URL}${fullPath}`;
}

/**
 * 페이지네이션 URL 생성
 */
export function getPaginatedCanonicalUrl(
  basePath: string,
  page: number
): string {
  if (page <= 1) {
    return getCanonicalUrl(basePath);
  }
  return getCanonicalUrl(basePath, {
    allowedParams: ['page'],
    searchParams: { page: page.toString() },
  });
}

/**
 * 정렬/필터 URL 생성 (필요한 경우만)
 */
export function getFilteredCanonicalUrl(
  basePath: string,
  filters: {
    page?: number;
    sort?: string;
    category?: string;
  }
): string {
  const allowedParams: string[] = [];
  const searchParams: Record<string, string> = {};

  // 페이지 (1이 아닌 경우만)
  if (filters.page && filters.page > 1) {
    allowedParams.push('page');
    searchParams.page = filters.page.toString();
  }

  // 정렬 (기본값이 아닌 경우만)
  if (filters.sort && filters.sort !== 'latest') {
    allowedParams.push('sort');
    searchParams.sort = filters.sort;
  }

  // 카테고리
  if (filters.category) {
    allowedParams.push('category');
    searchParams.category = filters.category;
  }

  return getCanonicalUrl(basePath, { allowedParams, searchParams });
}
```

### 사용 예시

```typescript
import { getCanonicalUrl, getPaginatedCanonicalUrl } from '@/shared/utils/canonical';

// 기본 사용
const url = getCanonicalUrl('/boards/free/123');
// → https://your-domain.com/boards/free/123

// 페이지네이션
const url = getPaginatedCanonicalUrl('/boards/free', 3);
// → https://your-domain.com/boards/free?page=3

// 첫 페이지
const url = getPaginatedCanonicalUrl('/boards/free', 1);
// → https://your-domain.com/boards/free
```

---

## 4.7 Self-Referencing Canonical 검증

모든 페이지가 자기 자신을 canonical로 가리키는지 확인합니다.

### 테스트 스크립트
`scripts/check-canonical.ts`

```typescript
import { JSDOM } from 'jsdom';

const pages = [
  '/',
  '/boards/all',
  '/boards/free',
  '/boards/free/1',
  '/livescore/football',
  '/livescore/football/match/1234567',
];

async function checkCanonical(url: string) {
  const fullUrl = `http://localhost:3000${url}`;
  const response = await fetch(fullUrl);
  const html = await response.text();

  const dom = new JSDOM(html);
  const canonical = dom.window.document.querySelector('link[rel="canonical"]');

  if (!canonical) {
    console.error(`❌ ${url}: canonical 태그 없음`);
    return;
  }

  const href = canonical.getAttribute('href');
  const expectedBase = 'https://your-domain.com';

  if (!href?.startsWith(expectedBase)) {
    console.error(`❌ ${url}: 잘못된 canonical - ${href}`);
    return;
  }

  console.log(`✅ ${url}: ${href}`);
}

async function main() {
  console.log('Canonical URL 검증 시작...\n');

  for (const page of pages) {
    await checkCanonical(page);
  }
}

main();
```

---

## 테스트 방법

### 1. 브라우저에서 확인
```javascript
// 개발자 도구 콘솔
document.querySelector('link[rel="canonical"]')?.href
```

### 2. curl로 확인
```bash
curl -s http://localhost:3000/boards/free/123 | grep canonical
```

### 3. SEO 도구
- [Screaming Frog SEO Spider](https://www.screamingfrog.co.uk/seo-spider/) - Canonical 검사
- [Ahrefs Site Audit](https://ahrefs.com/site-audit) - Canonical 이슈 감지

---

## 체크리스트

- [ ] canonical URL helper 함수 생성
- [ ] 모든 동적 페이지에 canonical 적용
  - [ ] Post 페이지
  - [ ] Board 페이지
  - [ ] Match 페이지
  - [ ] Team 페이지
  - [ ] Player 페이지
- [ ] 페이지네이션 canonical 처리
- [ ] next.config.js trailingSlash 설정
- [ ] 환경 변수 NEXT_PUBLIC_SITE_URL 확인
- [ ] Self-referencing canonical 검증
- [ ] OG URL과 canonical URL 일치 확인
