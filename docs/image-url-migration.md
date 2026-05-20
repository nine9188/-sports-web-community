# 이미지 URL 공통화 마이그레이션

작성일: 2026-05-20

## 목적

이미지 URL 생성, fallback, 외부 이미지 프록시 판정을 전역 공통 함수로 통일한다.

기존 컴포넌트별로 흩어진 다음 코드를 단계적으로 제거한다.

- `cdn.4590football.com` 직접 문자열 조립
- `/teams/`, `/leagues/`, `/players/` 직접 경로 조립
- 컴포넌트별 placeholder 상수 중복
- 컴포넌트별 외부 이미지 판정 함수 중복
- `cdn.4590football.com/proxy?url=` 직접 조립

## 전역 기준 파일

### `src/shared/images/urls.ts`

최종 기준 파일이다.

담당 역할:

- Storage CDN base URL
- 사이트 로고/아이콘 URL 상수
- 스포츠 에셋 URL 생성
- placeholder URL
- 로컬/Supabase/CDN/외부 이미지 판정
- 외부 이미지 CDN proxy URL 생성
- 썸네일 생성용 내부 이미지 proxy URL 생성
- 화면 표시용 이미지 URL 정규화
- `next/image`의 `unoptimized` 여부 판단

대표 함수:

```ts
normalizeDisplayImageUrl(url, { fallback, proxyExternal })
shouldUnoptimizeImageUrl(url)
teamLogoUrl(id)
leagueLogoUrl(id, { dark })
playerPhotoUrl(id)
coachPhotoUrl(id)
venuePhotoUrl(id)
externalImageProxyUrl(url)
localExternalImageProxyUrl(url)
profileIconUrl(path)
```

### `src/shared/utils/imageProxy.ts` (삭제 완료)

기존 게시판 썸네일 코드가 사용하던 호환 래퍼였다.

다음 함수 사용처가 0건이 되어 2026-05-20에 삭제했다.

```ts
getProxiedImageUrl()
getProxiedImageUrls()
getImageProps()
```

신규 코드에서는 이 파일을 다시 만들거나 import하지 않는다.

## 삭제 정책

`imageProxy.ts`는 삭제 완료 상태를 유지한다.

삭제 조건:

```bash
rg "getProxiedImageUrl|getProxiedImageUrls|getImageProps" src
```

위 명령 결과는 0건이어야 한다.

다시 사용처가 생기면 마이그레이션 역행으로 본다.

삭제 시 확인한 것:

- `src/shared/utils/index.ts`에 export 없음
- 관련 dead import 없음
- 게시판 썸네일은 `normalizeDisplayImageUrl(..., { proxyExternal: true })` 사용
- 외부 뉴스/게시글 이미지 proxy는 `urls.ts` 기준으로 동작

## 신규 코드 규칙

### 스포츠 에셋

팀/리그/선수/감독/경기장 이미지는 직접 문자열을 만들지 않는다.

```ts
teamLogoUrl(teamId)
leagueLogoUrl(leagueId)
leagueLogoUrl(leagueId, { dark: true })
playerPhotoUrl(playerId)
coachPhotoUrl(coachId)
venuePhotoUrl(venueId)
```

### 표시용 이미지

컴포넌트에서 받은 URL은 렌더링 전에 정규화한다.

```ts
const src = normalizeDisplayImageUrl(rawUrl, {
  fallback: '/images/placeholder-team.svg',
});
```

외부 이미지를 CDN proxy로 보내야 하면:

```ts
const src = normalizeDisplayImageUrl(rawUrl, {
  fallback: SITE_ICON_URL,
  proxyExternal: true,
});
```

### `next/image`

`unoptimized` 직접 판정은 공통 함수로 한다.

```tsx
<Image
  src={src}
  unoptimized={shouldUnoptimizeImageUrl(src)}
/>
```

이미 `UnifiedSportsImageClient`처럼 스포츠 CDN 이미지 전용 컴포넌트는 기본 정책을 따르되, fallback URL은 호출부에서 명시한다.

## 작업 순서

1. 전역 공통 최종 정리
   - `src/shared/images/urls.ts`
   - `src/shared/utils/imageProxy.ts` 삭제 완료
   - `src/shared/components/UserIcon.tsx`
   - `src/shared/components/UserIconServer.tsx`
   - `src/shared/components/SiteLogo.tsx`
   - `src/shared/components/UnifiedSportsImageClient.tsx`

