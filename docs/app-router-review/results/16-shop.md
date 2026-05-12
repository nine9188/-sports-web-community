# 16. Shop public pages

대상 route:
- `/shop`
- `/shop/[category]`

관련 파일:
- `src/app/(site)/shop/page.tsx`
- `src/app/(site)/shop/[category]/page.tsx`
- `src/app/(site)/shop/sitemap.ts`
- `src/shared/seo/sitemap.ts`
- `src/domains/shop/actions/actions.ts`
- `src/domains/shop/components/CategoryFilter.tsx`
- `src/domains/shop/components/ItemGrid.tsx`
- `src/domains/shop/components/ItemCard.tsx`
- `src/domains/shop/components/PurchaseModal.tsx`
- `src/domains/shop/components/EmoticonShopSection.tsx`
- `src/domains/shop/components/EmoticonPackCard.tsx`
- `src/domains/shop/components/EmoticonPackDetailModal.tsx`
- `src/domains/boards/actions/emoticons.ts`
- `src/domains/boards/hooks/useEmoticonQueries.ts`

## 점검 기준

- `/shop`과 `/shop/[category]`가 기본적으로 Server Component인지 확인한다.
- 상점 목록의 초기 HTML이 서버에서 준비되는지 확인한다.
- category, cat, page 같은 상태 URL이 canonical / robots 정책과 분리되는지 확인한다.
- `generateMetadata()`와 page 본문이 같은 카테고리 / 아이템 데이터를 중복 조회하지 않는지 확인한다.
- 구매 모달, 보유 여부, 포인트 표시처럼 사용자별 상호작용만 client island로 남기는지 확인한다.
- sitemap에 들어가는 shop category URL과 실제 page의 index 정책이 어긋나지 않는지 확인한다.

## 발견한 문제

### 1. `/shop?cat=...` / `/shop?page=...` 상태 URL이 검색 정책에서 분리되지 않았다

`src/app/(site)/shop/page.tsx`의 `generateMetadata()`는 `searchParams`를 받지 않는다.

하지만 `/shop`은 `cat` query를 읽어서 초기 카테고리를 바꾼다.
`CategoryFilter`도 `cat`을 URL 상태로 사용하고, 내부에서 `window.history.replaceState()`로 query를 갱신한다.

문제 사례:
- `/shop?cat=25`
- `/shop?cat=emoticon-packs`
- `/shop?page=2`

이 URL들은 canonical은 `/shop`으로 묶이지만 `noindex`가 없다.
특히 `page=2`는 현재 root page에서 서버 데이터 의미를 바꾸지 않으므로 base URL과 중복될 수 있다.

### 2. `/shop/[category]`는 metadata와 page 본문이 같은 데이터를 중복 조회한다

`src/app/(site)/shop/[category]/page.tsx`의 `generateMetadata()`는 다음을 조회한다.
- `getShopCategory(category)`
- `getCategoryItemsPaginated(allCategoryIds, 1, 1)`로 item count 확인

page 본문도 다시 다음을 조회한다.
- `getShopCategory(category)`
- `getCategoryItemsPaginated(categoryIdsForFetch, page, pageSize)`

같은 request 안에서 카테고리 조회가 중복되고, 기본 카테고리 URL에서는 item count 성격의 조회도 겹친다.
`getShopCategory()`와 공개 아이템 조회는 요청 단위 `cache()`로 묶거나, page에서 이미 계산한 결과를 재사용하는 구조가 필요하다.

### 3. `/shop/[category]`의 `page` query 정규화가 약하다

현재 page 계산은 다음 형태다.

`Math.max(1, Number(pageParam ?? "1") || 1)`

문제 사례:
- `page=1.5` → 정수로 정리되지 않는다.
- `page=999999` → 과도한 offset 요청이 가능하다.
- `page=abc`는 1로 떨어지지만, 정규화 기준이 명확하지 않다.

검색 14번에서 정리한 것처럼 `page`는 정수, 최소 1 기준으로 정규화해야 한다.
필요하면 실제 `totalPages`를 넘는 값은 마지막 페이지로 redirect하거나 noindex 상태로만 둔다.

### 4. `/shop` root가 모든 아이템을 크게 가져온 뒤 client에서 필터링한다

`/shop`은 활성 root/child category id를 모두 모은 뒤 `getCategoryItemsPaginated(initialCategoryIds, 1, 500)`을 호출한다.
그 다음 `CategoryFilter`에서 client-side로 탭, 카테고리, pagination을 처리한다.

문제는 다음과 같다.
- 첫 요청에서 필요 없는 카테고리 아이템까지 최대 500개를 가져온다.
- `cat` 상태가 URL에 있어도 서버 fetch 범위는 줄지 않는다.
- 이모티콘 탭은 `EmoticonShopSection`이 별도 client fetch를 하므로 root에서 가져온 아이템과 역할이 겹친다.
- root 상점이 사용자별 포인트/보유 아이템 때문에 `force-dynamic`인 상태에서 공개 아이템 목록까지 매번 같이 동적으로 묶인다.

