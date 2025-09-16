// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// 브라질 세리에 A (브라질레이로) ID
export const BRASILEIRAO_ID = 71;

// 브라질레이로 팀 매핑 데이터 (템플릿)
export const BRASILEIRAO_TEAMS: TeamMapping[] = [
    {
        id: 127,
        name_ko: '플라멩구',
        name_en: 'Flamengo',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'FLA'
      },
      {
        id: 121,
        name_ko: '팔메이라스',
        name_en: 'Palmeiras',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'PAL'
      },
      {
        id: 135,
        name_ko: '크루제이루',
        name_en: 'Cruzeiro',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'CRU'
      },
      {
        id: 7848,
        name_ko: '미라솔',
        name_en: 'Mirassol',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'MIR'
      },
      {
        id: 118,
        name_ko: '바이아',
        name_en: 'Bahia',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'BAH'
      },
      {
        id: 120,
        name_ko: '보타포구',
        name_en: 'Botafogo',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'BOT'
      },
      {
        id: 126,
        name_ko: '상파울루',
        name_en: 'Sao Paulo',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'SAO'
      },
      {
        id: 794,
        name_ko: 'RB 브라간치누',
        name_en: 'RB Bragantino',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'RBB'
      },
      {
        id: 131,
        name_ko: '코린치안스',
        name_en: 'Corinthians',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'COR'
      },
      {
        id: 124,
        name_ko: '플루미넨시',
        name_en: 'Fluminense',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'FLU'
      },
      {
        id: 129,
        name_ko: '세아라',
        name_en: 'Ceara',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'CEA'
      },
      {
        id: 119,
        name_ko: '인터나시오날',
        name_en: 'Internacional',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'INT'
      },
      {
        id: 1062,
        name_ko: '아틀레치쿠 미네이루',
        name_en: 'Atletico-MG',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'AMG'
      },
      {
        id: 130,
        name_ko: '그레미우',
        name_en: 'Gremio',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'GRE'
      },
      {
        id: 133,
        name_ko: '바스쿠 다 가마',
        name_en: 'Vasco DA Gama',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'VAS'
      },
      {
        id: 128,
        name_ko: '산투스',
        name_en: 'Santos',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'SAN'
      },
      {
        id: 136,
        name_ko: '비토리아',
        name_en: 'Vitoria',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'VIT'
      },
      {
        id: 152,
        name_ko: '유벤투데데',
        name_en: 'Juventude',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'JVT'
      },
      {
        id: 154,
        name_ko: '포르탈레자',
        name_en: 'Fortaleza EC',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'FOR'
      },
      {
        id: 123,
        name_ko: '스포르치 헤시피',
        name_en: 'Sport Recife',
        country_ko: '브라질',
        country_en: 'Brazil',
        code: 'SPT'
      }
      ];

export function getBrasileiraoTeamById(id: number): TeamMapping | undefined {
  return BRASILEIRAO_TEAMS.find(team => team.id === id);
}

export function searchBrasileiraoTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return BRASILEIRAO_TEAMS.filter(team => 
    team.name_ko.toLowerCase().includes(lowercaseName) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
}



