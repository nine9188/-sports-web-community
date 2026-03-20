# 이모티콘 스튜디오 시스템 계획

## 개요

유저가 이모티콘 팩을 직접 제작하여 신청서를 제출하면, 관리자가 검토 후 승인/거절하는 시스템.
승인 시 서버 액션을 통해 `shop_items` + `emoticon_packs`에 자동 등록된다.

> **핵심 원칙**
> - DB 트리거 사용 금지
> - DB 직접 조작 금지 — 모든 데이터 조작은 서버 액션(`'use server'`)을 통해 수행
> - 상태 관리는 React Query 사용

---

## 1. DB 스키마

### emoticon_submissions (신청서 테이블)

```sql
CREATE TABLE IF NOT EXISTS emoticon_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 팩 정보
  pack_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT[],

  -- 이미지
  thumbnail_path TEXT NOT NULL,
  emoticon_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  emoticon_count INTEGER NOT NULL DEFAULT 0,

  -- 가격
  requested_price INTEGER DEFAULT 0,

  -- 상태
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  reject_reason TEXT,
  suspend_reason TEXT,

  -- 승인 후 연결
  approved_pack_id TEXT,
  approved_shop_item_id INTEGER,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_emoticon_submissions_user_id ON emoticon_submissions(user_id);
CREATE INDEX idx_emoticon_submissions_status ON emoticon_submissions(status);
```

### 컬럼 설명

| 컬럼 | 설명 |
|------|------|
| `pack_name` | 팩 이름 (유저 입력, 중복 체크) |
| `description` | 팩 설명 (100자 이내) |
| `category` | 카테고리 (general, sports, meme, animal 등) |
| `tags` | 검색 태그 배열 (최대 5개) |
| `thumbnail_path` | Storage 경로 (대표 이미지) |
| `emoticon_paths` | Storage 경로 배열 (개별 이모티콘 이미지) |
| `emoticon_count` | 이모티콘 개수 (8~30개) |
| `requested_price` | 희망 판매가 (0=무료, 100~500P) |
| `status` | pending / approved / rejected / suspended |
| `reject_reason` | 거절 시 사유 |
| `suspend_reason` | 판매중지 사유 |
| `approved_pack_id` | 승인 후 생성된 pack_id |
| `approved_shop_item_id` | 승인 후 생성된 shop_item_id |

---

## 2. Storage

### 버킷: `emoticon-submissions`

```
emoticon-submissions/
├── {user_id}/
│   ├── {submission_id}/
│   │   ├── thumbnail.png       (대표 이미지, 200x200)
│   │   ├── emoticon_1.png      (이모티콘 1)
│   │   ├── emoticon_2.png      (이모티콘 2)
│   │   └── ...
```

- **업로드 제한**: PNG/JPG, 최대 200x200px, 파일당 500KB
- **RLS**: 본인 폴더만 업로드 가능, 읽기는 public
- **승인 후**: Storage URL을 그대로 `emoticon_packs.url`에 저장 (별도 복사 불필요)

---

## 3. 유저 페이지: 이모티콘 스튜디오

### 3-1. URL 구조

단일 페이지 + 쿼리 파라미터 탭 방식:

```
/shop/emoticon-studio              → 등록 신청 탭 (기본)
/shop/emoticon-studio?tab=my       → 내 이모티콘 탭
/shop/emoticon-studio?tab=reports  → 신고·중지 내역 탭
/shop/emoticon-studio?tab=guide    → 가이드 탭
```

### 3-2. 탭 네비게이션

Container 안에 카테고리 필터와 동일한 스타일로 탭 배치:

```
┌─────────────────────────────────────────────────┐
│ [ 등록 신청 ] [ 내 이모티콘 ] [ 신고·중지 ] [ 가이드 ] │
└─────────────────────────────────────────────────┘
```

