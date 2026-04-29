/**
 * YouTube 채널 매핑 - 매치 하이라이트 시스템
 *
 * 1순위: 한국 중계 채널 (쿠팡플레이, SPOTV) - 한국어 하이라이트
 * 2순위: 홈팀 공식 채널 - 영어 하이라이트 (fallback)
 */

// ── 한국 중계 채널 (1순위) ──

export const KOREAN_CHANNELS = {
  COUPANG_PLAY: {
    channelId: 'UCnBht7BrOx-A328KFXgysqQ',
    uploadsPlaylistId: 'UUnBht7BrOx-A328KFXgysqQ',
    name: '쿠팡플레이 스포츠',
    leagueIds: [39, 140, 78, 61, 292, 293] as const,
  },
  SPOTV: {
    channelId: 'UCtm_QoN2SIxwCE-59shX7Qg',
    uploadsPlaylistId: 'UUtm_QoN2SIxwCE-59shX7Qg',
    name: 'SPOTV',
    leagueIds: [135, 2, 3] as const,
  },
  UEFA: {
    channelId: 'UCyGa1YEx9ST66rYrJTGIKOw',
    uploadsPlaylistId: 'UUyGa1YEx9ST66rYrJTGIKOw',
    name: 'UEFA',
    leagueIds: [2, 3] as const,
  },
} as const;

export type KoreanChannelKey = keyof typeof KOREAN_CHANNELS;

// ── 리그 → 한국 채널 매핑 ──

export const LEAGUE_TO_KOREAN_CHANNEL: Record<number, KoreanChannelKey> = {
  39: 'COUPANG_PLAY', // EPL
  140: 'COUPANG_PLAY', // 라리가
  78: 'COUPANG_PLAY', // 분데스리가
  61: 'COUPANG_PLAY', // 리그앙
  292: 'COUPANG_PLAY', // K리그1
  293: 'COUPANG_PLAY', // K리그2
  135: 'SPOTV', // 세리에A
  2: 'SPOTV', // UCL
  3: 'SPOTV', // UEL
};

// ── 제목 매칭용 리그명 키워드 ──

export const LEAGUE_TITLE_KEYWORDS: Record<number, string[]> = {
  39: ['프리미어리그'],
  140: ['라리가'],
  78: ['분데스리가'],
  61: ['리그 1', '리그1'],
  292: ['K리그1', 'K리그'],
  293: ['K리그2'],
  135: ['세리에A', '세리에 A'],
  2: ['UCL', '챔피언스리그'],
  3: ['UEL', '유로파'],
};

// ── 하이라이트 지원 리그 ID 목록 ──

export const HIGHLIGHT_SUPPORTED_LEAGUE_IDS = [
  39, 140, 78, 61, 292, 293, 135, 2, 3,
] as const;

// ── 팀 공식 YouTube 채널 (2순위 fallback, 홈팀만 검색) ──

