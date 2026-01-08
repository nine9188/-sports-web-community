# Branding Assets

4590 Football의 브랜드 로고 파일들을 관리합니다.

## 📁 파일 목록

### logo-main.png
- **크기**: 275x200px (원본 기준)
- **형식**: PNG (투명 배경)
- **용도**: 메인 로고 (세로형/정사각형)
- **사용처**:
  - 헤더 (`HeaderClient.tsx`)
  - 인증 페이지 로고 (`(auth)/layout.tsx`, `auth/confirmed/page.client.tsx`)
  - 게시판 썸네일 폴백 (`PopularPostList.tsx`, `PostRenderers.tsx`, `NoticeItem.tsx`)
  - 사이드바 최신글 아이콘 (`TabsClient.tsx`)
  - 닉네임 변경권 아이콘 (`NicknameChangeModal.tsx`)
  - 뉴스 위젯 폴백 이미지 (`NewsWidgetClient.tsx`)
  - 이미지 프록시 기본 이미지 (`imageProxy.ts`)
  - Article Schema 로고 (`boards/[slug]/[postNumber]/page.tsx`)

### logo-horizontal.png
- **크기**: 310x150px (원본 기준)
- **형식**: PNG (투명 배경)
- **용도**: 가로형 로고
- **사용처**: 현재 미사용 (향후 확장용)

---

## 🔧 로고 변경 방법

### 1. 파일 준비
- **형식**: PNG (투명 배경 권장)
- **크기**:
  - 메인 로고: 약 200-300px 정사각형 또는 세로형
  - 가로형 로고: 약 300-400px 가로형
- **최적화**: TinyPNG 등으로 압축

### 2. 파일 교체
```bash
# 메인 로고 교체
cp new-logo.png /public/branding/logo-main.png

# 가로형 로고 교체 (선택사항)
cp new-logo-horizontal.png /public/branding/logo-horizontal.png
```

### 3. 확인 사항
- [ ] 헤더에서 로고 표시 확인
- [ ] 다크 모드에서 표시 확인 (필요시 invert 효과 적용)
- [ ] 모바일 반응형 확인
- [ ] 게시판 썸네일 폴백 표시 확인

---

## 🎨 디자인 가이드

### 권장 사항
- **배경**: 투명 (PNG alpha channel)
- **색상**: 다크모드 대응 고려
- **비율**: 1:1 또는 4:3 (메인), 2:1 또는 3:1 (가로형)
- **해상도**: 최소 200px, 최대 500px (파일 크기 고려)

### 다크모드 대응
코드에서 `dark:invert` 클래스가 적용되는 경우가 있으므로:
- **방법 1**: 밝은 색상 로고 사용 (자동 invert)
- **방법 2**: 다크모드 전용 로고 별도 제작 (코드 수정 필요)

---

## 📝 참조 코드 파일

로고를 사용하는 모든 파일:
1. `src/domains/layout/components/HeaderClient.tsx`
2. `src/app/(auth)/layout.tsx`
3. `src/app/auth/confirmed/page.client.tsx`
4. `src/domains/settings/components/profile/NicknameChangeModal.tsx`
5. `src/domains/boards/components/post/PopularPostList.tsx`
6. `src/domains/boards/components/post/postlist/components/shared/PostRenderers.tsx`
7. `src/domains/boards/components/notice/NoticeItem.tsx`
8. `src/domains/sidebar/components/TabsClient.tsx`
9. `src/domains/widgets/components/news-widget/NewsWidgetClient.tsx`
10. `src/shared/utils/imageProxy.ts`
11. `src/app/boards/[slug]/[postNumber]/page.tsx` (Article Schema)

경로가 하드코딩되어 있으므로 파일명 변경 시 코드 수정 필요합니다.

---

**마지막 업데이트**: 2026-01-08
