# 🚀 ApiSportsImage 빠른 시작 가이드

## 기본 사용법

### 1. 팀 로고 표시

```tsx
import ApiSportsImage from '@/shared/components/ApiSportsImage'
import { ImageType } from '@/shared/types/image'

// 리버풀 팀 로고
<ApiSportsImage
  src="https://media.api-sports.io/football/teams/40.png"
  imageId={40}
  imageType={ImageType.Teams}
  alt="리버풀"
  width={50}
  height={50}
  className="rounded-full"
/>
```

### 2. 선수 이미지 표시

```tsx
// 메시 선수 이미지
<ApiSportsImage
  src="https://media.api-sports.io/football/players/874.png"
  imageId={874}
  imageType={ImageType.Players}
  alt="메시"
  width={80}
  height={80}
  className="rounded-full"
/>
```

### 3. 리그 로고 표시

```tsx
// 프리미어리그 로고
<ApiSportsImage
  src="https://media.api-sports.io/football/leagues/39.png"
  imageId={39}
  imageType={ImageType.Leagues}
  alt="프리미어리그"
  width={40}
  height={40}
/>
```

## 장점

✅ **자동 캐싱**: 첫 로드 시 Supabase Storage에 자동 저장  
✅ **빠른 로드**: 이후 요청 시 CDN에서 빠르게 로드  
✅ **안정성**: 이미지 로드 실패 시 플레이스홀더 자동 표시  
✅ **쉬운 적용**: 기존 Image 컴포넌트와 동일한 사용법

## 동작 과정

1. **첫 번째 요청**: API Sports → Supabase Storage 저장 → 표시
2. **이후 요청**: Supabase Storage에서 직접 로드 (빠름!)
3. **에러 발생 시**: 플레이스홀더 이미지 자동 표시

## 기존 코드 마이그레이션

**Before (기존 코드):**
```tsx
<Image
  src="https://media.api-sports.io/football/teams/40.png"
  alt="리버풀"
  width={50}
  height={50}
  className="rounded-full"
/>
```

**After (새 코드):**
```tsx
<ApiSportsImage
  src="https://media.api-sports.io/football/teams/40.png"
  imageId={40}
  imageType={ImageType.Teams}
  alt="리버풀"
  width={50}
  height={50}
  className="rounded-full"
/>
```

단 3줄만 추가하면 됩니다! 🎉 