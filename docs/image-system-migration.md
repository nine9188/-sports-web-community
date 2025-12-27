# 이미지 시스템 마이그레이션 완료 보고서

> **상태: ✅ 완료** (2025-12-25)

## 1. 현재 상황 분석

### 1.1 현재 이미지 관련 파일 구조

```
src/shared/
├── components/
│   ├── ApiSportsImage.tsx      # 38개 파일에서 사용 중
│   └── UnifiedSportsImage.tsx  # 5개 파일에서 사용 중
├── actions/
│   ├── image-storage-actions.ts  # Supabase Storage 캐싱 로직
│   └── batch-image-cache.ts      # 배치 캐싱 (미사용)
├── utils/
│   ├── image-proxy.ts          # URL 생성 유틸리티
│   └── image-cache.ts          # 메모리 캐시 (미사용)
└── types/
    └── image.ts                # 이미지 타입 정의
```

### 1.2 두 컴포넌트의 차이점

| 구분 | ApiSportsImage | UnifiedSportsImage |
|------|----------------|-------------------|
| 사용 파일 수 | 38개 | 5개 |
| 이미지 소스 | Supabase Storage → API-Sports (폴백) | API-Sports 직접 |
| 로딩 방식 | Next.js Image + 서버 액션 | 일반 `<img>` 태그 |
| 캐싱 | Supabase Storage에 저장 시도 | 없음 (브라우저 캐시만) |
| 다크모드 | 리그 이미지 다크모드 지원 | 미지원 |

---

## 2. 문제점 분석

### 2.1 핵심 문제: Supabase Storage 우선 로딩 방식

**현재 ApiSportsImage의 동작 흐름:**
```
1. Supabase Storage URL 생성 (예: supabase.co/storage/.../players/12345.png)
2. 이미지 로드 시도
3. 404/400 에러 발생 (이미지가 Storage에 없음)
4. 서버 액션 호출하여 API-Sports에서 다운로드 → Storage에 업로드
5. 업로드된 URL 또는 API-Sports URL로 재시도
```

**문제점:**
- Storage에 이미지가 없으면 **매번 404/400 에러 발생**
- 콘솔에 에러 로그 대량 출력
- 불필요한 서버 액션 호출 (네트워크 비용)
- API-Sports에서 이미지를 다운로드하여 Supabase에 저장하는 과정이 느림
- 실제로 Supabase Storage에 저장된 이미지가 거의 없음

### 2.2 왜 이런 구조가 되었나?

**원래 의도:**
```
API-Sports CDN은 외부 서버이므로:
1. 속도 최적화를 위해 자체 Storage에 캐싱
2. API-Sports 요청 수 절감
3. Next.js Image 최적화 활용
```

**실제 상황:**
```
1. API-Sports CDN이 이미 충분히 빠름 (글로벌 CDN)
2. Supabase Storage에 이미지 저장이 제대로 안 됨
3. 오히려 추가 요청으로 인해 더 느려짐
4. 400 에러로 인한 사용자 경험 저하
```

### 2.3 코드 복잡성 문제

**불필요한 파일들:**
- `image-cache.ts`: 메모리 캐시 (실제 사용 안 함)
- `batch-image-cache.ts`: 배치 캐싱 (실제 사용 안 함)
- `image-storage-actions.ts`: Storage 캐싱 (제대로 작동 안 함)

**복잡한 로직:**
```typescript
// ApiSportsImage.tsx의 복잡한 에러 핸들링
const handleImageError = async () => {
  if (hasTriedServerAction) {
    // 이미 시도했으면 API-Sports URL 직접 사용
    setSrc(apiSportsUrl);
    return;
  }
  setHasTriedServerAction(true);

  try {
    // 서버 액션 호출 (불필요한 복잡성)
    const result = await getCachedImageFromStorage(...);
    // ...
  } catch {
    setSrc(apiSportsUrl);  // 결국 여기로 옴
  }
};
```

### 2.4 성능 이슈

| 시나리오 | 현재 (ApiSportsImage) | 개선 후 |
|---------|----------------------|---------|
| 첫 로딩 | Storage 시도 → 404 → 서버액션 → API-Sports | API-Sports 직접 |
| 요청 수 | 2-3회 | 1회 |
| 에러 로그 | 다수 | 없음 |
| 로딩 시간 | 느림 | 빠름 |

---

## 3. 해결 방안

### 3.1 단일 이미지 컴포넌트로 통합

**목표: `UnifiedSportsImage`를 표준 컴포넌트로 채택**

