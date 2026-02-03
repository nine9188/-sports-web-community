# 📚 프로젝트 문서 인덱스

이 폴더는 프로젝트의 모든 문서를 통합 관리합니다.

---

## 📂 문서 구조

```
docs/
├── README.md (이 파일)
├── QUICK_START.md               # 빠른 시작 가이드
├── 404-layout-separation/       # 404 레이아웃 분리 🔄 진행 중
├── chatbot/                     # 챗봇 시스템
├── hot-system/                  # HOT 게시글 시스템
├── notifications/               # 알림 시스템
├── reward-system/               # 보상 시스템
├── hotdeal/                     # 핫딜 시스템
├── livescore/                   # 라이브스코어 시스템
├── player-fixtures/             # 선수 경기 기록 API
├── seo/                         # SEO 개선 가이드
├── auth-refactoring/            # 인증 리팩토링 기록
├── guides/                      # 가이드 및 튜토리얼
└── dev-notes/                   # 개발 메모 및 노트
```

---

## 💬 챗봇 시스템 ✨ NEW

SSR을 이용한 최적화 대화형 챗봇 시스템입니다.

| 문서 | 설명 | 상태 |
|------|------|------|
| [README.md](./chatbot/README.md) | 챗봇 시스템 전체 개요 | ✅ 완료 |
| [architecture-improvements.md](./chatbot/architecture-improvements.md) | 아키텍처 개선 계획 | 📋 계획 |

**주요 기능**:
- ✅ 플로팅 버튼 + 모달/패널형 UI
- ✅ 인증/비인증 사용자 분리 (Supabase DB / localStorage)
- ✅ 6개 칩버튼 카테고리 (문의, 신고, 버그 등)
- ✅ 동적 폼 렌더링
- ✅ 카카오톡 스타일 읽음 표시
- ✅ 타이핑 버블 ("..." 애니메이션)

**개선 예정**:
- ⏳ role/kind 분리 (메시지 타입 구조 개선)
- ⏳ 읽음 테이블 분리 (멀티 디바이스 지원)
- ⏳ 중복 방지 메커니즘 (client_message_id)
- ⏳ typing 타이머 취소 로직

---

## 🏗️ Architecture

프로젝트의 핵심 아키텍처 구조 및 최적화 관련 문서입니다.

| 문서 | 설명 | 상태 |
|------|------|------|
| [route-group-restructure.md](./route-group-restructure.md) | Route Group 구조 개편 (외부 API 호출 제거) | ✅ 완료 |
| [404-layout-separation/](./404-layout-separation/README.md) | 404 레이아웃 분리 (Parallel Routes @chrome) | 🔄 진행 중 |

**주요 내용**:
- ✅ Root Layout에서 외부 API 호출 완전 제거
- ✅ `(site)` Route Group으로 사이트 레이아웃 분리
- ✅ 404 페이지 API 비용 제로화
- ✅ Server/Client Component 분리 (RootLayoutProvider)
- ✅ React Query를 활용한 클라이언트 lazy loading

**Before → After**:
- 봇 크롤링 시 API 호출: **4회 → 0회**
- 메인 페이지 TTFB: **~500ms → ~200ms** (60% 개선)
- 404 페이지: 외부 API 호출 없음 (비용 절감)

---

## 🎁 보상 시스템

사용자 활동에 대한 경험치(XP)와 포인트(P) 보상 시스템입니다.

| 문서 | 설명 | 상태 |
|------|------|------|
| [README.md](./reward-system/README.md) | 보상 시스템 전체 개요 | - |
| [PHASE2_PLAN.md](./reward-system/PHASE2_PLAN.md) | Phase 2: 연속 출석, 추천 보상, 레벨업 알림 | ✅ 완료 |
| [PHASE3_PLAN.md](./reward-system/PHASE3_PLAN.md) | Phase 3: 밸런스 조정, 아이템 등급화, 추가 보상 | ✅ 완료 |

**주요 기능**:
- ✅ 활동별 보상 (게시글, 댓글, 좋아요)
- ✅ 연속 출석 보너스 (7/14/21/30일)
- ✅ 출석 캘린더 UI (PC/모바일)
- ✅ 레벨업 알림
- ✅ 아이템 등급 시스템 (common/rare/epic/legendary)
- ✅ 경험치 밸런스 조정 (+100~200%)
- ✅ 추천하기/첫 활동 보너스

---

## 💰 핫딜 시스템 ✨ NEW

가전, 패션, 식품 등 다양한 카테고리의 핫딜 정보를 관리하는 시스템입니다.

| 문서 | 설명 | 상태 |
|------|------|------|
| [hotdeal-system.md](./boards/hotdeal-system.md) | 핫딜 시스템 전체 문서 (구조, 컴포넌트, 사용 가이드) | ✅ 완료 |
| [hotdeal-implementation.md](./boards/hotdeal-implementation.md) | 핫딜 구현 계획 (초기 설계 문서) | 📋 참고용 |

