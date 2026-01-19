# Button 컴포넌트 사용 현황 분석

> 최종 업데이트: 2026-01-19

## 개요

`src/shared/components/ui/button.tsx` Button 컴포넌트 사용 현황 및 마이그레이션 가이드입니다.

---

## 마이그레이션 현황

### 마이그레이션 완료 (24개 파일)

#### Auth 페이지 (6개) - 완료

| 파일 | 사용 variant |
|-----|-------------|
| `src/app/(auth)/signin/page.client.tsx` | `primary`, `ghost` |
| `src/app/(auth)/signup/page.client.tsx` | `primary`, `ghost` |
| `src/app/(auth)/social-signup/page.client.tsx` | `primary` |
| `src/app/(auth)/help/reset-password/page.client.tsx` | `primary`, `outline`, `ghost` |
| `src/app/(auth)/help/account-recovery/page.client.tsx` | `primary`, `ghost`, `link` |
| `src/app/(auth)/help/account-found/page.client.tsx` | `primary`, `outline` |

#### Settings 페이지 (3개) - 완료

| 파일 | 사용 variant |
|-----|-------------|
| `src/domains/settings/components/password/PasswordForm.tsx` | `primary`, `ghost` |
| `src/domains/settings/components/profile/ProfileForm.tsx` | `secondary` |
| `src/domains/settings/components/account-delete/AccountDeleteForm.tsx` | `destructive`, `secondary` |

#### 게시판 컴포넌트 (12개) - 완료

| 파일 | 사용 variant |
|-----|-------------|
| `src/domains/boards/components/post/PostEditForm.tsx` | `primary`, `secondary` |
| `src/domains/boards/components/post/PostActions.tsx` | `ghost` |
| `src/domains/boards/components/post/PostFooter.tsx` | `ghost` |
| `src/domains/boards/components/post/PostNavigation.tsx` | `ghost` |
| `src/domains/boards/components/post/Comment.tsx` | `primary`, `secondary`, `ghost` |
| `src/domains/boards/components/hotdeal/HotdealEndButton.tsx` | `destructive`, `secondary`, `outline` |
| `src/domains/boards/components/form/ImageUploadForm.tsx` | `primary`, `outline` |
| `src/domains/boards/components/form/LinkForm.tsx` | `primary`, `outline` |
| `src/domains/boards/components/form/VideoForm.tsx` | `primary`, `outline` |
| `src/domains/boards/components/form/YoutubeForm.tsx` | `primary`, `outline` |
| `src/domains/boards/components/form/MatchResultForm.tsx` | `outline` |
| `src/domains/boards/components/form/SocialEmbedForm.tsx` | `primary`, `outline` |

#### 기타 컴포넌트 (5개) - 완료

| 파일 | 사용 variant |
|-----|-------------|
| `src/domains/boards/components/createnavigation/EditorToolbar.tsx` | `ghost` + `size="icon"` |
| `src/domains/boards/components/common/PeriodFilter.tsx` | `ghost`, `secondary` |
| `src/domains/boards/components/common/HoverMenu.tsx` | `ghost` + `size="icon"` |
| `src/domains/chatbot/components/ChatFloatingButton.tsx` | `ghost` |
| `src/domains/chatbot/components/ChatChipButtons.tsx` | `primary`, `secondary` |

---

### 기존 Button 컴포넌트 사용 파일 (15개)

| 파일 | 사용 variant |
|-----|-------------|
| `src/domains/sidebar/components/auth/AuthSection.tsx` | 기본 |
| `src/domains/reports/components/ReportButton.tsx` | `outline`, `primary` |
| `src/domains/user/components/AuthorLink.tsx` | `outline`, `primary` |
| `src/app/admin/boards/page.tsx` | 기본 |
| `src/app/admin/exp/components/ExpManager.tsx` | 기본 |
| `src/app/admin/logs/components/LogViewer.tsx` | `outline`, `ghost` |
| `src/domains/chatbot/components/ChatInput.tsx` | - |
| `src/domains/chatbot/components/ChatModal.tsx` | - |
| `src/domains/chatbot/components/Chatbot.tsx` | - |
| `src/domains/sidebar/components/Sidebar.tsx` | - |
| `src/app/admin/shop/components/ShopItemManagement.tsx` | - |
| `src/domains/boards/components/post/CommentSection.tsx` | - |
| `src/app/admin/points/page.tsx` | - |
| `src/app/admin/points/components/PointManager.tsx` | - |
| `src/app/admin/exp/page.tsx` | - |