수정 방향은 서버가 `cat`과 `page`를 정규화해서 현재 필요한 아이템만 가져오고, 구매/보유 상태만 client island로 남기는 쪽이다.

### 5. `CategoryFilter` 아래 목록 전체가 큰 client boundary다

`CategoryFilter`, `ItemGrid`, `ItemCard`가 모두 client component다.
구매 모달, 버튼 클릭, 모바일 펼침, 포인트 차감 optimistic update는 client가 필요하다.

하지만 다음 영역은 서버에서 렌더링할 수 있다.
- 탭 / 카테고리 링크의 기본 HTML
- 아이템 카드의 이름, 이미지, 가격, 기본/보유 상태 표시
- 빈 목록 메시지
- page 기반 pagination 링크

현재는 아이템 목록 표시 자체가 전부 client boundary 안에 들어가 있어 hydration 범위가 크다.

### 6. 이모티콘 상점 탭은 초기 HTML 없이 client에서 다시 조회한다

`EmoticonShopSection`은 `useEmoticonShopData()`로 mount 이후 `getEmoticonShopData()` server action을 호출한다.

문제는 다음과 같다.
- 이모티콘 탭 첫 HTML에는 실제 팩 목록이 없다.
- `/shop?cat=<emoticonCategoryId>`처럼 이모티콘 탭을 직접 열어도 서버에서 팩 목록을 준비하지 않는다.
- page에서 이미 사용자 포인트와 보유 아이템을 조회했는데, `getEmoticonShopData()`가 다시 사용자와 포인트/보유 팩을 조회한다.

이모티콘 팩 목록은 서버에서 초기 데이터로 준비하고, 상세 모달/구매만 client island로 남기는 구조가 맞다.

### 7. broad catch가 page error를 200 fallback으로 숨긴다

`/shop`과 `/shop/[category]` page 본문은 전체를 `try/catch`로 감싸고, 오류가 나면 fallback UI를 직접 반환한다.

문제는 다음과 같다.
- 실제 서버 데이터 오류가 `error.tsx`로 가지 않는다.
- 실패한 HTML이 200 응답으로 노출될 수 있다.
- 검색 가능한 shop page에서 일시 오류 화면이 정상 page처럼 보일 수 있다.

이미 `src/app/(site)/shop/error.tsx`가 있으므로, 치명적인 조회 오류는 error boundary로 보내는 편이 낫다.

### 8. shop sitemap이 noindex category를 포함할 수 있다

`getShopSitemap()`은 활성 `shop_categories`의 slug만 보고 `/shop/[slug]`를 sitemap에 넣는다.
반면 `/shop/[category]` metadata는 해당 category의 active item count가 0이면 `noindex`를 반환한다.

즉 sitemap에는 포함되지만 실제 page metadata는 noindex인 URL이 생길 수 있다.
sitemap 생성 기준도 active item이 있는 category로 맞추거나, noindex 정책과 일치시켜야 한다.

### 9. 모든 일반 아이템 이미지가 eager loading이다

`ItemCard`는 모든 일반 아이템 이미지에 `loading="eager"`를 사용한다.
상점 grid는 여러 카드가 동시에 노출되므로 모든 이미지를 eager로 두면 초기 네트워크 비용이 커질 수 있다.

LCP 후보가 아닌 카드 이미지는 기본 lazy로 두고, 필요한 첫 몇 개만 우선순위를 주는 쪽이 더 안전하다.

## 확인 결과

- `/shop` page 자체는 Server Component다.
- `/shop/[category]` page 자체도 Server Component다.
- `/shop/[category]`는 `cat` 또는 `page` query가 있으면 `noindex`를 넣고 있다.
- `/shop`은 query가 있어도 `noindex`를 넣지 않는다.
- `/shop` 하위에 별도 `loading.tsx`는 없다.
- `/shop/error.tsx`는 존재하지만 page 본문의 broad catch 때문에 일부 오류는 error boundary로 가지 않는다.
- `/shop/sitemap.xml`은 존재하고 robots.txt에도 shop sitemap이 등록되어 있다.
- `prefetch={false}`는 studio 링크, category card 등 비용이 있는 shop 이동에 일부 적용되어 있다.

## 수정 내용

### 1. `/shop` query URL `noindex` 분리 완료

`generateMetadata({ searchParams })`로 바꾸고, `cat`이나 `page`가 있으면 `noindex`를 넣도록 수정했다.
canonical은 계속 `/shop`으로 유지한다.

### 2. `page` query 정규화 완료

