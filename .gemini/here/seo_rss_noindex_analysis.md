# RSS 게시글 구글 저품질(Search Penalty) 방지를 위한 noindex 검토 및 적용 계획

외부 RSS 피드를 통해 자동으로 가져오는 뉴스 콘텐츠는 동일한 내용이 다수의 언론사 및 포털(네이버, 다음 등)에 이미 인덱싱되어 있기 때문에, 구글 검색 엔진에서 **중복 콘텐츠(Duplicate Content)** 또는 **수집된 콘텐츠(Scraped Content)**로 감지되어 사이트 전체의 품질 평가에 악영향을 미칠 수 있습니다.

이 보고서에서는 RSS 게시글의 구글 저품질 문제를 해결하기 위한 방안을 검토하고 구체적인 적용 계획을 제시합니다.

---

## 1. 문제 분석 및 영향

### 1) 중복 콘텐츠 페널티 (Helpful Content Update)
* 구글은 독창적인 가치나 추가 정보 없이 타사 콘텐츠를 긁어와 게시하는 페이지가 도메인 내에 높은 비중을 차지할 경우, **도메인 전체의 검색 노출 순위(Domain Authority)**를 떨어뜨리는 알고리즘(도움이 되는 콘텐츠 업데이트)을 적용하고 있습니다.
* 현재 데이터베이스에 다수의 국내/해외 뉴스 게시글이 자동으로 쌓이고 있어, 고유 콘텐츠(예측 분석, 커뮤니티 자유 게시판 등)의 랭킹까지 함께 저하될 위험이 있습니다.

### 2) 크롤링 예산(Crawl Budget) 낭비
* 구글봇이 고유한 가치가 있는 분석 페이지나 활발한 커뮤니티 페이지를 크롤링하는 대신, 수천 개의 중복 뉴스 페이지를 크롤링하는 데 예산을 낭비하게 됩니다.

---

## 2. 해결 방안 비교

### 방안 A: RSS 게시판 전체에 `noindex, follow` 적용 (추천)
* **적용 방식**: RSS 수집 대상 게시판(`foreign-news`, `domestic-news`, `news`)의 목록 및 상세 페이지 메타데이터에 `<meta name="robots" content="noindex, follow">` 태그를 삽입합니다.
* **장점**:
  * 구글이 해당 뉴스 페이지들을 색인(Index)에서 완전히 제외하므로 중복 콘텐츠 페널티가 즉각 해소됩니다.
  * `follow` 설정을 유지하므로, 구글봇이 뉴스 본문 내의 내부 링크(팀 페이지, 선수 페이지 등)를 타고 이동하여 사이트 내 다른 주요 페이지들을 발견하고 가치를 전달(Link Juice)할 수 있습니다.
* **단점**: 구글 검색을 통한 해당 뉴스 단독 키워드의 유입은 중단됩니다. (단, 중복 뉴스글은 원래도 구글 상위 노출이 불가능에 가깝습니다.)

### 방안 B: 원본 출처로 `canonical` (표준 URL) 지정
* **적용 방식**: 메타데이터의 `canonical` URL을 우리 사이트의 경로가 아닌 원본 뉴스의 URL(예: `https://news.naver.com/...`)로 설정합니다.
* **장점**: 구글에 원본 글의 출처가 어디인지 명시적으로 알려줍니다.
* **단점**:
  * 크로스 도메인 표준화(Cross-domain Canonical)는 구글이 힌트로만 취급할 뿐 100% 보장되지 않으며, 크롤러가 여전히 페이지를 계속 크롤링하여 예산을 소모합니다.
  * 소스 URL(`source_url`)이 누락되었거나 파싱 오류가 있는 게시글의 경우 예외 처리가 필요합니다.

---

## 3. 권장 솔루션: 방안 A (`noindex, follow`) 적용

사이트 전체의 SEO 안전성을 확보하고 검색 엔진 최적화 랭킹을 보호하기 위해 **방안 A (`noindex, follow`)**를 적용하는 것이 가장 안전하고 효과적인 조치입니다.

### 적용 대상 게시판 (RSS 수집 게시판)
1. **해외 뉴스 (`foreign-news`)**
2. **축구 소식 (`news`)**
3. **국내 뉴스 (`domestic-news`)**

---

## 4. 구체적인 코드 수정 계획

### 1) 상세 게시글 페이지 ([src/app/(site)/boards/[slug]/[postNumber]/page.tsx](file:///home/kim/web2/src/app/(site)/boards/[slug]/[postNumber]/page.tsx))
상세 페이지의 `generateMetadata` 함수에서 RSS 게시판에 해당하는 경우 `robots: { index: false, follow: true }` 메타 태그를 반환하도록 수정합니다.

```diff
  const isRssBoard = ['foreign-news', 'domestic-news', 'news'].includes(slug);
  const robots = isRssBoard 
    ? { index: false, follow: true } 
    : (hasListState ? { index: false, follow: true } : undefined);

  return buildMetadata({
    title: displayTitle,
    titleOnly: true,
    description,
    path: `/boards/${slug}/${postNumber}`,
    type: 'article',
    image: post.thumbnail_url ?? undefined,
    publishedTime: post.created_at ?? undefined,
    modifiedTime: post.updated_at ?? undefined,
    keywords,
    includeSiteKeywords: false,
    includeDefaultOgFallbacks: false,
-   ...(hasListState && { robots: { index: false, follow: true } }),
+   ...(robots && { robots }),
  });
```

### 2) 게시판 목록 페이지 ([src/app/(site)/boards/[slug]/page.tsx](file:///home/kim/web2/src/app/(site)/boards/[slug]/page.tsx))
목록 페이지의 `generateMetadata` 함수도 RSS 게시판일 경우 `noindex, follow`를 설정하도록 수정합니다.

```diff
  const seo = getBoardSeoData(slug, board.name, parentBoardName);
+ const isRssBoard = ['foreign-news', 'domestic-news', 'news'].includes(slug);
+ const robots = isRssBoard 
+   ? { index: false, follow: true }
+   : metadataState.robots;

  return buildMetadata({
    title: seo.title,
    description: board.description ? `${board.description} 축구 커뮤니티 4590 Football.` : seo.desc,
    path: metadataState.path,
    keywords: seo.keywords,
-   ...(metadataState.robots && { robots: metadataState.robots }),
+   ...(robots && { robots }),
  });
```
