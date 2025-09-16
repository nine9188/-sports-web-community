// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 포르투갈 프리메이라 리가 ID
export const PRIMEIRA_LIGA_ID = 94;

// 포르투갈 프리메이라 리가 팀 매핑 데이터
export const PRIMEIRA_LIGA_TEAMS: TeamMapping[] = [
  {
    id: 228,
    name_ko: '스포르팅',
    name_en: 'Sporting CP',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'SPO'
  },
  {
    id: 211,
    name_ko: '벤피카',
    name_en: 'Benfica',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'BEN'
  },
  {
    id: 217,
    name_ko: '브라가',
    name_en: 'SC Braga',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'BRA'
  },
  {
    id: 212,
    name_ko: '포르투',
    name_en: 'FC Porto',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'POR'
  },
  {
    id: 224,
    name_ko: '비토리아 드 기마랑이스',
    name_en: 'Guimaraes',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'GUI'
  },
  {
    id: 227,
    name_ko: '산타 클라라',
    name_en: 'Santa Clara',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'SAN'
  },
  {
    id: 242,
    name_ko: '파말리카오',
    name_en: 'Famalicao',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'FAM'
  },
  {
    id: 4716,
    name_ko: '카사 피아',
    name_en: 'Casa Pia',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'CAS'
  },
  {
    id: 230,
    name_ko: '이스토릴 프라이아',
    name_en: 'Estoril',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'EST'
  },
  {
    id: 215,
    name_ko: '모레이렌스',
    name_en: 'Moreirense',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'MOR'
  },
  {
    id: 226,
    name_ko: '히우 아브',
    name_en: 'Rio Ave',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'RIO'
  },
  {
    id: 225,
    name_ko: '나시오날',
    name_en: 'Nacional',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'NAC'
  },
  {
    id: 240,
    name_ko: '아로카',
    name_en: 'Arouca',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'ARO'
  },
  {
    id: 762,
    name_ko: '길 비센테',
    name_en: 'GIL Vicente',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'VIC'
  },
  {
    id: 15130,
    name_ko: '이스트렐라 아마도라',
    name_en: 'Estrela',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: undefined
  },
  {
    id: 21595,
    name_ko: 'AVS',
    name_en: 'AVS',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: undefined
  },
  {
    id: 231,
    name_ko: '파렌스',
    name_en: 'Farense',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'FAR'
  },
  {
    id: 222,
    name_ko: '보아비스타',
    name_en: 'Boavista',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: undefined
  },
  {
    id: 4724,
    name_ko: '알베르카',
    name_en: 'Alverca',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'ALV'
  },
  {
    id: 218,
    name_ko: '톤델라',
    name_en: 'Tondela',
    country_ko: '포르투갈',
    country_en: 'Portugal',
    code: 'TON'
  }
  
];

// 팀 ID로 프리메이라 리가 팀 정보 가져오기
export function getPrimeiraLigaTeamById(id: number): TeamMapping | undefined {
  return PRIMEIRA_LIGA_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 프리메이라 리가 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchPrimeiraLigaTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return PRIMEIRA_LIGA_TEAMS.filter(team => 
    team.name_ko.includes(name) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
} 