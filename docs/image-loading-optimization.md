# 이미지 로딩 최적화 계획

## 현재 문제

### 증상
```
⨯ upstream image response failed for .../players/312468.png 400
⨯ upstream image response failed for .../players/47418.png 400
... (대량의 400 에러)
```

### 원인
1. `UnifiedSportsImage`가 Supabase Storage URL을 먼저 시도
2. 이미지가 없으면 Next.js Image 최적화에서 400 에러 발생
3. `onError` 핸들러로 서버 액션 호출 → 다운로드/캐싱
4. 다음 요청부터 정상 작동

### 문제점
- 처음 보는 팀/선수 이미지 로드 시 대량의 에러 로그
- 서버 액션이 에러 발생 후에야 호출됨 (비효율적)
- 동일한 없는 이미지에 대해 반복 요청

---

## 해결 방안: 하이브리드 이미지 로딩

### 핵심 전략
1. **unoptimized 모드**: Next.js 이미지 최적화 우회하여 에러 로그 억제
2. **3단계 캐시**: 메모리 → Storage → API-Sports
3. **없음 상태 캐싱**: 없는 이미지도 캐시하여 중복 요청 방지
4. **백그라운드 다운로드**: 에러 시 조용히 다운로드 후 캐시

### 캐시 상태
```typescript
type ImageCacheState = {
  url: string;      // 이미지 URL
  status: 'loading' | 'success' | 'error' | 'not-found';
  timestamp: number; // 캐시 시간
};
```

### 로딩 흐름
```
┌─────────────────────────────────────────────────────────────┐
│                    이미지 요청 시작                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. 메모리 캐시 확인 (urlCache)                               │
│    - 있음 + success → 캐시된 URL 사용                        │
│    - 있음 + not-found → 폴백 표시 (요청 안 함)               │
│    - 없음 → 다음 단계                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Storage URL 시도 (unoptimized)                           │
│    - 성공 → 메모리 캐시에 저장 (success)                     │
│    - 실패 → 다음 단계                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. 서버 액션 호출 (백그라운드)                               │
│    - API-Sports에서 다운로드                                 │
│    - Storage에 업로드                                        │
│    - 성공 → 메모리 캐시 업데이트 (success)                   │
│    - 실패 → 메모리 캐시에 not-found 저장                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. 폴백 표시                                                 │
│    - 선수: 등번호 또는 이름 첫글자                           │
│    - 팀: 플레이스홀더 이미지                                 │
│    - 감독: 사람 아이콘                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 구현 계획

### Phase 1: 캐시 시스템 개선

#### 1.1 캐시 타입 정의
**파일**: `src/shared/types/image.ts`

```typescript
// 이미지 캐시 상태
export interface ImageCacheEntry {
  url: string | null;
  status: 'loading' | 'success' | 'error' | 'not-found';
  timestamp: number;
}

// 캐시 만료 시간 (밀리초)
export const IMAGE_CACHE_TTL = {
  SUCCESS: 24 * 60 * 60 * 1000,    // 성공: 24시간
  NOT_FOUND: 30 * 60 * 1000,       // 없음: 30분 (나중에 추가될 수 있음)
  ERROR: 5 * 60 * 1000,            // 에러: 5분
};
```

#### 1.2 캐시 유틸리티
**파일**: `src/shared/utils/image-cache.ts`

```typescript
// 개선된 캐시 맵
export const imageCache = new Map<string, ImageCacheEntry>();

// 캐시 키 생성
export function getCacheKey(type: ImageType, id: string | number): string;

// 캐시 조회 (만료 확인 포함)
export function getCachedImage(type: ImageType, id: string | number): ImageCacheEntry | null;

// 캐시 저장
export function setCachedImage(type: ImageType, id: string | number, entry: ImageCacheEntry): void;

// 캐시 무효화
export function invalidateCache(type: ImageType, id: string | number): void;
```

### Phase 2: UnifiedSportsImage 수정

**파일**: `src/shared/components/UnifiedSportsImage.tsx`

#### 주요 변경사항
1. `unoptimized={true}` 추가
2. 3단계 캐시 로직 적용
3. 없음 상태 캐싱
4. 조용한 에러 처리

```typescript
// 변경 전
<Image
  src={src}
  alt={alt}
  {...sizeValues[size]}
  onError={handleImageError}
  loading={loading}
/>

// 변경 후
<Image
  src={src}
  alt={alt}
  {...sizeValues[size]}
  onError={handleImageError}
  loading={loading}
  unoptimized={true}  // 에러 로그 억제
/>
```

### Phase 3: 서버 액션 개선

**파일**: `src/shared/actions/image-storage-actions.ts`

#### 주요 변경사항
1. 없는 이미지에 대해 명확한 응답 반환
2. 에러 로깅 최소화
3. 배치 다운로드 최적화

```typescript
// 반환 타입 개선
export interface ImageCacheResult {
  success: boolean;
  url: string | null;
  cached: boolean;
  notFound?: boolean;  // 추가: API-Sports에도 없는 경우
  error?: string;
}
```

### Phase 4: SVGPlayerImage 동기화

**파일**: `src/domains/livescore/components/football/match/tabs/lineups/components/Player.tsx`

#### 주요 변경사항
1. 공통 캐시 시스템 사용
2. SVG `<image>` 태그에 에러 핸들링 개선
3. 폴백 렌더링 개선

---

## 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/shared/types/image.ts` | 수정 | 캐시 타입 추가 |
| `src/shared/utils/image-cache.ts` | 신규 | 캐시 유틸리티 |
| `src/shared/components/UnifiedSportsImage.tsx` | 수정 | 하이브리드 로딩 적용 |
| `src/shared/actions/image-storage-actions.ts` | 수정 | notFound 상태 추가 |
| `src/domains/livescore/.../Player.tsx` | 수정 | 캐시 시스템 연동 |
| `src/domains/livescore/.../PlayerImage.tsx` | 수정 | 필요시 동기화 |

---

## 예상 결과

### Before
```
⨯ upstream image response failed for .../players/312468.png 400
⨯ upstream image response failed for .../players/47418.png 400
... (30+ 에러 로그)
```

### After
```
(조용함 - 에러 로그 없음)
- 없는 이미지는 폴백 표시
- 백그라운드에서 다운로드 시도
- 다음 방문 시 캐시된 이미지 표시
```

---

## 추가 고려사항

### 1. 캐시 지속성
- 현재: 메모리 캐시 (페이지 새로고침 시 초기화)
- 개선 가능: localStorage 또는 IndexedDB 사용

### 2. 프리로딩
- 경기 페이지 진입 시 라인업 이미지 미리 로드
- `batchCacheImages` 활용

### 3. 모니터링
- 캐시 히트율 추적
- 다운로드 실패율 모니터링

---

## 구현 순서

1. [ ] Phase 1: 캐시 시스템 개선 (타입, 유틸리티)
2. [ ] Phase 2: UnifiedSportsImage 수정
3. [ ] Phase 3: 서버 액션 개선
4. [ ] Phase 4: SVGPlayerImage 동기화
5. [ ] 테스트 및 검증
6. [ ] 불필요한 코드 정리 (주석 처리된 teamPlayersMap 등)
