# 05. Home

검토 대상:
- `src/app/(site)/page.tsx`
- `src/domains/widgets/components/AllPostsWidget.tsx`
- `src/domains/widgets/components/news-widget/NewsWidget.tsx`
- `src/domains/widgets/components/board-collection-widget/BoardCollectionWidget.tsx`
- `src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2Server.tsx`
- `src/domains/widgets/components/board-quick-links-widget/BoardQuickLinksWidget.tsx`
- `src/shared/components/AdBanner.tsx`
- `src/shared/components/KakaoAd.tsx`

## 문제

홈은 SSR 페이지인데 위젯별 데이터 흐름이 흩어져 있어서 구조가 일관되지 않았다. 일부 위젯은 page에서 미리 받아 넣고, 일부는 컴포넌트 내부에서 따로 조회하는 식으로 보일 수 있었고, JSON-LD도 도메인이 하드코딩돼 있었다.

## 수정 내용

### 1. 홈 데이터는 page.tsx에서 한 번에 조회

수정한 곳:
- `src/app/(site)/page.tsx`

무엇을 바꿨는지:
- 홈에 필요한 데이터를 `Promise.all`로 묶어서 page에서 먼저 가져오도록 정리했다.
- 그 결과를 `LiveScoreWidgetV2`, `BoardCollectionWidget`, `AllPostsWidget`, `NewsWidget`에 각각 `leagues`, `data`, `posts`, `news` props로 넘기도록 맞췄다.
- `Suspense`와 로딩 분기 없이, 홈의 서버 렌더 결과가 한 흐름으로 나오게 정리했다.

### 2. 위젯 내부 fallback fetch 제거

수정한 곳:
- `src/domains/widgets/components/AllPostsWidget.tsx`
- `src/domains/widgets/components/news-widget/NewsWidget.tsx`
- `src/domains/widgets/components/board-collection-widget/BoardCollectionWidget.tsx`
- `src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2Server.tsx`

무엇을 바꿨는지:
- `initialData` props를 제거했다.
- 위젯 내부의 `initialData ?? fetch...` fallback도 제거했다.
- 이제 홈 주요 위젯은 page에서 받은 필수 데이터 props만 렌더링한다.
- `AllPostsWidget`, `NewsWidget`, `BoardCollectionWidget`는 page와 같은 기준의 데이터 준비 함수를 분리해 재사용 가능하게 만들었다.

### 3. 홈 JSON-LD 도메인 하드코딩 제거

수정한 곳:
- `src/app/(site)/page.tsx`

무엇을 바꿨는지:
- `homeJsonLd`의 `url`과 항목 URL을 `siteConfig.url` 기준으로 맞췄다.

## 확인 결과

- 홈은 이제 page에서 공통 데이터를 한 번에 준비하고, 모든 주요 위젯이 같은 주입 패턴을 따른다.
- 홈 내부의 데이터 흐름이 하나로 정리되어, 위젯이 누락된 props 때문에 각자 다시 fetch하는 경로를 제거했다.
- 홈 위젯 경로에서 `initialData`는 제거 완료했다.
- JSON-LD의 도메인 하드코딩도 제거 완료했다.

## 검증

- `npm.cmd run build` 통과
- `npm.cmd run typecheck` 통과

## 결론

홈은 SSR을 유지한 채 공통 fetch 구조로 정리됐다. page가 데이터를 한 번에 준비하고, 위젯들은 필수 데이터 props만 렌더링한다. `initialData`와 내부 fallback fetch는 제거했고, `siteConfig.url` 기준의 JSON-LD도 반영 완료했다.
