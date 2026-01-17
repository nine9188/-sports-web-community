# 핫딜 베스트 사이드바 문서

## 📋 개요

핫딜 게시판의 인기 핫딜을 사이드바에 표시하는 위젯입니다. TabsClient와 유사한 구조로 탭별로 다른 정렬 기준을 제공합니다.

**구현 완료**: 2026-01-17
**상태**: ✅ 완료

### 주요 특징
- 4개 탭 (🔥 HOT, 💰 할인율, 👍 추천수, 💬 댓글수)
- 최근 3일 기준 핫딜 표시
- 종료된 핫딜 자동 제외
- 다크 모드 지원
- 별도 쿼리 방식의 정확한 댓글 카운팅

## 🎯 기능 요구사항

### 탭 구성

1. **🔥 HOT** - 종합 인기도 (조회수 + 추천수 + 댓글수)
2. **💰 할인율** - 할인율 높은 순
3. **👍 추천수** - 추천수 많은 순
4. **💬 댓글수** - 댓글 많은 순

### 표시 정보

- 쇼핑몰 이름
- 상품명 (제목)
- 가격
- 할인율 (정가가 있는 경우)
- 통계 (탭에 따라 다름)
- 종료된 핫딜 제외

## 📂 파일 구조

```
src/domains/sidebar/
├── components/
│   └── HotdealTabsClient.tsx       # 핫딜 베스트 탭 컴포넌트
├── actions/
│   └── getHotdealBestPosts.ts      # 핫딜 베스트 데이터 가져오기
└── types/
    └── hotdeal.ts                  # 핫딜 사이드바 타입
```

## 🔧 구현 계획

### 1. 타입 정의

```typescript
// src/domains/sidebar/types/hotdeal.ts

export type HotdealTabType = 'hot' | 'discount' | 'likes' | 'comments';

export interface HotdealSidebarPost {
  id: string;
  post_number: number;
  title: string;
  board_slug: string;
  board_name: string;
  views: number;
  likes: number;
  comment_count: number;
  deal_info: {
    store: string;
    product_name: string;
    price: number;
    original_price?: number;
    is_ended: boolean;
  };
}

export interface HotdealPostsData {
  hot: HotdealSidebarPost[];
  discount: HotdealSidebarPost[];
  likes: HotdealSidebarPost[];
  comments: HotdealSidebarPost[];
  windowDays?: number;
}
```

### 2. 서버 액션

```typescript
// src/domains/sidebar/actions/getHotdealBestPosts.ts

'use server';

export async function getHotdealBestPosts(
  limit = 5,
  windowDays = 3
): Promise<HotdealPostsData> {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) return createEmptyHotdealData(windowDays);

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    // 1. HOT (조회수 + 추천수 기준)
    const { data: hotData } = await supabase
      .from('posts')
      .select('id, post_number, title, views, likes, board_id, deal_info, boards!inner(slug, name)')
      .not('deal_info', 'is', null)
      .eq('deal_info->>is_ended', 'false')
      .gte('created_at', cutoffDate.toISOString())
      .order('views', { ascending: false })
      .order('likes', { ascending: false })
      .limit(limit);

    // 2. 할인율순 (정가가 있는 것만, 클라이언트에서 정렬)
    const { data: discountData } = await supabase
      .from('posts')
      .select('...')
      .not('deal_info->>original_price', 'is', null)
      .limit(limit * 3);

    // 3. 추천수순
    const { data: likesData } = await supabase
      .from('posts')
      .select('...')
      .order('likes', { ascending: false })
      .limit(limit);

    // 4. 댓글수순 (많이 가져온 후 정렬)
    const { data: allPostsData } = await supabase
      .from('posts')
      .select('...')
      .limit(limit * 3);

    // 댓글 수 조회 (별도 쿼리)
    const commentCountMap = await fetchCommentCounts(supabase, allPostIds);

    // 데이터 포맷팅 및 정렬
    return {
      hot: hotData ? formatPosts(hotData) : [],
      discount: discountData ? sortByDiscount(formatPosts(discountData)) : [],
      likes: likesData ? formatPosts(likesData) : [],
      comments: allPostsData ? sortByComments(formatPosts(allPostsData)) : [],
      windowDays,
    };
  } catch (error) {
    console.error('[getHotdealBestPosts] 오류:', error);
    return createEmptyHotdealData(windowDays);
  }
}
```

### 3. 클라이언트 컴포넌트

