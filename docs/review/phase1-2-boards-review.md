# Phase 1.2 게시판 코드 리뷰

> 리뷰 일시: 2024-12-23
> 마지막 업데이트: 2025-12-23
> 리뷰어: Claude Code

## 개요

게시판 관련 페이지, 서버 액션, 컴포넌트를 코드 리뷰했습니다.

---

## 1. 페이지 파일 분석

### 1.1 게시판 목록 페이지 (`[slug]/page.tsx`) ✅

| 항목 | 내용 |
|------|------|
| **경로** | `src/app/boards/[slug]/page.tsx` |
| **줄 수** | ~~236줄~~ → **182줄** |
| **평가** | ✅ 리팩토링 완료 |

#### 이슈
| 심각도 | 이슈 | 위치 | 설명 | 상태 |
|--------|------|------|------|------|
| ✅ 해결 | 타입 중복 정의 | 9-34줄 | `types/post/layout.ts`로 분리 | 완료 |
| ✅ 해결 | 함수 중복 | 37-61줄 | `utils/post/postUtils.ts`로 분리 | 완료 |
| ✅ 해결 | HoverMenu 로직 중복 | 148-201줄 | `hover-menu/types.ts`로 분리 | 완료 |

---

### 1.2 글 상세 페이지 (`[slug]/[postNumber]/page.tsx`)

| 항목 | 내용 |
|------|------|
| **경로** | `src/app/boards/[slug]/[postNumber]/page.tsx` |
| **줄 수** | 212줄 |
| **평가** | ⚠️ 개선 필요 |

#### 이슈
| 심각도 | 이슈 | 위치 | 설명 |
|--------|------|------|------|
| 🟠 중간 | 타입 변환 로직 복잡 | 58-159줄 | 100줄+ 타입 변환 로직 |
| 🟡 낮음 | as unknown 사용 | 169줄 | 타입 단언 사용 |

---

### 1.3 글 작성 페이지 (`[slug]/create/page.tsx`)

| 항목 | 내용 |
|------|------|
| **경로** | `src/app/boards/[slug]/create/page.tsx` |
| **줄 수** | 107줄 |
| **평가** | ✅ 양호 |

#### 장점
- React `cache` 함수를 사용한 중복 호출 방지
- 메타데이터 생성과 페이지 렌더링에서 동일한 데이터 재사용
- 깔끔한 에러 처리

---

### 1.4 전체글 페이지 (`all/page.tsx`) ✅

| 항목 | 내용 |
|------|------|
| **경로** | `src/app/boards/all/page.tsx` |
| **줄 수** | ~~207줄~~ → **126줄** |
| **평가** | ✅ 리팩토링 완료 |

#### 이슈
| 심각도 | 이슈 | 위치 | 설명 | 상태 |
|--------|------|------|------|------|
| ✅ 해결 | 타입 중복 정의 | 10-62줄 | `types/post/layout.ts`로 분리 | 완료 |
| ✅ 해결 | 함수 중복 | 64-89줄 | `utils/post/postUtils.ts`로 분리 | 완료 |
| ✅ 해결 | HoverMenu 로직 중복 | 112-159줄 | `hover-menu/types.ts`로 분리 | 완료 |

---

### 1.5 인기글 페이지 (`popular/page.tsx`) ✅

| 항목 | 내용 |
|------|------|
| **경로** | `src/app/boards/popular/page.tsx` |
| **줄 수** | ~~214줄~~ → **133줄** |
| **평가** | ✅ 리팩토링 완료 |

#### 이슈
| 심각도 | 이슈 | 위치 | 설명 | 상태 |
|--------|------|------|------|------|
| ✅ 해결 | 타입 중복 정의 | 10-62줄 | `types/post/layout.ts`로 분리 | 완료 |
| ✅ 해결 | 함수 중복 | 64-89줄 | `utils/post/postUtils.ts`로 분리 | 완료 |
| ✅ 해결 | HoverMenu 로직 중복 | 116-163줄 | `hover-menu/types.ts`로 분리 | 완료 |

---

## 2. 서버 액션 분석

### 2.1 줄 수 현황