`/shop`과 `/shop/[category]`에서 page를 다음 기준으로 정리하도록 helper를 추가했다.
- 숫자가 아니면 `1`
- 정수가 아니면 정수로 정리
- 1보다 작으면 `1`

정규화된 page만 서버 조회와 URL pagination에 사용한다.

### 3. 공개 shop 조회 함수 요청 단위 cache 적용 완료

다음 조회를 React `cache()`로 묶었다.
- `getShopCategories()`
- `getShopCategory(slug)`
- `getCategoryItemsPaginated(categoryIds, page, pageSize)`

`getCategoryItemsPaginated()`는 category id 배열을 정렬된 key로 바꾼 뒤 cached function으로 넘겨서 같은 category/page/pageSize 조합을 재사용하게 했다.
구매 액션인 `purchaseItem()`은 캐시 대상이 아니다.

### 4. `/shop` root의 현재 카테고리 fetch 범위 축소 완료

root page도 `cat`과 `page`를 서버에서 읽고, 현재 탭/카테고리에 필요한 아이템만 가져오도록 바꿨다.
기존의 전체 500개 선조회는 제거했다.

탭/카테고리 이동은 URL 기반 서버 재조회로 바꿨다.
상태 URL은 noindex로 묶고, canonical은 `/shop` 또는 `/shop/[category]` 기본 URL로 둔다.

### 5. shop 목록 데이터 경로를 server-driven으로 축소 완료

`CategoryFilter`가 더 이상 전체 아이템을 받아 client에서 모든 탭/카테고리를 필터링하는 구조에 의존하지 않게 했다.
서버에서 현재 `cat` / `page`에 맞는 `items`, `totalPages`, `currentPage`를 계산해서 넘긴다.

구매 상태 변경은 기존 `PurchaseModal` / `useShopItems` 계열 client island를 유지했다.
카드 렌더링 자체를 완전히 Server Component로 쪼개는 작업은 `ItemCard`의 팀명 매핑 context와 구매 상호작용이 얽혀 있어 별도 refactor 후보로 남긴다.

### 6. 이모티콘 탭 초기 데이터 서버 준비 완료

`/shop?cat=<emoticonCategoryId>`로 이모티콘 탭에 직접 진입하면 page 서버 컴포넌트에서 `getEmoticonShopData()`를 먼저 호출해 `EmoticonShopSection`에 초기 데이터로 넘긴다.
`useEmoticonShopData()`는 `initialData`가 있으면 mount 직후 같은 데이터를 다시 조회하지 않도록 옵션을 추가했다.

상세 모달과 구매 처리는 기존 client island를 유지한다.

### 7. page-level broad catch 제거 완료

`/shop`과 `/shop/[category]` page 본문의 broad `try/catch`를 제거했다.
실제 조회 예외는 `src/app/(site)/shop/error.tsx`가 받도록 하고, 복구 가능한 빈 데이터만 UI에서 처리한다.

### 8. shop sitemap과 noindex 정책 정합성 개선 완료

`getShopSitemap()`이 active category만 보는 대신, active item이 연결된 category와 그 parent category만 sitemap에 넣도록 바꿨다.
아이템이 없는 category가 sitemap에는 들어가고 page metadata에서는 noindex가 되는 불일치를 줄였다.

### 9. item image loading 전략 조정 완료

`ItemCard`의 모든 이미지에 걸려 있던 `loading="eager"`를 제거했다.
일반 카드 이미지는 기본 lazy loading 전략을 따르게 했다.

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과
- `/shop` 기본 URL은 indexable metadata를 유지한다.
- `/shop?cat=...`와 `/shop?page=...`는 metadata에서 `noindex`로 분리된다.
- `/shop/[category]?page=2`는 정규화된 page 값으로 서버 조회한다.
- `/shop?cat=<emoticonCategoryId>`는 이모티콘 탭 초기 데이터를 서버에서 준비한다.
- shop sitemap은 active item이 연결된 category 기준으로 생성한다.

빌드 중 sitemap, API-Football, AllPostsWidget 외부 fetch 경고가 있었지만 빌드 자체는 성공했다.
해당 경고는 이번 상점 페이지 수정 범위의 실패가 아니라 기존 빌드 시점 외부 fetch 문제로 보인다.

## 결론

16번 상점 공개 페이지는 수정 완료했다.
핵심 수정은 `/shop` query noindex, page 정규화, 공개 shop 조회 캐시, root fetch 범위 축소, URL 기반 서버 재조회, 이모티콘 탭 초기 데이터 전달, broad catch 제거, sitemap/noindex 정책 정합성 개선, item image eager 제거다.
카드 렌더링 자체를 완전한 server shell + 작은 purchase island로 더 쪼개는 작업은 별도 구조 refactor 후보로 남긴다.
