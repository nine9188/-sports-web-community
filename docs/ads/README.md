# 광고 시스템

## 구조

```
shared/
├── constants/ad-constants.ts   # 모든 광고 ID 상수
├── components/
│   ├── AdSense.tsx             # 애드센스 기본 컴포넌트
│   ├── AdBanner.tsx            # 페이지 배너 (PC+모바일 CSS 분기)
│   └── KakaoAd.tsx             # 카카오 애드핏 컴포넌트
```

## 컴포넌트

### AdSense

고정 크기 또는 fluid 형식의 구글 애드센스 광고를 렌더링한다.

```tsx
import AdSense from '@/shared/components/AdSense';
import { ADSENSE } from '@/shared/constants/ad-constants';

// 고정 크기
<AdSense adSlot={ADSENSE.RIGHT_SIDEBAR} width={300} height={250} />

// fluid (인피드)
<AdSense
  adSlot={ADSENSE.POST_PC_INFEED}
  width={0} height={0}
  format="fluid"
  layoutKey="-ed+5p-2-bb+pw"
/>
```

**Props:**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `adSlot` | string | O | 광고 유닛 슬롯 ID |
| `width` | number | O | 너비 (px). fluid는 0 |
| `height` | number | O | 높이 (px). fluid는 0 |
| `format` | string | X | `'fluid'` 지정 시 인피드 광고 |
| `layoutKey` | string | X | fluid 광고의 레이아웃 키 |
| `className` | string | X | 추가 CSS 클래스 |

- 고정 크기 광고는 `overflow: hidden` 컨테이너로 감싸져 사이즈가 보장된다.
- JS resize 리스너 없음. SSR에서도 정상 렌더링.
- 개발 환경에서는 dashed border placeholder를 표시.

### AdBanner

페이지 배너 광고. PC(728x90)와 모바일(300x50)을 CSS `hidden md:block` / `md:hidden`으로 분기한다.

```tsx
import AdBanner from '@/shared/components/AdBanner';

<AdBanner />
```

- props 없음. 내부에서 `ADSENSE.PC_BANNER`와 `ADSENSE.MOBILE_BANNER` 상수를 사용.
- 7개 페이지(메인, 이적시장, 라이브스코어, 검색, 팀, 선수, 경기, 샵)에서 동일하게 사용.

### KakaoAd

카카오 애드핏 광고를 렌더링한다.

```tsx
import KakaoAd from '@/shared/components/KakaoAd';
import { KAKAO } from '@/shared/constants/ad-constants';

<KakaoAd adUnit={KAKAO.LEFT_SIDEBAR} adWidth={300} adHeight={250} />
```

**Props:**

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `adUnit` | string | O | 카카오 광고 유닛 ID (DAN-xxx) |
| `adWidth` | number | O | 너비 (px) |
| `adHeight` | number | O | 높이 (px) |
| `className` | string | X | 추가 CSS 클래스 |

- `ba.min.js` 스크립트는 페이지당 1회만 로드 (글로벌 상태 관리).
- 같은 `adUnit`은 동시에 DOM에 1개만 존재해야 한다. 모달에서는 `{isOpen && <KakaoAd />}` 패턴 사용.

## 광고 유닛 목록

### Google AdSense

| 상수 | 슬롯 ID | 크기 | 용도 |
|------|---------|------|------|
| `ADSENSE.PC_BANNER` | `8132343983` | 728x90 | 페이지 배너 (PC) |
| `ADSENSE.MOBILE_BANNER` | `5245092664` | 300x50 | 페이지 배너 (모바일) |
| `ADSENSE.RIGHT_SIDEBAR` | `7382476894` | 300x250 | 오른쪽 사이드바 |
| `ADSENSE.POST_PC_INFEED` | `2093016410` | fluid | 게시글 본문 아래 (PC) |
| `ADSENSE.POST_MOBILE_BANNER` | `1917321828` | 300x50 | 게시글 하단 (모바일) |

### Kakao AdFit

| 상수 | 유닛 ID | 크기 | 용도 |
|------|---------|------|------|
| `KAKAO.LEFT_SIDEBAR` | `DAN-ZD3sGdw5Tg2wQXp6` | 300x250 | 왼쪽 사이드바 |
| `KAKAO.POST_PC_BANNER` | `DAN-1pcdg9VkUBDfzAby` | 728x90 | 게시글 하단 (PC) |
| `KAKAO.MOBILE_MODAL` | `DAN-xQCe8VgP6G8I1XtL` | 320x50 | 모바일 모달 3곳 |

## 배치 위치

```
┌─────────────────────────────────────────────────────┐
│ Header                                              │
├──────────┬──────────────────────┬───────────────────┤
│ 왼쪽     │ 메인 콘텐츠          │ 오른쪽            │
│ 사이드바 │                      │ 사이드바          │
│          │ ┌──────────────────┐ │                   │
│ 카카오   │ │ AdBanner         │ │ 인기글 탭        │
│ 300x250  │ │ PC: 728x90       │ │                   │
│          │ │ 모바일: 300x50   │ │ 애드센스          │
│ 게시판   │ └──────────────────┘ │ 300x250           │
│ 이동     │                      │                   │
│          │ 위젯/콘텐츠          │ 리그 순위         │
│          │                      │                   │
└──────────┴──────────────────────┴───────────────────┘
```

### 게시글 상세 페이지

```
┌──────────────────────────────────┐
│ 게시글 본문                       │
├──────────────────────────────────┤
│ PC: 애드센스 인피드 (fluid)       │  ← hidden md:block
├──────────────────────────────────┤
│ 추천/비추천 버튼                  │
├──────────────────────────────────┤
│ 포스트 네비게이션                 │
├──────────────────────────────────┤
│ 모바일: 애드센스 300x50           │  ← md:hidden
│ PC: 카카오 728x90                │  ← hidden md:flex
├──────────────────────────────────┤
│ 댓글                             │
└──────────────────────────────────┘
```

### 모바일 모달 (햄버거, 라이브스코어, 프로필)

```
┌──────────────────┐
│ 모달 헤더         │
├──────────────────┤
│ 카카오 320x50    │  ← {isOpen && <KakaoAd />}
├──────────────────┤
│ 콘텐츠           │
└──────────────────┘
```

## PC/모바일 분기 규칙

모든 광고는 **CSS 클래스**로만 분기한다. JS `window.innerWidth` 감지는 사용하지 않는다.

| 방식 | 사용처 |
|------|--------|
| `hidden md:block` / `md:hidden` | AdBanner, PostDetail 인피드/배너 |
| `hidden xl:block` | 오른쪽 사이드바 (부모 컨테이너) |
| `hidden lg:block` | 왼쪽 사이드바 (부모 컨테이너) |
| `{isOpen && ...}` | 모바일 모달 (같은 adUnit 충돌 방지) |

## 새 광고 추가 방법

1. AdSense/카카오 대시보드에서 광고 유닛 생성
2. `ad-constants.ts`에 상수 추가
3. 적절한 컴포넌트(`AdSense`, `AdBanner`, `KakaoAd`) 사용
4. 부모에서 CSS 클래스로 디바이스 분기

## 환경변수

```
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-8892057636180546
```

`app/layout.tsx`의 `<head>`에 애드센스 스크립트가 포함되어 있다.
