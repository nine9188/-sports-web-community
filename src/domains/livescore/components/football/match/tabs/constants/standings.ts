interface LegendItem {
  condition: string;
  color: string;
  label: string;
}

interface CompetitionLegend {
  conditions: string[];
  items: LegendItem[];
}

// 리그별 ID 매핑 (API-Sports League IDs)
export const LEAGUE_IDS = {
  // 유럽 TOP 5 리그
  PREMIER_LEAGUE: 39,      // 프리미어리그
  LA_LIGA: 140,            // 라리가
  BUNDESLIGA: 78,          // 분데스리가
  SERIE_A: 135,            // 세리에A
  LIGUE_1: 61,             // 리그1
  
  // 유럽 기타 리그
  SCOTTISH_PREMIERSHIP: 179, // 스코틀랜드 프리미어십
  EREDIVISIE: 88,           // 에레디비지에
  PRIMEIRA_LIGA: 94,        // 프리메이라 리가
  
  // 아시아 리그
  K_LEAGUE_1: 292,         // K리그1
  J_LEAGUE_1: 98,          // J1리그
  CHINESE_SUPER_LEAGUE: 169, // 중국 슈퍼리그
  SAUDI_PRO_LEAGUE: 307,   // 사우디 프로리그
  
  // 미주 & 중남미
  MLS: 253,                // MLS
  BRASILEIRAO: 71,         // 브라질레이로
  LIGA_MX: 262,            // 리가 MX
  
  // 하위리그
  CHAMPIONSHIP: 40,        // 챔피언십
  
  // UEFA 클럽 대항전
  CHAMPIONS_LEAGUE: 2,     // 챔피언스리그
  EUROPA_LEAGUE: 3,        // 유로파리그
  CONFERENCE_LEAGUE: 848,  // 컨퍼런스리그
  
  // 국내 컵 대회
  FA_CUP: 45,              // FA컵
  EFL_CUP: 48,             // EFL컵
  COPA_DEL_REY: 143,       // 코파 델 레이
  COPPA_ITALIA: 137,       // 코파 이탈리아
  COUPE_DE_FRANCE: 66,     // 쿠프 드 프랑스
  DFB_POKAL: 81,           // DFB 포칼
};

