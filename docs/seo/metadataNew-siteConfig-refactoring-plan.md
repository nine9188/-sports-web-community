# metadataNew.ts와 siteConfig 통일 리팩토링 계획

## 현황 요약 (2026-01-24) ✅ 전체 완료

| 항목 | 상태 | 설명 |
|------|------|------|
| metadataNew.ts 리팩토링 | ✅ 완료 | siteConfig 사용으로 통일 |
| OG 이미지 절대 URL 처리 | ✅ 완료 | `siteConfig.getOgImage()` 사용 |
| 개별 페이지 canonical/url 빌드 | ✅ 완료 | 14개 파일 모두 `siteConfig.getCanonical()` 사용 |
| 하드코딩 fallback | ✅ 완료 | `siteConfig.name` 사용으로 변경 |

---

## 목표

`metadataNew.ts`에서 `siteConfig` 사용으로 통일하여:
1. 중복 상수 제거
2. 절대 OG 이미지 URL 처리 문제 해결
3. URL/OG/Canonical 빌드 로직 통일

---

## 현재 문제

### 1. 중복 상수 정의
```typescript
// metadataNew.ts (중복!)
const defaultSiteName = '4590 Football';
const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://4590football.com';
const defaultOgImage = '/og-image.png';

// siteConfig (원본) - 동일한 값
```

### 2. 절대 URL 처리 누락
```typescript
// metadataNew.ts - 절대 URL 체크 없음!
const buildUrl = (baseUrl: string, path: string) => {
  // path가 'https://...'여도 그대로 결합 → URL 깨짐!
  return `${normalizedBase}${normalizedPath}`;
};

// siteConfig - 절대 URL 체크 있음 ✅
getOgImage: (path) => {
  if (path.startsWith('http')) return path;  // 그대로 반환
  ...
}
```

---

## 수정 파일

### 1. `src/shared/utils/metadataNew.ts` (핵심)

**삭제할 코드:**
- 9-11행: `defaultSiteName`, `defaultSiteUrl`, `defaultOgImage` 상수
- 13-18행: `normalizeBaseUrl()`, `buildUrl()` 함수

**추가할 코드:**
```typescript
import { siteConfig } from '@/shared/config';

const getImageType = (path: string): string => {
  return path.endsWith('.jpg') || path.endsWith('.jpeg')
    ? 'image/jpeg'
    : 'image/png';
};
```

**변경 패턴:**
| 현재 | 변경 |
|------|------|
| `defaultSiteUrl` | `siteConfig.url` |
| `defaultSiteName` | `siteConfig.name` |
| `defaultOgImage` | `siteConfig.defaultOgImage` |
| `buildUrl(siteUrl, ogImagePath)` | `siteConfig.getOgImage(seoSettings?.og_image)` |
| `buildUrl(siteUrl, pagePath)` | `siteConfig.getCanonical(pagePath)` |
| `locale: 'ko_KR'` | `locale: siteConfig.locale` |

### 2. `docs/seo/seo-audit-2026-01.md` (문서화)

섹션 14 추가: "metadataNew.ts와 siteConfig 통일"

---

## 우선순위 유지

```
1순위: seoSettings (DB 설정) - 관리자가 동적으로 변경 가능
2순위: siteConfig (코드 기본값) - 환경변수 또는 하드코딩
```

```typescript
const siteName = seoSettings?.site_name || siteConfig.name;
const ogImage = siteConfig.getOgImage(seoSettings?.og_image);
```

---

## 영향 범위

- **수정 파일**: 1개 (`metadataNew.ts`) + 1개 (문서)
- **호출부 수정**: 없음 (함수 시그니처 유지)
- **사용 파일 18개**: 변경 불필요

---

## 검증 방법

### 1. 빌드 테스트
```bash
npm run build
```

### 2. 로컬 테스트
```bash
npm run dev
# 개발자 도구에서 OG 태그 확인
```

### 3. 절대 URL 처리 테스트

Supabase에서 `seo_settings.og_image`에 절대 URL 저장 후 확인:
- 입력: `https://cdn.example.com/image.png`
- 기대 결과: `<meta property="og:image" content="https://cdn.example.com/image.png">`

---

## 작업 순서

