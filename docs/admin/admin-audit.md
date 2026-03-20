# Admin 페이지 감사 보고서

> 작성일: 2026-03-20
> 상태: 일부 수정 완료, 나머지 진행 중

---

## 수정 완료 항목

### 보안

- [x] `admin/layout.tsx`에 `serverAuthGuard({ requireAdmin: true })` 추가 → 전체 16개 페이지 보호
- [x] `admin/actions/boards.ts` 모든 함수에 admin 권한 체크 추가 (RLS + 서버 이중 보호)
- [x] 테스트 페이지 삭제 (`test-kleague/`, `test-teams/`)
- [x] UI 테스트 페이지 삭제 (`/ui/`, `/test/`)

---

## 추가 수정 완료 항목

### HIGH
- [x] SuspensionManager `alert()` 7곳 → `toast` 교체
- [x] 사용자 관리: 관리자 권한 토글/이메일 인증에 `confirm()` 확인 다이얼로그 추가
- [x] notifications 페이지: `getSupabaseBrowser()` 제거 → `useAuth()` 사용
- [x] shop 페이지: 중복 `serverAuthGuard` 제거 (layout에서 처리)
- [x] emoticon-submissions 페이지: 중복 `serverAuthGuard` 제거 (layout에서 처리)

### MEDIUM
- [x] null/undefined 체크 보강 (users, exp, reports — `?.trim() || '이름 없음'` 패턴)
- [x] 매직 넘버 상수화 → `src/domains/admin/constants.ts` 생성 (DEFAULT_SUSPENSION_DAYS, NOTIFICATION_LOG_LIMIT 등)
- [x] Query Key 팩토리 통일 → `useAdminEmoticonSubmissions`가 `adminKeys` 사용하도록 변경

### LOW
- [x] JSDoc 추가: `createBoardStructure()` 재귀 알고리즘, `changeOrder()` 순서 변경 로직
- [x] 전체 admin `alert()` → `toast` 교체 (추가 4개 파일, 28곳)
  - `SubmissionDetailModal.tsx` (2곳)
  - `board-collection/page.tsx` (3곳)
  - `ShopItemManagement.tsx` (11곳)
  - `NoticeManagement.tsx` (12곳)

---

## 미수정 항목 (남은 개선사항)

### ~~HIGH~~ → 전부 완료

#### ~~1. SuspensionManager에서 `alert()` 사용~~ → 완료
- **파일**: `src/domains/admin/components/SuspensionManager.tsx`
- **문제**: `alert()`가 7곳에서 사용됨. 프로젝트 전체는 `react-toastify`를 사용하는데 여기만 `alert()`
- **수정**: 모든 `alert()` → `toast.error()` 또는 `toast.success()`로 교체

#### 2. 파괴적 작업에 확인 다이얼로그 없음
- **파일**: `src/app/admin/users/page.tsx`
- **문제**:
  - 관리자 권한 토글 시 확인 없이 바로 실행
  - 이메일 인증 확인 시 확인 없이 바로 실행
- **수정**: `confirm()` 또는 커스텀 확인 모달 추가

#### 3. notifications 페이지에서 `getSupabaseBrowser()` 직접 사용
- **파일**: `src/app/admin/notifications/page.tsx` (line 41)
- **문제**: 서버 액션 대신 클라이언트 Supabase로 `auth.getUser()` 호출
- **수정**: 서버 액션으로 전환 (이전 작업에서 다른 파일은 전환 완료했지만 이 파일은 누락)

#### 4. 폼 입력값 검증 부족
- **파일**:
  - `src/domains/admin/components/boards/BoardForm.tsx` — slug 실시간 피드백 없음
  - `src/app/admin/notifications/page.tsx` — 제목/내용 서버 검증 없음
- **수정**: 클라이언트 + 서버 양쪽 검증 추가

#### 5. 에러 처리 패턴 불일치
- **현황**: `alert()`, `toast`, `confirm()`, 무응답이 혼용됨
- **기준**: 전체 `react-toastify`로 통일
  - 성공 → `toast.success()`
  - 실패 → `toast.error()`
  - 확인 필요 → 커스텀 확인 모달 또는 `confirm()`

---

### MEDIUM — 시간 있을 때 개선

#### 6. 빈 상태(Empty State) 안내 부족
- **문제**: 데이터 없을 때 "없습니다"만 표시, 다음 행동 안내 없음
- **대상**: 사용자 목록, 로그, 신고 관리 등
- **수정**: "아직 데이터가 없습니다. [행동 유도]" 형태로 개선

#### 7. 스켈레톤 로더 없음
- **문제**: 테이블 데이터 로딩 시 전체 스피너만 표시
- **대상**: 사용자 목록, 게시판 관리, 로그 뷰어
- **수정**: 테이블 형태의 스켈레톤 로더 추가

#### 8. 뮤테이션 상태 추적 방식 불일치
- **현황**:
  - `users/page.tsx`: `processingIds` 배열로 개별 추적
  - `prediction/page.tsx`: `useTransition`의 `isPending`
  - `boards/page.tsx`: React Query `mutation.isPending`
