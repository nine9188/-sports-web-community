# 🔍 통합 검색 기능 PRD (Product Requirements Document)

## 📋 프로젝트 개요

### 목표
사용자가 게시판, 뉴스, 팀 정보를 통합적으로 검색할 수 있는 기능 구현

### 핵심 가치
- **통합성**: 모든 콘텐츠를 한 번에 검색
- **정확성**: Supabase Full-Text Search 활용한 고품질 검색
- **속도**: 인덱스 기반 빠른 검색 응답

---

## 🎯 MVP 범위 (1단계)

### 기능 범위
- [x] `/search` 라우트 생성
- [x] `searchPosts()` 함수 구현 (게시글 검색만)
- [x] 기본 검색 UI 구현
- [x] 검색 결과 표시

### 기술 스택
- **Backend**: Supabase PostgreSQL Full-Text Search
- **Frontend**: Next.js App Router + Server Actions
- **Database**: `to_tsvector()`, `to_tsquery()`, GIN 인덱스

---

## 🗄️ 데이터베이스 설계

### 검색 대상 테이블
```sql
-- 1단계: posts 테이블만
posts {
  id: string
  title: string
  content: Json
  board_id: string
  user_id: string
  created_at: string
  views: number
  likes: number
}

-- 관련 테이블
boards { id, name, slug }
profiles { id, nickname, icon_id }
```

### Full-Text Search 인덱스 생성
```sql
-- posts 테이블에 fts 컬럼 추가
ALTER TABLE posts 
ADD COLUMN fts tsvector 
GENERATED ALWAYS AS (
  to_tsvector('korean', title || ' ' || COALESCE(content::text, ''))
) STORED;

-- GIN 인덱스 생성
CREATE INDEX posts_fts_idx ON posts USING gin(fts);
```

---

## 🛠️ 기술 구현

### 폴더 구조
```
src/
├── app/
│   └── search/
│       └── page.tsx              # /search 라우트
├── domains/
│   └── search/
│       ├── actions.ts            # searchPosts() 서버 액션
│       ├── components/
│       │   ├── SearchBar.tsx     # 검색창
│       │   └── SearchResults.tsx # 검색 결과
│       └── types/
│           └── index.ts          # 검색 타입 정의
```

### 핵심 함수: searchPosts()
```typescript
// src/domains/search/actions.ts
'use server'

export async function searchPosts(query: string) {
  const supabase = createServerComponentClient()
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, content, created_at, views, likes, post_number,
      profiles(nickname, icon_id),
      boards(name, slug)
    `)
    .match({ is_published: true })
    .textSearch('fts', query)
    .order('created_at', { ascending: false })
    .limit(20)
    
  if (error) throw error
  return data
}
```

---

## 🎨 UI/UX 설계

### 검색 페이지 레이아웃
```
/search?q=리버풀

┌─────────────────────────────────────┐
│ 🔍 [검색창: "리버풀"]    [검색 버튼]    │
├─────────────────────────────────────┤
│ 📊 "리버풀" 검색 결과 (총 12개)         │
├─────────────────────────────────────┤
│ 📝 게시글 (12개)                    │
│ ┌─────────────────────────────────┐ │
│ │ 🏆 리버풀 vs 맨시티 경기 후기      │ │
│ │ 👤 축구팬123 • 자유게시판         │ │
│ │ 📅 2024-01-15 • 👀 245 • 👍 12  │ │
│ │ 💬 "리버풀이 정말 잘했다..."       │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ⚽ 리버풀 이적 루머 정리           │ │
│ │ 👤 스포츠기자 • 이적뉴스          │ │
│ │ 📅 2024-01-14 • 👀 189 • 👍 8   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 검색 결과 카드 컴포넌트
```tsx
interface SearchResultCard {
  title: string           // 게시글 제목
  author: string         // 작성자 닉네임
  boardName: string      // 게시판 이름
  createdAt: string      // 작성일
  views: number          // 조회수
  likes: number          // 좋아요
  snippet: string        // 검색어 포함 본문 미리보기
  url: string           // 게시글 링크
}
```