**주요 기능**:
- ✅ 핫딜 정보 등록 (상품명, 가격, 할인율, 배송비, 쇼핑몰 URL)
- ✅ URL 입력 시 쇼핑몰 자동 감지
- ✅ 종료 관리 (품절/마감 등 사유별 처리)
- ✅ 쇼핑몰별 필터링 (StoreFilterMenu)
- ✅ 리스트/상세 페이지 통합
- ✅ `[종료]` 배지 + 취소선 표시

**구현 완료**:
- ✅ Phase 1: 타입 & 유틸리티 (types/hotdeal, utils/hotdeal)
- ✅ Phase 2: 상세페이지 (HotdealInfoBox)
- ✅ Phase 3: 글쓰기 (HotdealFormFields)
- ✅ Phase 4: 리스트 (종료 표시)
- ✅ Phase 5: 관리 기능 (HotdealEndButton, endDeal)
- ✅ Phase 6: 쇼핑몰 필터링 (StoreFilterMenu)

---

## ⚽ 라이브스코어 시스템

실시간 축구 경기 정보를 제공하는 라이브스코어 시스템입니다.

| 문서 | 설명 | 상태 |
|------|------|------|
| [mainview-refactoring.md](./livescore/mainview-refactoring.md) | MainView 컴포넌트 리팩토링 가이드 | 🔄 진행 중 |

**주요 이슈**:
- ⚠️ 라이브 상태 체크 로직 중복 (3곳)
- ⚠️ LIVE 버튼 클릭 시 중복 API 호출
- ⚠️ 과도한 useEffect 사용 (7개)
- ⚠️ 30초 폴링 비효율성

**리팩토링 계획**:
1. 상수/유틸리티 추출
2. useEffect 정리 및 Custom Hook 분리
3. 폴링 최적화
4. 월간 데이터 fetch 병렬화

---

## 🔍 SEO 개선 가이드

검색 엔진 최적화(SEO) 개선을 위한 단계별 구현 가이드입니다.

| 문서 | 설명 | 우선순위 |
|------|------|---------|
| [README.md](./seo/README.md) | SEO 개선 전체 개요 및 현재 상태 | - |
| [step-1-dynamic-metadata.md](./seo/step-1-dynamic-metadata.md) | 동적 페이지 메타데이터 구현 | 🔴 높음 |
| [step-2-robots-sitemap.md](./seo/step-2-robots-sitemap.md) | Robots.txt & Sitemap 개선 | 🔴 높음 |
| [step-3-json-ld.md](./seo/step-3-json-ld.md) | JSON-LD 구조화 데이터 구현 | 🟡 중간 |
| [step-4-canonical-url.md](./seo/step-4-canonical-url.md) | Canonical URL 구현 | 🟢 낮음 |

**구현 순서**:
1. [Step 1] Post/Match/Team/Player 페이지 메타데이터 추가
2. [Step 2] Robots.txt에 sitemap URL 설정, Sitemap 확장
3. [Step 3] JSON-LD 스키마로 리치 스니펫 활성화
4. [Step 4] Canonical URL로 중복 콘텐츠 방지

---

## 🔥 HOT 게시글 시스템

HOT 게시글은 조회수, 좋아요, 댓글을 기반으로 인기 게시글을 실시간 계산하는 시스템입니다.

| 문서 | 설명 |
|------|------|
| [overview.md](./hot-system/overview.md) | HOT 시스템 전체 개요 및 사이드바 구조 |
| [score-calculation.md](./hot-system/score-calculation.md) | HOT 점수 계산 알고리즘 상세 가이드 |
| [server-action-deployment.md](./hot-system/server-action-deployment.md) | **Server Actions 배포 가이드** (Vercel Cron) ✨ |
| ~~[edge-function.md](./hot-system/edge-function.md)~~ | (구) Edge Function 가이드 - 더 이상 사용 안 함 |

**빠른 시작**:
1. [HOT 점수 계산 방식](./hot-system/score-calculation.md) 이해하기
2. [Server Actions 배포](./hot-system/server-action-deployment.md)로 자동 알림 설정
3. [테스트 가이드](./guides/testing-hot-notifications.md)로 동작 확인

---

## 🔔 알림 시스템

사용자 활동(댓글, 좋아요, HOT 진입 등)에 대한 실시간 알림 시스템입니다.

| 문서 | 설명 |
|------|------|
| [system-overview.md](./notifications/system-overview.md) | 알림 시스템 전체 구조 및 9가지 알림 타입 |

**주요 기능**:
- ✅ 9가지 알림 타입 (댓글, 좋아요, HOT 진입, 레벨업 등)
- ✅ Supabase Realtime 실시간 푸시
- ✅ PC 드롭다운 / 모바일 전체화면 모달
- ✅ 관리자 전체 공지 발송

