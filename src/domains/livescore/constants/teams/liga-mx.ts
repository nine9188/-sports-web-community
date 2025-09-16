// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 멕시코 리가 MX ID
export const LIGA_MX_ID = 262;

// 리가 MX 팀 매핑 데이터 (템플릿)
export const LIGA_MX_TEAMS: TeamMapping[] = [
  {
    id: 2282,
    name_ko: '몬테레이',
    name_en: 'Monterrey',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'MTY'
  },
  {
    id: 2295,
    name_ko: '크루스 아술',
    name_en: 'Cruz Azul',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'CAZ'
  },
  {
    id: 2287,
    name_ko: '클럽 아메리카',
    name_en: 'Club America',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'AME'
  },
  {
    id: 2281,
    name_ko: '톨루카',
    name_en: 'Toluca',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'TOL'
  },
  {
    id: 2279,
    name_ko: '티그레스 UANL',
    name_en: 'Tigres UANL',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'TIG'
  },
  {
    id: 2280,
    name_ko: '티후아나',
    name_en: 'Club Tijuana',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'TIJ'
  },
  {
    id: 2292,
    name_ko: '파추카',
    name_en: 'Pachuca',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'PAC'
  },
  {
    id: 2286,
    name_ko: '푸마스 UNAM',
    name_en: 'U.N.A.M. - Pumas',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'PUM'
  },
  {
    id: 2298,
    name_ko: '후아레스',
    name_en: 'FC Juarez',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'JUA'
  },
  {
    id: 2289,
    name_ko: '레온',
    name_en: 'Leon',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'LEO'
  },
  {
    id: 2278,
    name_ko: '치바스 과달라하라',
    name_en: 'Guadalajara Chivas',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'GDL'
  },
  {
    id: 2285,
    name_ko: '산토스 라구나',
    name_en: 'Santos Laguna',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'SAN'
  },
  {
    id: 2314,
    name_ko: '아틀레티코 산루이스',
    name_en: 'Atletico San Luis',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'ASL'
  },
  {
    id: 14002,
    name_ko: '마사틀란',
    name_en: 'Mazatlán',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'MAZ'
  },
  {
    id: 2283,
    name_ko: '아틀라스',
    name_en: 'Atlas',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'ATL'
  },
  {
    id: 2288,
    name_ko: '네카사',
    name_en: 'Necaxa',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'NEC'
  },
  {
    id: 2290,
    name_ko: '케레타로',
    name_en: 'Club Queretaro',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'QRO'
  },
  {
    id: 2291,
    name_ko: '푸에블라',
    name_en: 'Puebla',
    country_ko: '멕시코',
    country_en: 'Mexico',
    code: 'PUE'
  }
  ];

export function getLigaMxTeamById(id: number): TeamMapping | undefined {
  return LIGA_MX_TEAMS.find(team => team.id === id);
}

export function searchLigaMxTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return LIGA_MX_TEAMS.filter(team => 
    team.name_ko.toLowerCase().includes(lowercaseName) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
}



