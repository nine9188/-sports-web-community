좋습니다! 주신 정보와 코드 구조에 맞춰 현재 Supabase 클라이언트 사용 방식(클라이언트 사이드)을 **서버 컴포넌트 + 서버 액션 기반 구조로 리팩토링**하기 위한 PRD를 아래와 같이 구성해 드립니다.

---

## 🧩 PRD: 게시글 생성 페이지 (`[slug]/create`) - Supabase 서버 액션 리팩토링

### ✅ 목표
기존 클라이언트 컴포넌트에서 Supabase 클라이언트를 직접 생성하고 데이터 로딩/패칭을 하는 방식을, Next.js **서버 컴포넌트**와 **서버 액션** 구조로 리팩토링합니다.

- 보안: Supabase 키 노출 방지
- UX 개선: 클라이언트에서 불필요한 로딩 제거 (SSR로 대체)
- 아키텍처 통일: 서버 액션을 활용한 데이터 처리 방식 정착

---

## 📁 관련 파일 및 구조

```
src/
├── app/
│   ├── actions/
│   │   └── boards.ts           ← ✅ 서버 액션 생성
│   ├── boards/
│   │   ├── [slug]/
│   │   │   └── create/
│   │   │       └── page.tsx    ← ✅ 서버 컴포넌트로 변경
│   │   └── components/
│   │       └── PostEditForm.tsx ← ✅ 클라이언트 컴포넌트 유지
```

---

## 🔨 리팩토링 내용

### 1. 서버 액션 작성 (`src/app/actions/boards.ts`)

```ts
'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = () => createServerComponentClient({ cookies })

export async function getBoardBySlugOrId(slugOrId: string) {
  const client = supabase()
  const isUUID = /^[0-9a-fA-F-]{36}$/.test(slugOrId)

  const query = client.from('boards').select('*').single()
  const { data, error } = isUUID
    ? await query.eq('id', slugOrId)
    : await query.eq('slug', slugOrId)

  if (error) throw new Error('게시판 정보를 가져오지 못했습니다.')
  return data
}

export async function getAllBoards() {
  const { data, error } = await supabase().from('boards').select('*')
  if (error) throw new Error('게시판 목록 조회 실패')
  return data
}
```

---

### 2. 페이지 컴포넌트 서버 컴포넌트로 변경 (`page.tsx`)

```tsx
// src/app/boards/[slug]/create/page.tsx
import { getBoardBySlugOrId, getAllBoards } from '@/app/actions/boards'
import PostEditForm from '@/app/boards/components/PostEditForm'

export default async function CreatePostPage({ params }: { params: { slug: string } }) {
  try {
    const boardInfo = await getBoardBySlugOrId(params.slug)
    const allBoards = await getAllBoards()

    return (
      <div className="container mx-auto">
        <div className="bg-white p-0 rounded-md">
          <PostEditForm
            boardId={boardInfo.id}
            boardSlug={boardInfo.slug}
            initialTitle=""
            initialContent=""
            boardName={boardInfo.name}
            categoryId={boardInfo.id}
            setCategoryId={() => {}}
            allBoardsFlat={allBoards}
            isCreateMode={true}
          />
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-red-500 font-semibold">게시판 정보를 불러오는 데 실패했습니다.</div>
      </div>
    )
  }
}
```

> ✅ 기존 `useEffect`, `useState`, `supabase-browser` 코드 제거됨

---

### 3. PostEditForm.tsx (클라이언트 컴포넌트 유지)

- 이 컴포넌트는 상태 관리 및 폼 입력 등을 처리하므로 계속 클라이언트 컴포넌트로 유지
- `setCategoryId()`는 부모에서 빈 함수 또는 콜백으로 전달

```tsx
// 'use client'
export default function PostEditForm({
  boardId,
  boardSlug,
  initialTitle,
  initialContent,
  boardName,
  categoryId,
  setCategoryId,
  allBoardsFlat,
  isCreateMode,
}: { /* props 타입 정의 */ }) {
  // ...
}
```

---

## ✅ 기대 효과

| 항목 | 리팩토링 전 (클라이언트 중심) | 리팩토링 후 (서버 중심) |
|------|-----------------------------|--------------------------|
| Supabase 클라이언트 | 클라이언트에서 생성 | 서버에서만 생성 |
| 데이터 페칭 | `useEffect` 비동기 | SSR 데이터 사전 로딩 |
| 보안 | 키 노출 위험 있음 | 서버에서만 접근 가능 |
| 사용자 경험 | 초기 렌더 지연 | 즉시 데이터 포함 렌더링 |

---

