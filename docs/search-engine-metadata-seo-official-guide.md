# Search Engine Metadata SEO Official Guide

작성일: 2026-05-25

이 문서는 Google, Bing, 네이버, 다음의 공식 문서 또는 공식 블로그 기준으로 `title`, `meta description`, `meta keywords`, Open Graph, robots meta가 SEO와 검색 결과 노출에 어떻게 쓰이는지 정리한다.

기존 SEO 복구 문서와 별개로, 실제 메타데이터 운영 기준을 정하기 위한 새 문서다.

## 결론

1. `title`은 모든 검색엔진에서 중요하다.
2. `meta description`은 직접 순위 상승 태그라기보다 검색 결과 스니펫 후보와 클릭률 개선에 중요하다.
3. `meta keywords`는 Google과 Bing에서는 SEO 랭킹 가치가 없다고 보는 것이 맞다.
4. 네이버와 다음도 키워드 반복, 스팸성 키워드, 인기 키워드 끼워넣기를 부정적으로 본다.
5. 검색엔진별로 `robots` 제어는 어느 정도 다르게 줄 수 있지만, `title`/`description`을 검색엔진별로 다르게 지정하는 표준 태그는 없다.
6. 따라서 페이지별 HTML에는 모든 검색엔진이 이해할 수 있는 하나의 고유한 `title`, 하나의 고유한 `description`, 일관된 `og:title`/`og:description`을 넣는 것이 기본 전략이다.

## 검색엔진별 공식 기준

| 검색엔진 | title | meta description | meta keywords | Open Graph | robots meta |
| --- | --- | --- | --- | --- | --- |
| Google | 중요. `<title>`, H1, `og:title`, prominent text, 앵커 텍스트 등을 종합해 title link 생성 | 스니펫 후보. 페이지 내용이 더 적합하면 다른 본문을 쓸 수 있음 | 사용하지 않음. 색인/랭킹 영향 없음 | `og:title`이 title link 후보 중 하나 | `robots`, `googlebot`, `googlebot-news` 등 지원 |
| Bing | 중요. HTML title 외에도 OG, prominent text, 외부 앵커 등을 참고할 수 있음 | on-page SEO 기본 요소로 언급 | 공식 블로그에서 SEO 부스터로는 죽었다고 설명 | title 선택에 참고 가능 | `robots` 계열 제어와 Bing Webmaster 진단 사용 |
| 네이버 | 중요. 정확하고 고유한 제목 권장. 중복 title 문제로 진단 | 고유한 요약 권장. 중복 description은 노출에 영향 가능 | 별도 랭킹 가중 공식은 확인 안 됨. 반복/스팸 키워드 나열은 불리 | `og:title`, `og:description`도 검색 결과 제목/설명 후보 | `robots noindex` 안내 있음 |
| 다음 | 검색등록 기준에서는 사이트 제목/설명 기준이 별도로 강함 | 검색등록 설명문 기준 존재 | 검색빈도 높은 키워드 끼워넣기, 반복은 반영 안 될 수 있음 | 공식 검색등록 문서에서는 OG의 웹문서 반영 기준 확인 못 함 | `robots noindex,nofollow` 안내 있음 |

## Google

### Title

공식 문서:

- https://developers.google.com/search/docs/appearance/title-link

핵심:

- Google 검색 결과의 title link는 완전 자동 생성이다.
- `<title>`만 보는 것이 아니라 다음을 함께 참고한다.
  - `<title>`
  - 페이지의 주요 시각 제목
  - H1 등 heading
  - `og:title`
  - 크게/두드러지게 표시된 본문 텍스트
  - 페이지 내 다른 텍스트
  - 페이지 내 앵커 텍스트
  - 외부에서 해당 페이지로 연결되는 링크 텍스트
  - `WebSite` structured data
- 페이지별로 고유하고 명확하고 간결한 title을 써야 한다.
- 너무 길거나 반복적인 title은 좋지 않다.
- 키워드 스터핑은 검색 결과를 스팸처럼 보이게 할 수 있다.

### Meta Description

공식 문서:

- https://developers.google.com/search/docs/appearance/snippet

핵심:

- Google은 스니펫을 주로 페이지 본문에서 자동 생성한다.
- 다만 `<meta name="description">`이 페이지를 더 정확하게 설명한다고 판단하면 스니펫으로 사용할 수 있다.
- 검색어에 따라 같은 URL도 다른 스니펫이 표시될 수 있다.
- 페이지별 고유 description이 권장된다.
- 긴 키워드 나열 형태의 description은 사용자가 내용을 이해하기 어렵고, 스니펫으로 덜 선택될 수 있다.