```typescript
// 개선된 UnifiedSportsImage.tsx
const API_SPORTS_BASE_URL = 'https://media.api-sports.io/football';

export default function UnifiedSportsImage({
  imageId,
  imageType,
  alt,
  size = 'md',
  variant = 'square',
  ...
}) {
  const [hasError, setHasError] = useState(false);

  // API-Sports URL 직접 생성 (단순함)
  const src = `${API_SPORTS_BASE_URL}/${imageType}/${imageId}.png`;

  if (hasError) {
    return <FallbackComponent />;
  }

  return (
    <img
      src={src}
      onError={() => setHasError(true)}
      ...
    />
  );
}
```

### 3.2 다크모드 지원 추가

`ApiSportsImage`의 다크모드 로직을 `UnifiedSportsImage`에 통합:

```typescript
// 다크모드용 이미지가 있는 리그 ID들
const DARK_MODE_LEAGUE_IDS = [39, 2, 3, 848, 179, 88, 119, 98, 292, 66, 13];

// 다크모드 이미지 ID 생성
const effectiveImageId = isDark &&
  imageType === ImageType.Leagues &&
  DARK_MODE_LEAGUE_IDS.includes(Number(imageId))
    ? `${imageId}-1`
    : imageId;
```

---

## 4. 마이그레이션 계획

### 4.1 Phase 1: UnifiedSportsImage 개선

**작업 내용:**
1. 다크모드 지원 추가
2. Next.js Image 옵션 지원 (선택적)
3. 로딩 상태 애니메이션 개선

**예상 변경 파일:**
- `src/shared/components/UnifiedSportsImage.tsx`

### 4.2 Phase 2: ApiSportsImage → UnifiedSportsImage 마이그레이션

**마이그레이션 대상 (38개 파일):**

```
# Domain: boards (6개)
src/domains/boards/components/board/BoardTeamInfo.tsx
src/domains/boards/components/board/LeagueInfo.tsx
src/domains/boards/components/form/MatchResultForm.tsx
src/domains/boards/components/match/MatchCard.tsx
src/domains/boards/components/notice/NoticeItem.tsx
src/domains/boards/components/post/postlist/components/shared/PostRenderers.tsx

# Domain: livescore (24개)
src/domains/livescore/components/football/MainView/LeagueMatchList/index.tsx
src/domains/livescore/components/football/MainView/MatchCard/index.tsx
src/domains/livescore/components/football/leagues/LeagueCard.tsx
src/domains/livescore/components/football/leagues/LeagueHeader.tsx
src/domains/livescore/components/football/leagues/TeamCard.tsx
src/domains/livescore/components/football/match/MatchHeader.tsx
src/domains/livescore/components/football/match/sidebar/MatchPredictionClient.tsx
src/domains/livescore/components/football/match/tabs/Events.tsx
src/domains/livescore/components/football/match/tabs/Power.tsx
src/domains/livescore/components/football/match/tabs/Standings.tsx
src/domains/livescore/components/football/match/tabs/Stats.tsx
src/domains/livescore/components/football/player/PlayerHeader.tsx
src/domains/livescore/components/football/player/tabs/PlayerFixtures.tsx
src/domains/livescore/components/football/player/tabs/PlayerInjuries.tsx
src/domains/livescore/components/football/player/tabs/PlayerStats.tsx
src/domains/livescore/components/football/player/tabs/PlayerTransfers.tsx
src/domains/livescore/components/football/player/tabs/PlayerTrophies.tsx
src/domains/livescore/components/football/team/TeamHeader.tsx
src/domains/livescore/components/football/team/tabs/Squad.tsx
src/domains/livescore/components/football/team/tabs/Standings.tsx
src/domains/livescore/components/football/team/tabs/overview/components/MatchItems.tsx
src/domains/livescore/components/football/team/tabs/overview/components/StandingsPreview.tsx
src/domains/livescore/components/football/team/tabs/overview/components/StatsCards.tsx
src/domains/livescore/components/football/team/tabs/stats/components/BasicStatsCards.tsx
src/domains/livescore/components/football/transfers/TransfersPageContent.tsx

# Domain: layout (1개)
src/domains/layout/components/livescoremodal/MatchItem.tsx

# Domain: sidebar (2개)
src/domains/sidebar/components/TabsClient.tsx
src/domains/sidebar/components/league/LeagueStandings.tsx

# Domain: shop (2개)
src/domains/shop/components/ItemCard.tsx
src/domains/shop/components/PurchaseModal.tsx

# Domain: widgets (2개)
src/domains/widgets/components/live-score-widget-client.tsx
src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2.tsx

# Shared (1개)
src/shared/components/UserIcon.tsx
```