1. `metadataNew.ts` 수정 ✅ 완료
2. 빌드 테스트 (`npm run build`) ✅ 완료 (Exit code: 0)
3. `docs/seo/seo-audit-2026-01.md` 문서 업데이트 ✅ 완료

---

## 변경 전후 비교

### 변경 전 (metadataNew.ts)
```typescript
import { Metadata } from 'next';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';

const defaultSiteName = '4590 Football';
const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://4590football.com';
const defaultOgImage = '/og-image.png';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');
const buildUrl = (baseUrl: string, path: string) => {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

export async function generatePageMetadata(pagePath: string) {
  const seoSettings = await getSeoSettings();
  const siteUrl = seoSettings?.site_url || defaultSiteUrl;
  const siteName = seoSettings?.site_name || defaultSiteName;
  const ogImagePath = seoSettings?.og_image || defaultOgImage;
  const ogImage = buildUrl(siteUrl, ogImagePath);  // 절대 URL 문제!
  const canonicalUrl = buildUrl(siteUrl, pagePath);
  // ...
}
```

### 변경 후 (metadataNew.ts)
```typescript
import { Metadata } from 'next';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import { siteConfig } from '@/shared/config';

const getImageType = (path: string): string => {
  return path.endsWith('.jpg') || path.endsWith('.jpeg')
    ? 'image/jpeg'
    : 'image/png';
};

export async function generatePageMetadata(pagePath: string) {
  const seoSettings = await getSeoSettings();
  const siteName = seoSettings?.site_name || siteConfig.name;
  const ogImage = siteConfig.getOgImage(seoSettings?.og_image);  // 절대 URL 처리 OK!
  const canonicalUrl = siteConfig.getCanonical(pagePath);
  const imageType = getImageType(ogImage);
  // ...
}
```

---

## 핵심 개선 사항

1. **중복 제거**: 동일한 상수가 여러 파일에 있던 것을 `siteConfig` 단일 소스로 통일
2. **절대 URL 처리**: `siteConfig.getOgImage()`가 `http://` 시작하는 URL은 그대로 반환
3. **일관성**: `locale`, `name`, `url` 등 모든 설정이 `siteConfig`에서 관리됨
4. **유지보수성**: 도메인 변경 시 `siteConfig` 한 곳만 수정하면 됨

---

## ✅ 완료된 작업: 개별 페이지 URL 빌드 통일 (2026-01-24)

**14개 파일** 모두 `siteConfig.getCanonical()` 사용으로 변경 완료:

```typescript
// 변경 전 (직접 문자열 조합)
const siteUrl = seoSettings?.site_url || siteConfig.url;
const url = `${siteUrl}/livescore/football/team/${id}`;

// 변경 후 (siteConfig 사용)
const url = siteConfig.getCanonical(`/livescore/football/team/${id}`);
```

### 수정된 파일 목록

| # | 파일 | 상태 |
|---|------|------|
| 1 | `livescore/football/team/[id]/page.tsx` | ✅ |
| 2 | `livescore/football/player/[id]/page.tsx` | ✅ |
| 3 | `livescore/football/match/[id]/page.tsx` | ✅ |
| 4 | `boards/[slug]/page.tsx` | ✅ |
| 5 | `boards/[slug]/[postNumber]/page.tsx` | ✅ |
| 6 | `shop/[category]/page.tsx` | ✅ |
| 7-14 | `boards/(hotdeal)/*.tsx` (8개) | ✅ |

### 하드코딩 fallback 제거 완료

```typescript
// 변경 전 (boards/[slug]/[postNumber]/page.tsx)
const siteUrl = seoSettings?.site_url || 'https://4590football.com';  // 하드코딩
const siteName = seoSettings?.site_name || '4590 Football';           // 하드코딩

// 변경 후
const siteName = seoSettings?.site_name || siteConfig.name;
const postUrl = siteConfig.getCanonical(`/boards/${slug}/${postNumber}`);
```

---

## 최종 효과

- ✅ `siteUrl` 변수 선언 불필요 (코드 간결화)
- ✅ URL 빌드 로직이 `siteConfig` 단일 소스로 관리
- ✅ 슬래시 정규화 등 일관된 처리 보장
- ✅ 도메인 변경 시 `siteConfig` 한 곳만 수정
- ✅ 빌드 테스트 통과 (`npm run build` - Exit code: 0)
