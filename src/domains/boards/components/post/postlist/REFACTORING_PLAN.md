# PostList 리팩토링 계획

 ## 현재 문제점

 ### 1. 코드 복잡도
 - **PostList.tsx: 973줄** - 유지보수 불가능한 크기
 - 모바일/데스크톱, 가상화/비가상화, text/image-table variant가 한 파일에 혼재
 - VirtualizedPostItem, PostItem, LoadingSkeleton, EmptyState 모두 한 파일에

 ### 2. 모바일 렌더링 버그
 - 긴 제목이 `...` 처리 안되고 화면 밖으로 넘어감
 - 복잡한 flex 레이아웃 중첩으로 overflow 제어 실패
 - image-table variant에서 썸네일이 제목과 같은 줄에 있어 공간 부족

 ### 3. 성공 사례: PopularPostList
 - **PopularPostList.tsx: 184줄** - 간단하고 잘 작동
 - 모바일에서 텍스트 오버플로우 문제 없음
 - 간단한 구조: 제목 → 메타정보 → 썸네일 (순차적)

 ## 리팩토링 목표

 1. **단순함**: 각 컴포넌트는 하나의 책임만
 2. **명확성**: 모바일/데스크톱 완전 분리
 3. **유지보수성**: 각 파일 200줄 이하
 4. **버그 해결**: 모바일 오버플로우 문제 근본 해결

 ---

 ## 새 폴더 구조

 ```
 src/domains/boards/components/post/postlist/
 ├── REFACTORING_PLAN.md         # 이 파일
 │
 ├── types.ts                     # 타입 정의
 ├── utils.ts                     # 유틸 함수
 ├── hooks.ts                     # 커스텀 훅 (useIsMobile 등)
 │
 ├── components/
 │   ├── shared/
 │   │   ├── PostListSkeleton.tsx
 │   │   ├── PostListEmpty.tsx
 │   │   └── PostRenderers.tsx    # renderAuthor, renderBoardLogo 등
 │   │
 │   ├── mobile/
 │   │   ├── MobilePostItem.tsx          # 개별 아이템 (PopularPostList 스타일)
 │   │   ├── MobilePostList.tsx          # 모바일 리스트 컨테이너
 │   │   └── MobileVirtualizedItem.tsx   # react-window wrapper
 │   │
 │   └── desktop/
 │       ├── DesktopPostItem.tsx         # 테이블 row 또는 이미지형 카드
 │       ├── DesktopPostList.tsx         # 데스크톱 리스트
 │       └── DesktopVirtualizedItem.tsx
 │
 ├── PostList.tsx                 # 메인 진입점 (100줄 이하)
 └── index.ts                     # Public API
 ```

 ---

 ## 각 파일 역할 및 크기 목표

 ### 1. `types.ts` (~50줄)
 ```typescript
 export interface Post {
   id: string;
   title: string;
   board_id: string;
   board_slug: string;
   post_number: number;
   created_at: string;
   views: number;
   likes: number;
   author_nickname: string;
   comment_count: number;
   content?: string;
   // ... 등등
 }

 export interface PostListProps {
   posts: Post[];
   loading?: boolean;
   showBoard?: boolean;
   currentPostId?: string;
   emptyMessage?: string;
   headerContent?: React.ReactNode;
   footerContent?: React.ReactNode;
   className?: string;
   maxHeight?: string;
   currentBoardId: string;
   variant?: 'text' | 'image-table';
 }

 export interface PostItemProps {
   post: Post;
   isLast?: boolean;
   currentPostId?: string;
   currentBoardId: string;
   showBoard: boolean;
   variant: 'text' | 'image-table';
 }
 ```

 ### 2. `utils.ts` (~120줄)
 ```typescript
 /**
  * 게시글 콘텐츠에서 이미지, 비디오, 유튜브, 링크 포함 여부 확인
  */
 export function checkContentType(content?: string): {
   hasImage: boolean;
   hasVideo: boolean;
   hasYoutube: boolean;
   hasLink: boolean;
 } { ... }

 /**
  * 게시글 콘텐츠에서 첫 번째 이미지 URL 추출
  */
 export function extractFirstImageUrl(content?: string): string | null { ... }
 ```

 ### 3. `hooks.ts` (~50줄)
 ```typescript
 /**
  * 모바일 화면 감지 훅 (디바운스 적용)
  */
 export function useIsMobile() {
   const [isMobile, setIsMobile] = useState(false);

   useEffect(() => {
     const checkMobile = () => {
       startTransition(() => {
         setIsMobile(window.innerWidth < 640);
       });
     };

     checkMobile();

     let timeoutId: NodeJS.Timeout;
     const debouncedResize = () => {
       clearTimeout(timeoutId);
       timeoutId = setTimeout(checkMobile, 150);
     };

     window.addEventListener('resize', debouncedResize);
     return () => {
       window.removeEventListener('resize', debouncedResize);
       clearTimeout(timeoutId);
     };
   }, []);

   return isMobile;
 }
 ```

 ### 4. `components/shared/PostRenderers.tsx` (~150줄)
 ```typescript
 /**
  * 콘텐츠 타입 아이콘 렌더링 (이미지, 비디오, 유튜브, 링크)
  */
 export function renderContentTypeIcons(post: Post) { ... }

 /**
  * 사용자 아이콘 + 닉네임 렌더링
  */
 export function renderAuthor(post: Post, size: number, containerClass: string) { ... }

 /**
  * 게시판 로고 + 이름 렌더링
  */
 export function renderBoardLogo(post: Post) { ... }
 ```

 ### 5. `components/mobile/MobilePostItem.tsx` (~150줄) ⭐ 핵심
 ```typescript
 /**
  * 모바일 개별 게시글 아이템
  *
  * PopularPostList 스타일 채택:
  * - 줄 1: 제목 + 아이콘 + 댓글수 (line-clamp-1)
  * - 줄 2: 메타정보 (작성자 | 날짜 | 조회 | 추천)
  * - 줄 3: 썸네일 (image-table일 때만, 별도 줄)
  */
 export function MobilePostItem({
   post,
   isLast,
   currentPostId,
   currentBoardId,
   variant
 }: PostItemProps) {
   const isCurrentPost = post.id === currentPostId;
   const href = `/boards/${post.board_slug}/${post.post_number}?from=${currentBoardId}`;
   const formattedDate = post.formattedDate || '-';
   const thumbnailUrl = variant === 'image-table' ? extractFirstImageUrl(post.content) : null;

   return (
     <div className={`py-2 px-3 overflow-hidden ${!isLast ? 'border-b ...' : ''} ${isCurrentPost ? 'bg-[#EAEAEA] ...' : ''}`}>      
       <Link href={href} className="block">
         {/* 줄 1: 제목 + 아이콘 + 댓글 */}
         <h3 className="text-xs line-clamp-1 mb-2">
           {post.title}
           {renderContentTypeIcons(post)}
           {post.comment_count > 0 && <span>[{post.comment_count}]</span>}
         </h3>

         {/* 줄 2: 메타정보 */}
         <div className="flex items-center justify-between text-xs">
           <div>{renderAuthor(post, 20)} | {formattedDate}</div>
           <div>조회 {post.views} | 추천 {post.likes}</div>
         </div>

         {/* 줄 3: 썸네일 (image-table일 때만) */}
         {thumbnailUrl && (
           <div className="mt-2">
             <img src={thumbnailUrl} className="w-28 h-16 rounded object-cover" />
           </div>
         )}
       </Link>
     </div>
   );
 }
 ```

 ### 6. `components/mobile/MobilePostList.tsx` (~150줄)
 ```typescript
 /**
  * 모바일 게시글 리스트
  * - 30개 이하: 일반 렌더링
  * - 30개 이상: react-window 가상화
  */
 export function MobilePostList({
   posts,
   currentPostId,
   currentBoardId,
   variant = 'text',
   maxHeight
 }: PostListProps) {
   const deferredPosts = useDeferredValue(posts);
   const useVirtualization = deferredPosts.length > 30;

   if (useVirtualization) {
     return (
       <List
         height={calculateHeight(maxHeight)}
         itemCount={deferredPosts.length}
         itemSize={variant === 'image-table' ? 120 : 80}
         itemData={{ posts: deferredPosts, currentPostId, currentBoardId, variant }}
       >
         {MobileVirtualizedItem}
       </List>
     );
   }

   return (
     <div>
       {deferredPosts.map((post, index) => (
         <MobilePostItem
           key={post.id}
           post={post}
           isLast={index === deferredPosts.length - 1}
           currentPostId={currentPostId}
           currentBoardId={currentBoardId}
           variant={variant}
         />
       ))}
     </div>
   );
 }
 ```

 ### 7. `components/desktop/DesktopPostItem.tsx` (~200줄)
 ```typescript
 /**
  * 데스크톱 개별 게시글 아이템
  * - text variant: 테이블 row (<tr>)
  * - image-table variant: 카드형 (<div>)
  */
 export function DesktopPostItem({ ... }: PostItemProps) {
   if (variant === 'image-table') {
     return <ImageTableCard ... />;
   }

   return (
     <tr>
       {showBoard && <td>{renderBoardLogo(post)}</td>}
       <td>{post.title} {icons} [{comments}]</td>
       <td>{renderAuthor(post)}</td>
       <td>{formattedDate}</td>
       <td>{views}</td>
       <td>{likes}</td>
     </tr>
   );
 }
 ```

 ### 8. `components/desktop/DesktopPostList.tsx` (~150줄)
 ```typescript
 /**
  * 데스크톱 게시글 리스트
  * - text variant: 테이블 형식 (헤더 + tbody)
  * - image-table variant: 카드 리스트
  */
 export function DesktopPostList({ ... }: PostListProps) {
   const deferredPosts = useDeferredValue(posts);
   const useVirtualization = deferredPosts.length > 30;

   if (variant === 'image-table') {
     return <ImageTableList ... />;
   }

   return (
     <table>
       <thead>
         <tr>
           {showBoard && <th>게시판</th>}
           <th>제목</th>
           <th>글쓴이</th>
           <th>날짜</th>
           <th>조회</th>
           <th>추천</th>
         </tr>
       </thead>
       <tbody>
         {deferredPosts.map(...)}
       </tbody>
     </table>
   );
 }
 ```

 ### 9. `PostList.tsx` (메인 진입점, ~100줄)
 ```typescript
 /**
  * PostList 메인 컴포넌트
  * - 모바일/데스크톱 감지 후 적절한 컴포넌트 렌더링
  * - 공통 wrapper (header, footer, ScrollArea) 관리
  */
 export default function PostList({
   posts,
   loading = false,
   showBoard = true,
   currentPostId,
   emptyMessage = "게시글이 없습니다.",
   headerContent,
   footerContent,
   className = "",
   maxHeight,
   currentBoardId,
   variant = 'text'
 }: PostListProps) {
   const isMobile = useIsMobile();
   const deferredLoading = useDeferredValue(loading);

   return (
     <div className={`bg-white dark:bg-[#1D1D1D] rounded-lg border ... ${className}`}>
       {/* Header */}
       {headerContent && (
         <div className="h-12 px-4 flex items-center bg-[#F5F5F5] ...">
           {headerContent}
         </div>
       )}

       {/* Main Content */}
       <ScrollArea className="h-full" style={{ maxHeight }}>
         {deferredLoading ? (
           <PostListSkeleton />
         ) : posts.length === 0 ? (
           <PostListEmpty message={emptyMessage} />
         ) : isMobile ? (
           <MobilePostList
             posts={posts}
             currentPostId={currentPostId}
             currentBoardId={currentBoardId}
             variant={variant}
             maxHeight={maxHeight}
           />
         ) : (
           <DesktopPostList
             posts={posts}
             currentPostId={currentPostId}
             currentBoardId={currentBoardId}
             showBoard={showBoard}
             variant={variant}
             maxHeight={maxHeight}
           />
         )}
       </ScrollArea>

       {/* Footer */}
       {footerContent && <div>{footerContent}</div>}
     </div>
   );
 }
 ```

 ---

 ## 리팩토링 단계별 계획

 ### Phase 1: 기반 작업 (30분)
 - [ ] `types.ts` 작성 - 기존 타입 추출
 - [ ] `utils.ts` 작성 - checkContentType, extractFirstImageUrl
 - [ ] `hooks.ts` 작성 - useIsMobile
 - [ ] `components/shared/PostRenderers.tsx` 작성
 - [ ] `components/shared/PostListSkeleton.tsx` 작성
 - [ ] `components/shared/PostListEmpty.tsx` 작성

 ### Phase 2: 모바일 컴포넌트 (1시간) ⭐ 핵심
 - [ ] `components/mobile/MobilePostItem.tsx` - **PopularPostList 스타일 채택**
   - 간단한 구조로 오버플로우 문제 해결
   - line-clamp-1 사용
   - 썸네일을 별도 줄로 분리
 - [ ] `components/mobile/MobileVirtualizedItem.tsx`
 - [ ] `components/mobile/MobilePostList.tsx`
 - [ ] **모바일 테스트** - 긴 제목 오버플로우 확인

 ### Phase 3: 데스크톱 컴포넌트 (1시간)
 - [ ] `components/desktop/DesktopPostItem.tsx`
 - [ ] `components/desktop/DesktopVirtualizedItem.tsx`
 - [ ] `components/desktop/DesktopPostList.tsx`

 ### Phase 4: 통합 및 테스트 (30분)
 - [ ] `PostList.tsx` 새 버전 작성
 - [ ] `index.ts` 작성 (재export)
 - [ ] 기존 `PostList.tsx` → `PostList.backup.tsx` 백업
 - [ ] 새 PostList로 교체
 - [ ] 전체 테스트
   - [ ] text variant
   - [ ] image-table variant
   - [ ] showBoard true/false
   - [ ] 가상화 on/off (30개 이상)
   - [ ] 모바일/데스크톱
   - [ ] 긴 제목 오버플로우
 - [ ] 백업 파일 삭제

 ---

 ## 모바일 오버플로우 해결 전략

 ### ❌ 기존 방식 (PostList.tsx)
 ```tsx
 // 복잡한 flex 중첩 - 제어 어려움
 <div className="flex items-center gap-1">
   <div className="flex-1 min-w-0 overflow-hidden">
     <span className="truncate">{title}</span>
   </div>
   <div className="flex-shrink-0">{icons}</div>
   <div className="flex-shrink-0">{thumbnail}</div> // 공간 부족!
 </div>
 ```

 **문제:**
 - 제목 + 아이콘 + 썸네일이 한 줄에
 - 작은 화면(375px)에서 물리적 공간 부족
 - truncate가 작동 안 함

 ### ✅ 새 방식 (MobilePostItem.tsx)
 ```tsx
 // PopularPostList 스타일 - 간단하고 명확
 <div className="overflow-hidden">
   {/* 줄 1: 제목 + 아이콘 + 댓글 */}
   <h3 className="line-clamp-1">
     {title} {icons} [{comments}]
   </h3>

   {/* 줄 2: 메타정보 */}
   <div className="text-xs">
     {author} | {date} | 조회 {views} | 추천 {likes}
   </div>

   {/* 줄 3: 썸네일 (별도 줄) */}
   {variant === 'image-table' && url && (
     <div className="mt-2">
       <img src={url} className="w-28 h-16" />
     </div>
   )}
 </div>
 ```

 **장점:**
 - 한 요소에 모두 포함 → line-clamp-1 정상 작동
 - 썸네일을 별도 줄로 분리 → 공간 충분
 - 부모 컨테이너에 overflow-hidden → 확실한 방어

 ---

 ## 예상 결과

 ### Before (현재)
 ```
 PostList.tsx          973줄  ❌ 유지보수 불가능
 모바일 오버플로우     버그   ❌ 제목이 화면 밖으로
 ```

 ### After (리팩토링 후)
 ```
 📁 postlist/
   ├── types.ts                         50줄
   ├── utils.ts                        120줄
   ├── hooks.ts                         50줄
   ├── components/
   │   ├── shared/
   │   │   ├── PostRenderers.tsx       150줄
   │   │   ├── PostListSkeleton.tsx     30줄
   │   │   └── PostListEmpty.tsx        20줄
   │   ├── mobile/
   │   │   ├── MobilePostItem.tsx      150줄  ✅ PopularPostList 스타일
   │   │   ├── MobileVirtualizedItem.tsx 50줄
   │   │   └── MobilePostList.tsx      150줄
   │   └── desktop/
   │       ├── DesktopPostItem.tsx     200줄
   │       ├── DesktopVirtualizedItem.tsx 50줄
   │       └── DesktopPostList.tsx     150줄
   ├── PostList.tsx                    100줄  ✅ 간단한 진입점
   └── index.ts                         10줄

 총합: ~1280줄 (기존 973줄보다 많지만 유지보수 가능)
 각 파일: 200줄 이하 ✅
 모바일 오버플로우: 해결 ✅
 ```

 ---
## 🎉 리팩토링 완료 상태 (2025-12-22)

### ✅ 구현 완료

**전체 파일**: 15개 파일, 총 1,705줄

#### 실제 결과:

```
📁 postlist/
  ├── types.ts                         76줄  ✅
  ├── utils.ts                        273줄  ✅ (많은 유틸 함수)
  ├── hooks.ts                         51줄  ✅
  ├── constants.ts                     42줄  ✅ (추가됨)
  ├── components/
  │   ├── shared/
  │   │   ├── PostRenderers.tsx       162줄  ✅
  │   │   ├── PostListSkeleton.tsx     25줄  ✅
  │   │   └── PostListEmpty.tsx        22줄  ✅
  │   ├── mobile/
  │   │   ├── MobilePostItem.tsx      111줄  ✅ PopularPostList 스타일
  │   │   ├── MobileVirtualizedItem.tsx 121줄  ✅
  │   │   └── MobilePostList.tsx      116줄  ✅
  │   └── desktop/
  │       ├── DesktopPostItem.tsx     195줄  ✅
  │       ├── DesktopVirtualizedItem.tsx 155줄  ✅
  │       └── DesktopPostList.tsx     204줄  ✅
  ├── PostListMain.tsx                113줄  ✅ 간단한 진입점
  └── index.ts                         39줄  ✅

