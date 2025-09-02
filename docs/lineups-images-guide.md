### Livescore Lineups 이미지 처리 가이드 (Storage-only 일원화 + 사전 캐싱)

이 문서는 라인업(선수/팀/감독) 이미지 로딩을 Supabase Storage 단일 출처로 통일하고, 첫 페인트 성공률을 높이기 위한 권장 구조를 정리합니다.

---

## 목표
- 외부(API-Sports) URL 직접 로드 금지 → Supabase Storage/CDN 단일 출처
- 서버 사전 배치 캐싱(Pre-warm) → “깨짐 없이” 즉시 표시
- 클라이언트 기본 로딩은 lazy/auto/priority=false → 네트워크 피크 감소
- Next Image 최적화 적극 활용

---

## 현재 구현 요약 (분석 기반)

- 라인업 테이블: `UnifiedSportsImage` 사용
  - 초기 src는 `getSupabaseStorageUrl` (Storage-only)
  - onError 시 서버 액션 `getCachedImageFromStorage`로 저장/복구 1회 시도 → 성공 시 urlCache 갱신 후 재로딩, 실패 시 폴백(숫자/이니셜) 표시

- SVG 경기장: `Player.tsx` 내 `SVGPlayerImage`
  - urlCache에 동일 키(`{ImageType}-{id}`)가 채워질 때까지 0.5s 폴링(최대 10s) → 있으면 `<image href={storageUrl}>` 렌더
  - 자체 onError 저장 로직은 없음(테이블에서 캐싱된 urlCache에 의존)
  - Formation이 테이블보다 먼저 렌더되어, 최초 10s 내 캐시 미완료 시 스피너 후 비표시 가능성 있음

- 공통 유틸: `image-proxy.ts`
  - `getSupabaseStorageUrl` 존재(OK)
  - `getCachedImageUrl`가 실패 시 외부(API-Sports) URL 폴백(정책과 상충) → Strict 옵션 도입 필요

정리: “1) 저장된 이미지는 Storage에서 로드, 2) 없으면 저장, 3) 저장 후 Storage에서 로드”라는 정책은 테이블 경로에선 충족, SVG 경로는 테이블의 캐시 완료 타이밍에 부분적으로 의존합니다.

---

## 확인된 문제점
- 동일 이미지가 경로별로 상이하게 처리됨
  - 테이블: onError에서 서버 액션으로 즉시 저장 시도
  - SVG: urlCache 폴링만 수행, 자체 저장 시도 없음 → 10초 타임아웃 후 빈 상태 위험
- 외부 URL 폴백 경로가 유틸에 남아있음(`getCachedImageUrl`) → Storage-only 원칙 위반 가능성
- 우선순위(priority) 남용 위험 → 네트워크 혼잡 가능

---

## 개선안 (권장)

1) 서버 사전 배치 캐싱 도입(최우선)
- 라인업 렌더 전 서버에서 필요한 ID를 수집해 일괄 캐싱
- 파일: 매치 상세 서버 컴포넌트 또는 서버 액션 로더
- 함수 예시: `batchCacheMatchImages({ playerIds, teamIds, coachIds, leagueIds })`

2) SVG도 Storage-only 직접 렌더 + onError 1회 저장 시도
- `SVGPlayerImage`에서 `<image href={getSupabaseStorageUrl(...)}/> onError={async () => serverActionOnce()}`
- 성공 시 urlCache 갱신 후 즉시 재렌더, 실패 시 숫자/이니셜만 표시(추가 네트워크 없음)
- 폴링은 서버 사전 캐싱이 있는 경우 삭제 또는 타임아웃 단축(≤3s) 권장

3) 외부 폴백 제거(Strict 모드)
- `image-proxy.ts`의 `getCachedImageUrl`에 `{ strict: true }` 옵션 추가
- Strict 모드에서는 실패 시 `null` 반환(외부 URL 금지)
- 라인업 경로는 기본 Strict 적용 → 폴백은 “UI 폴백(번호/이니셜)”로만 처리