| 탭 | 쿼리 | 내용 |
|---|---|---|
| 등록 신청 | (기본) | 이모티콘 팩 신청 폼 |
| 내 이모티콘 | `?tab=my` | 내 신청 목록 (검토중/승인/거절) + 승인된 팩 판매 현황 |
| 신고·중지 | `?tab=reports` | 판매중지된 팩, 신고 이력 |
| 가이드 | `?tab=guide` | 이용방법 + 제작 가이드 (아코디언) |

### 3-3. 등록 신청 탭

```
┌─────────────────────────────────────────────┐
│ 팩 이름: [____________] [중복확인]            │
│                                             │
│ 카테고리: [일반 ▾]                            │
│                                             │
│ 대표 이미지:                                  │
│ [📷 이미지 업로드] (200x200, PNG/JPG)         │
│                                             │
│ 설명:                                        │
│ [________________________________]          │
│ (100자 이내)                                 │
│                                             │
│ 희망 가격: ○ 무료  ○ 100P  ○ 200P  ○ 300P   │
│                                             │
│ 이모티콘 등록: (최소 8개, 최대 30개)            │
│ [📷 이미지 추가]                              │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                │
│ │ 1  │ │ 2  │ │ 3  │ │ 4  │ ...            │
│ └────┘ └────┘ └────┘ └────┘                │
│                                             │
│ 태그: [__________] (쉼표 구분, 최대 5개)       │
│                                             │
│ ⚠️ 안내사항                                  │
│ · 음란물 등록 시 사이버수사대에 즉각 신고합니다.  │
│ · 저작권 위반 시 별도 통보 없이 판매중지됩니다.   │
│ · 검수는 평일 기준으로 진행됩니다.               │
│ · 하루 최대 3건까지 신청할 수 있습니다.          │
│                                             │
│                        [취소]  [신청하기]      │
└─────────────────────────────────────────────┘
```

### 3-4. 내 이모티콘 탭

```
┌─────────────────────────────────────────────┐
│ 팩 이름      상태      신청일     사유          │
│ ─────────────────────────────────────────── │
│ 페페팩2     ⏳ 검토중   03-18     -            │
│ 고양이팩    ✅ 승인     03-15     -     [취소]  │
│ 테스트팩    ❌ 거절     03-12     저작권 위반    │
└─────────────────────────────────────────────┘
```

- 검토중(`pending`): 취소 가능
- 승인(`approved`): 판매 현황 표시 (구매 수 등)
- 거절(`rejected`): 거절 사유 표시

### 3-5. 신고·중지 내역 탭

```
┌─────────────────────────────────────────────┐
│ 팩 이름      상태        중지일     사유        │
│ ─────────────────────────────────────────── │
│ 위반팩      🚫 판매중지   03-16    저작권 위반   │
└─────────────────────────────────────────────┘
```

- 판매중지(`suspended`) 상태인 팩만 표시
- 중지 사유 확인

### 3-6. 가이드 탭

아코디언 형태로 이용방법 + 제작 가이드 표시:

```
┌─────────────────────────────────────────────┐
│ ▸ 이모티콘 등록 방법                           │
│ ▸ 이미지 규격 안내                             │
│ ▸ 검수 기준                                   │
│ ▸ 판매 및 수익                                │
│ ▸ 주의사항                                    │
└─────────────────────────────────────────────┘
```

### 3-7. 진입점

- **샵 페이지** 이모티콘 섹션: "이모티콘 스튜디오" 버튼 (링크)
- **피커 모달 상점**: "이모티콘 상점 바로가기" 옆 또는 아래에 링크

---

## 4. 관리자 페이지

### 4-1. 이모티콘 신청 관리: `/admin/emoticon-submissions`

**위치**: `src/app/admin/emoticon-submissions/page.tsx`

**AdminLayoutClient.tsx 사이드바에 메뉴 추가**: "이모티콘 신청" 항목

