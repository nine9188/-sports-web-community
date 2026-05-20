# Public Assets 관리 가이드

이 폴더는 브라우저에서 직접 접근 가능한 정적 파일들을 관리합니다.

## 📁 디렉토리 구조

```
/public/
├── README.md                   # 이 파일
│
├── favicon.ico                 # 브라우저 탭 아이콘 (48x48)
├── apple-icon.png             # iOS 홈화면 아이콘 (180x180)
├── icon-96.png                # 데스크톱 바로가기 (96x96)
├── icon-192.png               # PWA 아이콘 (192x192)
├── icon-512.png               # PWA 고해상도 아이콘 (512x512)
├── og-image.png               # SNS 공유 이미지 (1200x630) ✅ DB 관리
│
├── site.webmanifest           # PWA 설정 파일
├── robots.txt                 # 검색엔진 크롤링 규칙
│
├── branding/                  # 브랜드 로고
│   └── README.md
│
└── icons/                     # UI 아이콘
    └── README.md
```

---

## 🔖 파비콘 & 아이콘

### favicon.ico
- **크기**: 48x48px (멀티사이즈 ICO 권장)
- **용도**: 브라우저 탭, 북마크 아이콘
- **경로**: `/favicon.ico` (루트 필수)
- **참조 파일**: `src/app/layout.tsx`

### apple-icon.png
- **크기**: 180x180px
- **용도**: iOS Safari 홈화면 추가 시 아이콘
- **경로**: `/apple-icon.png`
- **참조 파일**: `src/app/layout.tsx`, `site.webmanifest`

### icon-96.png, icon-192.png, icon-512.png
- **크기**: 각각 96x96, 192x192, 512x512px
- **용도**: PWA 설치 시 앱 아이콘, 데스크톱 바로가기
- **경로**: `/icon-*.png`
- **참조 파일**: `src/app/layout.tsx`, `site.webmanifest`

---

## 🌐 SEO & SNS

### og-image.png
- **크기**: 1200x630px (권장)
- **용도**: Facebook, Twitter, KakaoTalk 등 SNS 공유 시 표시되는 이미지
- **경로**: `/og-image.png`
- **관리**: 관리자 페이지 > SEO 설정 (`seo_settings` 테이블)
- **참조 파일**: `src/shared/utils/metadataNew.ts`

**변경 방법:**
1. 새 이미지를 `/public/og-image.png` 파일로 교체 (덮어쓰기)
2. 또는 다른 파일명 사용 시: 관리자 SEO 페이지에서 경로 변경

---

## 🎨 브랜딩 (Branding)

**위치**: `/public/branding/`

### logo-main.png
- **용도**: 메인 로고 (세로형)
- **원본**: `4590 로고2 이미지크기 275X200 누끼제거 버전.png`
- **사용처**:
  - Header
  - 인증 페이지 (로그인/회원가입)
  - Article Schema (게시글 상세)
  - 게시판 아이콘 (썸네일 없는 경우 폴백)

### logo-horizontal.png
- **용도**: 가로형 로고
- **원본**: `4590_FOOTBALL누끼제거 버전 -이미지 크기 310X150.png`
- **사용처**: (현재 미사용, 향후 확장용)

**변경 방법:**
- 새 로고 파일을 `/public/branding/logo-main.png`로 교체
- 코드 수정 불필요 (경로 하드코딩)

---

## 🎯 UI 아이콘

**위치**: `/public/icons/`

| 파일명 | 용도 | 사용처 |
|--------|------|--------|
| `ai.png` | AI 분석 게시판 | BoardQuickLinksWidget |
| `live.png` | 라이브스코어 | BoardQuickLinksWidget |
| `news.png` | 소식 게시판 | BoardQuickLinksWidget |
| `notice.png` | 공지 게시판 | BoardQuickLinksWidget |
| `post.png` | 전체글 게시판 | BoardQuickLinksWidget |
| `popular.png` | 인기글 게시판 | BoardQuickLinksWidget |

**참조 파일**: `src/domains/widgets/components/board-quick-links-widget/BoardQuickLinksWidget.tsx`

**변경 방법:**
- 새 아이콘 파일을 `/public/icons/[파일명].png`로 교체
- 코드 수정 불필요

---

## ⚙️ 설정 파일

### site.webmanifest
- PWA (Progressive Web App) 설정 파일
- 앱 이름, 아이콘, 테마 색상 등 정의
- **주의**: 아이콘 경로 변경 시 이 파일도 함께 수정 필요

### robots.txt
- 검색엔진 크롤러 제어 파일
- 관리자 페이지, 인증 페이지 등 크롤링 차단
- **관리**: 직접 파일 수정 (코드베이스)

---

## 🚀 배포 시 주의사항

1. **파비콘 캐싱 문제**
   - 브라우저가 파비콘을 강하게 캐싱함
   - 변경 후 적용 확인: 시크릿 모드 또는 캐시 삭제 후 테스트

2. **OG 이미지 캐싱 문제**
   - SNS 플랫폼이 OG 이미지를 캐싱함
   - 변경 후 캐시 갱신 필요:
     - Facebook: https://developers.facebook.com/tools/debug/
     - Twitter: https://cards-dev.twitter.com/validator
     - LinkedIn: https://www.linkedin.com/post-inspector/

3. **파일 크기 최적화**
   - PNG: 가능한 압축 (TinyPNG 등)
   - OG 이미지: 8MB 이하 권장
   - 파비콘: 투명 배경 지원 필요

---

## 🔧 관리자 페이지 연동

### SEO 설정
- **경로**: `/admin/site-management/seo-v2`
- **관리**: `og_image` 경로 수정 가능
- **DB**: `seo_settings` 테이블

### 브랜딩 관리
- **경로**: `/admin/site-management/branding`
- **역할**: 현재 설정 상태 확인 (안내 페이지)
- **DB**: `site_settings` 테이블 (현재 미사용)

---

## 📝 파일 변경 체크리스트

### 파비콘 변경
- [ ] `/public/favicon.ico` 파일 교체
- [ ] 시크릿 모드에서 확인
- [ ] 모바일 (iOS/Android) 확인

### 앱 아이콘 변경
- [ ] `/public/apple-icon.png` 교체 (180x180)
- [ ] `/public/icon-192.png` 교체 (192x192)
- [ ] `/public/icon-512.png` 교체 (512x512)
- [ ] `/public/site.webmanifest` 경로 확인

### OG 이미지 변경
- [ ] `/public/og-image.png` 교체 (1200x630)
- [ ] 관리자 SEO 페이지에서 경로 확인
- [ ] Facebook Debugger에서 캐시 갱신
- [ ] Twitter Card Validator에서 확인

### 로고 변경
- [ ] `/public/branding/logo-main.png` 교체
- [ ] 헤더에서 표시 확인
- [ ] 다크모드에서 확인

### UI 아이콘 변경
- [ ] `/public/icons/[파일명].png` 교체
- [ ] 메인 페이지 위젯에서 확인
- [ ] 다크모드에서 invert 효과 확인

---

## 🔗 관련 문서

- [관리자 브랜딩 관리](../src/app/admin/site-management/branding/page.tsx)
- [SEO 설정](../src/app/admin/site-management/seo-v2/SeoSettingsPage.tsx)
- [메타데이터 유틸](../src/shared/utils/metadataNew.ts)
- [PWA 매니페스트](./site.webmanifest)

---

**마지막 업데이트**: 2026-01-08
**관리자**: 개발팀
