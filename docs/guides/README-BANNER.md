## 🛠 작업 목적
- 배너위젯에서 로딩중 없이 데이터 즉시 노출
- 라이브스코어 위젯에서 로딩중 없이 데이터 즉시 노출 
- 불필요한 로딩으로 인한 사용자 이용 불편

## 🎯 작업 목표
- .불필요한 로딩중 제거 
- 서버액션 + 서버컴포넌트로 데이터 빠르게 로딩허고있음을 검토하기
- 불필요한 코드 점검 후 리팩토링
- 배너위젯 / pc 2열 모바일 1열
- 라이브스코어위젯 / pc 4열 모바일 2열
- 불필여한 ui ux 재정리 
- 라이브스코어에서 사용하고 있는 src/domains/livescore/actions/footballApi.ts 서버액션이 다른곳에서도 쓰이고 있을 확율이 많음 위젯만의 서버액션이 아니기때문에 수정할 때 조심해야함

## 📁 관련 파일 목록
- 123/1234 공통
- src/domains/widgets/components/live-score-widget.tsx
- src/domains/widgets/components/live-score-widget-client.tsx
- src/domains/widgets/components/banner-widget-client.tsx
- src/domains/widgets/components/banner-widget.tsx
- src/domains/widgets/components/banner-widget 
- src/domains/widgets/components/banner-widget/BannerCarousel.tsx
- src/domains/widgets/components/banner-widget/BannerWrapper.tsx
- src/domains/livescore/actions/footballApi.ts

## 📌 세부 지시 사항
- 일정한 레이아웃 유지 

## 🧪 테스트 기준

- [ ] 데스크탑 모바일  그리드 형태 테스트
ㄴ배너 데스크 2 모바일 1
ㄴ라이브스코어 데스크4 모바일 2
- [ ] ESLint/Prettier 통과, 타입 에러 없음

## 🗣 참고 메시지 (선택)
무문제점 
이 현상은 초기 렌더링 시 Swiper의 slidesPerView가 matches.length > 2 조건만 보고 2로 시작한 다음, window 크기를 감지한 이후에야 breakpoints가 적용되기 때문에 발생합니다.

즉, SSR(서버 측 렌더링) 또는 hydration 시점에는 breakpoints가 적용되지 않아서 모바일/PC 모두 처음엔 slidesPerView: 2 (기본값)으로 렌더되었다가, 클라이언트에서 re-hydration 후에야 적절히 4/2열로 전환됩니다.



해결법
1. Swiper 초기 slidesPerView를 화면 크기 기준으로 동적으로 설정

클라이언트 사이드에서 isMobile 여부를 먼저 판단해 slidesPerView를 동적으로 바꾸는 방법입니다.


3. matchMedia로 초기 slidesPerView 결정 + Swiper config에서 breakpoints 유지

이 방법은 위 1번과 비슷하지만 breakpoints는 유지하고, Swiper config에 초기값만 반영합니다:
✅ 추천 방법

1번 + 3번 혼합 방식 추천합니다. 이유는:
	•	SSR 시점에서는 안전한 기본값을 제공하고
	•	클라이언트 사이드에서 정확한 열 수로 보정 가능
	•	동적 import가 필요 없고 CSR 방식으로만 동작 가능

⸻

🔧 부가 팁
	1.	slidesPerView: 'auto'도 쓸 수 있지만 고정된 레이아웃이 아닐 경우 UI 깨짐 우려 있음미디어 쿼리로 깔끔한 반응형 구현
✅ **hydration 문제 없음**: 서버와 클라이언트 렌더링 결과 일치

### 마이그레이션 단계

#### 1단계: 패키지 설치 및 설정
```bash
npm install keen-slider
npm uninstall swiper
```

#### 2단계: 배너 위젯 마이그레이션
- `BannerCarousel.tsx` Swiper → keen-slider 변경
- CSS 기반 반응형 구현 (1024px 브레이크포인트)
- 자동 슬라이드, 네비게이션 버튼 유지

#### 3단계: 라이브스코어 위젯 마이그레이션  
- `live-score-widget-client.tsx` Swiper → keen-slider 변경
- CSS 기반 반응형 구현 (768px 브레이크포인트)
- 네비게이션 버튼, 빈 슬롯 로직 유지

#### 4단계: 테스트 및 최적화
- [ ] 데스크탑 모바일 그리드 형태 테스트
- [ ] 자동 슬라이드, 네비게이션 동작 테스트
- [ ] 성능 측정 (번들 크기, 렌더링 속도)

### 예상 개발 시간
- 1단계: 5분
- 2단계: 30분 (배너 위젯)
- 3단계: 30분 (라이브스코어 위젯)
- 4단계: 15분 (테스트)
- **총 예상 시간: 1시간 20분**

