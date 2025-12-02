// 팀 매핑 인터페이스
import { TeamMapping } from './index';

// J1 리그 ID
export const J_LEAGUE_ID = 98;

// J1 리그 팀 매핑 데이터
export const J_LEAGUE_TEAMS: TeamMapping[] = [
    {
        id: 302,
        name_ko: '교토 상가',
        name_en: 'Kyoto Sanga',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'KYO'
      },
      {
        id: 290,
        name_ko: '가시마 앤틀러스',
        name_en: 'Kashima',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'KSM'
      },
      {
        id: 281,
        name_ko: '가시와 레이솔',
        name_en: 'Kashiwa Reysol',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'KSR'
      },
      {
        id: 289,
        name_ko: '비셀 고베',
        name_en: 'Vissel Kobe',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'KOB'
      },
      {
        id: 303,
        name_ko: '마치다 젤비아',
        name_en: 'Machida Zelvia',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'MCD'
      },
      {
        id: 282,
        name_ko: '산프레체 히로시마',
        name_en: 'Sanfrecce Hiroshima',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'SAN'
      },
      {
        id: 294,
        name_ko: '가와사키 프론탈레',
        name_en: 'Kawasaki Frontale',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'KAW'
      },
      {
        id: 287,
        name_ko: '우라와 레즈',
        name_en: 'Urawa',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'URA'
      },
      {
        id: 293,
        name_ko: '감바 오사카',
        name_en: 'Gamba Osaka',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'GAM'
      },
      {
        id: 291,
        name_ko: '세레소 오사카',
        name_en: 'Cerezo Osaka',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'CER'
      },
      {
        id: 310,
        name_ko: '파지아노 오카야마',
        name_en: 'Fagiano Okayama',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'OKA'
      },
      {
        id: 316,
        name_ko: '아비스파 후쿠오카',
        name_en: 'Avispa Fukuoka',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'AVI'
      },
      {
        id: 283,
        name_ko: '시미즈 에스펄스',
        name_en: 'Shimizu S-pulse',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'SPU'
      },
      {
        id: 288,
        name_ko: '나고야 그램퍼스',
        name_en: 'Nagoya Grampus',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'NAG'
      },
      {
        id: 306,
        name_ko: '도쿄 베르디',
        name_en: 'Tokyo Verdy',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'VER'
      },
      {
        id: 292,
        name_ko: 'FC 도쿄',
        name_en: 'FC Tokyo',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'FCT'
      },
      {
        id: 296,
        name_ko: '요코하마 F. 마리노스',
        name_en: 'Yokohama F. Marinos',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'YFM'
      },
      {
        id: 284,
        name_ko: '쇼난 벨마레',
        name_en: 'Shonan Bellmare',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'SHO'
      },
      {
        id: 307,
        name_ko: '요코하마 FC',
        name_en: 'Yokohama FC',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'YFC'
      },
      {
        id: 311,
        name_ko: '알비렉스 니가타',
        name_en: 'Albirex Niigata',
        country_ko: '일본',
        country_en: 'Japan',
        code: 'ALB'
      }
      
];

// 팀 ID로 J리그 팀 정보 가져오기
export function getJLeagueTeamById(id: number): TeamMapping | undefined {
  return J_LEAGUE_TEAMS.find(team => team.id === id);
}

// 팀 이름으로 J리그 팀 검색하기 (한글/영문 모두 검색 가능)
export function searchJLeagueTeamsByName(name: string): TeamMapping[] {
  const lowercaseName = name.toLowerCase();
  return J_LEAGUE_TEAMS.filter(team => 
    team.name_ko.toLowerCase().includes(lowercaseName) || 
    team.name_en.toLowerCase().includes(lowercaseName)
  );
}