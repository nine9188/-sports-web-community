# 2. 자바스크립트와 CSS의 렌더 블로킹

> LCP 최적화 점검 - 2026-02-03 완료

## 현재 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 폰트 최적화 | ✅ | `display: swap`, `preload: true` |
| globals.css 분리 | ✅ | **완료** - 1,365줄 → 348줄 |
| 클라이언트 컴포넌트 | ✅ | 306개 파일 (대부분 UI 필수) |
| dynamic import | ✅ | 7개 파일에서 사용 (에디터, 사이드바 등) |
| React.lazy | ✅ | 3개 파일에서 사용 |

---

## 상세 분석

### A. 폰트 로딩 전략 ✅

**파일:** `src/app/layout.tsx`

```typescript
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',    // ✅ FOIT 방지
  preload: true,      // ✅ 미리 로드
});
```

**상태:** 양호 - Next.js 폰트 최적화 적용됨

---

### B. CSS 분리 ✅ 완료 (2026-02-03)

#### 변경 전
```
globals.css: 1,365줄
├── Critical CSS: ~243줄 (18%)
└── Non-Critical CSS: ~1,122줄 (82%) - 게시글 전용
```

#### 변경 후
```
globals.css: ~348줄 (Critical CSS만)
├── CSS 변수, base 스타일
├── autofill, 테마 스타일
├── 스크롤바 유틸리티
└── 애니메이션 키프레임

post-content.css: ~870줄 (게시글 전용)
├── 비디오/YouTube 임베드
├── 매치 카드 스타일
├── 소셜 미디어 임베드
├── 팀/선수 카드 스타일
└── ProseMirror 에디터
```

#### 적용 페이지
| CSS 파일 | 적용 페이지 |
|----------|-------------|
| `globals.css` | 모든 페이지 |
| `post-content.css` | 게시글 관련 페이지만 |

**import 위치:**
- `src/app/(post)/layout.tsx` - 게시글 상세/수정
- `src/app/(site)/boards/[slug]/create/page.tsx` - 게시글 작성

**예상 효과:**
- 홈페이지 CSS: ~24KB → ~8-10KB (약 60% 감소)
- 미사용 CSS 비율: 92% → ~50%

---

### C. 클라이언트 컴포넌트 현황 ✅

**총 306개 파일**에 `'use client'` 지시자 사용

| 도메인 | 파일 수 | 용도 |
|--------|---------|------|
| domains/livescore | 65 | 라이브스코어 UI (인터랙션 필수) |
| domains/boards | 52 | 게시판 컴포넌트 |
| domains/admin | 36 | 관리자 페이지 |
| shared/components | 21 | 공유 UI 컴포넌트 |
| app/admin | 21 | 관리자 앱 |
| domains/settings | 20 | 설정 페이지 |
| domains/layout | 13 | 레이아웃 컴포넌트 |
| 기타 | 78 | 챗봇, 검색, 알림 등 |

**상태:** 양호 - 대부분 UI 인터랙션에 필수적인 컴포넌트

---

### D. 코드 스플리팅 현황 ✅

#### 1) next/dynamic 사용 (7개 파일)

| 파일 | 지연 로딩 대상 | SSR |
|------|---------------|-----|
| `AuthStateManager.tsx` | Sidebar, ProfileSidebar, Chatbot | ✅/❌ |
| `boards/[slug]/create/page.tsx` | PostEditForm (Tiptap 에디터) | - |
| `boards/[slug]/[postNumber]/edit/page.tsx` | PostEditForm (Tiptap 에디터) | - |
| `TabContent.tsx` | 매치 탭 컴포넌트들 | - |
| `PreviewModal.tsx` | 관리자 프리뷰 | - |
| `PostDetailLayout.tsx` | 게시글 레이아웃 | - |
| `ChatMessageBubble.tsx` | 챗봇 메시지 | - |

**핵심:** Tiptap 에디터가 게시글 작성/수정 페이지에서만 로드됨 ✅

#### 2) React.lazy 사용 (3개 파일)

| 파일 | 지연 로딩 대상 |
|------|--------------|
| `RootLayoutProvider.tsx` | ToastContainer, SuspensionPopup, AttendanceChecker, ReactQueryDevtools |
| `EditorToolbar.tsx` | 7개 폼 컴포넌트 (ImageUploadForm, LinkForm 등) |
| `PredictionChartNode.tsx` | 차트 컴포넌트 |

---

## 적용된 수정 사항

### 1. CSS 분리 (2026-02-03)

**새 파일:** `src/styles/post-content.css`
- 비디오/YouTube 임베드 스타일
- 매치 카드 스타일
- 소셜 미디어 임베드 스타일
- 팀/선수 카드 스타일
- ProseMirror 에디터 스타일

**수정된 파일:**
- `src/app/globals.css` - Critical CSS만 유지 (348줄)
- `src/app/(post)/layout.tsx` - post-content.css import 추가
- `src/app/(site)/boards/[slug]/create/page.tsx` - post-content.css import 추가

---

## 측정 방법

```bash
# 1. Lighthouse로 렌더 블로킹 리소스 확인
Chrome DevTools > Lighthouse > Performance
→ "Eliminate render-blocking resources" 확인

# 2. Coverage 탭으로 미사용 CSS 확인
Chrome DevTools > More tools > Coverage
→ CSS 파일의 빨간색 비율 확인

# 3. 번들 분석
ANALYZE=true npm run build

# 4. Network 탭에서 CSS 로딩 시간 확인
Chrome DevTools > Network > CSS 필터
```

---

## 결론

### 완료된 항목 ✅
- 폰트 최적화 (display: swap, preload)
- CSS 분리 (globals.css → post-content.css)
- 대형 라이브러리 코드 스플리팅 (Tiptap, Toast 등)
- 사이드바/챗봇 dynamic import
- 클라이언트 컴포넌트 (대부분 필수)

### 추가 조치 불필요
- 현재 코드 스플리팅이 잘 적용되어 있음
- CSS 분리 완료로 홈페이지 렌더 블로킹 개선됨

---

## 완료 일자

- 2026-02-03: CSS 분리 완료, 문서 업데이트
