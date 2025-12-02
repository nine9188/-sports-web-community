# 🚀 ApiSportsImage 빠른 시작 가이드

## 기본 사용법

### 1. 팀 로고 표시

```tsx
import ApiSportsImage from '@/shared/components/ApiSportsImage'
import { ImageType } from '@/shared/types/image'

// 리버풀 팀 로고
<ApiSportsImage
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
  imageId={39}
  imageType={ImageType.Leagues}
  alt="프리미어리그"
  width={40}
  height={40}
/>
```

## 핵심 특징

✅ **무조건 스토리지 URL만 사용**: API-Sports URL은 절대 노출되지 않음  
✅ **메모리 캐시**: 중복 요청 방지로 성능 최적화  
✅ **useState + useEffect 패턴**: 비동기 URL 관리  
✅ **빈 영역 처리**: placeholder 없이 스토리지에 없으면 빈 영역 표시  

## 동작 과정

1. **컴포넌트 마운트**: src 상태는 null로 시작
2. **메모리 캐시 확인**: 이미 요청한 URL이 있으면 즉시 사용
3. **스토리지 확인**: getCachedImageFromStorage 호출하여 비동기로 URL 가져오기
4. **URL 설정**: 스토리지 URL이 확인되면 상태 업데이트하여 이미지 표시
5. **빈 영역**: 스토리지에 없으면 빈 div 유지

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
  imageId={40}
  imageType={ImageType.Teams}
  alt="리버풀"
  width={50}
  height={50}
  className="rounded-full"
/>
```

## ⚠️ 중요 변경사항

- **src prop 제거**: 이제 imageId와 imageType만 필요
- **alt prop 필수**: 접근성을 위해 필수 속성
- **fallback 제거**: placeholder 대신 빈 영역 표시
- **메모리 캐시**: 같은 이미지 재요청 시 즉시 반환

더 이상 API-Sports URL을 걱정할 필요 없이 안전하고 빠른 이미지 표시가 가능합니다! 🎉 