| 파일 | 줄 수 | 평가 |
|------|------|------|
| `getPosts.ts` | ~~586줄~~ → **276줄** | ✅ 리팩토링 완료 |
| `posts/fetchPostsHelpers.ts` | **315줄** (신규) | ✅ 헬퍼 함수 분리 |
| `setNotice.ts` | ~~553줄~~ → **298줄** | ✅ 리팩토링 완료 |
| `posts/likes.ts` | ~~535줄~~ → **286줄** | ✅ 리팩토링 완료 |
| `getPostDetails.ts` | ~~434줄~~ → **432줄** | ✅ 구조 양호, 경량 정리 |
| `comments/likes.ts` | ~~427줄~~ → **200줄** | ✅ 리팩토링 완료 |
| `posts/create.ts` | ~~394줄~~ → **207줄** | ✅ 리팩토링 완료 |
| `posts/notices.ts` | 378줄 | 🟡 양호 |
| `getAllPopularPosts.ts` | 284줄 | ✅ 양호 |
| `getBoards.ts` | 263줄 | ✅ 양호 |
| `getPopularPosts.ts` | 200줄 | ✅ 양호 |
| 기타 | < 200줄 | ✅ 양호 |

### 2.2 주요 이슈

| 심각도 | 파일 | 이슈 | 상태 |
|--------|------|------|------|
| ✅ 해결 | `getPosts.ts` | 586줄 → 276줄 | 헬퍼 함수 분리 |
| ✅ 해결 | `setNotice.ts` | 553줄 → 298줄 | 공통 로직 통합 |
| ✅ 해결 | `posts/likes.ts` | 535줄 → 286줄 | togglePostReaction 통합 |
| ✅ 해결 | `comments/likes.ts` | 427줄 → 200줄 | toggleCommentReaction 통합 |
| ✅ 해결 | `posts/create.ts` | 394줄 → 207줄 | createPostInternal 통합 |

---

## 3. 컴포넌트 분석

### 3.1 줄 수 현황

| 파일 | 줄 수 | 평가 |
|------|------|------|
| `PostContent.tsx` | ~~1727줄~~ → ~~1595줄~~ → ~~1294줄~~ → **520줄** | ✅ **3차 리팩토링 완료 (62% 감소)** |
| `post-content/types.ts` | **77줄** (신규) | ✅ 타입 정의 분리 |
| `post-content/config/domPurify.ts` | **54줄** (신규) | ✅ DOMPurify 설정 분리 |
| `post-content/renderers/tipTapRenderer.ts` | **120줄** (신규) | ✅ TipTap 렌더러 분리 |
| `post-content/renderers/rssRenderer.ts` | **57줄** (신규) | ✅ RSS 렌더러 분리 |
| `post-content/renderers/socialEmbedRenderer.ts` | **183줄** (신규) | ✅ 소셜 임베드 분리 |
| `post-content/renderers/matchCardRenderer.ts` | **46줄** | ✅ 매치 카드 렌더러 |
| `post-content/utils/contentUtils.ts` | **112줄** (신규) | ✅ 콘텐츠 유틸 분리 |
| `post-content/utils/matchCardUtils.ts` | **174줄** (신규) | ✅ 매치카드 유틸 분리 |
| `PostEditForm.tsx` | ~~995줄~~ → **495줄** | ✅ **리팩토링 완료** |
| `PostList.backup.tsx` | ~~974줄~~ | ✅ **삭제됨** |
| `PostDetailLayout.tsx` | 380줄 | ✅ 구조 양호 |
| `CommentSection.tsx` | 368줄 | ✅ 구조 양호 |
| `MatchStatsChart.tsx` | 331줄 | 🟡 양호 |
| `BoardDetailLayout.tsx` | ~~329줄~~ → **284줄** | ✅ 리팩토링 완료 |
| `Comment.tsx` | 299줄 | 🟡 양호 |
| 기타 | < 200줄 | ✅ 양호 |

### 3.2 PostContent.tsx 분석 ✅ 3차 리팩토링 완료

**리팩토링 전:** 1,727줄 → **리팩토링 후:** 520줄 (70% 감소)

