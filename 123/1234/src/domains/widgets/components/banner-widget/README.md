# 배너 위젯 컴포넌트

Swiper 라이브러리 기반의 모던한 배너 캐러셀 컴포넌트입니다.

## 📁 폴더 구조

```
banner-widget/
├── index.ts                    # export 파일
├── types.ts                    # 타입 정의
├── BannerWidget.tsx           # 메인 위젯 (디바이스 감지)
├── BannerCarousel.tsx         # Swiper 캐러셀 구현 ⭐
├── BannerWrapper.tsx          # 배너 래퍼
└── README.md                  # 이 파일
```

## 🎯 주요 특징

- **Swiper 기반**: 검증된 Swiper.js 라이브러리 활용
- **반응형**: 모바일 1개, 데스크탑 2개 배너 표시
- **자동 재생**: 5초 간격 자동 슬라이드 (모바일/데스크탑 모두)
- **터치 지원**: 모바일 스와이프 및 데스크탑 네비게이션
- **SSR 대응**: 하이드레이션 불일치 방지

## 🚀 사용법

```tsx
import { BannerWidget } from '@/domains/widgets/components/banner-widget';

<BannerWidget banners={banners} />
```

## 🎨 커스터마이징

### 간격 조정
```typescript
// BannerCarousel.tsx에서
spaceBetween: 12, // 배너 간 간격 (12px)
```

### 자동 재생 설정
```typescript
autoplay: {
  delay: 5000,                  // 5초 간격
  disableOnInteraction: false,
  pauseOnMouseEnter: true,
}
```

### 브레이크포인트
```typescript
// types.ts에서
export const MOBILE_BREAKPOINT = 768;
```

## 🔧 파일별 역할

- **BannerWidget.tsx**: 메인 진입점, 디바이스 감지 및 SSR 처리
- **BannerCarousel.tsx**: Swiper 기반 캐러셀 로직
- **BannerWrapper.tsx**: 개별 배너 래퍼 (링크, 스타일)
- **types.ts**: 공통 타입 및 상수

## 🐛 트러블슈팅

### 하이드레이션 오류
- `isMounted` 상태로 SSR/클라이언트 렌더링 차이 해결

### 페이지네이션 문제
- Swiper 기본 페이지네이션 사용, 커스텀 엘리먼트 제거

### 간격 문제
- `spaceBetween`, Tailwind margin 클래스 통일 (12px) 