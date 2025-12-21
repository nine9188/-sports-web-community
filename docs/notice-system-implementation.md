# 공지사항 시스템 구현 완료 보고

## 구현 상태

### ⚠️ Phase 1: 데이터베이스 스키마 (수정 필요)
**파일**: `docs/database/20251218_add_notice_system.sql`
**마이그레이션 이름**: `add_notice_system`

**기존 구현 (2025-12-19 적용됨)**:
- `posts` 테이블에 공지사항 컬럼 추가
  - `is_notice`: 공지 여부 (boolean, default: false)
  - `notice_type`: 공지 타입 ('global' | 'board')
  - `notice_order`: 공지 순서 (integer, default: 0)
  - `notice_created_at`: 공지 설정 시각 (timestamp with time zone)
- 성능 최적화 인덱스 생성
  - `idx_posts_notice`: 전체 공지 조회용
  - `idx_posts_board_notice`: 게시판별 공지 조회용
- 공지사항 전용 게시판 생성 (slug: 'notices')
- 트리거 함수로 자동 타임스탬프 관리

**🔄 추가 필요 (변경된 요구사항)**:
- [ ] `notice_boards` 컬럼 추가 (TEXT[] - 여러 게시판 ID 배열)
- [ ] GIN 인덱스 추가 (배열 검색 최적화)
- [ ] 공지사항 게시판 자동 공지 처리 트리거
- [ ] 공지사항 게시판 운영자 전용 권한 설정 (RLS 정책)

### ⚠️ Phase 2: 타입 정의 (수정 필요)
**파일**: `src/domains/boards/types/post/index.ts`

**기존 타입**:
```typescript
export type NoticeType = 'global' | 'board';

// Post 인터페이스에 추가
is_notice?: boolean;
notice_type?: NoticeType | null;
notice_order?: number | null;
notice_created_at?: string | null;
```

**🔄 추가 필요**:
```typescript
notice_boards?: string[] | null;  // 여러 게시판 ID 배열
```

### ⚠️ Phase 3: Server Actions (수정 필요)

#### 공지사항 조회 액션
**파일**: `src/domains/boards/actions/posts/notices.ts`

**기존 구현**:
- `getNotices(boardId?)`: 전체 공지 + 게시판별 공지 조회
- `getGlobalNotices()`: 전체 공지만 조회
- `getBoardNotices(boardId)`: 특정 게시판 공지만 조회

**🔄 수정 필요**:
- `getNotices()`: `notice_boards` 배열에서 게시판 ID 확인하도록 수정
- `getBoardNotices()`: 배열 검색 쿼리로 변경

#### 공지사항 설정 액션 (관리자)
**파일**: `src/domains/boards/actions/posts/setNotice.ts`

**기존 구현**:
- `setPostAsNotice()`: 게시글을 공지로 설정
- `removeNotice()`: 공지 해제
- `updateNoticeOrder()`: 공지 순서 변경
- `updateNoticeType()`: 공지 타입 변경

**🔄 수정 필요**:
- `setPostAsNotice()`: `boardIds` 배열 파라미터 추가 (다중 선택)
- `updateNoticeBoards()`: 공지 대상 게시판 변경 함수 추가

**보안**: 모든 함수에 관리자 권한 체크 포함

### ✅ Phase 4: UI 컴포넌트

#### 공지사항 컴포넌트
**디렉토리**: `src/domains/boards/components/notice/`

1. **NoticeBadge.tsx**
   - 전체공지: 빨간색 배지
   - 게시판공지: 파란색 배지

2. **NoticeItem.tsx**
   - 공지 배지, 제목, 게시판명, 작성자, 작성일, 조회수 표시
   - 클릭 시 게시글로 이동

3. **NoticeList.tsx**
   - 공지사항 목록 컴포넌트
   - 빈 상태 처리

### ✅ Phase 5: 게시판 페이지 통합

#### 수정된 파일
**파일**: `src/app/boards/[slug]/page.tsx`

- `getNotices()` 호출 추가
- BoardDetailLayout에 `notices` prop 전달

**파일**: `src/domains/boards/components/layout/BoardDetailLayout.tsx`

- `notices` prop 추가
- BoardInfo 컴포넌트 바로 아래에 NoticeList 렌더링
- 공지사항 → 인기 게시글 → 일반 게시글 순서로 배치

### ⚠️ Phase 6: 관리자 페이지 (수정 필요)

#### 관리자 공지 관리 페이지
**디렉토리**: `src/app/admin/notices/`

1. **page.tsx**: 관리자 페이지 레이아웃
2. **NoticeManagement.tsx**: 공지 관리 UI

