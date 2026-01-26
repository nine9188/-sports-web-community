# SEO 통합 계획서

> 작성일: 2026-01-26
> 상태: ✅ 완료 (Step 4까지)

## 1. 현재 문제점

### 1.1 SEO 설정이 분산되어 있음
- `site.ts`: 일부 기본값 정의
- `seo_settings` (DB): 관리자 설정값
- 각 페이지: 하드코딩된 값들이 중복 존재
- `metadataNew.ts`: 일부만 연동됨

### 1.2 일관성 없는 패턴
- 어떤 페이지는 DB 조회
- 어떤 페이지는 하드코딩
- 어떤 페이지는 site.ts 사용
- 55개 페이지가 각각 다른 방식

### 1.3 중복 및 불일치
- 같은 정보가 여러 곳에 다른 값으로 존재
- fallback 로직이 페이지마다 다름

---

## 2. 최종 목표

1. **55개 페이지 전부 SEO 흐름을 한 가지 패턴으로 통일**
2. **전역 기본값**: DB 우선 + site.ts 폴백
3. **페이지별 고유값**: 각 페이지에서만 전달 (title, description, path 등)
4. **메타데이터 조립**: `metadataNew.ts` 한 곳에서만

---

## 3. 역할 정의

### 3.1 site.ts (코드 기본값)

**역할**: 코드 레벨 기본값(fallback) + URL/이미지 빌더

**포함 항목**:
```typescript
export const siteConfig = {
  // 기본값 (DB 없을 때 fallback)
  url: 'https://4590football.com',
  name: '4590 Football',
  description: '실시간 축구 경기 일정과 스코어...',
  keywords: ['축구', '축구 커뮤니티', ...],
  locale: 'ko_KR',
  twitterHandle: '@4590football',

  // 정적 리소스 경로
  logo: '/logo/4590football-logo.png',
  defaultOgImage: '/og-image.png',

  // URL 빌더 함수
  getCanonical: (path: string) => `${siteUrl}${path}`,
  getOgImageUrl: (image?: string) => image || `${siteUrl}/og-image.png`,
  getDefaultOgImageObject: (title: string) => ({...}),
}
```

**사용 시점**: DB가 비어있거나 장애 시 폴백

---

### 3.2 seo_settings (DB)

**역할**: 운영 중 관리자 화면에서 바꾸는 전역값 (우선순위 1)

**테이블 구조**:
```sql
seo_settings (
  id,
  site_name,           -- 사이트 이름
  site_description,    -- 기본 설명
  site_keywords,       -- 기본 키워드
  twitter_handle,      -- 트위터 핸들
  default_og_image,    -- 기본 OG 이미지
  site_url,            -- 사이트 URL (선택)
  created_at,
  updated_at
)
```

**관리**: 관리자 페이지 `/admin/settings/seo`에서 수정

---

### 3.3 metadataNew.ts (메타데이터 생성기)

**역할**: 공통 메타데이터 생성기 (단 하나의 진입점)

**내부 로직**:
1. DB에서 seo_settings 조회
2. 없으면 site.ts 값 사용
3. 페이지에서 전달받은 고유값과 전역값 합침
4. Next.js Metadata 객체 반환

---

### 3.4 각 페이지 generateMetadata()

**역할**: 페이지 고유 정보만 준비

**규칙**:
- ✅ 페이지별 고유값만 전달 (title, description, path)
- ❌ 전역값 조회 절대 하지 않음
- ❌ DB 직접 호출 하지 않음
- ❌ siteConfig 직접 참조 최소화

---

## 4. 함수 설계

### 4.1 getSeoConfig()

**위치**: `src/shared/utils/metadataNew.ts`

**역할**: 전역 SEO 설정 조회 (DB 우선, site.ts 폴백)

```typescript
import { cache } from 'react';

export const getSeoConfig = cache(async () => {
  const dbSettings = await getSeoSettings(); // DB 조회

  return {
    siteName: dbSettings?.site_name || siteConfig.name,
    siteDescription: dbSettings?.site_description || siteConfig.description,
    siteKeywords: dbSettings?.site_keywords || siteConfig.keywords,
    twitterHandle: dbSettings?.twitter_handle || siteConfig.twitterHandle,
    defaultOgImage: dbSettings?.default_og_image || siteConfig.defaultOgImage,
    siteUrl: dbSettings?.site_url || siteConfig.url,
  };
});
```

**캐싱**: `react cache()`로 요청당 1회만 조회

---

### 4.2 buildMetadata()

**위치**: `src/shared/utils/metadataNew.ts`

**역할**: 페이지별 정보 받아서 완성된 Metadata 반환

```typescript
interface BuildMetadataParams {
  // 필수
  title: string;
  path: string;

  // 선택
  description?: string;
  image?: string;
  noindex?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
}

export async function buildMetadata(params: BuildMetadataParams): Promise<Metadata> {
  const config = await getSeoConfig();

  const fullTitle = `${params.title} - ${config.siteName}`;
  const description = params.description || config.siteDescription;
  const canonicalUrl = `${config.siteUrl}${params.path}`;
  const ogImage = params.image || `${config.siteUrl}${config.defaultOgImage}`;

  return {
    title: fullTitle,
    description,
    keywords: params.keywords || config.siteKeywords,
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: config.siteName,
      locale: 'ko_KR',
      type: params.type || 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      ...(params.publishedTime && { publishedTime: params.publishedTime }),
      ...(params.modifiedTime && { modifiedTime: params.modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: config.twitterHandle,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    ...(params.noindex && {
      robots: { index: false, follow: false },
    }),
  };
}
```

