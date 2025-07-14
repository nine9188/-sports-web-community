# Vercel CDN을 통한 API-Sports 이미지 처리 가이드

## 📝 개요

이 가이드는 API-Sports에서 제공하는 이미지들을 Vercel CDN을 통해 프록시하여 성능을 최적화하고 안정성을 향상시키는 방법을 설명합니다.

## 🎯 목적

- **성능 향상**: Vercel의 글로벌 CDN을 통한 빠른 이미지 로딩
- **안정성 증대**: API-Sports 서버 장애 시에도 캐시된 이미지 제공
- **비용 절약**: API 호출 횟수 감소 및 대역폭 최적화
- **사용자 경험**: 일관된 이미지 로딩 속도 제공

## 🏗️ 구조

```
src/
├── app/api/images/route.ts          # Edge API Route (이미지 프록시)
├── shared/
│   ├── components/
│   │   └── ApiSportsImage.tsx       # 자동 변환 이미지 컴포넌트
│   └── utils/
│       ├── image-proxy.ts           # URL 변환 유틸리티
│       └── image-error-handler.ts   # 에러 처리 로직
└── docs/
    └── VERCEL_CDN_IMAGES.md        # 이 문서
```

## 🚀 사용법

### 1. 기본 URL 변환

```typescript
import { getPlayerImageUrl, getTeamLogoUrl, getLeagueLogoUrl } from '@/shared/utils/image-proxy';

// 선수 이미지
const playerImage = getPlayerImageUrl(123); // /api/images?type=players&id=123

// 팀 로고
const teamLogo = getTeamLogoUrl(456); // /api/images?type=teams&id=456

// 리그 로고
const leagueLogo = getLeagueLogoUrl(789); // /api/images?type=leagues&id=789
```

### 2. 자동 변환 컴포넌트 사용

```tsx
import ApiSportsImage from '@/shared/components/ApiSportsImage';

function PlayerCard({ player }) {
  return (
    <div>
      <ApiSportsImage
        src={player.photo} // API-Sports URL 자동 감지 및 변환
        alt={player.name}
        width={100}
        height={100}
        fallbackType="players" // 에러 시 선수 기본 이미지 사용
      />
    </div>
  );
}
```

### 3. 기존 URL 변환

```typescript
import { convertApiSportsUrl } from '@/shared/utils/image-proxy';

const originalUrl = 'https://media.api-sports.io/football/players/123.png';
const proxiedUrl = convertApiSportsUrl(originalUrl); // /api/images?type=players&id=123
```

## 🔧 API Endpoints

### GET /api/images

API-Sports 이미지를 Vercel CDN을 통해 프록시합니다.

**Parameters:**
- `type`: 이미지 타입 (`players`, `teams`, `leagues`, `coachs`)
- `id`: 이미지 ID (숫자)

**Examples:**
```
GET /api/images?type=players&id=123    # 선수 이미지
GET /api/images?type=teams&id=456      # 팀 로고
GET /api/images?type=leagues&id=789    # 리그 로고
GET /api/images?type=coachs&id=101     # 감독 이미지
```

**Response Headers:**
```
Cache-Control: public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400
CDN-Cache-Control: max-age=2592000
Vercel-CDN-Cache-Control: max-age=2592000
```

## 📊 캐싱 전략

| 레벨 | 캐시 기간 | 설명 |
|------|-----------|------|
| 브라우저 | 24시간 | 클라이언트 측 캐시 |
| Vercel CDN | 30일 | 글로벌 엣지 캐시 |
| API-Sports | 원본 | 원본 서버 캐시 설정 |

## 🛠️ 설정

### 1. Next.js 설정 (`next.config.js`)

```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
        pathname: '/**',
      },
      // Vercel 자체 도메인 (프록시 이미지용)
      {
        protocol: 'https',
        hostname: process.env.VERCEL_URL || 'localhost',
        pathname: '/api/images',
      },
    ],
  },
};
```

### 2. 환경 변수

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
VERCEL_URL=your-domain.vercel.app  # Vercel에서 자동 설정
```

## 🔄 마이그레이션 가이드

### 기존 코드에서 새 시스템으로 마이그레이션

**Before:**
```typescript
const imageUrl = `https://media.api-sports.io/football/players/${playerId}.png`;
```

**After:**
```typescript
import { getPlayerImageUrl } from '@/shared/utils/image-proxy';
const imageUrl = getPlayerImageUrl(playerId);
```

**컴포넌트 마이그레이션:**

**Before:**
```tsx
<Image
  src={`https://media.api-sports.io/football/players/${player.id}.png`}
  alt={player.name}
  width={100}
  height={100}
  onError={handleError}