```
┌─────────────────────────────────────────────────┐
│ 이모티콘 신청 관리                                │
├─────────────────────────────────────────────────┤
│ [전체] [검토대기] [승인] [거절] [판매중지]           │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 페페팩2  |  @닉네임  |  8개  |  300P        │ │
│ │ 2026-03-18  ⏳ 검토대기                     │ │
│ │         [상세보기] [승인] [거절] [판매중지]    │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 4-2. 상세 보기 모달

```
┌─────────────────────────────────────────────┐
│ 신청 상세                              [X]  │
├─────────────────────────────────────────────┤
│ 팩 이름: 페페팩2                             │
│ 신청자: @닉네임 (user_id)                    │
│ 카테고리: 밈                                 │
│ 설명: 페페 개구리 이모티콘입니다               │
│ 희망 가격: 300P                              │
│ 태그: 페페, 개구리, 밈                        │
│ 신청일: 2026-03-18 11:40                     │
│                                             │
│ 대표 이미지:                                 │
│ [🐸]                                        │
│                                             │
│ 이모티콘 목록 (8개):                          │
│ [🐸] [🐸] [🐸] [🐸] [🐸] [🐸] [🐸] [🐸]    │
│                                             │
│ ─────────── 관리자 액션 ───────────          │
│                                             │
│ 가격 조정: [300 ▾] P                         │
│ 거절/중지 사유: [________________]            │
│                                             │
│            [판매중지]  [거절하기]  [승인하기]    │
└─────────────────────────────────────────────┘
```

### 4-3. 관리자 액션

- **승인**: `emoticon_packs` + `shop_items` 자동 등록 → 유저 알림
- **거절**: 사유 입력 필수 → 유저 알림
- **판매중지**: 이미 승인된 팩을 중지 → `emoticon_packs.is_active = false` + 유저 알림

---

## 5. 서버 액션

### 5-1. 유저용 (신청)

**위치**: `src/domains/shop/actions/emoticon-submissions.ts`

```typescript
'use server'

// 팩 이름 중복 체크
checkPackNameDuplicate(name: string): Promise<boolean>

// 신청서 제출
submitEmoticonPack(formData: {
  packName: string
  description: string
  category: string
  tags: string[]
  thumbnailPath: string
  emoticonPaths: string[]
  requestedPrice: number
}): Promise<{ success: boolean; id?: number; error?: string }>
// - 로그인 체크
// - 정지 유저 체크
// - 하루 신청 제한 체크 (3건)
// - 이미지 개수 검증 (8~30)
// - emoticon_submissions INSERT

// 내 신청 내역 조회
getMySubmissions(): Promise<Submission[]>

// 내 판매중지 내역 조회
getMySuspendedSubmissions(): Promise<Submission[]>

// 신청 취소 (pending 상태만)
cancelSubmission(id: number): Promise<void>
```

### 5-2. 관리자용 (검토)

**위치**: `src/domains/admin/actions/emoticon-submissions.ts`

```typescript
'use server'

// 전체 신청 목록 조회 (필터 가능)
getSubmissions(filter?: 'all' | 'pending' | 'approved' | 'rejected' | 'suspended'): Promise<Submission[]>
// - checkAdminPermission()
// - 유저 프로필 JOIN (닉네임 등)

// 신청 상세 조회
getSubmissionDetail(id: number): Promise<SubmissionDetail>

// 승인 처리
approveSubmission(id: number, finalPrice?: number): Promise<void>
// - checkAdminPermission()
// 1. shop_items INSERT (유료인 경우)
//    → shop_item_id 획득
// 2. emoticon_packs INSERT (이모티콘 개수만큼 행 생성)
//    → pack_id 생성 (예: 'user_{submission_id}')
//    → code 생성 (예: '~u{id}_1', '~u{id}_2', ...)
// 3. emoticon_submissions UPDATE
//    → status = 'approved'
//    → approved_pack_id, approved_shop_item_id 기록
//    → reviewed_at, reviewed_by 기록
// 4. revalidatePath('/shop')

