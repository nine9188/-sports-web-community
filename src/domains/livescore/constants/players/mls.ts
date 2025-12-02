import { PlayerMapping } from './index';
import { MLS_PART2_PLAYERS } from './mls-part2';

// MLS 선수 매핑 데이터 (1,094명, 30개 팀)
// 참고: MLS는 미국/캐나다 리그로 영문 이름을 기본으로 하고 한글은 음차 표기

// Atlanta United FC (Team ID: 1608) - 33명
export const ATLANTA_UNITED_FC_PLAYERS: PlayerMapping[] = [
  { id: 50869, name: "B. Guzan", korean_name: "브래드 구잔", team_id: 1608, position: "Goalkeeper" },
  { id: 71239, name: "J. Cohen", korean_name: "조시 코헨", team_id: 1608, position: "Goalkeeper" },
  { id: 455599, name: "Jayden Hibbert", korean_name: "제이든 히버트", team_id: 1608, position: "Goalkeeper" },
  { id: 2442, name: "R. Hernández", korean_name: "로날드 에르난데스", team_id: 1608, position: "Defender" },
  { id: 26772, name: "E. Mihaj", korean_name: "엘리아 미하이", team_id: 1608, position: "Defender" },
  { id: 48066, name: "S. Gregersen", korean_name: "스탈레 그레거센", team_id: 1608, position: "Defender" },
  { id: 2039, name: "Juan Berrocal", korean_name: "후안 베로칼", team_id: 1608, position: "Defender" },
  { id: 51218, name: "B. Lennon", korean_name: "브룩스 레넌", team_id: 1608, position: "Defender" },
  { id: 41967, name: "Pedro Amador", korean_name: "페드로 아마도르", team_id: 1608, position: "Defender" },
  { id: 2418, name: "L. Abram", korean_name: "루이스 아브람", team_id: 1608, position: "Defender" },
  { id: 265734, name: "Matthew Edwards", korean_name: "매튜 에드워즈", team_id: 1608, position: "Defender" },
  { id: 467159, name: "D. Chong Qui", korean_name: "데릭 총 키", team_id: 1608, position: "Defender" },
  { id: 413048, name: "S. Mazzaferro", korean_name: "세바스티안 마자페로", team_id: 1608, position: "Defender" },
  { id: 103323, name: "N. Sessock", korean_name: "노아 세속", team_id: 1608, position: "Defender" },
  { id: 17715, name: "S. Alzate", korean_name: "스티븐 알사테", team_id: 1608, position: "Midfielder" },
  { id: 87301, name: "T. Muyumba", korean_name: "트리스탄 무윰바", team_id: 1608, position: "Midfielder" },
  { id: 2507, name: "M. Almirón", korean_name: "미겔 알미론", team_id: 1608, position: "Midfielder" },
  { id: 418619, name: "A. Torres", korean_name: "알레한드로 토레스", team_id: 1608, position: "Midfielder" },
  { id: 119008, name: "William Reilly", korean_name: "윌리엄 라일리", team_id: 1608, position: "Midfielder" },
  { id: 265735, name: "A. Fortune", korean_name: "아제이 포춘", team_id: 1608, position: "Midfielder" },
  { id: 3008, name: "M. Klich", korean_name: "마테우시 클리히", team_id: 1608, position: "Midfielder" },
  { id: 414128, name: "C. Sanchez", korean_name: "카를로스 산체스", team_id: 1608, position: "Midfielder" },
  { id: 484, name: "A. Miranchuk", korean_name: "알렉세이 미란추크", team_id: 1608, position: "Midfielder" },
  { id: 13528, name: "E. Mosquera", korean_name: "에드윈 모스케라", team_id: 1608, position: "Midfielder" },
  { id: 40534, name: "B. Slisz", korean_name: "바르토시 슬리시", team_id: 1608, position: "Midfielder" },
  { id: 15698, name: "S. Lobzhanidze", korean_name: "사바 롭잔니제", team_id: 1608, position: "Attacker" },
  { id: 216500, name: "Leonardo Afonso", korean_name: "레오나르도 아폰소", team_id: 1608, position: "Attacker" },
  { id: 20705, name: "J. Thiaré", korean_name: "자말 티아레", team_id: 1608, position: "Attacker" },
  { id: 32137, name: "E. Latte Lath", korean_name: "엠마누엘 라테 라스", team_id: 1608, position: "Attacker" },
  { id: 341239, name: "L. Brennan", korean_name: "루크 브레넌", team_id: 1608, position: "Attacker" },
  { id: 407438, name: "A. Gordon", korean_name: "아지이 고든", team_id: 1608, position: "Attacker" },
  { id: 33894, name: "C. Togashi", korean_name: "칼로스 토가시", team_id: 1608, position: "Attacker" },
  { id: 445964, name: "R. Neri", korean_name: "로베르토 네리", team_id: 1608, position: "Attacker" },
];