- **권장**: React Query의 `isPending`으로 통일

#### 9. null/undefined 체크 누락
- **대상**:
  - `users/page.tsx`: `nickname`이 빈 문자열일 수 있음
  - `reports/page.tsx`: `report.target_info?.author` 누락 가능
  - `exp/page.tsx`: `user.nickname || '이름 없음'` — 빈 문자열 처리 안 됨
- **수정**: `nickname?.trim() || '이름 없음'` 형태로 보강

#### 10. 다크모드 누락
- **대상**: 삭제된 테스트 페이지 외에도 일부 admin 컴포넌트에서 `dark:` 프리픽스 누락
- **수정**: 전체 admin 컴포넌트 다크모드 점검

---

### LOW — 코드 품질 개선

#### 11. 매직 넘버 상수화
```typescript
// 현재
const DEFAULT_SUSPENSION_DAYS = 7;  // SuspensionManager에 하드코딩
const PAGE_LIMIT = 20;              // notification에 하드코딩
const LOG_LIMIT = 50;               // LogViewer에 하드코딩

// 개선: 상수 파일로 분리
// src/domains/admin/constants.ts
```

#### 12. shop 페이지 중복 가드 제거
- **파일**: `src/app/admin/shop/page.tsx`
- **문제**: layout.tsx에서 이미 `serverAuthGuard`로 체크하는데 page에서도 중복 체크
- **수정**: page에서 가드 제거 (layout이 이미 보호)

#### 13. emoticon-submissions 페이지 중복 가드 제거
- **파일**: `src/app/admin/emoticon-submissions/page.tsx`
- **문제**: 위와 동일
- **수정**: page에서 가드 제거

#### 14. Query Key 팩토리 불일치
- **파일**: `src/domains/admin/hooks/useAdminEmoticonSubmissions.ts`
- **문제**: 자체 `submissionKeys` 정의 → `shared/constants/queryKeys.ts`의 `adminKeys` 사용해야 함
- **수정**: `adminKeys`에 submission 키 추가 후 통일

#### 15. console.error에 민감 정보
- **문제**: 프로덕션에서 에러 상세가 콘솔에 노출
- **대상**: prediction, exp, reports 등 다수
- **수정**: 프로덕션에서는 상세 에러 로깅을 서버 로그로 전환

#### 16. 모달 구현 불일치
- **현황**:
  - `users/page.tsx`: raw `<div>` 오버레이
  - `reports/page.tsx`: `SuspensionModal` 컴포넌트
  - `notifications/page.tsx`: 조건부 렌더링
- **수정**: 공통 모달 컴포넌트(이미 `shared/components/ui/dialog.tsx` 있음)로 통일

#### 17. JSDoc 부재
- **대상**:
  - `useAdminBoards.ts`의 `createBoardStructure()` — 재귀 구조 생성
  - `boards/page.tsx`의 `changeOrder()` — 복잡한 순서 변경 로직
- **수정**: 복잡한 함수에 알고리즘 설명 추가

---

## Admin 페이지 전체 현황

| 페이지 | 서버 가드 | 서버 액션 | 에러 처리 | 상태 |
|--------|----------|----------|----------|------|
| Dashboard | ✅ layout | ✅ | toast | 양호 |
| Users | ✅ layout | ✅ | toast | 확인 다이얼로그 필요 |
| Boards | ✅ layout | ✅ checkAdmin | toast | 양호 |
| Shop | ✅ layout (+ 중복) | ✅ | toast | 중복 가드 제거 필요 |
| Points | ✅ layout | ✅ | toast | 양호 |
| Exp | ✅ layout | ✅ | toast | 양호 |
| Reports | ✅ layout | ✅ | toast | 양호 |
| Notifications | ✅ layout | ⚠️ 클라이언트 Supabase | toast | 서버 액션 전환 필요 |
| Logs | ✅ layout | ✅ | toast | 양호 |
| Prediction | ✅ layout | ✅ | toast | 양호 |
| Notices | ✅ layout | ✅ | 미확인 | 점검 필요 |
| Emoticon | ✅ layout (+ 중복) | ✅ | toast | 중복 가드 제거 필요 |
| Site Management (3개) | ✅ layout | ✅ | 미확인 | 점검 필요 |
| Widgets | ✅ layout | ✅ | alert | toast로 교체 필요 |
| ~~test-kleague~~ | 삭제됨 | - | - | - |
| ~~test-teams~~ | 삭제됨 | - | - | - |

---

## 수정 우선순위

### 즉시 (부작용 없는 것)
1. SuspensionManager `alert()` → `toast` 교체
2. shop/emoticon 페이지 중복 가드 제거
3. notifications 페이지 `getSupabaseBrowser()` → 서버 액션

### 이번 주
4. 파괴적 작업 확인 다이얼로그 추가
5. 에러 처리 패턴 통일

### 다음 주
6. 빈 상태/스켈레톤 로더 개선
7. null 체크 보강
8. Query Key 통일