**완료된 분리 구조:**
```
post-content/
├── types.ts                    (77줄)  타입 정의
├── config/
│   ├── domPurify.ts            (54줄)  DOMPurify 설정
│   └── index.ts
├── parsers/
│   ├── matchStatsParser.ts     (131줄) 경기 통계 파싱
│   └── index.ts
├── renderers/
│   ├── tipTapRenderer.ts       (120줄) TipTap → HTML
│   ├── rssRenderer.ts          (57줄)  RSS 콘텐츠
│   ├── socialEmbedRenderer.ts  (183줄) YouTube/Twitter/Instagram
│   ├── matchCardRenderer.ts    (46줄)  매치 카드
│   └── index.ts
└── utils/
    ├── contentUtils.ts         (112줄) 배당률 파싱, 차트 데이터
    ├── matchCardUtils.ts       (174줄) 이미지/호버 처리
    └── index.ts
```

**개선 효과:**
- ✅ 모듈화: 각 기능별로 독립적인 파일
- ✅ 재사용성: 렌더러/유틸리티 함수 재사용 가능
- ✅ 테스트 용이성: 각 모듈 개별 테스트 가능
- ✅ 유지보수성: 관심사 분리로 코드 탐색 용이

### 3.3 PostEditForm.tsx 분석 (995줄) ⚠️

**문제점:**
- 에디터, 폼 로직, 모달들이 한 파일에
- 상태 관리 복잡

**권장 분리:**
```
post-edit-form/
├── index.ts
├── PostEditForm.tsx (메인 - 300줄 이하)
├── hooks/
│   ├── usePostEditor.ts
│   └── usePostSubmit.ts
├── components/
│   ├── NoticeSettings.tsx
│   └── EditorModals.tsx
└── utils/
    └── formUtils.ts
```

---

## 4. 공통 이슈 요약

### 4.1 타입 중복 ✅ 해결됨

**현황:** ~~`LayoutPost`, `ApiPost`, `Post` 타입이 다음 파일들에 중복 정의됨~~

**해결:**
```typescript
// src/domains/boards/types/post/layout.ts 에 통합 ✅
export interface LayoutPost { ... }
export interface ApiPost { ... }
export interface PopularPost { ... }
```

### 4.2 함수 중복 ✅ 해결됨

**현황:** ~~`convertApiPostsToLayoutPosts` 함수가 4개 파일에 동일하게 정의됨~~

**해결:**
```typescript
// src/domains/boards/utils/post/postUtils.ts ✅
export function convertApiPostsToLayoutPosts(apiPosts: ApiPost[]): LayoutPost[] { ... }
```

### 4.3 HoverMenu 데이터 로직 중복 ✅ 해결됨

**현황:** ~~동일한 HoverMenu 데이터 구조화 로직이 여러 페이지에 반복됨~~

**해결:**
```typescript
// src/domains/boards/components/common/hover-menu/types.ts ✅
export interface ChildBoard { ... }
export interface TopBoard { ... }
export interface HoverMenuProps { ... }
```

### 4.4 백업 파일 ✅ 삭제됨

**현황:** ~~`PostList.backup.tsx` (974줄)가 존재~~

**해결:** 삭제 완료 ✅

---

## 5. 종합 평가

### 5.1 페이지별 점수

| 페이지 | 줄 수 | 복잡도 | 코드 품질 | 총평 |
|--------|-------|--------|-----------|------|
| `[slug]/page.tsx` | ~~236~~ → **182** | 낮음 | ⭐⭐⭐⭐⭐ | ✅ 리팩토링 완료 |
| `[slug]/[postNumber]/page.tsx` | 212 | 중간 | ⭐⭐⭐ | 타입 변환 개선 필요 |
| `create/page.tsx` | 107 | 낮음 | ⭐⭐⭐⭐⭐ | 우수 |
| `all/page.tsx` | ~~207~~ → **126** | 낮음 | ⭐⭐⭐⭐⭐ | ✅ 리팩토링 완료 |
| `popular/page.tsx` | ~~214~~ → **133** | 낮음 | ⭐⭐⭐⭐⭐ | ✅ 리팩토링 완료 |

### 5.2 우선순위별 이슈

#### ~~🔴 높음 (반드시 개선)~~ ✅ 완료
1. ~~**PostContent.tsx 리팩토링**~~ ✅ 1차 완료 (1727줄 → 1595줄)
2. ~~**PostEditForm.tsx 리팩토링**~~ ✅ 완료 (995줄 → 495줄)
3. ~~**타입 및 함수 중복 제거**~~ ✅ 완료

