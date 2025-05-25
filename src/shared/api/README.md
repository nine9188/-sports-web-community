# 🔧 Supabase 클라이언트 구조 가이드

> 공식 Supabase Next.js 문서에 따라 구성된 클라이언트 구조입니다.

## 📁 파일 구조

```
src/shared/api/
├── supabase.ts        # 클라이언트 컴포넌트용
├── supabaseServer.ts  # 서버 컴포넌트/액션용
├── middleware.ts      # 미들웨어 유틸리티
└── README.md         # 이 파일
```

---

## 🎯 사용법

### 1. 클라이언트 컴포넌트에서 사용

```tsx
'use client'

import { createClient } from '@/shared/api/supabase'
import { useEffect, useState } from 'react'

export default function ClientComponent() {
  const [data, setData] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('posts').select()
      setData(data)
    }
    fetchData()
  }, [])

  return <div>{JSON.stringify(data)}</div>
}
```

### 2. 서버 컴포넌트에서 사용

```tsx
import { createClient } from '@/shared/api/supabaseServer'

export default async function ServerComponent() {
  const supabase = await createClient()
  const { data } = await supabase.from('posts').select()
  
  return <div>{JSON.stringify(data)}</div>
}
```

### 3. 서버 액션에서 사용

```tsx
'use server'

import { createClient } from '@/shared/api/supabaseServer'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  
  const supabase = await createClient()
  
  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')
  
  // 게시글 작성
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      content: JSON.parse(content),
      user_id: user.id
    })
    .select()
    .single()
  
  if (error) throw new Error('게시글 작성 실패')
  
  // 캐시 갱신
  revalidatePath('/posts')
  
  return data
}
```

### 4. 라우트 핸들러에서 사용

```tsx
import { createClient } from '@/shared/api/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.from('posts').select()
  
  return NextResponse.json(data)
}
```

---

## ⚠️ 중요 사항

### 1. 인증 확인 방법

```tsx
// ✅ 올바른 방법 (서버에서)
const { data: { user } } = await supabase.auth.getUser()

// ❌ 잘못된 방법 (서버에서 신뢰할 수 없음)
const { data: { session } } = await supabase.auth.getSession()
```

### 2. 쿠키 처리

- **서버 컴포넌트**: 쿠키 읽기만 가능
- **서버 액션**: 쿠키 읽기/쓰기 가능
- **미들웨어**: Auth 토큰 새로고침 담당

### 3. 캐시 관리

```tsx
import { revalidatePath, revalidateTag } from 'next/cache'

// 특정 경로 캐시 무효화
revalidatePath('/posts')

// 태그 기반 캐시 무효화
revalidateTag('posts')
```

---

## 🔄 마이그레이션 가이드

### 기존 API 라우트에서 서버 액션으로

**Before (API Route):**
```tsx
// app/api/posts/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  // Supabase 로직
}
```

**After (Server Action):**
```tsx
// domains/posts/actions.ts
'use server'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  // Supabase 로직
}
```

### 클라이언트에서 호출 방법 변경

**Before:**
```tsx
const response = await fetch('/api/posts', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

**After:**
```tsx
import { createPost } from '@/domains/posts/actions'

// 폼에서 직접 호출
<form action={createPost}>
  {/* 폼 필드 */}
</form>

// 또는 프로그래밍 방식으로 호출
const formData = new FormData()
formData.append('title', 'Title')
await createPost(formData)
```

---

## 🛡️ 보안 고려사항

1. **RLS (Row Level Security)** 정책 활성화
2. **서버 액션**에서 사용자 권한 확인
3. **입력 검증** 및 **타입 안전성** 보장
4. **에러 처리** 및 **로깅** 구현

---

## 📚 참고 문서

- [Supabase Next.js 공식 가이드](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Next.js App Router](https://nextjs.org/docs/app) 