// Austin FC (Team ID: 16489) - 29명
export const AUSTIN_FC_PLAYERS: PlayerMapping[] = [
  { id: 50849, name: "B. Stuver", korean_name: "브래드 스투버", team_id: 16489, position: "Goalkeeper" },
  { id: 50896, name: "S. Cleveland", korean_name: "숀 클리블랜드", team_id: 16489, position: "Goalkeeper" },
  { id: 511387, name: "R. Thomas", korean_name: "루벤 토마스", team_id: 16489, position: "Defender" },
  { id: 39229, name: "M. Desler", korean_name: "맷 데슬러", team_id: 16489, position: "Defender" },
  { id: 8527, name: "B. Hines-Ike", korean_name: "브렌단 하인스-아이크", team_id: 16489, position: "Defender" },
  { id: 14333, name: "O. Svatok", korean_name: "오드리치 스바토크", team_id: 16489, position: "Defender" },
  { id: 37456, name: "L. Väisänen", korean_name: "레오 바이사넨", team_id: 16489, position: "Defender" },
  { id: 50890, name: "J. Gallagher", korean_name: "존 갤러거", team_id: 16489, position: "Defender" },
  { id: 51224, name: "J. Cascante", korean_name: "훌리오 카스칸테", team_id: 16489, position: "Defender" },
  { id: 105632, name: "Ž. Kolmanič", korean_name: "조르단 콜마니치", team_id: 16489, position: "Defender" },
  { id: 459966, name: "A. Gomez", korean_name: "알렉산더 고메스", team_id: 16489, position: "Defender" },
  { id: 323378, name: "M. Đorđević", korean_name: "밀란 조르제비치", team_id: 16489, position: "Defender" },
  { id: 285981, name: "Nico van Rijn", korean_name: "니코 판 레인", team_id: 16489, position: "Defender" },
  { id: 51263, name: "Ilie Sánchez", korean_name: "일리에 산체스", team_id: 16489, position: "Midfielder" },
  { id: 310975, name: "D. Pereira", korean_name: "디에고 페레이라", team_id: 16489, position: "Midfielder" },
  { id: 47845, name: "B. Šabović", korean_name: "블라디미르 샤보비치", team_id: 16489, position: "Midfielder" },
  { id: 313360, name: "C. Fodrey", korean_name: "콜린 포드레이", team_id: 16489, position: "Midfielder" },
  { id: 451017, name: "N. Dubersarsky", korean_name: "니콜라스 두버사르스키", team_id: 16489, position: "Midfielder" },
  { id: 197449, name: "Guilherme Biro", korean_name: "길헤르메 비로", team_id: 16489, position: "Midfielder" },
  { id: 407423, name: "M. Burton", korean_name: "매튜 버튼", team_id: 16489, position: "Midfielder" },
  { id: 265740, name: "Adrián González Mendoza", korean_name: "아드리안 곤살레스", team_id: 16489, position: "Midfielder" },
  { id: 425840, name: "Ervin Torres", korean_name: "에르빈 토레스", team_id: 16489, position: "Midfielder" },
  { id: 13755, name: "J. Obrian", korean_name: "자우스턴 오브리안", team_id: 16489, position: "Attacker" },
  { id: 50893, name: "B. Vázquez", korean_name: "브라이언 바스케스", team_id: 16489, position: "Attacker" },
  { id: 14405, name: "M. Uzuni", korean_name: "밀로트 우주니", team_id: 16489, position: "Attacker" },
  { id: 61418, name: "O. Bukari", korean_name: "오스만 부카리", team_id: 16489, position: "Attacker" },
  { id: 2566, name: "D. Rubio", korean_name: "디에고 루비오", team_id: 16489, position: "Attacker" },
  { id: 460815, name: "Bryant Farkarlun", korean_name: "브라이언트 파카룬", team_id: 16489, position: "Attacker" },
  { id: 267866, name: "O. Wolff", korean_name: "오웬 울프", team_id: 16489, position: "Attacker" },
];

// MLS 전체 선수 (1,094명, 30개 팀)
export const MLS_PLAYERS: PlayerMapping[] = [
  ...ATLANTA_UNITED_FC_PLAYERS,
  ...AUSTIN_FC_PLAYERS,
  ...MLS_PART2_PLAYERS,
];

