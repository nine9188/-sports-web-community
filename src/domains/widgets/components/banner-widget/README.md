# 배너 위젯 컴포넌트

Swiper 라이브러리 기반의 모던한 배너 캐러셀 컴포넌트 시스템입니다.

## 📁 폴더 구조

```
banner-widget/
├── index.ts                    # 메인 export 파일
├── types.ts                    # 공통 타입 및 상수 정의
├── BannerWidget.tsx           # 메인 위젯 (자동 디바이스 감지)
├── BannerCarousel.tsx         # Swiper 기반 캐러셀 컴포넌트 ⭐ NEW
├── MobileBannerWidget.tsx     # 모바일 전용 위젯 (레거시)
├── DesktopBannerWidget.tsx    # 데스크탑 전용 위젯 (레거시)
├── BannerWrapper.tsx          # 공통 배너 래퍼 컴포넌트
└── README.md                  # 이 파일
```

## 🎯 주요 특징

### 1. **Swiper 라이브러리 기반**
- **최신 기술**: 검증된 Swiper.js 라이브러리 활용
- **고성능**: 하드웨어 가속 및 최적화된 터치 처리
- **풍부한 기능**: 자동 재생, 페이지네이션, 네비게이션, 루프 등

### 2. **디바이스별 최적화**
- **모바일**: 터치 기반 스와이프, 중앙 정렬, 1개 배너 표시, 자동 슬라이드 없음
- **데스크탑**: 마우스 기반 버튼, 2개 배너 동시 표시, 자동 슬라이드 지원
- **반응형**: 모바일(1개) ↔ 데스크탑(2개) 자동 전환

### 3. **성능 최적화**
- SSR 대응 하이드레이션 불일치 방지
- 조건부 모듈 로딩 (autoplay, navigation 등)
- 메모리 효율적인 슬라이드 관리

### 4. **타입 안전성**
- TypeScript 기반 엄격한 타입 정의
- Swiper 타입 완전 지원

## 🚀 사용법

### 기본 사용법
```tsx
import { BannerWidget } from '@/domains/widgets/components/banner-widget';

function HomePage() {
  return (
    <div>
      <BannerWidget banners={banners} />
    </div>
  );
}
```

### 직접 캐러셀 사용
```tsx
import { BannerCarousel } from '@/domains/widgets/components/banner-widget';

// 모바일용 캐러셀
<BannerCarousel banners={banners} isMobile={true} />

// 데스크탑용 캐러셀
<BannerCarousel banners={banners} isMobile={false} />
```

### 레거시 컴포넌트 (선택적 사용)
```tsx
import { 
  MobileBannerWidget, 
  DesktopBannerWidget 
} from '@/domains/widgets/components/banner-widget';

// 기존 구현 (권장하지 않음)
<MobileBannerWidget banners={banners} />
<DesktopBannerWidget banners={banners} />
```

## 📱 모바일 캐러셀 특징

- **네이티브 터치**: Swiper의 최적화된 터치 제스처
- **중앙 정렬**: 배너가 화면 중앙에 위치
- **부드러운 전환**: 하드웨어 가속 애니메이션
- **사용자 중심**: 자동 슬라이드 없이 사용자 제어

## 🖥️ 데스크탑 캐러셀 특징

- **자동 재생**: 5초 간격 자동 슬라이드 (마우스 오버 시 일시정지)
- **2개 배너 표시**: 최적의 가독성을 위한 2개 배너 동시 표시
- **네비게이션**: 좌우 화살표 버튼과 페이지네이션
- **호버 효과**: 부드러운 마우스 오버 피드백

## 🎨 커스터마이징

### Swiper 설정 조정
```typescript
// BannerCarousel.tsx에서 swiperConfig 객체 수정
const swiperConfig = {
  autoplay: {
    delay: 5000,           // 자동 재생 간격
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  speed: 300,              // 전환 속도
  spaceBetween: 20,        // 슬라이드 간격
  loop: true,              // 무한 루프
  // ... 기타 설정
};
```

### 상수 설정
```typescript
// types.ts에서 수정 가능
export const MOBILE_BREAKPOINT = 768;
export const BANNER_HEIGHT = '210px';
export const SWIPE_THRESHOLD = 30;
```

### 스타일 커스터마이징
- Tailwind CSS 클래스로 기본 스타일 조정
- `styled-jsx`로 Swiper 커스텀 스타일 적용
- CSS 변수로 색상 및 크기 조정 가능

## 🔧 유지보수 가이드

### 새로운 배너 타입 추가
1. `Banner` 타입에 새로운 타입 추가
2. `BannerWrapper.tsx`의 `renderBannerContent` 함수에 케이스 추가
3. 필요시 개별 렌더링 함수 생성

### Swiper 설정 변경
1. `BannerCarousel.tsx`의 `swiperConfig` 객체 수정
2. 필요시 새로운 Swiper 모듈 추가 (EffectCoverflow, Thumbs 등)
3. breakpoints 설정으로 반응형 동작 조정

### 성능 최적화
- Swiper 모듈을 필요한 것만 선택적 로딩
- `lazy` 옵션으로 이미지 지연 로딩
- `watchSlidesProgress`로 슬라이드 가시성 최적화

## 🐛 트러블슈팅

### 하이드레이션 오류
- SSR 렌더링과 클라이언트 렌더링이 다를 때 발생
- `isMounted` 상태로 해결됨

### Swiper 스타일 문제
- CSS import 순서 확인
- `styled-jsx` 스타일이 Swiper 기본 스타일을 덮어쓰는지 확인
- z-index 충돌 방지

### 터치/스와이프 문제
- Swiper의 내장 터치 핸들링 사용
- `touchRatio`, `threshold` 값으로 민감도 조정
- `preventClicks`, `preventClicksPropagation` 옵션 활용 