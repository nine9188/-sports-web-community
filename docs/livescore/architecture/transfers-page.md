# 이적시장 페이지 (`/transfers`) 아키텍처 검토

> `docs/livescore/architecture.md` 표준 대비 실제 코드 검증 결과.

**검토일**: 2026-03-01

---

## 검토 요약

| 항목 | 상태 | 비고 |
|:-----|:----:|:-----|
| API 호출 래퍼 | ✅ | 모든 API 호출 `fetchFromFootballApi` 사용 |
| 캐시 계층 (L1/L3 + Supabase) | ✅ | transfers: 24시간 revalidate + Supabase transfers_cache |
| React Query | — | 미사용 (서버 컴포넌트 기반, 정상) |
| Query Key 관리 | — | React Query 미사용이므로 해당 없음 |
| 이미지 파이프라인 | ✅ | 4590 표준, 선수 사진 + 팀 로고 배치 조회 |
| force-dynamic | ✅ | 미사용 (`searchParams` 자동 dynamic) |
| 죽은 코드 | ✅ | 없음 |

---

## 데이터 흐름

```
TransfersPage (서버)
  │
  ├─ fetchTransfersFullData(filters, page, 20)     ← L3 cache()
  │   ├─ getTransfersCache()                        ← Supabase transfers_cache (24시간 TTL)
  │   │   └─ 캐시 히트? → 캐시된 데이터 반환
  │   │   └─ 캐시 미스? ↓
  │   ├─ fetchFromFootballApi('transfers', {...})    ← L1 캐시 (24시간)
  │   └─ setTransfersCache()                        ← 결과 저장
  │
  ├─ getPlayersKoreanNames(playerIds)               ← DB 조회
  ├─ getPlayerPhotoUrls(playerIds)                  ← Supabase asset_cache
  ├─ ensureAssetsCached('team_logo', teamIds)       ← Supabase asset_cache
  │
  └─ <TransfersPageContent
       initialData / playerKoreanNames
       playerPhotoUrls / teamLogoUrls />

TransfersPageContent (클라이언트)
  ├─ <TransferFilters />     ← 리그/팀/시즌 필터 (클라이언트 상태)
  └─ <TransferList />        ← 이적 목록 렌더링
```

**특징**:
- React Query 미사용 — 서버에서 모든 데이터 fetch 후 props 전달
- 필터 변경 시 URL searchParams 업데이트 → 서버 리렌더링
- Supabase `transfers_cache` 테이블로 L2급 캐시 구현 (24시간 TTL)

---

## 항목별 상세 검증

### API 호출 래퍼 — ✅ 정상

| 함수 | 파일 | 래퍼 | 상태 |
|------|------|:----:|:----:|
| `fetchTransfersFullData` | transfers/index.ts | `fetchFromFootballApi` | ✅ |
| `fetchTeamTransfers` | transfers/index.ts | `fetchFromFootballApi` | ✅ |
| `fetchLeagueTransfersFromAPI` | transfers/index.ts | `fetchFromFootballApi` | ✅ |

### 캐시 계층 — ✅ 정상

| 계층 | 상태 | 설명 |
|------|:----:|------|
| L1 (Next.js Data Cache) | ✅ | `fetchFromFootballApi` → transfers: 86400초 (24시간) |
| L2 (Supabase transfers_cache) | ✅ | 리그별/팀별 이적 데이터, 24시간 TTL |
| L3 (React cache) | ✅ | `fetchTransfersFullData = cache(...)`, `fetchTeamTransfers = cache(...)` |

### 이미지 파이프라인 — ✅ 4590 표준

- 선수 사진: `getPlayerPhotoUrls(playerIds)` 배치 조회
- 팀 로고: `ensureAssetsCached('team_logo', teamIds)` 배치 조회
- 모든 이미지는 Supabase Storage URL로 제공

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/app/(site)/transfers/page.tsx` | 서버 컴포넌트 (데이터 fetch) |
| `src/domains/livescore/components/football/transfers/TransfersPageContent.tsx` | 클라이언트 래퍼 |
| `src/domains/livescore/components/football/transfers/TransferFilters.tsx` | 필터 UI |
| `src/domains/livescore/actions/transfers/index.ts` | fetchTransfersFullData |
| `src/domains/livescore/actions/transfers/transfersCache.ts` | Supabase transfers_cache |
| `src/domains/livescore/actions/player/transfers.ts` | 선수별 이적 (선수 상세용) |
| `src/domains/livescore/actions/teams/transfers.ts` | 팀별 이적 (팀 상세용) |