### Meta Keywords

공식 문서:

- https://developers.google.com/search/docs/crawling-indexing/special-tags

핵심:

- `<meta name="keywords" content="...">`는 Google Search에서 사용하지 않는다.
- 색인과 랭킹에 영향이 없다.

따라서 Google 기준으로는 `keywords` 배열을 아무리 늘려도 순위 상승을 기대하면 안 된다.

### Robots Meta

공식 문서:

- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag

핵심:

- 모든 검색엔진 대상:

```html
<meta name="robots" content="noindex">
```

- Google 웹 검색 대상:

```html
<meta name="googlebot" content="nosnippet">
```

- Google News 대상:

```html
<meta name="googlebot-news" content="nosnippet">
```

- 여러 crawler별 지시를 동시에 둘 수 있다.

```html
<meta name="googlebot" content="notranslate">
<meta name="googlebot-news" content="nosnippet">
```

주의:

- Google이 해당 meta를 읽으려면 robots.txt로 크롤링을 막으면 안 된다.
- `noindex`를 적용하려면 crawler가 페이지 HTML을 볼 수 있어야 한다.

## Bing

### Title

공식 블로그:

- https://blogs.bing.com/webmaster/June-2014/How-Does-Bing-Choose-The-Title-For-My-Web-Page

핵심:

- Bing도 HTML title을 그대로 보여준다고 보장하지 않는다.
- Bing은 사용자 검색 의도에 맞게 title, snippet, display URL을 최적화한다.
- title 선택 시 다음을 참고할 수 있다.
  - HTML title
  - Open Graph annotation
  - 페이지의 prominent text
  - 외부 anchor text
  - 외부 디렉토리/데이터 소스
- title은 검색자가 사용할 query와 관련 있어야 한다.
- 너무 길거나 반복적이면 좋지 않다.
- `Home`, `About Us` 같은 generic title은 피해야 한다.
- Open Graph를 넣는다면 원하는 title과 일관되게 맞춰야 한다.

### Meta Description / H1 / On-page SEO

공식 블로그:

- https://blogs.bing.com/webmaster/August-2012/The-Secret-Sauce-of-SEO

핵심:

- Bing 공식 블로그는 기본 on-page SEO 요소로 `<title>`, `<meta description>`, H1, ALT, 페이지 속도, 콘텐츠 깊이 등을 언급한다.
- 키워드 리서치를 통해 사람들이 실제 검색하는 phrase를 이해하고 콘텐츠 계획에 반영하라고 권장한다.
- Bing Webmaster Tools에는 keyword research 기능이 있으며 실제 organic query volume을 볼 수 있다고 안내한다.

공식 페이지:

- https://www.bing.com/webmasters

### Meta Keywords

공식 블로그:

- https://blogs.bing.com/webmaster/October-2014/Blame-The-Meta-Keyword-Tag

핵심:

- Bing 공식 블로그는 meta keywords tag가 검색 SEO value 측면에서는 죽었다고 설명한다.
- 문맥 광고나 기타 bot 신호에는 쓸 여지가 있을 수 있지만, 검색 순위를 올리는 booster로 보면 안 된다.

## 네이버

### Title

공식 문서:

- https://searchadvisor.naver.com/guide/seo-help
- https://searchadvisor.naver.com/guide/markup-content

핵심:

- `<title>`은 네이버 검색로봇에게 페이지 주제를 알려준다.
- 페이지 콘텐츠 주제를 나타내는 정확하고 고유한 제목을 작성해야 한다.
- `<title>`이 없거나 2개 이상이거나 사이트 내 여러 페이지에서 동일하면 SEO 문제로 본다.
- 매우 긴 title은 좋지 않다.
- 개별 페이지 title은 페이지 콘텐츠 주제를 명확히 설명해야 한다.
- 모든 페이지에 같은 title을 넣으면 검색 사용자가 콘텐츠를 찾기 어려워진다.
- 검색 노출만을 위해 제목을 자주 변경하거나 과도하게 긴 제목을 쓰면 불이익 가능성이 있다.
- 2회 이상 반복 키워드, 스팸성 키워드, 콘텐츠와 무관한 키워드나 홍보 문구 나열은 불이익 가능성이 있다.

### Meta Description

공식 문서:

- https://searchadvisor.naver.com/guide/seo-help
- https://searchadvisor.naver.com/guide/markup-content

핵심:

- `<meta name="description">`은 페이지 내용을 요약한다.
- 검색 결과 스니펫으로도 사용될 수 있다.
- 각 페이지마다 고유한 요약 내용을 입력하는 것이 좋다.
- 여러 페이지에 동일한 meta description이 있으면 네이버 검색로봇이 유의미하지 않은 내용으로 판단하거나 중복 문서로 분류해 노출에 영향이 있을 수 있다.

### Open Graph

공식 문서:

- https://searchadvisor.naver.com/guide/faq-serpedit
- https://searchadvisor.naver.com/guide/markup-content

핵심:

- 네이버는 사이트 제목과 Open Graph 제목을 모두 참고한다.
- 네이버 웹 검색에서는 일반 title/description과 OG title/description이 다르면 색인 과정에서 검색에 최적화된 값을 선택해 검색 결과에 반영한다.
- 따라서 `title`, `description`, `og:title`, `og:description`이 서로 다른 의도를 말하면 검색 결과가 원하는 대로 안 나올 수 있다.

권장:

```html
<title>아스널 순위·일정·선수단</title>
<meta name="description" content="아스널의 현재 순위, 경기 일정, 선수단, 최근 경기 결과와 시즌 통계를 확인하세요.">
<meta property="og:title" content="아스널 순위·일정·선수단">
<meta property="og:description" content="아스널의 현재 순위, 경기 일정, 선수단, 최근 경기 결과와 시즌 통계를 확인하세요.">
```

### Robots Meta

공식 문서:

- https://searchadvisor.naver.com/guide/faq-serpremove
- https://searchadvisor.naver.com/guide/seo-basic-intro

핵심:

- 네이버도 `robots noindex`를 통한 웹 검색 제외를 안내한다.

```html
<meta name="robots" content="noindex">
```

## 다음

다음은 Google/Naver처럼 웹문서 SEO 전체를 상세히 다루는 공개 공식 문서보다, 검색등록 가이드의 사이트 검색 기준이 더 명확하게 확인된다.

### 검색등록 / 사이트 검색 기준

공식 문서:

- https://register.search.daum.net/index.daum
- https://register.search.daum.net/info.daum?act=guideT1

핵심:

- Daum 검색등록은 사이트 검색을 무료로 등록할 수 있는 서비스다.
- 등록 후 Daum 검색결과 노출을 보장하지 않는다.
- 사이트 검색 서비스는 사이트 검색 가이드를 만족해야 한다.
- 사이트 제목, URL, 설명문, 디렉토리 필드는 사이트 검색 작성기준을 따른다.

### 사이트 제목

공식 문서:

- https://register.search.daum.net/info.daum?act=guideT1

핵심:

- 사이트 제목은 홈페이지에서 확인할 수 있는 제목이어야 한다.
- 예: 홈페이지 상단 로고, 하단 copyright, 회사/사이트 소개, HTML title 등.
- 한글 표기를 원칙으로 한다.
- 띄어쓰기 포함 26자 이내로 입력한다.
- 제목을 꾸미기 위한 특수문자나 기호는 입력하지 않는다.
- 최근 이슈 키워드나 보편적 인기 키워드를 조합해 검색에 유리하게 하려는 제목은 반영되지 않는다.
- 일반명사 또는 검색빈도/조회수가 높은 상업성 키워드는 반영되지 않는다.

이 부분 때문에 다음에서는 네이버나 Google과 다르게 보일 수 있다. 특히 "사이트 검색" 영역에서는 HTML meta만으로 결정되기보다 검색등록 정보와 검토 기준이 개입될 수 있다.

### 설명문

공식 문서:

- https://register.search.daum.net/info.daum?act=guideT1

핵심:

- 회사의 성격을 나타내는 키워드를 입력한다.
- 홈페이지에서 확인되지 않는 허위, 과장된 내용은 입력하지 않는다.
- 설명은 사이트를 소개할 수 있는 핵심문장을 띄어쓰기 포함 45자 이내로 입력한다.
- 설명-품목에는 상품/서비스명 또는 키워드를 100자 이내로 입력한다.
- 쉼표를 사용해 키워드 단위로 입력하며, 문장으로 입력하지 않는 기준이 있다.
- 동일 단어를 여러 번 반복하면 반영되지 않을 수 있다.

주의:

- 이 기준은 Daum 검색등록의 사이트 검색 작성기준이다.
- 개별 웹문서 검색의 title/snippet 생성 로직 전체를 설명하는 문서로 확대 해석하면 안 된다.
- 다만 Daum에서 사이트명/설명문이 기대와 다르게 보이는 문제를 볼 때는 검색등록 기준을 반드시 확인해야 한다.