export const OFFICIAL_TEAM_CHANNELS: Record<number, string> = {
  // ── EPL ──
  42: 'UCpryVRk_VDudG8SHXgWcG0w', // Arsenal
  50: 'UC68-fNNVedSxS2Q1hWaiCJw', // Manchester City
  33: 'UC6yW44UGJJBvYTlfC7CRg2Q', // Manchester United
  66: 'UCICNP0mvtr0prFwGUQIABfQ', // Aston Villa
  40: 'UC9LQwHZoucFT94I2h6JOcjw', // Liverpool
  49: 'UCU2PacFf99vhb3hNiYDmxww', // Chelsea
  55: 'UCAalMUm3LIf504ItA3rqfug', // Brentford
  45: 'UCtK4QAczAN2mt2ow_jlGinQ', // Everton
  36: 'UC2VLfz92cTT8jHIFOecC-LA', // Fulham
  35: 'UCeOCuVSSweaEj6oVtJZEKQw', // Bournemouth
  51: 'UCf-cpC9WAdOsas19JHipukA', // Brighton
  746: 'UCrw-7k6yJc0EMJdf-0BAkoQ', // Sunderland
  34: 'UCywGl_BPp9QhD0uAcP2HsJw', // Newcastle
  52: 'UCWB9N0012fG6bGyj486Qxmg', // Crystal Palace
  63: 'UCyQcJHDN4uYfPa1DHzKVSnw', // leedsUnited
  47: 'UCEg25rdRZXg32iwai6N6l0w', // Tottenham
  65: 'UCyAxjuAr8f_BFDGCO3Htbxw', // Nottingham Forest
  48: 'UCCNOsmurvpEit9paBOzWtUg', // West Ham
  44: 'UChvUXuSDeEFSQZS8GcPMtkg', // Burnley
  39: 'UCQ7Lqg5Czh5djGK6iOG53KQ', // Wolves

  
  


// ── 라리가 2025/26 시즌 20개 팀 최종 명단 ──
529: 'UC14UlmYlSNiQCBe9Eookf_A', // 바르셀로나
541: 'UCWV3obpZVGgJ3j9FVhEjF2Q', // 레알 마드리드
533: 'UC0MLWyQ0L7uEZY8wbkDSTkw', // 비야레알
530: 'UCuzKFwdh7z2GHcIOX_tXgxA', // 아틀레티코 마드리드
543: 'UCeB7JZwcar2fVoK2w2f9OwA', // 레알 베티스
546: 'UC34fUqq4rxJc0cj5Hart0zQ', // 헤타페
538: 'UCCJLVZYqRb_85b2Flpg04cg', // 셀타 비고
548: 'UCfeqewEKWQ8CXY8OiXoMxxw', // 레알 소시에다드
531: 'UCUiLE_NqFKarAXFhhmXiIFA', // 아틀레틱 클럽
727: 'UC2JTagDPIChbcEeiLjypuYA', // 오사수나
728: 'UCUTkI-vFAO7BjfpqIDFO8rQ', // 라요 바예카노
540: 'UClywhnD01yUU5kO6OgAeHUQ', // 에스파뇰
547: 'UC6x5gKUZpXuKDujmaHc3Xhg', // 지로나
532: 'UCgvyo5x49J8ht5H9imKfxMQ', // 발렌시아
798: 'UCZ4KmAXw0xsSbTovdqB736A', // 마요르카
536: 'UCLy9lmj_0cqffXUzbGHNmYA', // 세비야
542: 'UC5yHOZPDde9RWodH5bn4QgA', // 알라베스
// 신규 추가 (ID 확인 완료)
797: 'UCeY_BssoWHlT-juP90UcZZg', // 엘체 (번호는 프로젝트 규칙에 맞게 수정 가능)
539: 'UCvOegN2N1FGPPv4xBNN2F9A', // 레반테 (번호는 프로젝트 규칙에 맞게 수정 가능)
718: 'UCvpFN8tLnBsjPR2BCJ-FJQA', // 오비에도 (번호는 프로젝트 규칙에 맞게 수정 가능)

// ── 분데스리가 2025/26 시즌 18개 팀 최종 명단 ──
157: 'UCZkcxFIsqW5htimoUQKA0iA', // 바이에른 뮌헨
165: 'UCK8rTVgp3-MebXkmeJcQb1Q', // 보루시아 도르트문트
173: 'UCkZwB4IGoNBvRmVT2gaO4XA', // RB 라이프치히
172: 'UCNjHTx_URHNiZvjW-uzIf4Q', // VfB 슈투트가르트
167: 'UCYnzpk_ECf4E2QWc9DBWjBQ', // 1899 호펜하임
168: 'UCSMZmPVql528Cph9WPvt0GA', // 바이어 레버쿠젠
160: 'UC_atVJpGbIdjIa9OC6E3yJA', // SC 프라이부르크
169: 'UCDFp4bscTFm8hYxCBx-tIXg', // 아인트라흐트 프랑크푸르트
170: 'UCMH-8bjKSpk1eNVwN2U8VLA', // FC 아우크스부르크
164: 'UCMT1hwsDgOEMhS2dIfD3e6A', // FSV 마인츠 05
182: 'UCexHeD0RsxZFZoKLhhR_IUQ', // 우니온 베를린
163: 'UCcAV1UxgHz4czIBJp9zwNyg', // 보루시아 묀헨글라트바흐
162: 'UCdjedrfgyFQEkqbkq1DJf3w', // 베르더 브레멘
186: 'UCmjYwKDykQSA9VtqaT-OVdA', // FC 장크트 파울리
161: 'UCfdfDFNp50xLjAjD0TKOa4g', // VfL 볼프스부르크
180: 'UCa3-PdvjgmAb5gBKAMfBHJA', // 1. FC 하이덴하임
// 신규 추가 (ID 확인 완료)
192: 'UCQZhvmm636X6I5rrnLFBp1w', // FC 쾰른 (번호는 프로젝트 규칙에 맞게 수정 가능)
175: 'UCUegZz1N_lW_5mKORkYykCw', // 함부르크 SV (번호는 프로젝트 규칙에 맞게 수정 가능)

// ── 세리에A 2025/26 시즌 20개 팀 최종 명단 ──
505: 'UCvXzEblUa0cfny4HAJ_ZOWw', // 인테르
489: 'UCKcx1uK38H4AOkmfv4ywlrg', // AC 밀란
492: 'UCTnCzHi0P6MH83er5OfZbzQ', // 나폴리
496: 'UCLzKhsxrExAC6yAdtZ-BOWw', // 유벤투스
895: 'UCCSgBfz78cc9JmIN7a7MCSg', // 코모
497: 'UC5jJFSjh9rq91_m71YTOafA', // AS 로마
499: 'UC0R-isVeRhMDe3vFTWP5Spg', // 아탈란타
500: 'UCaUywe79ysewBvPXljIZ__w', // 볼로냐
487: 'UC1QZ2s4eXdYWGJDRUx0R2o4', // 라치오
494: 'UCbz89vmhZ0uerNuVKxur9lA', // 우디네세
503: 'UCD-Q9QNPEmhrxyZb2yn3juA', // 토리노
495: 'UCcFYiZvNtDbvVak3wEj3usA', // 제노아
523: 'UCXKXzx4PG8dcqExNJ5npUkg', // 파르마
502: 'UC9nwpWq73kl4e2a51d1aCog', // 피오렌티나
490: 'UCKPvGWyCL62gKy-i_Fz_CJA', // 칼리아리
867: 'UCzc84VvVxLbeCQ2wYXV0VOg', // 레체
504: 'UCquN7Rmr2Hw-b3UkhtAMp_w', // 베로나
801: 'UCZz446y-Vl63CJH9Fb3k-yA', // 피사
// 신규 추가 (ID 확인 완료)
488: 'UC6S9Z-SInE8-u-O0M_YVn_Q', // 사수올로 (번호는 프로젝트 규칙에 맞게 수정 가능)
520: 'UCGvYpX8C_oA_l_S_iV11nng', // 크레모네세 (번호는 프로젝트 규칙에 맞게 수정 가능)

// ── 리그1 2025/26 시즌 18개 팀 최종 명단 ──
85: 'UCt9a_qP9CqHCNwilf-iULag', // PSG (파리 생제르맹)
116: 'UCE-f1Taamum6q2S-Ve4koSw', // 랑스
79: 'UCae9u1pNGzaklyZC8OKkeCQ', // 릴
80: 'UCYRAEs6qBn4UHH1VL7FNmDg', // 리옹
94: 'UC96bdUrtQVEqx_OmKwFAgXg', // 렌 (ID 확인됨)
81: 'UCoKweTwEeA-D9vuSVw_Z_DQ', // 마르세유
91: 'UCHy548EHHX9f-ETJlm18Jiw', // 모나코
95: 'UCfxu0LuxvMKtHjPX9faYVpg', // 스트라스부르
96: 'UCYXs6c0q6Fdlltd5SyrQnjw', // 툴루즈
106: 'UC0IUjVIiL24hZx73DahzITA', // 스타드 브레스트
77: 'UC_tAu9uLd6s4zHYHg4UY07g', // 앙제
111: 'UCFbRPjb-CC_02AZnzMmQRgA', // 르 아브르
84: 'UCAvm8jHWe-8K2kZK-7ynIHA', // 니스
108: 'UCSbKMu2GkvGa5-_K90SciAw', // 오세르 (ID 확인됨)
83: 'UC4sn_Eq3_g9Al4JhdYysj0g', // 낭트
// 신규 추가 (ID 확인 완료)
112: 'UCRt4L6aPg6hOQBoxdE-bycw', // 메스 (신규)
114: 'UCYh5fX_dsAbmpoh5Ihee45A', // 파리 FC (신규)
97: 'UC1LeTxFgKYwMeQjRjLyGRTQ', // 로리앙 (신규)

// ── K리그 12개 팀 최종 명단 ──
2766: 'UCXtWUl6qmPtibHVKIXbZlcA', // FC 서울
2767: 'UCZ8lUWJ0_vZZf-SiNedia7Q', // 울산 HD
2746: 'UCuLjoid8kKTKITvkUP94kJA', // 강원 FC
2762: 'UCKxMSkJHBIpn5b4vUQHYliQ', // 전북 현대
2761: 'UCQfQeoiJTN2EVqde4_0PlUA', // 제주 유나이티드
2764: 'UCOZQIw1I6ixjQZ_va_eCn7w', // 포항 스틸러스
2763: 'UCGA9gUrYCb4hRk_wHBzB_nQ', // 인천 유나이티드
2750: 'UCo2pmNaOCgv26neeCAkLj9w', // 대전하나시티즌 (ID 확인됨)
2768: 'UCSZ-CvpbBm6JnZnWYmiNrlQ', // 김천 상무
2759: 'UCPLHmQevKu4uTiOh1UjoL4w', // 광주 FC (ID 확인됨)
// 신규 추가 (ID 확인 완료)
2745: 'UCR2h5a66sN72NQoIBYFZ5OA', // 부천 FC 1995 (신규)
2748: 'UC9UFdmIfiMBKawVCAbRYy3g', // FC 안양 (신규)

// ── K리그2 2026 시즌 17개 팀 ──
2752: 'UCuY9Dae7K7Lq6Y0yRCHzC_A', // 부산 아이파크
2765: 'UCyC_F4oOid_7r_NlH7U9m3A', // 수원 삼성 블루윙즈
2749: 'UC6K89Lp_K_h2pE-0YfR6nSw', // 서울 이랜드 FC
2756: 'UCHPiDeQQyVcYe-nhyUanSWg', // 수원 FC
7098: 'UCIE66iZ54haLbJfkWiTH5hQ', // 파주시민 FC (파주프런티어)
7078: 'UC4s6ixsPRg8zya6awLbhAKA', // 김포 FC
2747: 'UCI50QJRCvW1NxwbjB57rGVA', // 대구 FC
2753: 'UC4oGgpewSJxBpQVQNH-0DMw', // 충남아산 FC
7060: 'UCw_g7FQILk5EoRlAi83MRyQ', // 천안시티 FC
2757: 'UCt7aHRANCzaUDnEcTxnXhgg', // 성남 FC
7087: 'UC01qzHeXKv9Q8Oc6bwympcw', // 화성 FC
2758: 'UCf5ZZmwNz0jw5KdFV9dTfRw', // 안산 그리너스
7061: 'UCXd274yCYZ-sCzwGkeoBt-A', // 충북청주 FC
2760: 'UCEAF13kWFQUBD6kVxlJs-Uw', // 전남 드래곤즈
2751: 'UCTvoVkwegdQSCMX4PT06rpg', // 경남 FC
9171: 'UC98bvCq2B70Sb8GJcY7hY9g', // 용인 FC (신규)
7076: 'UCAUAAh_yU3vqJ8dG0mmsqoQ', // 김해 FC
};
