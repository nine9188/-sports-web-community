# 공지사항 시스템 구현 계획

## 개요
관리자가 게시글을 공지로 설정하고, 전체 공지와 게시판별 공지를 구분하여 노출하는 시스템

## 요구사항

### 1. 공지사항 타입
- **전체 공지 (Global Notice)**: 모든 게시판에 표시
- **게시판별 공지 (Board Notice)**: 선택한 여러 게시판에 표시 (다중 선택 가능)

### 2. 공지사항 게시판 (slug: 'notices') 권한
- **운영자(관리자) 전용 게시판**
  - 일반 유저: 읽기만 가능
  - 운영자만: 글 작성 가능
- **자동 공지 처리**
  - 공지사항 게시판에 작성된 모든 글은 자동으로 `is_notice = true` 설정
  - 작성 시 공지 타입과 대상 게시판 선택 필수

### 3. 노출 규칙

#### 공지 게시판 (Notice Board: /boards/notices)
- 전체 공지 전체 목록
- 모든 게시판별 공지 목록
- 모든 공지사항을 한 곳에서 관리/조회

#### 일반 게시판 (Regular Boards)
- 전체 공지 (notice_type = 'global')
- 해당 게시판 공지 (notice_type = 'board' AND 게시판 ID가 notice_boards 배열에 포함)
- 예: "프리미어리그" 게시판 = 전체공지 + 프리미어리그 공지

#### 공지 노출 위치
- 게시판 헤더 정보(Board Info) 바로 아래
- 일반 게시글 목록 위에 고정 표시

### 4. 관리자 기능
- [ ] 게시글을 공지로 설정/해제
- [ ] 공지 타입 선택 (전체/게시판)
- [ ] **게시판 다중 선택** (특정 게시판 공지인 경우)
  - 체크박스로 여러 게시판 동시 선택 가능
  - 예: 자유게시판 + 공략게시판 + 질문게시판 동시 공지
- [ ] 공지 순서 관리 (선택적)
- [ ] 공지 게시판 운영자 전용 설정

## 구현 계획

### Phase 1: 데이터베이스 스키마 수정

#### 1.1 posts 테이블 컬럼 추가
```sql
ALTER TABLE posts
ADD COLUMN is_notice BOOLEAN DEFAULT false,
ADD COLUMN notice_type TEXT CHECK (notice_type IN ('global', 'board')),
ADD COLUMN notice_boards TEXT[],  -- 🆕 여러 게시판 ID 배열 (다중 선택)
ADD COLUMN notice_order INTEGER DEFAULT 0,
ADD COLUMN notice_created_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_posts_notice ON posts(is_notice, notice_type, notice_order)
WHERE is_notice = true;

-- GIN 인덱스로 배열 검색 최적화
CREATE INDEX idx_posts_notice_boards ON posts USING GIN(notice_boards)
WHERE is_notice = true AND notice_type = 'board';
```

#### 1.2 공지 게시판 생성 및 권한 설정
```sql
-- 공지사항 전용 게시판
INSERT INTO boards (name, slug, description, type, is_active)
VALUES (
  '공지사항',
  'notices',
  '전체 공지사항과 게시판별 공지를 확인할 수 있습니다',
  'notice',
  true
);

-- 공지사항 게시판 자동 공지 처리 트리거
CREATE OR REPLACE FUNCTION auto_set_notice_for_notice_board()
RETURNS TRIGGER AS $$
BEGIN
  -- 공지사항 게시판(slug='notices')에 작성된 글은 자동으로 공지 처리
  IF EXISTS (
    SELECT 1 FROM boards
    WHERE id = NEW.board_id AND slug = 'notices'
  ) THEN
    NEW.is_notice := true;
    NEW.notice_created_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_notice_for_notice_board
BEFORE INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION auto_set_notice_for_notice_board();
```

### Phase 2: 타입 정의

#### 2.1 공지사항 타입 추가
파일: `src/domains/boards/types/post/index.ts`

```typescript
export type NoticeType = 'global' | 'board';

export interface NoticeMetadata {
  is_notice: boolean;
  notice_type: NoticeType | null;
  notice_boards: string[] | null;  // 🆕 여러 게시판 ID 배열
  notice_order: number | null;
  notice_created_at: string | null;
}

// Post 타입에 NoticeMetadata 추가
export interface Post extends NoticeMetadata {
  // ... 기존 필드들
}
```

### Phase 3: Server Actions 구현

#### 3.1 공지사항 조회 액션
파일: `src/domains/boards/actions/posts/notices.ts`

```typescript
'use server';

export async function getNotices(boardId?: string) {
  // boardId가 없으면: 모든 공지 조회 (공지 게시판용)
  // boardId가 있으면:
  //   1. 전체공지 (notice_type = 'global')
  //   2. 해당 게시판 공지 (notice_type = 'board' AND boardId IN notice_boards)
}

export async function getGlobalNotices() {
  // 전체 공지만 조회 (notice_type = 'global')
}

export async function getBoardNotices(boardId: string) {
  // 특정 게시판 공지만 조회
  // notice_type = 'board' AND boardId IN notice_boards
}
```