### Robots Meta

공식 도움말:

- https://cs.daum.net/m/faq/faqlist/28966?orderStr=REG_DT_DESC&pageNo=4

검색 결과로 확인되는 핵심:

```html
<meta name="robots" content="noindex, nofollow">
```

Daum 도움말은 Daum 또는 모든 검색서비스의 웹수집 로봇 차단 문맥에서 `robots` meta 예시를 안내한다.

## 검색엔진별로 다른 메타를 넣어도 되는가

### 가능한 것

검색엔진별 robots 지시는 가능하다.

Google 공식 예:

```html
<meta name="robots" content="index,follow">
<meta name="googlebot" content="nosnippet">
<meta name="googlebot-news" content="noindex">
```

이런 지시는 검색엔진별 색인/스니펫 제어에 해당한다.

### 권장하지 않는 것

검색엔진별로 서로 다른 `title`/`description`을 숨겨서 주는 방식은 권장하지 않는다.

이유:

- 표준 HTML에는 `google-title`, `naver-title`, `daum-title` 같은 검색엔진별 title 태그가 없다.
- Google과 Bing은 title 생성 시 HTML title, H1, OG, prominent text, 앵커 등을 종합한다.
- 네이버도 title/description과 OG가 다르면 최적화된 값을 선택한다고 안내한다.
- 서로 다른 값을 많이 넣으면 검색엔진이 원하는 값을 고르지 않을 가능성이 커진다.
- crawler별로 HTML을 다르게 내려주는 cloaking은 위험할 수 있다.

### 예외적으로 조정할 수 있는 것

1. 네이버/카카오/소셜 공유용 OG를 넣되, 일반 title/description과 같은 의도를 유지한다.
2. Google News, 일반 Google Search처럼 vertical이 다른 경우 robots meta를 다르게 줄 수 있다.
3. 다음 사이트 검색은 HTML meta와 별개로 검색등록의 사이트 제목/설명문 기준을 맞춘다.

## 4590 Football 적용 원칙

### 공통 메타 원칙

모든 색인 대상 페이지:

```html
<title>페이지별 핵심 검색어 + 페이지 내용</title>
<meta name="description" content="페이지 내용을 정확히 요약한 고유 설명">
<meta property="og:title" content="title과 같은 의도">
<meta property="og:description" content="description과 같은 의도">
<link rel="canonical" href="정규 URL">
```

`meta keywords`:

- Google/Bing 기준 SEO 가치 없음.
- 네이버/다음에서도 반복/나열은 위험.
- 코드상 필요하면 짧게 유지하되, SEO 핵심 작업으로 보지 않는다.

### 페이지 유형별 title 방향

#### 라이브스코어 메인

목표 검색 의도:

- 축구 라이브스코어
- 오늘 축구 경기
- 실시간 축구
- 축구 경기결과

권장 title:

```txt
오늘 축구 라이브스코어 - 실시간 경기결과
```

피해야 할 title:

```txt
축구 라이브스코어 실시간스코어 오늘축구경기 축구결과 해외축구결과
```

#### 매치 상세

목표 검색 의도:

- `{홈팀} vs {원정팀}`
- `{홈팀} {원정팀} 경기결과`
- `{홈팀} {원정팀} 라인업`
- `{홈팀} {원정팀} 하이라이트`

종료 경기 title:

```txt
{홈팀} {스코어} {원정팀} 경기결과 - {리그명}
```

예정 경기 title:

```txt
{홈팀} vs {원정팀} 일정·예상 라인업 - {리그명}
```

주의:

- 모든 경기 title에 "중계"를 넣으면 실제 중계 제공 여부와 맞지 않아 위험하다.
- 하이라이트가 없는 경기 title에 "하이라이트"를 고정으로 넣는 것도 부정확하다.

#### 팀 상세

목표 검색 의도:

- `{팀명} 순위`
- `{팀명} 일정`
- `{팀명} 선수단`
- `{팀명} 경기결과`
- `{팀명} 이적`

권장 title:

```txt
{팀명} 순위·일정·선수단
```

팀 이적 페이지가 별도로 있으므로 팀 상세 title에 이적을 항상 앞세우지는 않는다.

#### 선수 상세

목표 검색 의도:

- `{선수명} 통계`
- `{선수명} 기록`
- `{선수명} 프로필`
- `{선수명} 골`
- `{선수명} 이적`

권장 title:

```txt
{선수명} 통계·기록·프로필
```

이적 탭/이적 데이터가 강한 선수는 description에 이적 정보를 넣는다.