---

## 🔐 인증 리팩토링

프로젝트 인증 시스템 리팩토링 히스토리 및 진행 상황입니다.

| 문서 | 설명 |
|------|------|
| [AUTH_REFACTORING_PLAN.md](./auth-refactoring/AUTH_REFACTORING_PLAN.md) | 전체 리팩토링 계획 |
| [AUTH_REFACTORING_STEP_BY_STEP.md](./auth-refactoring/AUTH_REFACTORING_STEP_BY_STEP.md) | 단계별 실행 가이드 |
| [PROGRESS_SUMMARY.md](./auth-refactoring/PROGRESS_SUMMARY.md) | 진행 상황 요약 |
| [SECURITY_REVIEW.md](./auth-refactoring/SECURITY_REVIEW.md) | 보안 검토 |
| [REFACTORING_REVIEW_REPORT.md](./auth-refactoring/REFACTORING_REVIEW_REPORT.md) | 리팩토링 리뷰 보고서 |
| [STEP1_COMPLETED.md](./auth-refactoring/STEP1_COMPLETED.md) | Step 1 완료 기록 |
| [STEP2_COMPLETED.md](./auth-refactoring/STEP2_COMPLETED.md) | Step 2 완료 기록 |
| [STEP3_PLAN.md](./auth-refactoring/STEP3_PLAN.md) | Step 3 계획 |
| [STEP3_PHASE1_COMPLETED.md](./auth-refactoring/STEP3_PHASE1_COMPLETED.md) | Step 3 Phase 1 완료 |
| [STEP3_PHASE2_COMPLETED.md](./auth-refactoring/STEP3_PHASE2_COMPLETED.md) | Step 3 Phase 2 완료 |
| [STEP3_PHASE3_COMPLETED.md](./auth-refactoring/STEP3_PHASE3_COMPLETED.md) | Step 3 Phase 3 완료 |
| [STEP3_COMPLETED.md](./auth-refactoring/STEP3_COMPLETED.md) | Step 3 전체 완료 |
| [STEP4_COMPLETED.md](./auth-refactoring/STEP4_COMPLETED.md) | Step 4 완료 기록 |

---

## 📖 가이드

실전 가이드 및 튜토리얼입니다.

| 문서 | 설명 |
|------|------|
| [testing-hot-notifications.md](./guides/testing-hot-notifications.md) | HOT 알림 테스트 스크립트 사용법 |
| [LOGIN_DEBUG_GUIDE.md](./guides/LOGIN_DEBUG_GUIDE.md) | 로그인 디버깅 가이드 |
| [MLS_PLAYER_MAPPING_SUMMARY.md](./guides/MLS_PLAYER_MAPPING_SUMMARY.md) | MLS 선수 매핑 요약 |
| [API_SPORTS_IMAGE_CACHE.md](./guides/API_SPORTS_IMAGE_CACHE.md) | API Sports 이미지 캐시 가이드 |
| [KAKAO_SETUP.md](./guides/KAKAO_SETUP.md) | 카카오 로그인 설정 가이드 |
| [README-BANNER.md](./guides/README-BANNER.md) | 배너 시스템 가이드 |
| [README-icons-refactoring.md](./guides/README-icons-refactoring.md) | 아이콘 리팩토링 가이드 |
| [README-user-icon.md](./guides/README-user-icon.md) | 사용자 아이콘 가이드 |
| [profile-icon-system.md](./guides/profile-icon-system.md) | 프로필 아이콘 시스템 전체 구조 ✨ NEW |

---

## 📝 개발 노트

개발 중 작성한 메모 및 임시 문서입니다.

| 문서 | 설명 |
|------|------|
| [margin.md](./dev-notes/margin.md) | 마진 관련 개발 메모 |
| [modal.md](./dev-notes/modal.md) | 모달 관련 개발 메모 |
| [package-additions.md](./dev-notes/package-additions.md) | 패키지 추가 내역 |

---

## 🗂️ 기타 프로젝트 문서

- **[CLAUDE.md](../CLAUDE.md)** - 프로젝트 전체 구조 및 개발 가이드 (AI 어시스턴트용)
- **[QUICK_START.md](./QUICK_START.md)** - 프로젝트 빠른 시작 가이드

---

## 📝 문서 작성 규칙

1. **위치**: 모든 문서는 `docs/` 폴더 내에 위치
2. **분류**: 기능별로 하위 폴더 구분 (hot-system, notifications, auth-refactoring 등)
3. **링크**: 상대 경로 사용 (예: `./hot-system/overview.md`)
4. **작성일**: 각 문서 하단에 작성일/업데이트일 명시

---

**문서 작성일**: 2025-12-03
**최종 업데이트**: 2026-01-30
**버전**: 1.7.0
