// Constants 모듈 재내보내기
export * from './league-mappings';
export * from './event-mappings';
export * from './match-status';

// 기본 내보내기를 위한 객체 제공
import { MAJOR_LEAGUE_IDS, LEAGUE_NAMES_MAP } from './league-mappings';

const leagueMapping = {
  MAJOR_LEAGUE_IDS,
  LEAGUE_NAMES_MAP
};

export default leagueMapping; 