**기존 기능**:
   - 게시글 ID로 공지 설정
   - 공지 타입 선택 (전체/게시판)
   - 공지 순서 설정
   - 현재 공지 목록 표시
   - 공지 타입 변경
   - 공지 해제

**🔄 추가/수정 필요**:
   - [ ] **게시판 다중 선택 UI**
     - 전체 공지: 라디오 버튼
     - 특정 게시판 공지: 체크박스 (다중 선택)
       - [x] 자유게시판
       - [x] 공략게시판
       - [ ] 질문게시판
   - [ ] 선택된 게시판 ID 배열을 `setPostAsNotice()`에 전달

**접근 경로**: `/admin/notices`

## 주요 기능

### 1. 공지사항 게시판 (slug: 'notices') 특별 규칙
- **운영자 전용 게시판**
  - 일반 유저: 읽기만 가능
  - 운영자만: 글 작성 가능
- **자동 공지 처리**
  - 공지사항 게시판에 작성된 모든 글은 자동으로 `is_notice = true` 설정 (트리거)
  - 작성 시 공지 타입과 대상 게시판 선택 필수

### 2. 공지사항 노출 규칙

#### 일반 게시판
```
전체 공지 (notice_type = 'global')
+ 해당 게시판 공지 (notice_type = 'board' AND 게시판 ID가 notice_boards 배열에 포함)
```

#### 공지 게시판 (/boards/notices)
```
모든 전체 공지 (notice_type = 'global')
+ 모든 게시판 공지 (notice_type = 'board')
```

### 3. 공지 순서
- `notice_order` 값이 낮을수록 먼저 표시
- 같은 순서일 경우 `created_at` 기준 최신순

### 4. 관리자 기능
- ✅ 게시글을 공지로 설정/해제
- ✅ 전체 공지 ↔ 게시판 공지 변경
- 🔄 **게시판 다중 선택** (특정 게시판 공지인 경우)
  - 여러 게시판에 동시에 공지 노출 가능
  - 예: 자유게시판 + 공략게시판 + 질문게시판
- ✅ 공지 순서 관리
- ✅ 현재 공지 목록 확인

## 파일 구조

```
src/
├── domains/boards/
│   ├── actions/posts/
│   │   ├── notices.ts          # 공지 조회 액션
│   │   ├── setNotice.ts        # 공지 설정 액션
│   │   └── index.ts            # 액션 export
│   ├── components/
│   │   ├── notice/
│   │   │   ├── NoticeBadge.tsx
│   │   │   ├── NoticeItem.tsx
│   │   │   ├── NoticeList.tsx
│   │   │   └── index.ts
│   │   └── layout/
│   │       └── BoardDetailLayout.tsx  # 공지 통합
│   └── types/post/
│       └── index.ts            # NoticeType 정의
└── app/
    ├── boards/[slug]/
    │   └── page.tsx            # 공지 데이터 fetch
    └── admin/notices/
        ├── page.tsx            # 관리자 페이지
        └── NoticeManagement.tsx

docs/
└── database/
    └── 20251218_add_notice_system.sql  # DB 마이그레이션
```

## 변경된 요구사항 반영 필요

### 🔄 Phase 1: 데이터베이스 마이그레이션 수정
**새로운 마이그레이션 파일**: `docs/database/20251219_update_notice_system_multi_boards.sql`

**추가할 내용**:
1. `notice_boards` 컬럼 추가 (TEXT[] 배열)
2. GIN 인덱스 생성 (배열 검색 최적화)
3. 공지사항 게시판 자동 공지 처리 트리거
4. 공지사항 게시판 운영자 전용 RLS 정책

### 🔄 Phase 2-6: 코드 수정
1. **타입 정의 수정**: `notice_boards` 필드 추가
2. **Server Actions 수정**:
   - `getNotices()`: 배열 검색 쿼리로 변경
   - `setPostAsNotice()`: `boardIds` 배열 파라미터 추가
   - `updateNoticeBoards()`: 새로운 함수 추가
3. **관리자 UI 수정**:
   - 게시판 다중 선택 체크박스 추가
   - 선택된 게시판 배열 처리

### 테스트 시나리오 (수정 후)

#### 1. 공지사항 게시판 권한 테스트
- [ ] 일반 유저로 로그인 → 공지사항 게시판 글 작성 시도 → 거부 확인
- [ ] 운영자로 로그인 → 공지사항 게시판 글 작성 → 성공 확인
- [ ] 작성한 글이 자동으로 공지 처리되었는지 확인

