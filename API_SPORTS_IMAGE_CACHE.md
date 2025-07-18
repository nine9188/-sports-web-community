# 🏈 API Sports 이미지 캐싱 시스템

API Sports 이미지를 Supabase Storage에 자동으로 캐싱하여 성능을 최적화하는 시스템입니다.

## 🚀 주요 기능

- **자동 캐싱**: 처음 요청 시 API Sports에서 다운로드 후 Supabase Storage에 저장
- **스마트 로드**: 이미 캐시된 이미지는 Supabase Storage에서 직접 로드
- **폴백 처리**: 이미지 로드 실패 시 자동으로 플레이스홀더 이미지 표시
- **메모리 캐시**: 중복 요청 방지를 위한 클라이언트 메모리 캐시
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

### 1. 기본 사용법

```tsx
import ApiSportsImage from '@/shared/components/ApiSportsImage'
import { ImageType } from '@/shared/types/image'

// 팀 로고 표시
<ApiSportsImage
  src="https://media.api-sports.io/football/teams/40.png"
  imageId={40}
  imageType={ImageType.Teams}
  alt="리버풀"
  width={50}
  height={50}
  className="rounded-full"
/>

// 선수 이미지 표시
<ApiSportsImage
  src="https://media.api-sports.io/football/players/874.png"
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

### 1. 이미지 요청 플로우

```
1. ApiSportsImage 컴포넌트 렌더링
   ↓
2. imageId + imageType 있음?
   ├─ Yes: Supabase Storage URL 먼저 시도
   └─ No: 원본 API Sports URL 사용
   ↓
3. Storage URL 실패 시
   ↓
4. 백그라운드에서 getCachedImageFromStorage 호출
   ↓
5. Storage에 이미지 있음?
   ├─ Yes: Storage URL 반환
   └─ No: API Sports에서 다운로드 → Storage 저장 → Storage URL 반환
   ↓
6. 업로드 실패 시 원본 API Sports URL 사용
   ↓
7. 모든 URL 실패 시 플레이스홀더 이미지 표시
```

### 2. 캐싱 전략

- **Storage First**: 가능하면 항상 Supabase Storage URL 우선 사용
- **Lazy Loading**: 이미지가 실제로 요청될 때만 캐싱 수행
- **Memory Cache**: 동일 세션 내 중복 요청 방지
- **Fallback Chain**: Storage → API Sports → Placeholder 순서로 폴백

## 🎛️ 설정

### 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Storage 버킷

다음 버킷들이 필요합니다:
- `players`: 선수 이미지
- `teams`: 팀 로고
- `leagues`: 리그 로고  
- `coachs`: 감독 이미지

각 버킷은 public 접근이 가능해야 하며, PNG 파일 업로드를 허용해야 합니다.

## 🎯 성능 최적화

### 1. 프리로딩

```tsx
import { warmupPremierLeagueImages } from '@/shared/actions/batch-image-cache'

// 프리미어리그 주요 팀 이미지 미리 캐싱
await warmupPremierLeagueImages()
```

### 2. 메모리 캐시 활용

같은 이미지를 여러 번 요청해도 메모리 캐시로 인해 중복 서버 요청이 발생하지 않습니다.

### 3. 배치 처리

페이지 로드 시 필요한 모든 이미지를 배치로 캐싱하여 개별 요청을 줄입니다.

## 🐛 문제 해결

### 1. 이미지가 로드되지 않는 경우

- Supabase Storage 버킷 권한 확인
- API Sports URL 유효성 확인
- 네트워크 연결 상태 확인

### 2. 캐싱이 되지 않는 경우

- 서버 액션 권한 확인
- Supabase Storage 용량 확인
- 콘솔 에러 로그 확인

### 3. 성능 이슈

- 불필요한 이미지 요청 줄이기
- 배치 캐싱 활용
- 이미지 크기 최적화

## 🧪 테스트

테스트 페이지에서 캐싱 기능을 확인할 수 있습니다:

```
http://localhost:3000/test-storage
```

이 페이지에서 다음을 테스트할 수 있습니다:
- 개별 이미지 캐싱
- 배치 캐싱
- 컴포넌트 동작
- 에러 처리

## 📊 모니터링

### 캐시 히트율 확인

```tsx
// 서버 액션 결과에서 캐시 상태 확인
const result = await getCachedImageFromStorage('teams', 40)
console.log('캐시에서 로드됨:', result.cached)
```

### 배치 처리 결과

```tsx
const result = await batchCacheTeamLogos([40, 33, 49])
console.log(`총 ${result.cached + result.failed}개 중 ${result.cached}개 성공`)
``` 