---

### 4.3 페이지에서 사용 예시

```typescript
// src/app/boards/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoard(slug);

  if (!board) {
    return buildMetadata({
      title: '게시판을 찾을 수 없습니다',
      path: `/boards/${slug}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: board.name,
    description: board.description || `${board.name} 게시판입니다.`,
    path: `/boards/${slug}`,
  });
}
```

---

## 5. 마이그레이션 순서

### Step 0. 기준 확정 (필수)

- [x] 절대 URL 기준 도메인 확정: `https://4590football.com`
- [x] www 리다이렉트 설정 확인
- [x] OG 이미지 절대경로로 생성되는지 확인

### Step 1. site.ts 정리

- [x] 필요한 필드만 남김: name, description, keywords, twitterHandle, defaultOgImage, url, urlBuilders
- [x] 하드코딩된 값들 site.ts로 모음
- [x] 불필요한 중복 제거

### Step 2. metadataNew.ts 단일 진입점 구현

- [x] `getSeoConfig()` 구현 (DB 조회 + 캐싱)
- [x] `buildMetadata()` 구현
- [x] 기존 함수들 정리/제거

### Step 3. 핵심 페이지 먼저 적용

우선순위 높은 페이지:
- [x] `/` (홈)
- [x] `/boards/[slug]` (게시판 상세)
- [x] `/boards/[slug]/[postNumber]` (게시글 상세)
- [x] `/livescore/football` (라이브스코어)
- [x] `/livescore/football/match/[id]` (매치 상세)

이 단계에서 패턴 확정

### Step 4. 나머지 페이지 일괄 정리

- [x] `export const metadata = {...}` 전부 제거/변환
- [x] 각 페이지는 `generateMetadata()`에서 `buildMetadata()`만 호출
- [x] 페이지별 DB 호출 코드 제거

**변환된 페이지 목록:**
- 핵심: page.tsx, boards/[slug], boards/[slug]/[postNumber], livescore/football, livescore/football/match/[id]
- Auth: signin, signup, social-signup, help/email, help/password, auth/confirmed
- Hotdeal: hotdeal, hotdeal-sale, hotdeal-mobile, hotdeal-living, hotdeal-food, hotdeal-beauty, hotdeal-apptech, hotdeal-appliance
- Boards: all, popular
- Search: search
- Livescore: team/[id], player/[id], leagues, leagues/[id]
- Other: terms, privacy, transfers, shop, shop/[category], user/[publicId]

**Layout 파일 (static metadata 유지):**
- (auth)/layout.tsx - noindex 설정됨
- settings/layout.tsx - noindex 설정됨
- admin/layout.tsx - noindex 설정됨
- notifications/layout.tsx - noindex 설정됨

### Step 5. 검증

- [ ] 카카오톡 미리보기 테스트
- [ ] 디스코드 미리보기 테스트
- [ ] 트위터 미리보기 테스트
- [ ] canonical 절대경로 확인
- [ ] title/description 페이지별 고유값 확인
- [x] noindex 필요한 페이지 확인 (auth, settings, admin, notifications, user profile)

---

## 6. 예외 규칙

### 6.1 인증/내부 페이지

```typescript
// /auth/*, /settings/* 등
return buildMetadata({
  title: '로그인',
  path: '/auth/login',
  noindex: true,  // 검색 제외
});
```

### 6.2 동적 상세 페이지 (게시글/매치/팀/선수)

```typescript
// 데이터 기반 title/description
return buildMetadata({
  title: post.title,  // 데이터에서 가져옴
  description: extractDescription(post.content),  // 본문에서 추출
  path: `/boards/${slug}/${postNumber}`,
  type: 'article',
  publishedTime: post.created_at,
});
```

### 6.3 이미지 규칙

- 페이지별 고유 이미지 있으면 사용
- 없으면 전역 OG 이미지로 폴백

---

## 7. 수정 대상 파일 목록

### 핵심 파일 (새로 작성/수정)

| 파일 | 작업 |
|------|------|
| `src/shared/config/site.ts` | 정리 |
| `src/shared/utils/metadataNew.ts` | getSeoConfig, buildMetadata 구현 |
| `src/domains/seo/actions/seoSettings.ts` | 필요시 수정 |

### 페이지 파일 (55개)

각 페이지의 `generateMetadata()` 또는 `export const metadata`를 `buildMetadata()` 호출로 변경

---

## 8. 완료 기준

1. ✅ 모든 페이지가 `buildMetadata()` 사용
2. ✅ DB 설정 변경 시 전체 사이트에 즉시 반영
3. ✅ 각 페이지는 고유값만 전달
4. ✅ canonical, og:url 모두 `https://4590football.com` 도메인
5. ✅ 소셜 미리보기 정상 동작
