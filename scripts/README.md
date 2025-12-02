# 📜 Scripts 폴더

이 폴더는 프로젝트의 모든 스크립트 파일을 통합 관리합니다.

---

## 📂 스크립트 구조

```
scripts/
├── README.md (이 파일)
├── test-hot-notifications.ts    # HOT 알림 테스트 스크립트
├── generate-saudi-players.js    # 사우디 리그 선수 데이터 생성
└── data-generation/              # 데이터 생성 스크립트 모음
    ├── build_saudi_file.py
    ├── fetch_and_build.sh
    ├── fetch_saudi_data.js
    ├── generate_j1_players.js
    ├── generate_j1_players.py
    ├── generate_mls_part2.js
    ├── generate_saudi_players.js
    ├── generate_saudi_players_final.py
    ├── generate_saudi_pro_league.js
    ├── process_mls_players.py
    ├── translate_eredivisie_full.py
    ├── translate_eredivisie_players.py
    └── translate_primeira_players.py
```

---

## 🔥 HOT 알림 테스트

### test-hot-notifications.ts

HOT 알림 시스템을 테스트하는 스크립트입니다.

**사용법**:
```bash
cd 123/1234
npx tsx scripts/test-hot-notifications.ts
```

**자세한 가이드**: [testing-hot-notifications.md](../docs/guides/testing-hot-notifications.md)

---

## ⚽ 데이터 생성 스크립트

### data-generation/

각종 리그의 선수 데이터를 생성하고 번역하는 스크립트 모음입니다.

#### 사우디 프로 리그

| 스크립트 | 설명 |
|---------|------|
| `generate_saudi_players.js` | 사우디 리그 선수 데이터 생성 |
| `generate_saudi_players_final.py` | 최종 사우디 선수 데이터 생성 (Python) |
| `generate_saudi_pro_league.js` | 사우디 프로 리그 데이터 생성 |
| `fetch_saudi_data.js` | 사우디 데이터 가져오기 |
| `build_saudi_file.py` | 사우디 파일 빌드 |
| `fetch_and_build.sh` | 사우디 데이터 가져오기 및 빌드 (셸 스크립트) |

**사용법**:
```bash
# Node.js 스크립트
node scripts/data-generation/generate_saudi_players.js

# Python 스크립트
python scripts/data-generation/generate_saudi_players_final.py

# 셸 스크립트
bash scripts/data-generation/fetch_and_build.sh
```

#### J1 리그 (일본)

| 스크립트 | 설명 |
|---------|------|
| `generate_j1_players.js` | J1 리그 선수 데이터 생성 (JavaScript) |
| `generate_j1_players.py` | J1 리그 선수 데이터 생성 (Python) |

#### MLS (미국)

| 스크립트 | 설명 |
|---------|------|
| `generate_mls_part2.js` | MLS 선수 데이터 생성 (Part 2) |
| `process_mls_players.py` | MLS 선수 데이터 처리 |

**관련 문서**: [MLS_PLAYER_MAPPING_SUMMARY.md](../docs/guides/MLS_PLAYER_MAPPING_SUMMARY.md)

#### 유럽 리그

| 스크립트 | 설명 |
|---------|------|
| `translate_eredivisie_players.py` | 에레디비시 선수명 번역 |
| `translate_eredivisie_full.py` | 에레디비시 전체 데이터 번역 |
| `translate_primeira_players.py` | 프리메이라 리가 선수명 번역 |

---

## 🛠️ 기타 스크립트 (123/1234/ 루트)

프로젝트 루트 디렉토리에도 일부 스크립트가 있습니다:

| 스크립트 | 위치 | 설명 |
|---------|------|------|
| `migrate-auth-guard.js` | 123/1234/ | Auth Guard 마이그레이션 |
| `migrate-server-imports.js` | 123/1234/ | 서버 임포트 마이그레이션 |
| `migrate-supabase-imports.js` | 123/1234/ | Supabase 임포트 마이그레이션 |
| `fetch_j1_from_supabase.js` | 123/1234/ | Supabase에서 J1 데이터 가져오기 |
| `run_j1_generator.js` | 123/1234/ | J1 생성기 실행 |

---

## 📝 스크립트 작성 규칙

1. **위치**:
   - 테스트 스크립트 → `scripts/`
   - 데이터 생성 스크립트 → `scripts/data-generation/`
   - 마이그레이션 스크립트 → 프로젝트 루트 (123/1234/)

2. **네이밍**:
   - 케밥 케이스 사용 (예: `test-hot-notifications.ts`)
   - 명확한 동사 사용 (generate, fetch, process, translate, migrate)

3. **문서화**:
   - 복잡한 스크립트는 별도 가이드 작성 (`docs/guides/`)
   - 스크립트 상단에 사용법 주석 추가

---

## 관련 문서

- [HOT 알림 테스트 가이드](../docs/guides/testing-hot-notifications.md)
- [MLS 선수 매핑 요약](../docs/guides/MLS_PLAYER_MAPPING_SUMMARY.md)

---

**문서 작성일**: 2025-12-03
**최종 업데이트**: 2025-12-03
**버전**: 1.0.0
