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
    leagueIds: [39, 140, 78, 61, 292] as const,
  },
  SPOTV: {
    channelId: 'UCtm_QoN2SIxwCE-59shX7Qg',
    uploadsPlaylistId: 'UUtm_QoN2SIxwCE-59shX7Qg',
    name: 'SPOTV',
    leagueIds: [135, 2, 3] as const,
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
  135: ['세리에A', '세리에 A'],
  2: ['UCL', '챔피언스리그'],
  3: ['UEL', '유로파'],
};

// ── 하이라이트 지원 리그 ID 목록 ──

export const HIGHLIGHT_SUPPORTED_LEAGUE_IDS = [
  39, 140, 78, 61, 292, 135, 2, 3,
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

  
  


  // ── 라리가 ──
  529: 'UC14UlmYlSNiQCBe9Eookf_A', // Barcelona
  541: 'UCWV3obpZVGgJ3j9FVhEjF2Q', // Real Madrid
  530: 'UCuzKFwdh7z2GHcIOX_tXgxA', // Atletico Madrid
  531: 'UCUiLE_NqFKarAXFhhmXiIFA', // Athletic Club
  533: 'UC0MLWyQ0L7uEZY8wbkDSTkw', // Villarreal
  543: 'UCeB7JZwcar2fVoK2w2f9OwA', // Real Betis
  538: 'UCCJLVZYqRb_85b2Flpg04cg', // Celta Vigo
  798: 'UCZ4KmAXw0xsSbTovdqB736A', // Mallorca
  548: 'UCfeqewEKWQ8CXY8OiXoMxxw', // Real Sociedad
  728: 'UCUTkI-vFAO7BjfpqIDFO8rQ', // Rayo Vallecano
  546: 'UC34fUqq4rxJc0cj5Hart0zQ', // Getafe
  532: 'UCgvyo5x49J8ht5H9imKfxMQ', // Valencia
  536: 'UCLy9lmj_0cqffXUzbGHNmYA', // Sevilla
  540: 'UClywhnD01yUU5kO6OgAeHUQ', // Espanyol
  727: 'UC2JTagDPIChbcEeiLjypuYA', // Osasuna
  547: 'UC6x5gKUZpXuKDujmaHc3Xhg', // Girona
  542: 'UC5yHOZPDde9RWodH5bn4QgA', // Alaves
  534: 'UCVmpXogwdZ48VRUIR56fNgQ', // Las Palmas
  537: 'UCo3YoqowZ5Uu0gpJxgwaA_g', // Leganes
  720: 'UC8EDad9xVOqr8bMDhqeJdcw', // Valladolid

  // ── 분데스리가 ──
  157: 'UCZkcxFIsqW5htimoUQKA0iA', // Bayern München
  168: 'UCSMZmPVql528Cph9WPvt0GA', // Bayer Leverkusen
  169: 'UCDFp4bscTFm8hYxCBx-tIXg', // Eintracht Frankfurt
  173: 'UCkZwB4IGoNBvRmVT2gaO4XA', // RB Leipzig
  164: 'UCMT1hwsDgOEMhS2dIfD3e6A', // FSV Mainz 05
  160: 'UC_atVJpGbIdjIa9OC6E3yJA', // SC Freiburg
  163: 'UCcAV1UxgHz4czIBJp9zwNyg', // Borussia Mönchengladbach
  165: 'UCK8rTVgp3-MebXkmeJcQb1Q', // Borussia Dortmund
  170: 'UCMH-8bjKSpk1eNVwN2U8VLA', // FC Augsburg
  172: 'UCNjHTx_URHNiZvjW-uzIf4Q', // VfB Stuttgart
  162: 'UCdjedrfgyFQEkqbkq1DJf3w', // Werder Bremen
  161: 'UCfdfDFNp50xLjAjD0TKOa4g', // VfL Wolfsburg
  182: 'UCexHeD0RsxZFZoKLhhR_IUQ', // Union Berlin
  167: 'UCYnzpk_ECf4E2QWc9DBWjBQ', // 1899 Hoffenheim
  186: 'UCmjYwKDykQSA9VtqaT-OVdA', // FC St. Pauli
  180: 'UCa3-PdvjgmAb5gBKAMfBHJA', // 1. FC Heidenheim
  176: 'UCosWpaTY6_EXtb7OXf8HrhQ', // VfL Bochum
  191: 'UCTjC3TYAW7ilfryQ9Omn6TA', // Holstein Kiel

  // ── 세리에A ──
  505: 'UCvXzEblUa0cfny4HAJ_ZOWw', // Inter
  492: 'UCTnCzHi0P6MH83er5OfZbzQ', // Napoli
  496: 'UCLzKhsxrExAC6yAdtZ-BOWw', // Juventus
  499: 'UC0R-isVeRhMDe3vFTWP5Spg', // Atalanta
  500: 'UCaUywe79ysewBvPXljIZ__w', // Bologna
  487: 'UC1QZ2s4eXdYWGJDRUx0R2o4', // Lazio
  497: 'UC5jJFSjh9rq91_m71YTOafA', // AS Roma
  502: 'UC9nwpWq73kl4e2a51d1aCog', // Fiorentina
  489: 'UCKcx1uK38H4AOkmfv4ywlrg', // AC Milan
  503: 'UCD-Q9QNPEmhrxyZb2yn3juA', // Torino
  494: 'UCbz89vmhZ0uerNuVKxur9lA', // Udinese
  495: 'UCcFYiZvNtDbvVak3wEj3usA', // Genoa
  895: 'UCCSgBfz78cc9JmIN7a7MCSg', // Como
  504: 'UCquN7Rmr2Hw-b3UkhtAMp_w', // Verona
  490: 'UCKPvGWyCL62gKy-i_Fz_CJA', // Cagliari
  523: 'UCXKXzx4PG8dcqExNJ5npUkg', // Parma
  867: 'UCzc84VvVxLbeCQ2wYXV0VOg', // Lecce
  511: 'UCQUI7PTAVYa1fceC494WQIg', // Empoli
  517: 'UCJJps-5awi4eioa38QEcp-g', // Venezia
  1579: 'UCgFNZmFK4tLKPpXpvJGS9dQ', // Monza

  // ── 리그1 ──
  85: 'UCt9a_qP9CqHCNwilf-iULag', // PSG
  91: 'UCHy548EHHX9f-ETJlm18Jiw', // Monaco
  81: 'UCoKweTwEeA-D9vuSVw_Z_DQ', // Marseille
  79: 'UCae9u1pNGzaklyZC8OKkeCQ', // Lille
  95: 'UCfxu0LuxvMKtHjPX9faYVpg', // Strasbourg
  84: 'UCAvm8jHWe-8K2kZK-7ynIHA', // Nice
  80: 'UCYRAEs6qBn4UHH1VL7FNmDg', // Lyon
  106: 'UC0IUjVIiL24hZx73DahzITA', // Stade Brestois
  116: 'UCE-f1Taamum6q2S-Ve4koSw', // Lens
  96: 'UCYXs6c0q6Fdlltd5SyrQnjw', // Toulouse
  83: 'UC4sn_Eq3_g9Al4JhdYysj0g', // Nantes
  93: 'UCom66wjZm3vaOeRdsU1jXtQ', // Reims
  77: 'UC_tAu9uLd6s4zHYHg4UY07g', // Angers
  111: 'UCFbRPjb-CC_02AZnzMmQRgA', // Le Havre
  1063: 'UCscJOCFCeR6f61BaHJdJ9Eg', // Saint-Etienne
  82: 'UCShdjQGwGgq34kUXpbsBD6w', // Montpellier
  // 108: Auxerre - 채널 ID 미확인
  // 94: Rennes - 채널 ID 미확인

  // ── K리그 ──
  2767: 'UCZ8lUWJ0_vZZf-SiNedia7Q', // 울산
  2762: 'UCKxMSkJHBIpn5b4vUQHYliQ', // 전북
  2764: 'UCOZQIw1I6ixjQZ_va_eCn7w', // 포항
  2766: 'UCXtWUl6qmPtibHVKIXbZlcA', // FC 서울
  2763: 'UCGA9gUrYCb4hRk_wHBzB_nQ', // 인천
  2761: 'UCQfQeoiJTN2EVqde4_0PlUA', // 제주
  2746: 'UCuLjoid8kKTKITvkUP94kJA', // 강원
  2768: 'UCSZ-CvpbBm6JnZnWYmiNrlQ', // 김천
  // 2750: 대전 - 채널 ID 미확인
  // 2759: 광주 - 채널 ID 미확인
};