2. 메인 페이지 위젯
   - `src/domains/widgets/**`
   - 상태: 2026-05-20 기준 1차 정리 완료

3. 게시판 목록/카드
   - `src/domains/boards/components/post/postlist/**`
   - `src/domains/boards/components/post/PopularPostList.tsx`
   - `src/domains/boards/components/cards/**`
   - 상태: 2026-05-20 기준 1차 정리 완료

4. 게시글 상세/본문 렌더러
   - `src/domains/boards/components/post/post-content/**`
   - `src/domains/boards/components/match/MatchCard.tsx`
   - `src/domains/boards/components/form/MatchResultForm.tsx`
   - 상태: 2026-05-20 기준 완료

5. 검색
   - `src/domains/search/actions/**`
   - `src/domains/search/components/**`
   - 상태: 2026-05-20 기준 완료

6. 라이브스코어
   - `src/domains/livescore/components/football/MainView/**`
   - `src/domains/livescore/components/football/match/**`
   - `src/domains/livescore/components/football/team/**`
   - `src/domains/livescore/components/football/player/**`
   - `src/domains/livescore/components/football/leagues/**`
   - 상태: 2026-05-20 기준 1차 정리 완료
   - 비고: `UnifiedSportsImageClient`에서 표시 URL 정규화/외부 proxy/fallback을 공통 처리
   - 비고: livescore 이미지 액션은 `teamLogoUrl()`, `leagueLogoUrl()`, `playerPhotoUrl()`, `coachPhotoUrl()`, `venuePhotoUrl()` 기준으로 URL 생성

7. 이적 페이지
   - `src/domains/livescore/components/football/transfers/**`
   - `src/app/(site)/transfers/**`
   - 상태: 2026-05-20 기준 완료

8. 정적 소개/가이드 페이지
   - `src/app/(site)/about/**`
   - `src/app/(site)/guide/**`
   - 상태: 2026-05-20 기준 검토 완료
   - 비고: 데모 자산은 `teamLogoUrl()`, `leagueLogoUrl()`, `playerPhotoUrl()` 기반이라 추가 URL 조립 제거 없음

9. 관리자/샵/썸네일
   - `src/domains/admin/**`
   - `src/app/admin/**`
   - `src/domains/shop/**`
   - 상태: 2026-05-20 기준 1차 정리 완료
   - 비고: 썸네일 export용 `/api/proxy-image`는 CORS/canvas 용도라 유지하되 `localExternalImageProxyUrl()`로 공통화

10. 최종 삭제/검증
    - `imageProxy.ts` 삭제 상태 유지
    - 직접 CDN 문자열 검색
    - 직접 proxy URL 조립 검색
    - 변경 파일 lint
    - 가능한 경우 `.next` 정리 후 타입체크
    - 상태: 2026-05-20 기준 완료

## 검색 체크리스트

```bash
rg "cdn\\.4590football\\.com|media\\.api-sports\\.io" src
rg "proxy\\?url=|getProxiedImageUrl|getProxiedImageUrls|getImageProps" src
rg "/teams/|/leagues/|/players/|/coachs/|/venues/" src
rg "placeholder-team|placeholder-league|placeholder-player|placeholder-coach|placeholder-venue" src
```

검색 결과가 모두 0건일 필요는 없다.

허용되는 예외:

- `src/shared/images/urls.ts`
- 이미지 캐시 서버 액션의 bucket/API path 상수
- public 정적 파일 참조가 명확히 필요한 곳
- fallback을 호출부에서 명시해야 하는 이미지 컴포넌트

## 완료 기준

- 신규 코드가 `imageProxy.ts`를 import하지 않는다.
- 스포츠 에셋 URL 조립은 `urls.ts`를 통해서만 한다.
- 외부 이미지 proxy URL은 `externalImageProxyUrl()` 또는 `normalizeDisplayImageUrl(..., { proxyExternal: true })`만 사용한다.
- 존재하지 않는 fallback 파일 경로가 없다.
- 삭제된 `imageProxy.ts`를 다시 만들지 않는다.