#### 이적시장 메인

목표 검색 의도:

- 축구 이적시장
- 축구 이적
- 선수 이적
- 해외축구 이적
- K리그 이적

권장 title:

```txt
축구 이적시장 - 팀별 영입·방출 정보
```

#### 팀 이적 페이지

목표 검색 의도:

- `{팀명} 이적`
- `{팀명} 영입`
- `{팀명} 방출`
- `{팀명} 이적시장`

권장 title:

```txt
{팀명} 이적시장 - 영입·방출 정보
```

## 점검 체크리스트

### 공통

- [ ] 색인 대상 페이지마다 고유한 `<title>`이 있는가
- [ ] 색인 대상 페이지마다 고유한 `meta description`이 있는가
- [ ] `title`, H1, `og:title`이 같은 검색 의도를 말하는가
- [ ] `description`, 본문 첫 영역, `og:description`이 같은 검색 의도를 말하는가
- [ ] 같은 키워드를 2회 이상 무리하게 반복하지 않는가
- [ ] 페이지 내용에 없는 키워드를 넣지 않았는가
- [ ] query state, pagination, tab state는 필요한 경우 `noindex` 처리했는가
- [ ] canonical URL이 한글/대문자/placeholder slug 없이 안정적인가

### Google/Bing

- [ ] `meta keywords`에 의존하지 않는가
- [ ] title이 너무 길거나 boilerplate 반복이 심하지 않은가
- [ ] H1과 title이 충돌하지 않는가
- [ ] OG title/description이 일반 title/description과 충돌하지 않는가

### 네이버

- [ ] 중복 title/description이 많은 템플릿 페이지가 없는가
- [ ] `<title>`이 2개 이상 출력되지 않는가
- [ ] H1이 페이지 주제를 명확히 나타내는가
- [ ] OG title/description과 일반 title/description의 의도가 일치하는가

### 다음

- [ ] 사이트 검색등록의 사이트 제목/설명문 기준을 별도로 확인했는가
- [ ] 사이트 제목이 실제 사이트명과 일치하는가
- [ ] 검색빈도 높은 일반 키워드만 조합한 제목이 아닌가
- [ ] 설명문에 동일 단어 반복이 없는가
- [ ] 다음 사이트 검색 결과가 HTML title과 다르면 검색등록 정보도 확인했는가

## 운영 판단

검색엔진별로 다른 title/description을 만들려고 하기보다 다음 순서로 운영한다.

1. Google Search Console, Bing Webmaster Tools, 네이버 서치어드바이저에서 실제 query와 landing page를 확인한다.
2. 페이지 유형별 대표 검색 의도 하나를 정한다.
3. 그 검색 의도를 title 앞쪽에 넣는다.
4. 보조 검색어는 description과 본문 첫 영역에 자연스럽게 넣는다.
5. OG는 title/description과 같은 의도로 맞춘다.
6. 다음은 별도로 검색등록의 사이트 제목/설명문 기준을 점검한다.
7. 변경 후 2-4주 단위로 노출, CTR, 평균 순위를 비교한다.

## 참고 공식 출처

- Google Title Links: https://developers.google.com/search/docs/appearance/title-link
- Google Meta Descriptions / Snippets: https://developers.google.com/search/docs/appearance/snippet
- Google Supported Meta Tags: https://developers.google.com/search/docs/crawling-indexing/special-tags
- Google Robots Meta: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Bing Title Selection: https://blogs.bing.com/webmaster/June-2014/How-Does-Bing-Choose-The-Title-For-My-Web-Page
- Bing Meta Keywords: https://blogs.bing.com/webmaster/October-2014/Blame-The-Meta-Keyword-Tag
- Bing SEO Basics / Keyword Research: https://blogs.bing.com/webmaster/August-2012/The-Secret-Sauce-of-SEO
- Bing Webmaster Tools: https://www.bing.com/webmasters
- Naver SEO Basic Guide: https://searchadvisor.naver.com/guide/seo-help
- Naver Content Markup: https://searchadvisor.naver.com/guide/markup-content
- Naver Search Result Title/Description Update: https://searchadvisor.naver.com/guide/faq-serpedit
- Naver Web Search Exclusion: https://searchadvisor.naver.com/guide/faq-serpremove
- Daum Search Registration: https://register.search.daum.net/index.daum
- Daum Search Registration Guide: https://register.search.daum.net/info.daum?act=guideT1
- Daum Customer Center robots meta reference: https://cs.daum.net/m/faq/faqlist/28966?orderStr=REG_DT_DESC&pageNo=4