---

### 마이그레이션 보류 - Admin 페이지 (11개)

| 파일 | 버튼 유형 | 권장 variant |
|-----|----------|-------------|
| `src/app/admin/banners/components/BannerManagementClient.tsx` | CRUD 버튼 | `primary`, `destructive`, `outline` |
| `src/app/admin/notices/NoticeManagement.tsx` | 공지 관리 | `primary`, `outline` |
| `src/app/admin/users/page.tsx` | 사용자 관리 | `primary`, `destructive` |
| `src/app/admin/reports/page.tsx` | 신고 관리 | `primary`, `outline` |
| `src/app/admin/youtube/page.tsx` | 유튜브 관리 | `primary`, `outline` |
| `src/app/admin/notifications/page.tsx` | 알림 관리 | `primary` |
| `src/app/admin/site-management/branding/BrandingSettingsForm.tsx` | 설정 저장 | `primary` |
| `src/app/admin/site-management/seo-v2/SeoSettingsPage.tsx` | SEO 설정 | `primary` |
| `src/app/admin/site-management/ui-theme/UIThemeSettingsPage.tsx` | 테마 설정 | `primary` |
| `src/app/admin/widgets/board-collection/page.tsx` | 위젯 관리 | `primary`, `outline` |
| `src/domains/admin/components/SuspensionManager.tsx` | 정지 관리 | `destructive`, `secondary` |

---

### 추가 마이그레이션 완료 (13개 파일)

초기 분석에서 누락되었으나 마이그레이션 완료된 파일들입니다.

#### Settings 추가 컴포넌트 (5개) - 완료

| 파일 | 사용 variant |
|-----|-------------|
| `src/domains/settings/components/profile/NicknameChangeModal.tsx` | `ghost`, `secondary`, `primary` |
| `src/domains/settings/components/profile/ReferralSection.tsx` | `primary` |
| `src/domains/settings/components/phone/PhoneVerificationForm.tsx` | `secondary`, `ghost` |
| `src/domains/settings/components/exp/LevelList.tsx` | `header` |
| `src/domains/settings/components/icons/IconForm.tsx` | `ghost`, `primary` |

#### Chatbot 추가 컴포넌트 (5개) - 완료

| 파일 | 사용 variant |
|-----|-------------|
| `src/domains/chatbot/components/ChatFormRenderer.tsx` | `outline`, `primary` |
| `src/domains/chatbot/components/ChatConversationList.tsx` | `ghost`, `primary` |
| `src/domains/chatbot/components/ChatModal.tsx` | `ghost` + `size="icon"` |
| `src/domains/chatbot/components/ChatInput.tsx` | `ghost`, `primary` + `size="icon"` |
| `src/domains/chatbot/components/ChatHeader.tsx` | `ghost` + `size="icon"` |

#### 게시판 Form 추가 버튼 (3개) - 완료

| 파일 | 사용 variant |
|-----|-------------|
| `src/domains/boards/components/form/ImageUploadForm.tsx` | `ghost`, `secondary` |
| `src/domains/boards/components/form/VideoForm.tsx` | `secondary`, `ghost` |
| `src/domains/boards/components/form/MatchResultForm.tsx` | `secondary`, `ghost` |

---

#### 게시판 Post 특수 케이스 (유지)

| 파일 | 이유 |
|-----|------|
| `src/domains/boards/components/post/Comment.tsx` (ActionButton) | 좋아요/싫어요 동적 색상 |
| `src/domains/boards/components/post/Comment.tsx` (작성자 버튼) | 드롭다운 토글, 텍스트 스타일 |

---

### 네이티브 button 유지 (7개)

특수한 케이스로 네이티브 button 사용이 적절합니다.

