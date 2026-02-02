# 3. 느린 리소스 로딩 시간

> LCP 최적화 점검 - 2026-02-03 완료

## 현재 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 로고 preload | ✅ | `layout.tsx`에서 설정 |
| 로고 priority | ✅ | HeaderClient (데스크탑/모바일) |
| 홈페이지 아이콘 priority | ✅ | **수정 완료** - BoardQuickLinksWidget |
| 이미지 자동 최적화 | ✅ | Next.js Image 자동 WebP 변환 |
| lazy loading | ✅ | 대부분 적용됨 |
| 뉴스 이미지 | ⚠️ | unoptimized 유지 (외부 이미지) |

---

## 상세 분석

### A. LCP 요소 식별

홈페이지에서 LCP 후보:
1. **로고 이미지** - 헤더에 항상 표시
2. **BoardQuickLinksWidget 아이콘** - 6개 아이콘 (첫 화면)
3. **LiveScoreWidget 리그 로고** - 경기 정보

---

### B. priority 설정 현황 ✅

#### 1) 로고 (HeaderClient.tsx)
```tsx
// 데스크탑 로고 (line 270-271)
<Image
  src={logoUrl}
  priority
  fetchPriority="high"
/>

// 모바일 로고 (line 314-315)
<Image
  src={logoUrl}
  priority
  fetchPriority="high"
/>
```
**상태:** ✅ 양호

#### 2) 홈페이지 아이콘 (BoardQuickLinksWidget.tsx) - 수정 완료
```tsx
// 모바일 아이콘 (line 79-86)
<Image
  src={item.iconImage}
  width={28}
  height={28}
  priority  // ✅ 추가됨
/>

// PC 아이콘 (line 97-104)
<Image
  src={item.iconImage}
  width={20}
  height={20}
  priority  // ✅ 추가됨
/>
```
**상태:** ✅ 수정 완료 (2026-02-03)

---

### C. lazy loading 현황 ✅

| 컴포넌트 | 파일 | 설정 | 상태 |
|---------|------|------|------|
| 로고 | HeaderClient | `priority` | ✅ |
| 아이콘 | BoardQuickLinksWidget | `priority` | ✅ |
| 리그/팀 로고 | LiveScoreWidgetV2 | `loading="lazy"` (UnifiedSportsImage) | ✅ |
| 게시판 로고 | BoardCollectionWidgetClient | `fill`, `sizes` | ✅ |
| 게시글 썸네일 | PostList 관련 컴포넌트들 | `loading="lazy"` | ✅ |
| 뉴스 이미지 | NewsWidgetClient | `unoptimized`, lazy | ⚠️ |

**PostList 관련 컴포넌트 상세:**
- `DesktopPostItem.tsx`: `loading="lazy"` ✅
- `DesktopVirtualizedItem.tsx`: `loading="lazy"` ✅
- `MobilePostItem.tsx`: `loading="lazy"` ✅
- `MobileVirtualizedItem.tsx`: `loading="lazy"` ✅
- `PopularPostList.tsx`: 기본값 (lazy) ✅

---

### D. preload 설정 현황 ✅

**파일:** `src/app/layout.tsx`

```tsx
<head>
  {/* 로고 preload */}
  <link
    rel="preload"
    href="/logo/4590football-logo.png"
    as="image"
    type="image/png"
    fetchPriority="high"
  />
</head>
```

**상태:** ✅ 로고 preload 적용됨

---

### E. 이미지 파일 크기 분석 ✅

#### Next.js Image 자동 최적화

Next.js `next/image` 컴포넌트가 **자동으로 WebP 변환**을 처리합니다:

```tsx
// PNG로 작성해도
<Image src="/logo/4590football-logo.png" />

// 브라우저에는 WebP로 변환되어 전달됨
// → /_next/image?url=/logo/4590football-logo.png&w=275&q=75
// → Content-Type: image/webp
```