**변환 패턴:**
```typescript
// Before
import ApiSportsImage from '@/shared/components/ApiSportsImage';

<ApiSportsImage
  imageId={teamId}
  imageType={ImageType.Teams}
  alt="팀 로고"
  width={32}
  height={32}
  className="..."
/>

// After
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';

<UnifiedSportsImage
  imageId={teamId}
  imageType={ImageType.Teams}
  alt="팀 로고"
  size="md"  // width/height 대신 size 사용
  className="..."
/>
```

### 4.3 Phase 3: 불필요한 파일 삭제

**삭제 대상:**
```
src/shared/components/ApiSportsImage.tsx       # 마이그레이션 완료 후
src/shared/utils/image-cache.ts                # 미사용
src/shared/utils/image-proxy.ts                # ApiSportsImage에서만 사용
src/shared/actions/image-storage-actions.ts    # 더 이상 필요 없음
src/shared/actions/batch-image-cache.ts        # 미사용
```

**타입 파일 정리 (`src/shared/types/image.ts`):**
```typescript
// 삭제 가능한 타입들
- ImageCacheResult
- BatchImageCacheResult
- ImageCacheRequest
- ImageCacheStatus
- ImageCacheEntry
- IMAGE_CACHE_TTL

// 유지할 타입들
- ImageType (enum)
```

---

## 5. 사이즈 매핑 가이드

현재 `ApiSportsImage`는 `width/height`를 직접 받고, `UnifiedSportsImage`는 `size` prop을 사용합니다.

### 5.1 Size 매핑 테이블

| width/height | UnifiedSportsImage size |
|--------------|------------------------|
| 24px | `sm` |
| 32px | `md` |
| 40px | `lg` |
| 48px | `xl` |
| 112px | `xxl` |

### 5.2 커스텀 사이즈 대응

`size` prop으로 커버되지 않는 경우:
1. `className`으로 Tailwind 클래스 적용
2. 필요시 새로운 size variant 추가

---

## 6. 예상 효과

### 6.1 성능 개선
- 이미지 로딩 시간: **50% 이상 단축** (중간 단계 제거)
- 네트워크 요청: **2-3회 → 1회**
- 콘솔 에러: **완전 제거**

### 6.2 코드 품질
- 파일 수: **7개 → 2개** (UnifiedSportsImage.tsx + image.ts)
- 코드 라인: **약 500줄 감소**
- 복잡도: **대폭 감소**

### 6.3 유지보수
- 단일 진실 공급원 (Single Source of Truth)
- 이해하기 쉬운 구조
- 테스트 용이성 향상

---

## 7. 실행 체크리스트

### Phase 1: UnifiedSportsImage 개선
- [ ] 다크모드 지원 추가
- [ ] 로딩 애니메이션 개선
- [ ] 테스트

### Phase 2: 마이그레이션 (도메인별)
- [ ] boards 도메인 (6개 파일)
- [ ] livescore 도메인 (24개 파일)
- [ ] layout 도메인 (1개 파일)
- [ ] sidebar 도메인 (2개 파일)
- [ ] shop 도메인 (2개 파일)
- [ ] widgets 도메인 (2개 파일)
- [ ] shared 컴포넌트 (1개 파일)

### Phase 3: 정리
- [ ] ApiSportsImage.tsx 삭제
- [ ] image-cache.ts 삭제
- [ ] image-proxy.ts 삭제
- [ ] image-storage-actions.ts 삭제
- [ ] batch-image-cache.ts 삭제
- [ ] image.ts 불필요 타입 정리
- [ ] 최종 빌드 테스트

---

## 8. 롤백 계획

만약 문제가 발생할 경우:
1. Git에서 이전 커밋으로 복원
2. 도메인별로 점진적 롤백 가능
3. ApiSportsImage를 임시로 유지하면서 점진적 마이그레이션

---

## 9. 결론

**핵심 요약:**
1. Supabase Storage 캐싱 방식은 **실패한 최적화**
2. API-Sports CDN을 직접 사용하는 것이 **더 빠르고 단순**
3. 38개 파일의 마이그레이션이 필요하지만, **기계적 변환**으로 빠르게 완료 가능
4. 마이그레이션 후 **7개 파일 삭제**, 코드베이스 대폭 간소화