| 파일 | 이유 |
|-----|------|
| `src/app/error.tsx` | 에러 바운더리, 최소 의존성 필요 |
| `src/app/global-error.tsx` | 전역 에러, 최소 의존성 필요 |
| `src/app/test/page.tsx` | 테스트 페이지 |
| `src/app/tset/page.tsx` | 테스트 페이지 |
| `src/app/tset/match/page.tsx` | 테스트 페이지 |
| `src/app/tset/friendly/page.tsx` | 테스트 페이지 |
| `src/domains/auth/components/KakaoLoginButton.tsx` | 카카오 브랜드 색상 필수 (#FEE500) |

---

## Button 컴포넌트 Variants

```tsx
import { Button } from '@/shared/components/ui';

// 기본 - 흰색 배경 + 연한 테두리
<Button>기본</Button>
<Button variant="default">기본</Button>

// Primary - 강조 (다크 배경)
<Button variant="primary">확인</Button>

// Secondary - 회색 배경
<Button variant="secondary">보조</Button>

// Destructive - 빨간색 (삭제, 위험)
<Button variant="destructive">삭제</Button>

// Outline - 테두리만
<Button variant="outline">취소</Button>

// Ghost - 투명 배경, 호버 시 배경
<Button variant="ghost">아이콘</Button>

// Link - 텍스트 링크 스타일
<Button variant="link">링크</Button>

// Header - 컨테이너 헤더용
<Button variant="header">헤더 버튼</Button>
```

---

## Size Variants

```tsx
// 기본 크기
<Button size="default">기본 (h-10)</Button>

// 작은 크기
<Button size="sm">작게 (h-9)</Button>

// 큰 크기
<Button size="lg">크게 (h-11)</Button>

// 아이콘 전용
<Button size="icon" variant="ghost">
  <Icon className="h-4 w-4" />
</Button>
```

---

## 마이그레이션 가이드

### Before (네이티브 button)

```tsx
<button
  onClick={handleClick}
  className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
>
  저장
</button>
```

### After (Button 컴포넌트)

```tsx
import { Button } from '@/shared/components/ui';

<Button variant="primary" onClick={handleClick}>
  저장
</Button>
```

---

## 특수 케이스 처리

### 상태별 색상이 필요한 경우 (좋아요/싫어요)

```tsx
// Button 사용 시 className으로 오버라이드
<Button
  variant="ghost"
  className={isLiked ? 'text-blue-500' : 'text-gray-500'}
>
  좋아요
</Button>
```

### 아이콘 버튼

```tsx
<Button variant="ghost" size="icon">
  <Edit className="h-4 w-4" />
</Button>
```

### asChild로 Link 감싸기

```tsx
import Link from 'next/link';

<Button asChild variant="primary">
  <Link href="/dashboard">대시보드로 이동</Link>
</Button>
```

### 전체 너비 버튼

```tsx
<Button variant="primary" className="w-full py-3 h-auto">
  로그인
</Button>
```

---

## 통계 요약

| 분류 | 파일 수 | 상태 |
|-----|--------|------|
| Button 컴포넌트 사용 (기존) | 15개 | 완료 |
| 마이그레이션 완료 (1차) | 24개 | 완료 |
| 마이그레이션 완료 (추가 Settings/Chatbot/Form) | 13개 | 완료 |
| 마이그레이션 완료 (전체 도메인) | 45개+ | 완료 |
| Admin 페이지 (보류) | 11개 | 보류 |
| 네이티브 유지 (특수 케이스) | 10개+ | 해당없음 |
| **총 Button 사용 파일** | **90개+** | - |

---

## 변경 이력

| 날짜 | 변경 내용 |
|-----|----------|
| 2026-01-19 | 초기 분석 문서 작성 |
| 2026-01-19 | Auth 페이지 마이그레이션 완료 (6개 파일) |
| 2026-01-19 | Settings 페이지 마이그레이션 완료 (3개 파일) |
| 2026-01-19 | 게시판 컴포넌트 마이그레이션 완료 (12개 파일) |
| 2026-01-19 | Chatbot/기타 컴포넌트 마이그레이션 완료 (5개 파일) |
| 2026-01-19 | Admin 페이지 마이그레이션 보류 (11개 파일) |
| 2026-01-19 | 추가 마이그레이션 필요 파일 13개 발견 (Settings, Chatbot, Form 컴포넌트) |
| 2026-01-19 | 추가 마이그레이션 13개 파일 완료 |
| 2026-01-19 | 전체 도메인 마이그레이션 완료 (shop, notifications, search, layout, sidebar, livescore, widgets, boards, user) |