#### ~~🟠 중간 (권장) - 서버 액션 리팩토링~~ ✅ 완료
4. ~~**HoverMenu 데이터 로직 분리**~~ ✅ 완료
5. ~~**getPosts.ts 분리**~~ ✅ 완료 (586줄 → 276줄 + 헬퍼 315줄)
6. ~~**setNotice.ts 분리**~~ ✅ 완료 (553줄 → 298줄)
7. ~~**posts/likes.ts 분리**~~ ✅ 완료 (535줄 → 286줄)

#### ~~🟡 낮음 (선택)~~ ✅ 완료
8. ~~**PostList.backup.tsx 삭제**~~ ✅ 삭제됨
9. ~~**as unknown 타입 단언 제거**~~ ✅ 완료 (12개 제거)

---

## 6. 체크리스트 업데이트

| 항목 | 상태 | 담당 컴포넌트/액션 | 비고 |
|------|------|-------------------|------|
| 게시판 목록 조회 | ✅ | `getBoards.ts`, `BoardInfo` | 정상 동작 |
| 전체 글 보기 | ✅ | `getAllPopularPosts.ts`, `PostList` | 중복 코드 있음 |
| 인기글 보기 | ✅ | `getPopularPosts.ts`, `PopularPostList` | 중복 코드 있음 |
| 글 상세 보기 | ✅ | `getPostDetails.ts`, `PostDetailLayout` | 타입 변환 복잡 |
| 글 작성 | ✅ | `PostEditForm`, `EditorToolbar` | 컴포넌트 너무 큼 |
| 글 수정 | ✅ | `PostEditForm` | 컴포넌트 너무 큼 |
| 글 삭제 | ✅ | `PostActions` | 정상 |
| 댓글 작성 | ✅ | `CommentSection` | 정상 |
| 댓글 수정/삭제 | ✅ | `Comment` | 정상 |
| 좋아요/싫어요 | ✅ | `PostActions` | 액션 파일 큼 |
| 이미지 업로드 | ✅ | `ImageUploadForm` | 정상 |
| 페이지네이션 | ✅ | `PostList` | 정상 |
| 공지사항 표시 | ✅ | `NoticeList` | 정상 |

---

## 7. 다음 단계

### 완료된 작업 ✅
1. [x] PostContent.tsx 리팩토링 계획 수립 ✅ 1차 완료
2. [x] PostEditForm.tsx 리팩토링 계획 수립 ✅ 완료
3. [x] 공통 타입/함수 분리 작업 ✅ 완료
4. [x] HoverMenu 로직 분리 ✅ 완료
5. [x] PostList.backup.tsx 삭제 ✅ 완료

### 서버 액션 리팩토링 완료 ✅
6. [x] **서버 액션 리팩토링** (2025-12-23 완료)
   - [x] getPosts.ts: 586줄 → 276줄 (53% 감소)
   - [x] setNotice.ts: 553줄 → 298줄 (46% 감소)
   - [x] posts/likes.ts: 535줄 → 286줄 (47% 감소)
   - [x] comments/likes.ts: 427줄 → 200줄 (53% 감소)
   - [x] posts/create.ts: 394줄 → 207줄 (47% 감소)
   - [x] fetchPostsHelpers.ts 생성 (315줄)

### 컴포넌트 리팩토링 완료 ✅
7. [x] **PostContent.tsx 2차 리팩토링** (2025-12-23 완료)
   - [x] 1595줄 → 1294줄 (19% 감소)
   - [x] matchCardRenderer.ts 생성 (186줄)

### 타입 개선 완료 ✅
8. [x] **as unknown 타입 단언 제거** (2025-12-23 완료)
   - [x] SocialEmbedForm.tsx: 이벤트 타입 유연화
   - [x] BoardDetailLayout.tsx: Board 타입 확장, NoticeListPost 도입
   - [x] PostContent.tsx: MatchCardLinkElement, parseBettingOdds 헬퍼
   - [x] getPosts.ts: RawPostData 인터페이스 정의
9. [x] **PostDetailLayout.tsx, CommentSection.tsx 검토** - 구조 양호, 변경 불필요

---

## Phase 1.2 완료 ✅

모든 서버 액션, 컴포넌트 리팩토링 및 타입 개선 완료. 총 **~2400줄+** 감소.