// 거절 처리
rejectSubmission(id: number, reason: string): Promise<void>
// - checkAdminPermission()
// - emoticon_submissions UPDATE (status='rejected', reject_reason)
// - reviewed_at, reviewed_by 기록

// 판매중지 처리 (승인된 팩 대상)
suspendSubmission(id: number, reason: string): Promise<void>
// - checkAdminPermission()
// - emoticon_packs UPDATE (is_active = false) WHERE pack_id = approved_pack_id
// - emoticon_submissions UPDATE (status='suspended', suspend_reason)
// - reviewed_at, reviewed_by 기록
// - revalidatePath('/shop')
```

---

## 6. React Query 훅

### 위치: `src/domains/shop/hooks/useEmoticonStudio.ts`

```typescript
// 쿼리 훅
useMySubmissions()                → 내 신청 목록 조회
useMySuspendedSubmissions()       → 내 판매중지 내역 조회
useCheckPackName(name: string)    → 팩 이름 중복 체크 (debounced)

// 뮤테이션 훅
useSubmitPack()                   → 신청 제출 mutation
useCancelSubmission()             → 신청 취소 mutation
```

### 쿼리 키: `src/shared/constants/queryKeys.ts`에 추가

```typescript
emoticonStudioKeys: {
  submissions(): ['emoticon-studio', 'submissions'],
  suspended(): ['emoticon-studio', 'suspended'],
  detail(id: number): ['emoticon-studio', 'detail', id],
  packNameCheck(name: string): ['emoticon-studio', 'nameCheck', name],
}
```

### 관리자용 훅: `src/domains/admin/hooks/useAdminEmoticonSubmissions.ts`

```typescript
useAdminSubmissions(filter)       → 전체 신청 목록
useAdminSubmissionDetail(id)      → 상세 조회
useApproveSubmission()            → 승인 mutation
useRejectSubmission()             → 거절 mutation
useSuspendSubmission()            → 판매중지 mutation
```

---

## 7. 이미지 업로드 플로우

### 클라이언트 → Storage (직접 업로드)

```
1. 유저가 이미지 선택
2. 클라이언트에서 사이즈/포맷 검증 (200x200, PNG/JPG, 500KB)
3. supabase.storage.from('emoticon-submissions')
     .upload(`${userId}/${submissionId}/${filename}`, file)
4. 업로드된 경로를 state에 저장
5. 신청서 제출 시 경로 배열을 서버 액션에 전달
```

### 승인 후 이미지 처리

```
승인 서버 액션에서:
1. Storage public URL을 그대로 emoticon_packs.url에 저장
   (별도 복사 불필요)
