# React Query 리팩토링 가이드

> 이 문서는 Phase별로 분리되었습니다.
>
> **새 문서 위치: [docs/refactoring/react-query/](./react-query/README.md)**

---

## 문서 구조

```
docs/refactoring/react-query/
├── README.md                      # 전체 개요 및 인덱스
├── phase-1-context-migration.md   # Phase 1: Context → React Query
├── phase-2-livescore-polling.md   # Phase 2: Livescore 폴링 & 캐싱
├── phase-3-admin.md               # Phase 3: Admin 페이지
├── phase-4-medium-priority.md     # Phase 4: Medium Priority
├── phase-5-common-components.md   # Phase 5: 공통 컴포넌트
└── shared-patterns.md             # 공통 패턴 & Query Keys
```

---

## 빠른 링크

| Phase | 문서 | 상태 |
|-------|------|------|
| 1 | [Context → React Query](./react-query/phase-1-context-migration.md) | ✅ 완료 |
| 2 | [Livescore 폴링 & 캐싱](./react-query/phase-2-livescore-polling.md) | ✅ 완료 |
| 3 | [Admin 페이지](./react-query/phase-3-admin.md) | ✅ 완료 |
| 4 | [Medium Priority](./react-query/phase-4-medium-priority.md) | ✅ 완료 |
| 5 | [공통 컴포넌트](./react-query/phase-5-common-components.md) | ✅ 완료 |
| - | [공통 패턴 & Query Keys](./react-query/shared-patterns.md) | 📖 참고 |

---

## 현재 진행 상황

모든 Phase가 완료되었습니다.

- **Phase 1** ✅: Player, Team, Match Context 마이그레이션 완료 (4,170줄 → ~500줄)
- **Phase 2** ✅: LiveScoreView, LeagueStandings 마이그레이션 완료
- **Phase 3** ✅: Admin 페이지 완료
  - Phase 3-1: UI Guidelines 적용 완료
  - Phase 3-2: React Query 마이그레이션 완료 (9개 훅)
  - Phase 3-3: 대형 컴포넌트 리팩토링 완료 (8개 파일, 60% 코드 감소)
- **Phase 4** ✅: EntityPicker, Notifications 등 5개 컴포넌트 완료
- **Phase 5** ✅: StateComponents, useClickOutside 완료

---

## 주요 성과

| 항목 | 수치 |
|------|------|
| Phase 1 코드 절감 | 4,170줄 → ~500줄 |
| Phase 3 코드 절감 | 5,253줄 → 2,076줄 (60%) |
| 생성된 React Query 훅 | 19개 |
| 분리된 Admin 컴포넌트 | 8개 도메인, 40+ 파일 |