export const STANDINGS_LEGENDS: Record<string, CompetitionLegend> = {
  // 🇬🇧 프리미어리그
  premierLeague: {
    conditions: ['premier league', 'epl'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: '챔피언스리그 (1~4위)'
      },
      {
        condition: 'europa league',
        color: 'bg-blue-500',
        label: '유로파리그 (5위)'
      },
      {
        condition: 'europa league qualification',
        color: 'bg-blue-400',
        label: '유로파/컨퍼런스리그 (6~7위)'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '챔피언십 강등 (18~20위)'
      }
    ]
  },

  // 🇪🇸 라리가
  laLiga: {
    conditions: ['la liga', 'laliga'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: '챔피언스리그 (1~4위)'
      },
      {
        condition: 'europa league',
        color: 'bg-blue-500',
        label: '유로파리그 (5위)'
      },
      {
        condition: 'conference league',
        color: 'bg-cyan-500',
        label: '컨퍼런스리그 (6위)'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '세군다 강등 (18~20위)'
      }
    ]
  },

  // 🇩🇪 분데스리가
  bundesliga: {
    conditions: ['bundesliga'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: '챔피언스리그 (1~4위)'
      },
      {
        condition: 'europa league',
        color: 'bg-blue-500',
        label: '유로파리그 (5위)'
      },
      {
        condition: 'europa league qualification',
        color: 'bg-blue-400',
        label: '유로파/컨퍼런스리그 (6위)'
      },
      {
        condition: 'relegation play-off',
        color: 'bg-orange-500',
        label: '승강 플레이오프 (16위)'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '2부 강등 (17~18위)'
      }
    ]
  },

  // 🇮🇹 세리에A
  serieA: {
    conditions: ['serie a', 'seriea'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: '챔피언스리그 (1~4위)'
      },
      {
        condition: 'europa league',
        color: 'bg-blue-500',
        label: '유로파리그 (5위)'
      },
      {
        condition: 'conference league',
        color: 'bg-cyan-500',
        label: '컨퍼런스리그 (6위)'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '세리에B 강등 (18~20위)'
      }
    ]
  },

  // 🇫🇷 리그1
  ligue1: {
    conditions: ['ligue 1', 'ligue1'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: '챔피언스리그 (1~3위)'
      },
      {
        condition: 'europa league',
        color: 'bg-blue-500',
        label: '유로파리그 (4위)'
      },
      {
        condition: 'conference league',
        color: 'bg-cyan-500',
        label: '컨퍼런스리그 (5위)'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '리그2 강등 (16~18위)'
      }
    ]
  },

  // 🔵 UEFA 챔피언스리그 (2024~ 스위스 리그 방식)
  championsLeague: {
    conditions: ['champions league', 'uefa champions league'],
    items: [
      {
        condition: '1/8-finals',
        color: 'bg-green-600',
        label: '16강 직행 (1~8위)'
      },
      {
        condition: 'play-off',
        color: 'bg-yellow-500',
        label: '16강 플레이오프 (9~24위)'
      },
      {
        condition: 'elimination',
        color: 'bg-gray-400',
        label: '탈락 (25~36위)'
      }
    ]
  },

  // 🟠 유로파리그 (2024~ 스위스 리그 방식)
  europaLeague: {
    conditions: ['europa league', 'uefa europa league'],
    items: [
      {
        condition: '1/8-finals',
        color: 'bg-blue-600',
        label: '16강 직행 (1~8위)'
      },
      {
        condition: 'play-off',
        color: 'bg-yellow-500',
        label: '16강 플레이오프 (9~24위)'
      },
      {
        condition: 'elimination',
        color: 'bg-gray-400',
        label: '탈락 (25~36위)'
      }
    ]
  },

  // 🟢 컨퍼런스리그 (2024~ 스위스 리그 방식)
  conferenceLeague: {
    conditions: ['conference league', 'uefa conference league'],
    items: [
      {
        condition: '1/8-finals',
        color: 'bg-cyan-600',
        label: '16강 직행 (1~8위)'
      },
      {
        condition: 'play-off',
        color: 'bg-yellow-500',
        label: '16강 플레이오프 (9~24위)'
      },
      {
        condition: 'elimination',
        color: 'bg-gray-400',
        label: '탈락 (25~36위)'
      }
    ]
  },

  // 🇬🇧 스코틀랜드 프리미어십
  scottishPremiership: {
    conditions: ['scottish premiership', 'scotland'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: '챔피언스리그'
      },
      {
        condition: 'europa league',
        color: 'bg-blue-500',
        label: '유로파리그'
      },
      {
        condition: 'conference league',
        color: 'bg-cyan-500',
        label: '컨퍼런스리그'
      },
      {
        condition: 'relegation play-off',
        color: 'bg-orange-500',
        label: '승강 플레이오프 (11위)'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '강등 (최하위)'
      }
    ]
  },

  // 🇳🇱 에레디비지에
  eredivisie: {
    conditions: ['eredivisie', 'netherlands'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: '챔피언스리그 (1~2위)'
      },
      {
        condition: 'europa league',
        color: 'bg-blue-500',
        label: '유로파리그 (3~5위)'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '강등 (17~18위)'
      }
    ]
  },

  // 🇵🇹 프리메이라 리가
  primeiraLiga: {
    conditions: ['primeira liga', 'portugal'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: '챔피언스리그 (1~3위)'
      },
      {
        condition: 'europa league',
        color: 'bg-blue-500',
        label: '유로파리그 (4~5위)'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '강등 (16~18위)'
      }
    ]
  },

  // 🇰🇷 K리그1
  kLeague1: {
    conditions: ['k league', 'k-league', 'korea'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: 'AFC 챔피언스리그'
      },
      {
        condition: 'relegation play-off',
        color: 'bg-orange-500',
        label: '승강 플레이오프 (11위)'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '강등 (12위)'
      }
    ]
  },

  // 🇯🇵 J1리그
  jLeague1: {
    conditions: ['j1 league', 'j-league', 'japan'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: 'AFC 챔피언스리그'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: 'J2 강등 (17~18위)'
      }
    ]
  },

  // 🇨🇳 중국 슈퍼리그
  chineseSuperLeague: {
    conditions: ['chinese super league', 'china'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: 'AFC 챔피언스리그'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '강등 (하위 2팀)'
      }
    ]
  },

  // 🇸🇦 사우디 프로리그
  saudiProLeague: {
    conditions: ['saudi pro league', 'saudi', 'roshn'],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: 'AFC 챔피언스리그'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '강등 (16~18위)'
      }
    ]
  },

  // 🇺🇸 MLS
  mls: {
    conditions: ['mls', 'major league soccer'],
    items: [
      {
        condition: 'eastern conference',
        color: 'bg-blue-500',
        label: '동부 컨퍼런스'
      },
      {
        condition: 'western conference',
        color: 'bg-red-500',
        label: '서부 컨퍼런스'
      },
      {
        condition: 'playoff',
        color: 'bg-green-500',
        label: '플레이오프 진출'
      }
    ]
  },

  // 🇧🇷 브라질레이로
  brasileirao: {
    conditions: ['brasileirao', 'serie a', 'brazil'],
    items: [
      {
        condition: 'copa libertadores',
        color: 'bg-green-600',
        label: '코파 리베르타도레스'
      },
      {
        condition: 'copa sudamericana',
        color: 'bg-blue-500',
        label: '코파 수다메리카나'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '강등 (17~20위)'
      }
    ]
  },

  // 🇲🇽 리가 MX
  ligaMX: {
    conditions: ['liga mx', 'mexico'],
    items: [
      {
        condition: 'playoff',
        color: 'bg-green-500',
        label: '플레이오프 (아페르투라/클라우수라)'
      }
    ]
  },

  // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 챔피언십 (잉글랜드 2부)
  championship: {
    conditions: ['championship', 'efl championship'],
    items: [
      {
        condition: 'promotion',
        color: 'bg-green-600',
        label: '프리미어리그 자동 승격 (1~2위)'
      },
      {
        condition: 'promotion play-off',
        color: 'bg-green-400',
        label: '승격 플레이오프 (3~6위)'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '리그원 강등 (22~24위)'
      }
    ]
  },

  // 🏆 FA컵
  faCup: {
    conditions: ['fa cup'],
    items: [
      {
        condition: 'winner',
        color: 'bg-gold-500',
        label: '우승팀 유로파리그 진출'
      }
    ]
  },

  // 🏆 EFL컵 (리그컵)
  eflCup: {
    conditions: ['efl cup', 'league cup', 'carabao cup'],
    items: [
      {
        condition: 'winner',
        color: 'bg-gold-500',
        label: '우승팀 컨퍼런스리그 플레이오프'
      }
    ]
  },

  // 🏆 코파 델 레이
  copaDelRey: {
    conditions: ['copa del rey'],
    items: [
      {
        condition: 'winner',
        color: 'bg-gold-500',
        label: '우승팀 유로파리그 진출'
      }
    ]
  },

  // 🏆 코파 이탈리아
  coppaItalia: {
    conditions: ['coppa italia'],
    items: [
      {
        condition: 'winner',
        color: 'bg-gold-500',
        label: '우승팀 유로파리그 진출'
      }
    ]
  },

  // 🏆 쿠프 드 프랑스
  coupeDeFrance: {
    conditions: ['coupe de france'],
    items: [
      {
        condition: 'winner',
        color: 'bg-gold-500',
        label: '우승팀 유로파리그 진출'
      }
    ]
  },

  // 🏆 DFB 포칼
  dfbPokal: {
    conditions: ['dfb pokal', 'dfb-pokal'],
    items: [
      {
        condition: 'winner',
        color: 'bg-gold-500',
        label: '우승팀 유럽대항전 진출권'
      }
    ]
  },

  // 기본 범례 (다른 리그용)
  default: {
    conditions: [],
    items: [
      {
        condition: 'champions league',
        color: 'bg-green-600',
        label: '챔피언스리그'
      },
      {
        condition: 'europa league',
        color: 'bg-blue-500',
        label: '유로파리그'
      },
      {
        condition: 'conference league',
        color: 'bg-cyan-500',
        label: '컨퍼런스리그'
      },
      {
        condition: 'promotion',
        color: 'bg-green-500',
        label: '승격권'
      },
      {
        condition: 'relegation play-off',
        color: 'bg-orange-500',
        label: '승강 플레이오프'
      },
      {
        condition: 'relegation',
        color: 'bg-red-500',
        label: '강등권'
      }
    ]
  }
}; 