2. next.config.js remotePatterns에 Supabase Storage 호스트 이미 등록됨
```

---

## 8. 제한사항 & 검증

### 유저 제한
- 하루 신청 최대 **3건** (서버 액션에서 체크)
- 이모티콘 **최소 8개, 최대 30개**
- 팩 이름 **2~20자**, 중복 불가
- 설명 **5~100자**
- 태그 **최대 5개**, 각 1~5자
- 이미지 **PNG/JPG**, **200x200px**, **파일당 500KB**
- 로그인 필수, 정지된 유저 불가

### 관리자 검토 기준
- 음란물/폭력물 → 거절 + 유저 정지 가능
- 저작권 위반 → 거절
- 품질 미달 (해상도, 투명도 등) → 거절
- 가격은 관리자가 최종 조정 가능

---

## 9. 파일 구조

```
src/
├── app/(site)/shop/
│   └── emoticon-studio/
│       └── page.tsx                    # 스튜디오 페이지 (서버 컴포넌트)
│
├── app/admin/
│   └── emoticon-submissions/
│       ├── page.tsx                    # 관리자 신청 목록 (서버 컴포넌트)
│       └── components/
│           ├── SubmissionList.tsx       # 신청 목록 (클라이언트)
│           └── SubmissionDetailModal.tsx # 상세 + 승인/거절 (클라이언트)
│
├── domains/shop/
│   ├── actions/
│   │   └── emoticon-submissions.ts     # 유저용 서버 액션
│   ├── components/
│   │   └── emoticon-studio/
│   │       ├── StudioTabs.tsx          # 탭 네비게이션 (클라이언트)
│   │       ├── SubmitForm.tsx          # 등록 신청 폼 (클라이언트)
│   │       ├── MyEmoticonList.tsx      # 내 이모티콘 목록 (클라이언트)
│   │       ├── SuspendedList.tsx       # 신고·중지 내역 (클라이언트)
│   │       └── GuideSection.tsx        # 가이드 (클라이언트)
│   ├── hooks/
│   │   └── useEmoticonStudio.ts        # React Query 훅
│   └── types/
│       └── emoticon-submission.ts      # 타입 정의
│
├── domains/admin/
│   ├── actions/
│   │   └── emoticon-submissions.ts     # 관리자용 서버 액션
│   └── hooks/
│       └── useAdminEmoticonSubmissions.ts # 관리자 React Query 훅
│
├── shared/constants/
│   └── queryKeys.ts                    # emoticonStudioKeys 추가
│
└── docs/
    └── features/
        └── emoticon-submission-plan.md # 이 문서
```

---

## 10. 구현 순서

### Phase 1: 기반 (DB + Storage + 타입 + 쿼리 키)
1. `emoticon_submissions` 테이블 생성 (서버 액션으로 마이그레이션 SQL 실행)
2. `emoticon-submissions` Storage 버킷 생성 + RLS
3. 타입 정의 (`emoticon-submission.ts`)
4. 쿼리 키 추가 (`queryKeys.ts`)

### Phase 2: 유저 — 이모티콘 스튜디오
5. 유저용 서버 액션 구현
6. React Query 훅 구현 (`useEmoticonStudio.ts`)
7. 스튜디오 탭 컴포넌트 구현 (`StudioTabs.tsx`)
8. 등록 신청 폼 구현 (`SubmitForm.tsx`)
9. 내 이모티콘 목록 구현 (`MyEmoticonList.tsx`)
10. 신고·중지 내역 구현 (`SuspendedList.tsx`)
11. 가이드 구현 (`GuideSection.tsx`)
12. 스튜디오 페이지 구현 (`/shop/emoticon-studio`)
13. 샵 페이지에 진입점 버튼 추가

### Phase 3: 관리자 — 신청 검토
14. 관리자용 서버 액션 구현
15. 관리자용 React Query 훅 구현
16. 관리자 신청 목록 페이지 구현 (`/admin/emoticon-submissions`)
17. 상세 보기 + 승인/거절/판매중지 모달 구현
18. AdminLayoutClient 사이드바에 메뉴 추가

### Phase 4: 연동 & 마무리
19. 승인 시 `shop_items` + `emoticon_packs` 자동 등록 검증
20. next.config.js 이미지 패턴 확인
21. 알림 연동 (승인/거절/판매중지 시 유저에게 알림)
22. 테스트 및 엣지 케이스 처리

---

## 11. 참고

- 기존 상점 구매 플로우: `src/domains/shop/actions/actions.ts` → `purchaseItem()`
- 기존 이모티콘 등록: `src/domains/boards/actions/emoticons.ts`
- 관리자 권한 체크: `src/shared/actions/admin-actions.ts` → `checkAdminPermission()`
- 관리자 상점 관리: `src/app/admin/shop/components/ShopItemManagement.tsx`
- 이미지 URL 표준: `docs/guides/image-4590-standard.md`
- 기존 React Query 이모티콘 훅: `src/domains/boards/hooks/useEmoticonQueries.ts`
- 쿼리 키 관리: `src/shared/constants/queryKeys.ts`