#### 2. 다중 게시판 공지 설정 테스트
- [ ] 관리자로 로그인
- [ ] `/admin/notices` 접속
- [ ] 게시글 ID 입력
- [ ] "특정 게시판 공지" 선택
- [ ] 여러 게시판 체크박스 선택 (예: 자유게시판 + 공략게시판)
- [ ] 공지로 설정
- [ ] 선택한 모든 게시판에서 공지 노출 확인

#### 3. 공지 노출 테스트
- [ ] 자유게시판 접속 → 전체 공지 + 자유게시판 공지 표시 확인
- [ ] 공략게시판 접속 → 전체 공지 + 공략게시판 공지 표시 확인
- [ ] 질문게시판 접속 → 전체 공지만 표시 확인 (게시판 공지 미선택 시)

#### 4. 공지 게시판 테스트
- [ ] `/boards/notices` 접속
- [ ] 모든 공지사항 표시 확인 (전체 + 모든 게시판 공지)

### 추가 개선 사항 (선택)

- [ ] 공지사항 드래그 앤 드롭 순서 변경
- [ ] 공지사항 게시 기간 설정 (시작일/종료일)
- [ ] 공지사항 미리보기
- [ ] 공지사항 검색 기능
- [ ] 공지사항 일괄 관리
- [ ] 공지사항 통계 (조회수, 클릭률)

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Supabase)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks

## 보안 고려사항

- ✅ 관리자 권한 체크 (`checkAdminPermission`)
- ✅ SQL Injection 방지 (Supabase ORM)
- ✅ XSS 방지 (React 자동 이스케이핑)
- ✅ CSRF 방지 (Server Actions)

## 성능 최적화

- ✅ 데이터베이스 인덱스 최적화
- ✅ 컴포넌트 메모이제이션 (`memo`)
- ✅ 서버 사이드 데이터 페칭
- ✅ 조건부 렌더링

## 문의 및 지원

- 구현 문서: `docs/notice-system-plan.md`
- 이슈 발생 시: GitHub Issues
- 추가 기능 요청: Feature Request

---

**초기 구현 완료일**: 2025-12-18
**초기 DB 마이그레이션 적용일**: 2025-12-19
**요구사항 변경일**: 2025-12-19
**현재 상태**: 🔄 변경된 요구사항 반영 필요
**구현자**: Claude Code Agent
**버전**: 1.1.0 (다중 게시판 선택 지원)

---

## 📋 최종 요구사항 정리 (2025-12-19 업데이트)

### 1. `/notice` 게시판 (공지 전용 게시판)
**특징**:
- ✅ 이 게시판에 작성된 **모든 글은 자동으로 공지**가 됨
- ✅ 관리자만 글 작성 가능 (일반 유저는 읽기만 가능)
- ✅ 모든 공지사항을 한 곳에서 볼 수 있는 전용 게시판

**목적**:
- 전체 공지 및 각 게시판 공지를 통합 관리
- 사용자가 모든 공지를 한 곳에서 확인 가능

---

### 2. 각 일반 게시판에서 공지 작성
**작성 방법**:
- ✅ 관리자가 글 작성 시 **"공지로 등록" 체크박스** 선택
- ✅ 체크 시: 해당 글이 공지로 설정됨
- ❌ 미체크 시: 일반 게시글로 작성됨

**표시 위치** (중요):
1. **해당 게시판 상단에 고정 표시**
   - 예: `/boards/free` 게시판에서 공지로 작성 → 자유게시판 상단에 표시

2. **`/notice` 게시판에도 함께 표시**
   - 모든 게시판의 공지가 `/notice` 게시판에 통합 표시됨
   - 사용자가 모든 공지를 한 곳에서 확인 가능

**예시**:
```
[자유게시판에서 공지 작성]
→ 자유게시판 상단 표시 ✅
→ /notice 게시판 표시 ✅

[공략게시판에서 공지 작성]
→ 공략게시판 상단 표시 ✅
→ /notice 게시판 표시 ✅

[/notice 게시판에서 직접 작성]
→ /notice 게시판 표시 ✅
→ 전체 공지 or 지정한 게시판들에 표시 ✅
```

---

### 3. 글 작성 폼 수정 (관리자 전용)
**필요한 기능**:
- ✅ **"공지로 등록" 체크박스** 추가
  - 체크 시: 공지 설정 옵션 표시
  - 미체크 시: 일반 게시글로 작성

**공지 설정 옵션** (체크박스 선택 시 표시):
- 공지 타입 선택:
  - [ ] 전체 공지 (모든 게시판에 표시)
  - [ ] 특정 게시판 공지 (선택한 게시판에만 표시)