총합: 1,705줄
각 파일: 13/15개가 200줄 이하 (87% 달성) ✅
모바일 오버플로우: 구현 완료 (테스트 필요) ⚠️
```

### 📊 목표 달성도

| 목표 | 상태 | 비고 |
|------|------|------|
| **단순함** (각 컴포넌트는 하나의 책임만) | ✅ 100% | 완벽한 책임 분리 |
| **명확성** (모바일/데스크톱 완전 분리) | ✅ 100% | 완전 분리됨 |
| **유지보수성** (각 파일 200줄 이하) | ✅ 87% | 13/15개 파일 달성 |
| **버그 해결** (모바일 오버플로우) | ⚠️ 90% | 구현 완료, 테스트 필요 |

### ⚠️ 남은 작업

**필수 테스트** (반드시 실행 필요):
- [ ] **모바일 오버플로우 테스트** - Chrome DevTools에서 375px 화면에서 긴 제목 테스트
- [ ] **variant 전환 테스트** - text ↔ image-table 동작 확인
- [ ] **가상화 테스트** - 30개 이상 게시글에서 react-window 동작 확인
- [ ] **다크모드 테스트** - 모든 variant에서 색상 확인
- [ ] **백업 파일 삭제** - \`PostList.backup.tsx\` 제거 (테스트 후)

**선택 작업**:
- [ ] E2E 테스트 작성 (Playwright)
- [ ] Storybook 스토리 작성
- [ ] 성능 벤치마크 (기존 vs 새 버전)

### 📝 상세 검증 보고서

**→ 상세한 검증 결과는 \`REFACTORING_VERIFICATION.md\` 파일 참조**