---

## 🚀 구현 단계

### Phase 1: MVP (1주차)
- [x] `/search` 페이지 생성
- [x] `searchPosts()` 서버 액션 구현
- [x] 기본 검색창 UI
- [x] 검색 결과 리스트 표시
- [x] 데이터베이스 인덱스 생성

### Phase 2: 확장 (2주차)
- [ ] 댓글 검색 추가 (`searchComments()`)
- [ ] 뉴스 검색 추가 (`searchNews()`)
- [ ] 팀 검색 추가 (`searchTeams()`)
- [ ] 통합 검색 결과 탭

### Phase 3: 고도화 (3주차)
- [ ] 검색어 하이라이트
- [ ] 자동완성 기능
- [ ] 검색 필터 (날짜, 게시판별)
- [ ] 무한 스크롤

---

## 📊 성공 지표

### 기술적 지표
- 검색 응답 시간: < 500ms
- 검색 정확도: 관련성 높은 결과 상위 노출
- 인덱스 크기: 최적화된 저장 공간

### 사용자 지표
- 검색 사용률: 일 활성 사용자 대비 검색 사용 비율
- 검색 성공률: 검색 후 결과 클릭 비율
- 재검색률: 첫 검색 후 재검색하는 비율

---

## 🔧 기술적 고려사항

### Supabase Full-Text Search 활용
- **한국어 지원**: `to_tsvector('korean', text)` 사용
- **부분 검색**: `query:*` 문법으로 prefix 검색
- **복합 검색**: `&` (AND), `|` (OR) 연산자 활용
- **근접 검색**: `<->` 연산자로 단어 간 거리 검색

### 성능 최적화
- GIN 인덱스로 빠른 Full-Text Search
- 검색 결과 페이지네이션 (20개씩)
- 검색어 캐싱 (인기 검색어)

### 보안 고려사항
- SQL Injection 방지 (Supabase 자동 처리)
- 비공개 게시글 제외 (`is_published: true`)
- 사용자 권한 기반 검색 결과 필터링

---

## 📝 개발 체크리스트

### 데이터베이스
- [ ] posts 테이블 fts 컬럼 추가
- [ ] GIN 인덱스 생성
- [ ] 검색 성능 테스트

### 백엔드
- [ ] `searchPosts()` 서버 액션 구현
- [ ] 검색 결과 타입 정의
- [ ] 에러 핸들링

### 프론트엔드
- [ ] `/search` 페이지 생성
- [ ] SearchBar 컴포넌트
- [ ] SearchResults 컴포넌트
- [ ] 로딩 상태 처리
- [ ] 모바일 반응형

### 테스트
- [ ] 검색 기능 단위 테스트
- [ ] 검색 성능 테스트
- [ ] 사용자 시나리오 테스트

---

## 🎯 예상 검색 시나리오

### "리버풀" 검색
1. **제목 매칭**: "리버풀 vs 맨시티"
2. **본문 매칭**: "리버풀이 좋은 경기를 보여줬다"
3. **부분 매칭**: "리버풀FC", "리버풀팬"

### "챔피언스리그" 검색
1. **완전 매칭**: "챔피언스리그 16강"
2. **부분 매칭**: "챔스", "UCL"
3. **관련 매칭**: "유럽축구", "챔피언스"

---

## 📚 참고 자료

- [Supabase Full-Text Search 공식 문서](https://supabase.com/docs/guides/database/full-text-search)
- [PostgreSQL Text Search 문서](https://www.postgresql.org/docs/current/textsearch.html)
- [Next.js App Router 서버 액션](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

---

**마지막 업데이트**: 2024-01-15  
**담당자**: 개발팀  
**상태**: 구현 준비 완료 