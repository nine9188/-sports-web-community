# 🏈 API Sports 이미지 캐싱 시스템

API Sports 이미지를 Supabase Storage에 자동으로 캐싱하여 성능을 최적화하는 시스템입니다.

## 🚀 주요 기능

- **무조건 스토리지 URL만 사용**: API-Sports URL은 절대 노출되지 않음
- **메모리 캐시**: 중복 요청 방지를 위한 클라이언트 메모리 캐시
- **useState + useEffect 패턴**: 비동기 URL 관리로 부드러운 로딩
- **빈 영역 처리**: placeholder 없이 스토리지에 없으면 빈 영역 표시
- **배치 처리**: 여러 이미지를 한 번에 캐싱하는 배치 기능

## 📦 구조

```
src/shared/
├── types/image.ts              # 이미지 타입 정의
├── utils/image-proxy.ts        # 이미지 URL 생성 유틸리티
├── actions/
│   ├── image-storage-actions.ts # 스토리지 서버 액션
│   └── batch-image-cache.ts    # 배치 캐싱 액션
└── components/
    └── ApiSportsImage.tsx      # 이미지 컴포넌트
```

## 🎯 사용법

### 1. 기본 사용법 (NEW)

```tsx
import ApiSportsImage from '@/shared/components/ApiSportsImage'
import { ImageType } from '@/shared/types/image'

// 팀 로고 표시
<ApiSportsImage
  imageId={40}
  imageType={ImageType.Teams}
  alt="리버풀"
  width={50}
  height={50}
  className="rounded-full"
/>

// 선수 이미지 표시
<ApiSportsImage
  imageId={874}
  imageType={ImageType.Players}
  alt="메시"
  width={80}
  height={80}
/>
```

### 2. 유틸리티 함수 사용

```tsx
import { 
  getTeamLogoUrlCached, 
  getPlayerImageUrlCached,
  getLeagueLogoUrlCached,
  getCoachImageUrlCached 
} from '@/shared/utils/image-proxy'

// 캐시된 URL 가져오기 (비동기)
const teamLogoUrl = await getTeamLogoUrlCached(40) // Liverpool
const playerImageUrl = await getPlayerImageUrlCached(874) // Messi
const leagueLogoUrl = await getLeagueLogoUrlCached(39) // Premier League
const coachImageUrl = await getCoachImageUrlCached(1) // Coach

// 직접 API Sports URL 생성 (동기)
import { getTeamLogoUrl, getPlayerImageUrl } from '@/shared/utils/image-proxy'
const directTeamUrl = getTeamLogoUrl(40)
const directPlayerUrl = getPlayerImageUrl(874)
```

### 3. 서버 액션 직접 사용

```tsx
import { getCachedImageFromStorage } from '@/shared/actions/image-storage-actions'

// 서버에서 이미지 캐시
const result = await getCachedImageFromStorage('teams', 40)
if (result.success) {
  console.log('캐시된 URL:', result.url)
  console.log('새로 캐시됨:', result.cached)
}
```

### 4. 배치 캐싱

```tsx
import { 
  batchCacheTeamLogos, 
  batchCachePlayerImages,
  batchCacheMatchImages 
} from '@/shared/actions/batch-image-cache'

// 여러 팀 로고 한 번에 캐시
const teamIds = [40, 33, 49, 50] // Liverpool, Man United, Chelsea, Man City
const result = await batchCacheTeamLogos(teamIds)
console.log(`${result.cached}개 캐시됨, ${result.failed}개 실패`)

// 경기 관련 모든 이미지 캐시
await batchCacheMatchImages({
  teamIds: [40, 33],
  playerIds: [874, 1100],
  leagueIds: [39],
  coachIds: [1, 2]
})
```

## 🔧 동작 원리

### 1. 이미지 요청 플로우 (NEW)

```
1. ApiSportsImage 컴포넌트 마운트
   ↓
2. src 상태 초기값: null
   ↓
3. useEffect에서 메모리 캐시 확인
   ├─ 캐시 있음: 즉시 URL 설정
   └─ 캐시 없음: getCachedImageFromStorage 호출
   ↓
4. 스토리지에서 이미지 확인
   ├─ 있음: 스토리지 URL 반환 → 메모리 캐시 저장 → 이미지 표시
   └─ 없음: API Sports에서 다운로드 → 스토리지 저장 → URL 반환
   ↓
5. 스토리지 URL 없으면 빈 영역 표시 (placeholder 없음)
```

### 2. 메모리 캐시 시스템

```typescript
// 클라이언트 메모리 캐시
const urlCache = new Map<string, string | null>();

// 캐시 키: "{imageType}-{imageId}"
// 예시: "teams-40", "players-874"
```

### 3. 핵심 원칙

- ✅ **무조건 스토리지 URL만 사용**
- ✅ **API-Sports URL 절대 노출 안 됨**
- ✅ **메모리 캐시로 중복 요청 방지**
- ✅ **placeholder 없이 빈 영역 처리**

## ⚠️ 마이그레이션 가이드

### Before (기존 방식):
```tsx
<ApiSportsImage
  src="https://media.api-sports.io/football/teams/40.png"
  imageId={40}
  imageType={ImageType.Teams}
  alt="리버풀"
  fallbackType={ImageType.Teams}
/>
```

### After (새 방식):
```tsx
<ApiSportsImage
  imageId={40}
  imageType={ImageType.Teams}
  alt="리버풀"
/>
```

### 주요 변경사항:
- ❌ `src` prop 제거
- ❌ `fallbackType` prop 제거
- ✅ `alt` prop 필수화
- ✅ `imageId`, `imageType` 필수화

## 🏁 결론

새로운 방식은 더 안전하고 빠르며 간단합니다:

1. **보안**: API-Sports URL 절대 노출 안 됨
2. **성능**: 메모리 캐시로 중복 요청 방지
3. **단순성**: src 없이 ID만으로 간단 사용
4. **일관성**: 모든 이미지가 동일한 플로우로 처리

이제 `imageId`와 `imageType`만 있으면 안전하고 빠른 이미지 표시가 가능합니다! 🚀 