/>
```

**After:**
```tsx
<ApiSportsImage
  src={player.photo} // 원본 URL
  alt={player.name}
  width={100}
  height={100}
  fallbackType="players"
/>
```

## 🚨 에러 처리

### 1. 자동 폴백 시스템

```typescript
import { getFallbackImageUrl } from '@/shared/utils/image-proxy';

const fallbackUrl = getFallbackImageUrl('players'); // /images/player-placeholder.png
```

### 2. 재시도 로직

```typescript
import { handleImageRetry } from '@/shared/utils/image-error-handler';

const retrySuccess = handleImageRetry(imageUrl, (newUrl) => {
  // 재시도 로직
  setImageSrc(newUrl);
}, 3); // 최대 3번 재시도
```

### 3. 이미지 유효성 검증

```typescript
import { validateImageUrl } from '@/shared/utils/image-error-handler';

const isValid = await validateImageUrl(imageUrl, 5000); // 5초 타임아웃
```

## 📈 성능 최적화

### 1. 지연 로딩

```tsx
<ApiSportsImage
  src={imageUrl}
  alt="Player"
  loading="lazy" // 뷰포트에 들어올 때 로드
  priority={false} // 중요하지 않은 이미지
/>
```

### 2. 우선순위 설정

```tsx
<ApiSportsImage
  src={heroImageUrl}
  alt="Hero"
  priority={true} // 중요한 이미지 먼저 로드
/>
```

### 3. 적절한 사이즈 설정

```tsx
<ApiSportsImage
  src={imageUrl}
  alt="Player"
  sizes="(max-width: 768px) 50px, 100px" // 반응형 사이즈
  width={100}
  height={100}
/>
```

## 🐛 트러블슈팅

### 1. 이미지가 로드되지 않는 경우

**확인사항:**
- API 키가 올바르게 설정되었는지 확인
- 네트워크 탭에서 프록시 요청이 정상적으로 이루어지는지 확인
- Vercel 함수 로그 확인

**해결방법:**
```typescript
// 개발자 도구에서 직접 테스트
fetch('/api/images?type=players&id=123')
  .then(res => console.log(res.status))
  .catch(err => console.error(err));
```

### 2. 캐시 무효화

```typescript
// 특정 이미지 캐시 초기화
import { resetImageRetryState } from '@/shared/utils/image-error-handler';
resetImageRetryState(imageUrl);

// 모든 이미지 캐시 초기화
import { clearAllImageRetryStates } from '@/shared/utils/image-error-handler';
clearAllImageRetryStates();
```

### 3. 로컬 개발 환경 이슈

로컬에서는 `localhost:3000`을 사용하므로, 프로덕션과 다른 동작을 할 수 있습니다.

```typescript
// 개발 환경에서 직접 API-Sports URL 사용
const isDev = process.env.NODE_ENV === 'development';
const imageUrl = isDev 
  ? originalApiSportsUrl 
  : getProxiedImageUrl('players', playerId);
```

## 📊 모니터링

### 1. 이미지 로딩 성공률 추적

```typescript
// 이미지 로딩 통계 수집
let loadSuccess = 0;
let loadError = 0;

<ApiSportsImage
  onLoad={() => loadSuccess++}
  onError={() => loadError++}
/>
```

### 2. 캐시 히트율 모니터링

Vercel Analytics를 통해 `/api/images` 엔드포인트의 응답 시간과 캐시 히트율을 모니터링할 수 있습니다.

## 🔗 관련 링크

- [Vercel Edge API 문서](https://vercel.com/docs/functions/edge-functions)
- [Next.js Image 최적화](https://nextjs.org/docs/pages/api-reference/components/image)
- [API-Sports 문서](https://www.api-football.com/documentation-v3)

## 📝 업데이트 로그

- **2024-01-XX**: 초기 구현 완료
- **2024-01-XX**: 에러 처리 및 재시도 로직 추가
- **2024-01-XX**: 자동 변환 컴포넌트 구현 