#### 원본 파일 크기 (참고용)
| 파일 | 원본 크기 | 실제 전달 |
|------|----------|----------|
| 4590football-logo.png | 41KB | ~10KB (WebP) |
| icons/*.png | ~84KB | ~25KB (WebP) |

**확인 방법:**
```
Chrome DevTools > Network > Img 필터
→ 실제 전달되는 Content-Type이 image/webp인지 확인
```

**상태:** ✅ 수동 변환 불필요 - Next.js 자동 처리

---

### F. 뉴스 이미지 (unoptimized) ⚠️

**파일:** `src/domains/widgets/components/news-widget/NewsWidgetClient.tsx`

```tsx
<Image
  src={imageUrl}
  unoptimized  // 외부 이미지 도메인 제한 때문에 유지
  // ...
/>
```

**이유:**
- 뉴스 이미지는 RSS, 외부 URL 등 다양한 소스에서 옴
- 모든 외부 도메인을 remotePatterns에 추가 불가
- 프록시 사용 시 서버 부하 증가

**결론:** unoptimized 유지 (현실적인 선택)

---

### G. UnifiedSportsImage 컴포넌트 ✅

**파일:** `src/shared/components/UnifiedSportsImage.tsx`

```tsx
export default function UnifiedSportsImage({
  loading = 'lazy',      // 기본값 lazy
  priority = false,      // 필요시 priority 설정 가능
  // ...
}) {
  return (
    <Image
      priority={priority}
      loading={priority ? undefined : loading}
      // ...
    />
  );
}
```

**이미지 소스:**
- 리그/팀: Supabase Storage (`vnjjfhsuzoxcljqqwwvx.supabase.co`)
- 선수/감독: API-Sports (`media.api-sports.io`)

**상태:** ✅ Next.js Image 최적화 적용됨

---

### H. next.config.js 설정 ✅

```js
images: {
  localPatterns: [
    { pathname: '/api/proxy-image' },
    { pathname: '/logo/**' },
    { pathname: '/icons/**' },
  ],
  remotePatterns: [
    { hostname: 'media.api-sports.io' },      // 선수/감독
    { hostname: 'vnjjfhsuzoxcljqqwwvx.supabase.co' },  // 팀/리그/업로드
    { hostname: 'i.ytimg.com' },              // YouTube
    { hostname: 'cdn.footballist.co.kr' },
    { hostname: 'image.fmkorea.com' },
    { hostname: 'static01.nyt.com' },
  ],
}
```

**상태:** ✅ 주요 도메인 설정됨

---

## 적용된 수정 사항

### 1. BoardQuickLinksWidget priority 추가 (2026-02-03)

**파일:** `src/domains/widgets/components/board-quick-links-widget/BoardQuickLinksWidget.tsx`

```tsx
// 변경 전
<Image
  src={item.iconImage}
  width={28}
  height={28}
/>

// 변경 후
<Image
  src={item.iconImage}
  width={28}
  height={28}
  priority  // 첫 화면에 보이는 요소
/>
```

---

## 측정 방법

```bash
# 1. 이미지 크기 확인
ls -la public/logo/
ls -la public/icons/

# 2. Chrome DevTools > Network
# - Img 필터로 이미지 로딩 순서/시간 확인
# - priority 이미지가 먼저 로드되는지 확인

# 3. Lighthouse > Performance
# - "Largest Contentful Paint element" 확인
# - "Properly size images" 경고 확인

# 4. WebPageTest
# - 이미지 워터폴 분석
```

---

## 이미지 최적화 도구

```bash
# WebP 변환 (cwebp 사용)
cwebp -q 80 logo.png -o logo.webp

# 또는 온라인 도구
# - squoosh.app (Google)
# - tinypng.com

# Next.js 빌드 시 자동 최적화 확인
npm run build
# .next/static/media/ 확인
```

---

## 결론

### 완료된 항목 ✅
- 로고 preload 및 priority
- 홈페이지 아이콘 priority 추가
- PostList 컴포넌트 lazy loading
- UnifiedSportsImage 최적화
- next.config.js remotePatterns 설정
- 이미지 자동 WebP 변환 (Next.js Image)

### 유지 (현실적 선택)
- NewsWidgetClient unoptimized (외부 이미지)

---

## 완료 일자

- 2026-02-03: BoardQuickLinksWidget priority 추가, 문서 업데이트