4) 로딩/우선순위 정책 일원화
- 기본: `loading='lazy'`, `fetchPriority='auto'`, `priority={false}`
- Above-the-fold 핵심 1~3개에만 `priority` 명시

5) urlCache 키 체계 고정 및 공유
- 키: `${imageType}-${imageId}` (현재 구현과 동일)
- 테이블/SVG/기타 모든 사용처에서 동일 키 사용

---

## 구현 스니펫 (개념 예시)

서버 사전 배치 캐싱:
```ts
// 서버(매치 페이지 서버 컴포넌트 등)
import { batchCacheMatchImages } from '@/shared/actions/batch-image-cache'

await batchCacheMatchImages({
  playerIds, // startXI + subs
  teamIds: [homeTeamId, awayTeamId],
  coachIds: [homeCoachId, awayCoachId].filter(Boolean),
  leagueIds: [leagueId]
});
```

SVG onError 1회 저장 시도 패턴(개념):
```tsx
<image href={getSupabaseStorageUrl(ImageType.Players, playerId)} onError={async () => {
  if (tried) return;
  setTried(true);
  const { getCachedImageFromStorage } = await import('@/shared/actions/image-storage-actions');
  const r = await getCachedImageFromStorage('players', playerId);
  if (r.success && r.url) {
    urlCache.set(`players-${playerId}`, r.url);
    setSrc(r.url);
  } else {
    setSrc(null); // 숫자/이니셜 폴백만 표시
  }
}} />
```

Strict 모드 유틸(개념):
```ts
export async function getCachedImageUrl(type, id, opts?: { strict?: boolean }) {
  try {
    const r = await getCachedImageFromStorage(type, id);
    if (r.success && r.url) return r.url;
  } catch {}
  return opts?.strict ? null : getApiSportsImageUrl(type, id);
}
```

---

## 체크리스트
- 클라이언트 코드 어디에도 외부(API-Sports) URL 직접 사용이 없다
- 서버에서 라인업 진입 시 `batchCacheMatchImages`가 실행된다
- `UnifiedSportsImage` 기본 로딩은 lazy/auto, priority는 최소화
- SVG는 Storage-only로 렌더하며, 실패 시 1회 서버 액션 후 UI 폴백
- `image-proxy.ts`는 Strict 모드를 지원하고, 라인업 경로는 Strict를 사용한다

---

## 테스트 시나리오
1) 첫 방문(캐시X)
   - 네트워크 탭에 외부 `media.api-sports.io` 요청이 없는지 확인(Strict)
   - SVG/테이블이 “깨짐 없이” 즉시 표시되는지(서버 사전 캐싱으로)
2) 새로고침(캐시O)
   - 대부분 Storage hit로 빠르게 로드되는지
3) 느린 3G
   - priority 남용 없이도 체감 품질이 유지되는지, 폴백 UI 자연스러운지
4) 에러/미존재
   - 1회 저장 실패 시 추가 네트워크 재시도 없이 폴백만 표시되는지
5) 웹바이탈
   - LCP/INP 개선, 전송량 감소 확인

---

## 권장 기본값
- `UnifiedSportsImage`: `loading='lazy'`, `fetchPriority='auto'`, `priority={false}`
- priority는 상단 핵심 1~3개에 한해 명시
- Next Image 최적화 기본 사용, `unoptimized` 지양

---

## Q&A
- Q: 서버 사전 캐싱은 꼭 필요한가요?
  - A: 네. 첫 페인트 성공률과 네트워크 피크 제어에 가장 효과적입니다.
- Q: 외부 URL 폴백을 유지하면?
  - A: Storage-only 원칙과 성능 목표에 반합니다. Strict 모드에서 제거하세요.
- Q: 얼마나 빨라지나요?
  - A: 실패-복구 루프 제거, 동시요청 축소, CDN 최적화로 LCP/체감 속도가 개선됩니다.