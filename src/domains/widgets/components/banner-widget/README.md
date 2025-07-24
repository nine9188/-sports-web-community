# 배너 위젯 컴포넌트

모바일과 데스크탑을 위한 분리된 배너 위젯 컴포넌트 시스템입니다.

## 📁 폴더 구조

```
banner-widget/
├── index.ts                    # 메인 export 파일
├── types.ts                    # 공통 타입 및 상수 정의
├── BannerWidget.tsx           # 메인 위젯 (자동 디바이스 감지)
├── MobileBannerWidget.tsx     # 모바일 전용 위젯
├── DesktopBannerWidget.tsx    # 데스크탑 전용 위젯
├── BannerWrapper.tsx          # 공통 배너 래퍼 컴포넌트
└── README.md                  # 이 파일
```

## 🎯 주요 특징

### 1. **디바이스별 최적화**
- **모바일**: 터치 기반 스와이프, 1개 배너 표시, 자동 슬라이드 없음
- **데스크탑**: 마우스 기반 버튼, 다중 배너 표시, 자동 슬라이드 지원

### 2. **성능 최적화**
- `useMemo`, `useCallback`을 통한 리렌더링 최소화
- SSR 대응 하이드레이션 불일치 방지
- 컴포넌트 분리를 통한 코드 스플리팅

### 3. **타입 안전성**
- TypeScript 기반 엄격한 타입 정의
- 인터페이스 기반 Props 검증

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

### 디바이스별 직접 사용
```tsx
import { 
  MobileBannerWidget, 
  DesktopBannerWidget 
} from '@/domains/widgets/components/banner-widget';

// 모바일 전용
<MobileBannerWidget banners={banners} />

// 데스크탑 전용
<DesktopBannerWidget banners={banners} />
```

## 📱 모바일 특징

- **터치 스와이프**: 좌우 스와이프로 배너 변경
- **단일 배너**: 한 번에 1개 배너만 표시
- **간단한 UI**: 하단 인디케이터만 표시
- **자동 슬라이드 없음**: 사용자 제어 우선

## 🖥️ 데스크탑 특징

- **자동 슬라이드**: 설정 가능한 자동 슬라이드 기능
- **다중 배너**: 설정에 따른 여러 배너 동시 표시
- **네비게이션 버튼**: 좌우 화살표 버튼
- **호버 효과**: 마우스 오버 시 시각적 피드백

## 🎨 커스터마이징

### 상수 설정
```typescript
// types.ts에서 수정 가능
export const MOBILE_BREAKPOINT = 768;
export const DEFAULT_AUTO_SLIDE_INTERVAL = 10000;
export const AUTO_PLAY_RESUME_DELAY = 3000;
export const SWIPE_THRESHOLD = 50;
export const BANNER_HEIGHT = '210px';
```

### 스타일 커스터마이징
각 컴포넌트의 Tailwind CSS 클래스를 수정하여 디자인 변경 가능

## 🔧 유지보수 가이드

### 새로운 배너 타입 추가
1. `Banner` 타입에 새로운 타입 추가
2. `BannerWrapper.tsx`의 `renderBannerContent` 함수에 케이스 추가
3. 필요시 개별 렌더링 함수 생성

### 새로운 디바이스 대응
1. `types.ts`에 새로운 breakpoint 추가
2. `BannerWidget.tsx`에 감지 로직 추가
3. 필요시 새로운 디바이스 전용 컴포넌트 생성

### 성능 최적화
- `useMemo` 의존성 배열 최적화
- `useCallback` 함수 메모이제이션 검토
- 불필요한 리렌더링 방지

## 🐛 트러블슈팅

### 하이드레이션 오류
- SSR 렌더링과 클라이언트 렌더링이 다를 때 발생
- `isMounted` 상태로 해결됨

### 터치 이벤트 문제
- `touchAction` CSS 속성 확인
- 스와이프 threshold 값 조정

### 자동 슬라이드 멈춤
- `isAutoPlaying` 상태 확인
- interval cleanup 로직 검토 