### 다음 단계
10. [ ] Phase 1.3 라이브스코어 리뷰 진행

---

## 8. 리팩토링 우선순위 및 결과 (2025-12-23)

| 순서 | 작업 | 예상 효과 | 결과 |
|------|------|----------|------|
| 1 | 공통 타입/함수 분리 | 4개 파일에서 ~200줄 중복 제거 | ✅ **-261줄** |
| 2 | PostContent.tsx 리팩토링 | 1727줄 → ~300줄 | ✅ 1차 완료 **-132줄** |
| 3 | PostEditForm.tsx 리팩토링 | 995줄 → ~300줄 | ✅ **-501줄** (495줄) |
| 4 | HoverMenu 로직 분리 | 4개 파일에서 ~200줄 중복 제거 | ✅ 타입/컴포넌트 분리 완료 |
| 5 | getPosts.ts 리팩토링 | 586줄 → ~300줄 | ✅ **-310줄** (276줄) |
| 6 | setNotice.ts 리팩토링 | 553줄 → ~300줄 | ✅ **-255줄** (298줄) |
| 7 | posts/likes.ts 리팩토링 | 535줄 → ~300줄 | ✅ **-249줄** (286줄) |
| 8 | comments/likes.ts 리팩토링 | 427줄 → ~200줄 | ✅ **-227줄** (200줄) |
| 9 | posts/create.ts 리팩토링 | 394줄 → ~200줄 | ✅ **-187줄** (207줄) |
| 10 | PostContent.tsx 2차 리팩토링 | 1595줄 → ~1300줄 | ✅ **-301줄** (1294줄) |
| 11 | as unknown 타입 단언 제거 | 12개 타입 단언 | ✅ 타입 안전성 개선 |

### 총 감소량: **~2400줄+**, 타입 단언 **12개 제거**

### 서버 액션 리팩토링 상세
| 파일 | 이전 | 이후 | 감소율 | 개선 내용 |
|------|------|------|--------|----------|
| `getPosts.ts` | 586줄 | 276줄 | 53% | 헬퍼 함수 분리 (fetchPostsHelpers.ts) |
| `setNotice.ts` | 553줄 | 298줄 | 46% | validateNoticeAction 통합, 에러 메시지 상수화 |
| `posts/likes.ts` | 535줄 | 286줄 | 47% | togglePostReaction 통합, console.log 제거 |
| `comments/likes.ts` | 427줄 | 200줄 | 53% | toggleCommentReaction 통합, 알림 로직 분리 |
| `posts/create.ts` | 394줄 | 207줄 | 47% | createPostInternal 공통 로직 통합 |

### 컴포넌트 리팩토링 상세
| 파일 | 이전 | 이후 | 감소율 | 개선 내용 |
|------|------|------|--------|----------|
| `PostContent.tsx` | 1595줄 | 1294줄 | 19% | matchCardRenderer.ts 분리 (186줄) |

### 타입 단언 (`as unknown`) 제거 상세
| 파일 | 제거 개수 | 개선 방법 |
|------|----------|----------|
| `SocialEmbedForm.tsx` | 2개 | handleSubmit 시그니처 변경 (이벤트 타입 유연화) |
| `BoardDetailLayout.tsx` | 2개 | Board 타입에 view_type 추가, NoticeListPost 타입 도입 |
| `PostContent.tsx` | 7개 | MatchCardLinkElement 인터페이스, parseBettingOdds 헬퍼 함수 |
| `getPosts.ts` | 1개 | RawPostData 인터페이스 정의 |

---

## 9. 리팩토링 상세 문서

| 문서 | 설명 |
|------|------|
| [refactoring-board-types.md](./refactoring-board-types.md) | 공통 타입/함수 분리 |
| [refactoring-post-content.md](./refactoring-post-content.md) | PostContent.tsx 리팩토링 |
| [refactoring-post-edit-form.md](./refactoring-post-edit-form.md) | PostEditForm.tsx 리팩토링 |
| [refactoring-hover-menu.md](./refactoring-hover-menu.md) | HoverMenu 로직 분리 |

---

[← Phase 1 상세 문서](./phase1-core-user-flow.md) | [메인 체크리스트 →](../launch-review-checklist.md)