```typescript
// src/domains/sidebar/components/HotdealTabsClient.tsx

'use client';

export function HotdealTabsClient({ postsData }: HotdealTabsClientProps) {
  const [activeTab, setActiveTab] = useState<HotdealTabType>('hot');

  // 현재 탭에 맞는 게시글 배열 가져오기
  const getCurrentPosts = (): HotdealSidebarPost[] => {
    return postsData[activeTab] || [];
  };

  // 탭에 따른 통계 표시
  const renderStats = (post: HotdealSidebarPost) => {
    const discountRate = getDiscountRate(
      post.deal_info.price,
      post.deal_info.original_price
    );

    if (activeTab === 'hot') {
      return (
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-0.5" />
            {post.views}
          </span>
          <span className="flex items-center">
            <ThumbsUp className="h-3 w-3 mr-0.5" />
            {post.likes}
          </span>
        </div>
      );
    } else if (activeTab === 'discount') {
      return discountRate ? (
        <span className="text-orange-600 dark:text-orange-400 font-bold text-xs">
          {discountRate}%↓
        </span>
      ) : null;
    } else if (activeTab === 'likes') {
      return (
        <span className="text-gray-500 dark:text-gray-400 text-[10px] flex items-center">
          <ThumbsUp className="h-3 w-3 mr-0.5" />
          {post.likes}
        </span>
      );
    } else if (activeTab === 'comments') {
      return (
        <span className="text-gray-500 dark:text-gray-400 text-[10px] flex items-center">
          <MessageSquare className="h-3 w-3 mr-0.5" />
          {post.comment_count || 0}
        </span>
      );
    }
    return null;
  };

  const currentPosts = getCurrentPosts();

  return (
    <div className="mb-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0">
      {/* 헤더 */}
      <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center border-b border-black/5 dark:border-white/10 rounded-t-lg">
        <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">핫딜 베스트</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          {postsData.windowDays ? `최근 ${postsData.windowDays}일 기준` : '최근 3일 기준'}
        </span>
      </div>

      {/* 탭 (🔥 HOT, 💰 할인율, 👍 추천수, 💬 댓글수) */}
      <div className="flex border-b border-black/5 dark:border-white/10">
        {[
          { id: 'hot', label: 'HOT', icon: <Flame className="h-3 w-3 mr-0.5" /> },
          { id: 'discount', label: '할인율', icon: <Percent className="h-3 w-3 mr-0.5" /> },
          { id: 'likes', label: '추천수', icon: <ThumbsUp className="h-3 w-3 mr-0.5" /> },
          { id: 'comments', label: '댓글수', icon: <MessageSquare className="h-3 w-3 mr-0.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as HotdealTabType)}
            className={`flex-1 text-xs py-2 px-2 flex items-center justify-center transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-medium border-b-2 border-slate-800 dark:border-white'
                : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 게시글 리스트 */}
      <div>
        {currentPosts.length === 0 ? (
          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
            핫딜이 없습니다.
          </div>
        ) : (
          <ul>
            {currentPosts.map((post, index) => {
              const discountRate = getDiscountRate(
                post.deal_info.price,
                post.deal_info.original_price
              );

              return (
                <li
                  key={post.id}
                  className={
                    index < currentPosts.length - 1
                      ? 'border-b border-black/5 dark:border-white/10'
                      : ''
                  }
                >
                  <Link
                    href={`/boards/${post.board_slug}/${post.post_number}?from=hotdeal-best`}
                    className="block px-3 py-2.5 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors overflow-hidden"
                  >
                    {/* 제목 */}
                    <div className="text-xs text-gray-900 dark:text-[#F0F0F0] truncate mb-1">
                      {post.title}
                    </div>

                    {/* 쇼핑몰 + 가격 + 할인율 */}
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-gray-500 dark:text-gray-400">
                        {post.deal_info.store}
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        {formatPrice(post.deal_info.price)}
                      </span>
                      {discountRate && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          {discountRate}%↓
                        </span>
                      )}
                      <span className="ml-auto">
                        {renderStats(post)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
```

## 🎨 UI 설계

### 레이아웃

```
┌─────────────────────────────────┐
│ 핫딜 베스트        최근 3일 기준  │
├─────────────────────────────────┤
│ 🔥 HOT │ 💰 할인율 │ 👍 추천 │ 💬 댓글 │
├─────────────────────────────────┤
│ [쿠팡] LG 통돌이 세탁기           │
│ 11,900원  26%↓  👍 23            │
├─────────────────────────────────┤
│ [네이버] 농부창고 참기름          │
│ 11,160원  무료배송  👍 18        │
├─────────────────────────────────┤
│ ...                             │
└─────────────────────────────────┘
```

### 탭별 표시 정보

**모든 탭 공통**:
- 제목 (한 줄, truncate)
- 쇼핑몰 이름
- 가격 (빨간색, 굵게)
- 할인율 (정가가 있는 경우, 주황색)

**탭별 추가 통계 (우측)**:

**🔥 HOT 탭**:
- 👁️ 조회수 + 👍 추천수 아이콘과 숫자

**💰 할인율 탭**:
- 할인율 강조 표시 (예: `26%↓`)

**👍 추천수 탭**:
- 👍 추천수 아이콘과 숫자

**💬 댓글수 탭**:
- 💬 댓글 아이콘과 숫자

## 📊 정렬 로직

### 1. HOT 탭 (조회수 + 추천수 기준)

```typescript
// DB에서 직접 정렬
.order('views', { ascending: false })
.order('likes', { ascending: false })
.limit(5)
```

### 2. 할인율 탭

```typescript
// DB에서 많이 가져온 후 클라이언트에서 정렬
const sortByDiscount = (posts) => {
  return posts
    .map((post) => {
      const { price, original_price } = post.deal_info;
      const discountRate =
        original_price && original_price > price
          ? ((original_price - price) / original_price) * 100
          : 0;
      return { ...post, discountRate };
    })
    .sort((a, b) => (b.discountRate || 0) - (a.discountRate || 0))
    .slice(0, 5);
};
```

### 3. 추천수 탭

```typescript
// DB에서 직접 정렬
.order('likes', { ascending: false })
.limit(5)
```

### 4. 댓글수 탭

```typescript
// ⚠️ 중요: Supabase 집계 함수 사용 불가
// 댓글을 별도 쿼리로 조회 후 수동 카운팅

// 1. 게시글 조회
const { data: allPostsData } = await supabase
  .from('posts')
  .select('id, post_number, title, views, likes, board_id, deal_info, boards!inner(slug, name)')
  .not('deal_info', 'is', null)
  .eq('deal_info->>is_ended', 'false')
  .gte('created_at', cutoffDate.toISOString())
  .limit(15); // 여유있게 가져옴

// 2. 댓글 수 조회 (별도 쿼리)
const { data: commentCounts } = await supabase
  .from('comments')
  .select('post_id')
  .in('post_id', postIds)
  .eq('is_hidden', false)
  .eq('is_deleted', false);

// 3. 수동 카운팅
const commentCountMap = {};
commentCounts.forEach((comment) => {
  if (comment.post_id) {
    commentCountMap[comment.post_id] = (commentCountMap[comment.post_id] || 0) + 1;
  }
});

// 4. 클라이언트 정렬
const sortByComments = (posts) => {
  return posts
    .sort((a, b) => b.comment_count - a.comment_count)
    .slice(0, 5);
};
```

**참고**: `fetchCommentCounts` 헬퍼 함수 패턴 사용 (src/domains/boards/actions/posts/fetchPostsHelpers.ts:195-223)

## 🔄 데이터 갱신

- **기준 기간**: 최근 3일
- **제외 조건**: `is_ended = true` (종료된 핫딜)
- **기본 개수**: 5개
- **캐시**: 서버 컴포넌트에서 fetch (revalidate: 300 / 5분)

## 📝 구현 상태

- [x] 타입 정의 작성 (src/domains/sidebar/types/hotdeal.ts)
- [x] 서버 액션 구현 (src/domains/sidebar/actions/getHotdealBestPosts.ts)
- [x] HotdealTabsClient 컴포넌트 작성 (src/domains/sidebar/components/HotdealTabsClient.tsx)
- [x] 사이드바 통합 (src/domains/sidebar/components/RightSidebar.tsx)
- [x] 할인율순 정렬 로직 구현
- [x] 댓글수순 정렬 로직 구현 (별도 쿼리 방식)
- [x] 스타일 조정
- [x] 테스트 데이터 생성 (10개 핫딜 게시글 + 댓글)

## 🚀 통합 위치

```typescript
// src/domains/sidebar/components/RightSidebar.tsx

import { HotdealTabsClient } from './HotdealTabsClient';
import { getHotdealBestPosts } from '../actions/getHotdealBestPosts';

export default async function RightSidebar() {
  try {
    const [viewsData, likesData, commentsData, hotData, hotdealData] = await Promise.all([
      getCachedTopicPosts('views'),
      getCachedTopicPosts('likes'),
      getCachedTopicPosts('comments'),
      getHotPosts({ limit: 20 }),
      getHotdealBestPosts(5, 3) // 5개, 최근 3일
    ]);

    const postsData = {
      views: viewsData,
      likes: likesData,
      comments: commentsData,
      hot: hotData.posts,
      windowDays: hotData.windowDays
    };

    return (
      <aside className="hidden xl:block w-[300px] shrink-0">
        <div className="h-full pt-4">
          <TopicTabsClient postsData={postsData} />
          <HotdealTabsClient postsData={hotdealData} /> {/* 추가됨 */}
        </div>
      </aside>
    );
  } catch {
    // 에러 시 빈 데이터로 렌더링
  }
}
```

## 🐛 해결된 이슈

### 댓글 카운팅 문제

**문제**: 댓글 탭에서 댓글 수가 0으로 표시되는 문제

**원인**:
- Supabase aggregate 함수 `comments:comments(count)` 사용 시 제대로 작동하지 않음
- 잘못된 파싱 로직: `Array.isArray(item.comments) ? item.comments.length : 0`

**해결**:
- `fetchCommentCounts` 헬퍼 패턴 적용
- 별도 쿼리로 댓글 조회 후 수동 카운팅
- `is_hidden = false` 및 `is_deleted = false` 필터 추가

---

**작성일**: 2026-01-16
**최종 수정일**: 2026-01-17
**버전**: 1.1.0
