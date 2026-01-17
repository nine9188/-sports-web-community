# 핫딜 시스템 문서

핫딜(Hot Deal) 게시판 기능 관련 문서입니다.

## 📚 문서 목록

### 핵심 문서
- **[시스템 개요](./system-overview.md)** - 핫딜 시스템의 전체 구조와 작동 방식
- **[데이터베이스 스키마](./database-schema.md)** - `deal_info` JSONB 필드 구조
- **[UI 컴포넌트 가이드](./ui-components.md)** - 핫딜 관련 컴포넌트 사용법
- **[트러블슈팅](./troubleshooting.md)** - 문제 해결 가이드 및 개선 방안

### 빠른 참조
- [가격 정보가 표시되지 않을 때](./troubleshooting.md#문제-핫딜-가격-정보가-리스트에-표시되지-않음)
- [새 필드 추가 체크리스트](./troubleshooting.md#1-타입-체크리스트-작성)
- [데이터 흐름 간소화 방안](./troubleshooting.md#간소화-방안)

## 🎯 핫딜 기능 개요

### 주요 기능
1. **핫딜 정보 등록** - 게시글 작성 시 가격, 할인율, 배송비 등 입력
2. **핫딜 정보 표시** - 리스트와 상세 페이지에서 가격 정보 표시
3. **핫딜 종료 관리** - 수동 종료 및 자동 종료 (종료일시 기준)
4. **핫딜 게시판** - `view_type: 'image-table'` 카드형 레이아웃

### 지원 게시판
- `/boards/hotdeal-appliance` - 가전 핫딜
- `/boards/hotdeal-fashion` - 패션 핫딜
- `/boards/hotdeal-food` - 식품 핫딜
- `/boards/hotdeal-etc` - 기타 핫딜

## 🏗️ 아키텍처

### 데이터 흐름
```
1. 사용자 입력
   ↓
2. PostEditForm (deal_info 수집)
   ↓
3. createPost / updatePost (서버 액션)
   ↓
4. Supabase DB (posts.deal_info JSONB)
   ↓
5. getPosts (SELECT deal_info)
   ↓
6. formatPostData (deal_info 보존)
   ↓
7. convertApiPostsToLayoutPosts (deal_info 매핑)
   ↓
8. DesktopPostItem / MobilePostItem (UI 렌더링)
```

### 핵심 파일 구조
```
src/
├── domains/boards/
│   ├── types/
│   │   ├── hotdeal.ts                     # DealInfo 타입
│   │   └── post/
│   │       └── layout.ts                   # LayoutPost, ApiPost 타입
│   ├── actions/
│   │   ├── getPosts.ts                    # 게시글 조회 (deal_info 포함)
│   │   └── posts/
│   │       ├── createPost.ts              # 게시글 생성
│   │       └── fetchPostsHelpers.ts       # formatPostData
│   ├── utils/
│   │   ├── hotdeal.ts                     # 가격 포맷팅 유틸
│   │   └── post/
│   │       └── postUtils.ts               # convertApiPostsToLayoutPosts
│   └── components/
│       └── post/
│           ├── PostEditForm.tsx           # 핫딜 정보 입력 폼
│           ├── PopularPostList.tsx        # 인기글 리스트
│           └── postlist/components/
│               ├── desktop/
│               │   ├── DesktopPostItem.tsx  # 데스크톱 가격 표시
│               │   └── DesktopPostList.tsx
│               └── mobile/
│                   └── MobilePostItem.tsx   # 모바일 가격 표시
```

## 🔧 개발 가이드

### 새 필드 추가 시 체크리스트
핫딜 관련 새 필드를 추가할 때는 다음 순서로 작업:

1. **타입 정의** (`src/domains/boards/types/hotdeal.ts`)
   ```typescript
   export interface DealInfo {
     // ... 기존 필드
     newField?: string;  // 새 필드 추가
   }
   ```

2. **SQL 쿼리** - `deal_info` 선택하는 모든 쿼리 확인
   - `src/domains/boards/actions/getPosts.ts`
   - `src/domains/boards/actions/getPopularPosts.ts`

3. **데이터 변환** - 자동으로 포함됨 (`deal_info || null`)
   - ✅ `formatPostData` (fetchPostsHelpers.ts)
   - ✅ `convertApiPostsToLayoutPosts` (postUtils.ts)

4. **UI 컴포넌트**
   - 입력: `PostEditForm.tsx`
   - 표시: `DesktopPostItem.tsx`, `MobilePostItem.tsx`

### 로컬 개발
```bash
# 개발 서버 시작
npm run dev

# 핫딜 게시판 접속
http://localhost:3000/boards/hotdeal-appliance

# 타입 체크
npx tsc --noEmit

# 테스트 (추가 예정)
npm run test
```

## 🐛 일반적인 문제

### 가격 정보가 표시되지 않음
- **원인**: 데이터 변환 파이프라인에서 `deal_info` 누락
- **해결**: [트러블슈팅 가이드](./troubleshooting.md) 참조

### 할인율이 계산되지 않음
- **원인**: `original_price`가 `null`이거나 `price`보다 작음
- **해결**: `getDiscountRate()` 함수가 `null` 반환, UI에서 표시하지 않음

### 핫딜 종료 버튼이 작동하지 않음
- **원인**: 권한 부족 또는 이미 종료된 핫딜
- **해결**: `updatePost` 액션의 권한 체크 확인

## 📊 성능 최적화

### 현재 구현
- ✅ `useDeferredValue`로 대량 게시글 렌더링 최적화
- ✅ `React.memo`로 불필요한 리렌더링 방지
- ✅ 30개 이상 게시글 시 `react-window` 가상화

### 개선 가능 영역
- [ ] `deal_info` 파싱 로직 메모이제이션
- [ ] 가격 포맷팅 함수 캐싱
- [ ] 이미지 lazy loading 개선

## 🔒 보안 고려사항

### 입력 검증
- 가격: 0 이상의 정수만 허용
- URL: 유효한 URL 형식 검증
- 종료일시: 현재 시간 이후만 허용

### 권한 관리
- 핫딜 정보 입력: 로그인 사용자만
- 핫딜 종료: 작성자 또는 관리자만
- 핫딜 게시글 삭제: 작성자 또는 관리자만

## 📈 향후 계획

### Phase 4 (예정)
- [ ] 핫딜 알림 기능 (가격 하락 시)
- [ ] 핫딜 북마크/찜하기
- [ ] 핫딜 통계 (조회수, 클릭수)
- [ ] 가격 히스토리 추적

### Phase 5 (검토 중)
- [ ] 외부 쇼핑몰 API 연동
- [ ] 자동 가격 비교
- [ ] 핫딜 큐레이션 (AI 추천)

## 🤝 기여 가이드

### 코드 스타일
- TypeScript strict 모드 사용
- 모든 컴포넌트에 JSDoc 주석 작성
- 가격 관련 함수는 반드시 단위 테스트 포함

### PR 체크리스트
- [ ] 타입 체크 통과 (`npm run type-check`)
- [ ] ESLint 경고 없음 (`npm run lint`)
- [ ] 관련 문서 업데이트
- [ ] 테스트 추가 (해당되는 경우)

## 📞 지원

문제가 발생하면:
1. [트러블슈팅 가이드](./troubleshooting.md) 확인
2. 콘솔 로그에서 에러 메시지 확인
3. 데이터 흐름 각 단계에 로그 추가하여 디버깅

---

**마지막 업데이트**: 2026-01-16
**버전**: 1.0.0
**담당자**: Development Team
