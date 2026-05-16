# 05. 게시글 상세 query 정리

## 문제 요약

게시판 목록 pagination의 `page`와 게시글 상세 상태의 `page`가 같은 이름으로 쓰였습니다.

이후 게시글 상세 하단 목록 상태를 `listPage`로 바꾸는 과정에서 과거 query가 일부 남아 있습니다.

## 허용 URL

게시판 목록 pagination:

```txt
/boards/{boardSlug}?page=2
```

게시글 상세 clean URL:

```txt
/boards/{postSlug}/{postNumber}
```

게시글 상세 하단 목록 상태가 URL에 꼭 필요한 경우:

```txt
/boards/{postSlug}/{postNumber}?listPage=2
```

## 비허용 URL

```txt
/boards/{postSlug}/{postNumber}?page=2
/boards/{postSlug}/{postNumber}?from={boardId}
/boards/{postSlug}/{postNumber}?page=2&listPage=3
/boards/{postSlug}/{postNumber}?from={boardId}&page=2&listPage=3
```

## 문제 지점 1. 게시글 상세 내부 링크

담당 파일:

```txt
src/domains/boards/components/post/postlist/utils.ts
```

현재 형태:

```txt
/boards/{postSlug}/{postNumber}?from={boardId}&page={currentPage}
```

원하는 형태:

```txt
/boards/{postSlug}/{postNumber}
```

## 문제 지점 2. 게시글 상세 하단 목록

담당 파일:

```txt
src/domains/boards/components/layout/PostDetailRelatedList.tsx
```

현재 문제:

```ts
url.searchParams.set("listPage", String(page));
```

수정 방향:

```ts
url.searchParams.delete("page");
url.searchParams.delete("from");
url.searchParams.delete("sort");
url.searchParams.set("listPage", String(page));
```

## 문제 지점 3. 이전글/다음글 query 전파

담당 파일:

```txt
src/app/(site)/boards/[slug]/[postNumber]/page.tsx
src/domains/boards/components/post/PostNavigation.tsx
```

현재 문제:

```ts
const detailQueryString = buildQueryString(resolvedSearchParams, ['from', 'page', 'listPage', 'sort']);
```

권장:

- 이전글/다음글은 clean URL
- `from`, `page`, `sort`, `listPage` 전파 금지

## 최종 정책

```txt
게시판 목록 page URL = 허용
게시글 상세 clean URL = 기본
게시글 상세 listPage URL = 필요 시만 허용, noindex follow
게시글 상세 page/from/sort URL = 내부 생성 금지, 외부 요청 시 clean URL로 redirect
```