- 공지 순서 입력 (낮은 숫자가 먼저 표시)

**구현 위치**:
- `src/app/boards/[slug]/create/page.tsx` (글 작성 페이지)
- `src/app/boards/[slug]/[postNumber]/edit/page.tsx` (글 수정 페이지)

---

### 4. 관리자 공지 관리 페이지 (`/admin/notices`)
**역할**:
- 게시판 상단(info 영역)에 **고정 표시되는 공지를 관리**하는 페이지
- 기존 게시글을 공지로 설정/해제

**주요 기능**:
1. ✅ 게시글 ID로 공지 설정
2. ✅ 공지 타입 선택 (전체 공지 / 게시판별 공지)
3. ✅ 여러 게시판 동시 선택 가능 (다중 선택)
4. ✅ 공지 순서 조정
5. ✅ 공지 해제
6. ✅ 현재 공지 목록 표시

**접근 경로**: `/admin/notices`

---

### 5. 구현 순서 및 체크리스트

#### Phase 1: 데이터베이스 및 백엔드
- [ ] `/notice` 슬러그 게시판 생성
- [ ] 자동 공지 처리 트리거 추가
- [ ] RLS 정책 설정 (관리자만 작성 가능)
- [ ] Server Actions 수정:
  - [ ] 공지 조회 시 `/notice` 게시판 필터링 로직 추가
  - [ ] 공지 작성 시 자동 설정 로직 추가

#### Phase 2: 글 작성 폼 UI
- [ ] "공지로 등록" 체크박스 추가
- [ ] 공지 타입 선택 라디오 버튼 추가
- [ ] 게시판 다중 선택 체크박스 추가
- [ ] 공지 순서 입력 필드 추가
- [ ] 폼 제출 시 공지 데이터 포함하여 전송

#### Phase 3: 공지 표시 로직
- [ ] 각 게시판: 해당 게시판 공지 + 전체 공지 표시
- [ ] `/notice` 게시판: 모든 공지 표시
- [ ] 공지 순서대로 정렬

#### Phase 4: 관리자 페이지
- [ ] 기존 공지 관리 기능 유지
- [ ] UI/UX 개선

---

### 6. 공지 표시 규칙 (최종)

#### 일반 게시판 (예: `/boards/free`)
```sql
WHERE (
  notice_type = 'global'  -- 전체 공지
  OR
  (notice_type = 'board' AND 'free' = ANY(notice_boards))  -- 자유게시판 공지
)
ORDER BY notice_order ASC, created_at DESC
```

#### `/notice` 공지 게시판
```sql
WHERE is_notice = true  -- 모든 공지
ORDER BY notice_order ASC, created_at DESC
```

#### `/notice` 게시판 자동 공지 처리
- 이 게시판에 작성된 모든 글은 자동으로 `is_notice = true`
- 트리거로 구현

---

### 7. 사용자 시나리오

#### 시나리오 1: 관리자가 자유게시판에서 공지 작성
1. `/boards/free/create` 접속
2. 글 작성
3. **"공지로 등록" 체크**
4. "특정 게시판 공지" 선택 → 자유게시판 선택
5. 제출
6. **결과**:
   - 자유게시판 상단에 공지 표시 ✅
   - `/notice` 게시판에도 표시 ✅

#### 시나리오 2: 관리자가 `/notice` 게시판에서 전체 공지 작성
1. `/boards/notice/create` 접속
2. 글 작성 (자동으로 공지 설정됨)
3. "전체 공지" 선택
4. 제출
5. **결과**:
   - 모든 게시판 상단에 공지 표시 ✅
   - `/notice` 게시판에도 표시 ✅

#### 시나리오 3: 일반 유저가 공지 확인
1. `/notice` 게시판 접속
2. 모든 공지사항을 한 곳에서 확인 ✅
3. 각 게시판 접속 시 해당 게시판 공지도 상단에 표시 ✅

---

### 8. 주요 차이점 정리

| 항목 | 기존 방식 | 새로운 요구사항 |
|------|-----------|----------------|
| 공지 작성 | 관리자 페이지에서만 설정 | 글 작성 시 체크박스로 설정 가능 |
| `/notice` 게시판 | 없음 | 모든 공지 통합 표시 게시판 추가 |
| 공지 표시 위치 | 해당 게시판만 | 해당 게시판 + `/notice` 게시판 |
| 공지 설정 방식 | 사후 설정 (관리자 페이지) | 작성 시 설정 + 사후 설정 둘 다 가능 |

---

**최종 업데이트**: 2025-12-19
**버전**: 2.0.0 (공지 게시판 추가 및 작성 폼 통합)
