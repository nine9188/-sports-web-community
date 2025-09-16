// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 세리에 A ID
export const SERIE_A_ID = 135;

// 세리에 A 팀 매핑 데이터
export const SERIE_A_TEAMS: TeamMapping[] = [
  {
    id: 505,
    name_ko: '인테르',
    name_en: 'Inter',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'INT'
  },
  {
    id: 492,
    name_ko: '나폴리',
    name_en: 'Napoli',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'NAP'
  },
  {
    id: 496,
    name_ko: '유벤투스',
    name_en: 'Juventus',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'JUV'
  },
  {
    id: 499,
    name_ko: '아탈란타',
    name_en: 'Atalanta',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'ATA'
  },
  {
    id: 500,
    name_ko: '볼로냐',
    name_en: 'Bologna',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'BOL'
  },
  {
    id: 487,
    name_ko: '라치오',
    name_en: 'Lazio',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'LAZ'
  },
  {
    id: 497,
    name_ko: 'AS 로마',
    name_en: 'AS Roma',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'ROM'
  },
  {
    id: 502,
    name_ko: '피오렌티나',
    name_en: 'Fiorentina',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'FIO'
  },
  {
    id: 489,
    name_ko: 'AC 밀란',
    name_en: 'AC Milan',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'MIL'
  },
  {
    id: 503,
    name_ko: '토리노',
    name_en: 'Torino',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'TOR'
  },
  {
    id: 494,
    name_ko: '우디네세',
    name_en: 'Udinese',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'UDI'
  },
  {
    id: 495,
    name_ko: '제노아',
    name_en: 'Genoa',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'GEN'
  },
  {
    id: 895,
    name_ko: '코모',
    name_en: 'Como',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'COM'
  },
  {
    id: 504,
    name_ko: '베로나',
    name_en: 'Verona',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'VER'
  },
  {
    id: 490,
    name_ko: '칼리아리',
    name_en: 'Cagliari',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'CAG'
  },
  {
    id: 523,
    name_ko: '파르마',
    name_en: 'Parma',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'PAR'
  },
  {
    id: 867,
    name_ko: '레체',
    name_en: 'Lecce',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'LEC'
  },
  {
    id: 511,
    name_ko: '엠폴리',
    name_en: 'Empoli',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'EMP'
  },
  {
    id: 517,
    name_ko: '베네치아',
    name_en: 'Venezia',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'VEN'
  },
  {
    id: 1579,
    name_ko: '몬자',
    name_en: 'Monza',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'MON'
  },
  {
    id: 520,
    name_ko: '크레모네세',
    name_en: 'Cremonese',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'CRE'
  },
  {
    id: 488,
    name_ko: '사수올로',
    name_en: 'Sassuolo',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'SAS'
  },
  {
    id: 801,
    name_ko: '피사',
    name_en: 'Pisa',
    country_ko: '이탈리아',
    country_en: 'Italy',
    code: 'PIS'
  }
  
];

// 팀 ID로 세리에 A 팀 정보 가져오기
export function getSerieATeamById(id: number): TeamMapping | undefined {
  return SERIE_A_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 세리에 A 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchSerieATeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return SERIE_A_TEAMS.filter(team => 
    team.name_ko.includes(name) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
} 