#### 3.2 공지사항 설정 액션 (관리자)
파일: `src/domains/boards/actions/posts/setNotice.ts`

```typescript
'use server';

export async function setPostAsNotice(
  postId: number,
  noticeType: 'global' | 'board',
  boardIds?: string[],  // 🆕 여러 게시판 ID 배열 (다중 선택)
  noticeOrder?: number
) {
  // 관리자 권한 확인
  // noticeType이 'board'인 경우 boardIds 필수
  // 게시글을 공지로 설정
}

export async function removeNotice(postId: number) {
  // 공지 해제
}

export async function updateNoticeOrder(postId: number, newOrder: number) {
  // 공지 순서 변경
}

export async function updateNoticeBoards(
  postId: number,
  boardIds: string[]
) {
  // 🆕 공지 대상 게시판 변경
}
```

### Phase 4: UI 컴포넌트 구현

#### 4.1 공지사항 목록 컴포넌트
파일: `src/domains/boards/components/notice/NoticeList.tsx`

```typescript
// 공지사항 목록 (핀 고정된 형태로 표시)
// - 전체 공지 배지 표시
// - 게시판 공지 배지 표시
// - 공지 순서에 따라 정렬
```

#### 4.2 공지사항 배지 컴포넌트
파일: `src/domains/boards/components/notice/NoticeBadge.tsx`

```typescript
// "전체공지" 또는 "공지" 배지
```

#### 4.3 관리자 공지 설정 UI
파일: `src/app/admin/notices/NoticeManagement.tsx`

```typescript
// 관리자 전용: 공지 설정 폼
// - 공지로 설정
// - 공지 타입 선택 (전체/게시판)
//   [ ] 전체 공지 (global)
//   [ ] 특정 게시판 공지 (board)
//     - 🆕 게시판 다중 선택 체크박스
//       [x] 자유게시판
//       [x] 공략게시판
//       [ ] 질문게시판
// - 공지 순서 설정
```

### Phase 5: 게시판 목록 페이지 통합

#### 5.1 게시판 페이지 수정
파일: `src/app/boards/[slug]/page.tsx`

```typescript
// 1. 공지사항 조회 (전체 + 해당 게시판)
// 2. NoticeList 컴포넌트 추가 (BoardInfo 아래)
// 3. 일반 게시글 목록 표시
```

#### 5.2 공지 게시판 페이지
파일: `src/app/boards/notices/page.tsx`

```typescript
// 모든 공지사항 조회 및 표시
```

### Phase 6: 관리자 페이지 통합

#### 6.1 관리자 공지 관리 페이지
파일: `src/app/admin/notices/page.tsx`

```typescript
// - 모든 공지 목록
// - 공지 설정/해제
// - 공지 순서 관리 (드래그 앤 드롭)
```

## 구현 순서

1. ✅ **계획 문서 작성** (현재)
2. [ ] **데이터베이스 마이그레이션** (Phase 1)
3. [ ] **타입 정의** (Phase 2)
4. [ ] **Server Actions 구현** (Phase 3)
5. [ ] **UI 컴포넌트 구현** (Phase 4)
6. [ ] **게시판 페이지 통합** (Phase 5)
7. [ ] **관리자 페이지 구현** (Phase 6)
8. [ ] **테스트 및 검증**

## 기술 스택
- Next.js 15 (App Router)
- Server Actions
- Supabase (PostgreSQL)
- TypeScript

## 예상 파일 구조

```
src/domains/boards/
├── actions/
│   └── posts/
│       ├── notices.ts          (공지 조회)
│       └── setNotice.ts        (공지 설정 - 관리자)
├── components/
│   ├── notice/
│   │   ├── NoticeList.tsx      (공지 목록)
│   │   ├── NoticeBadge.tsx     (공지 배지)
│   │   └── NoticeItem.tsx      (공지 항목)
│   └── post/
│       └── NoticeSettings.tsx  (관리자 공지 설정 UI)
└── types/
    └── notice.ts               (공지 타입 정의)

src/app/
├── boards/
│   ├── [slug]/page.tsx         (게시판 - 공지 통합)
│   └── notices/page.tsx        (공지 게시판)
└── admin/
    └── notices/page.tsx        (관리자 공지 관리)
```

## 주의사항
- 관리자 권한 체크 필수
- 공지 순서는 낮은 숫자가 먼저 표시
- **공지 게시판(slug='notices')은 운영자만 글 작성 가능**
- **공지 게시판에 작성된 글은 자동으로 공지 처리** (트리거 사용)
- 공지로 설정된 게시글은 작성자 정보 유지
- 공지 해제 시 일반 게시글로 전환
- 게시판별 공지는 여러 게시판에 동시 노출 가능 (다중 선택)

## UI/UX 고려사항
- 공지는 시각적으로 구분 (배경색, 아이콘 등)
- 전체 공지와 게시판 공지 배지 색상 구분
- 모바일에서도 공지가 명확히 보이도록
- 공지 개수가 많을 경우 페이지네이션 또는 접기 기능

## 다음 단계
Phase 1 데이터베이스 마이그레이션부터 시작합니다.
