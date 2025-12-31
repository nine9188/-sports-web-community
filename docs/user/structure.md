# User Domain 구조 개요

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Entry Points                              │
├─────────────────────────────────────────────────────────────────┤
│  /user/[publicId]          │  AuthorLink (게시글/댓글 작성자)     │
│  (공개 프로필 페이지)         │  (드롭다운 → 프로필 모달/페이지)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Components                                │
├─────────────────────────────────────────────────────────────────┤
│  PublicProfileCard         │  UserProfileModal                   │
│  (프로필 정보 카드)           │  (프로필 모달 - Context 기반)        │
├─────────────────────────────────────────────────────────────────┤
│  UserPostList              │  UserCommentList                    │
│  (사용자 게시글 목록)         │  (사용자가 댓글 단 게시글 목록)       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Server Actions                            │
├─────────────────────────────────────────────────────────────────┤
│  getPublicProfile()        │  getUserPosts()                     │
│  (프로필 정보 조회)          │  (사용자 게시글 조회)                │
│                             │  getUserCommentedPosts()            │
│                             │  (사용자 댓글 게시글 조회)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database (Supabase)                       │
├─────────────────────────────────────────────────────────────────┤
│  profiles                  │  posts / comments                   │
│  - id (uuid)               │  - user_id (FK → profiles.id)       │
│  - public_id (8자리)        │  - board_id (FK → boards.id)        │
│  - nickname                │  - is_deleted                       │
│  - level, exp, points      │                                     │
│  - icon_id (FK → shop_items)│                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 데이터 흐름

### 1. 프로필 페이지 접근

```
/user/[publicId] (page.tsx)
    │
    ├─ getPublicProfile(publicId)     // 서버 액션
    │   └─ profiles 테이블 조회
    │   └─ shop_items 조회 (아이콘 URL)
    │   └─ posts/comments count 조회
    │
    ├─ PublicProfileCard 렌더링
    │
    └─ UserActivityTabs
        ├─ UserPostList
        │   └─ getUserPosts(publicId, pagination)
        │
        └─ UserCommentList
            └─ getUserCommentedPosts(publicId, pagination)
```

### 2. 프로필 모달 (게시글에서 작성자 클릭)

```
게시글/댓글
    │
    └─ AuthorLink 클릭
        │
        ├─ 드롭다운 표시 (프로필 보기 옵션)
        │
        └─ /user/[publicId] 페이지로 이동
            또는
            UserProfileModalContext.openProfileModal(publicId)
            └─ UserProfileModal 표시
```

## 식별자 시스템

### public_id
- 8자리 영숫자 문자열
- 외부 노출용 ID (URL에 사용)
- 프로필 생성 시 자동 생성

### user_id (id)
- UUID 형식
- 내부 참조용 (FK로 사용)
- Auth 시스템과 연동

```typescript
// 예시
public_id: "a1b2c3d4"  // URL: /user/a1b2c3d4
id: "123e4567-e89b-12d3-a456-426614174000"  // DB FK
```

## 레벨 시스템

### 레벨 테이블 (49레벨)

| 레벨 | 필요 누적 EXP | 아이콘 인덱스 |
|------|-------------|--------------|
| 1-4  | 0-1500      | level-1.png  |
| 5-8  | 1500-3000   | level-2.png  |
| 9-12 | 3000-15000  | level-3.png  |
| ... | ... | ... |
| 41+  | 1,623,000+  | level-11~19.png |

### 아이콘 결정 로직

```typescript
// level-icons.ts
if (level <= 40) {
  iconIndex = Math.ceil(level / 4);  // 4레벨당 1아이콘
} else {
  iconIndex = 10 + (level - 40);     // 41+ 레벨당 1아이콘
}
iconIndex = Math.min(iconIndex, 19); // 최대 19개
```

## 관련 테이블 스키마

### profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  public_id VARCHAR(8) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  email VARCHAR(255),
  full_name VARCHAR(100),
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  icon_id INTEGER REFERENCES shop_items(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### posts (관련 컬럼만)

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  board_id UUID REFERENCES boards(id),
  title VARCHAR(255),
  content TEXT,
  post_number INTEGER,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### comments (관련 컬럼만)

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  post_id UUID REFERENCES posts(id),
  content TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```
