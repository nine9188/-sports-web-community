import { PlayerMapping } from './index';

// ============================================
// 프리미어리그 전체 선수 매핑 (693명)
// DB 실제 데이터 기준 (2025-10-10)
// ============================================

// ============================================
// Manchester United (Team ID: 33) - 31명
// ============================================
export const MANCHESTER_UNITED_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (4명)
  { id: 50132, name: "A. Bayındır", korean_name: "알툰 바인디르", team_id: 33, position: "Goalkeeper" },
  { id: 2931, name: "T. Heaton", korean_name: "톰 히튼", team_id: 33, position: "Goalkeeper" },
  { id: 526, name: "A. Onana", korean_name: "앙드레 오나나", team_id: 33, position: "Goalkeeper" },
  { id: 162511, name: "S. Lammens", korean_name: "손 라멘스", team_id: 33, position: "Goalkeeper" },

  // Defenders (11명)
  { id: 37145, name: "T. Malacia", korean_name: "티렐 말라시아", team_id: 33, position: "Defender" },
  { id: 532, name: "M. de Ligt", korean_name: "마테이스 더 리흐트", team_id: 33, position: "Defender" },
  { id: 2935, name: "H. Maguire", korean_name: "해리 매과이어", team_id: 33, position: "Defender" },
  { id: 2467, name: "Lisandro Martínez", korean_name: "리산드로 마르티네스", team_id: 33, position: "Defender" },
  { id: 403064, name: "H. Amass", korean_name: "해리 아마스", team_id: 33, position: "Defender" },
  { id: 382452, name: "P. Dorgu", korean_name: "패트릭 도르구", team_id: 33, position: "Defender" },
  { id: 342970, name: "L. Yoro", korean_name: "레니 요로", team_id: 33, position: "Defender" },
  { id: 891, name: "L. Shaw", korean_name: "루크 쇼", team_id: 33, position: "Defender" },
  { id: 402329, name: "A. Heaven", korean_name: "애슐리 헤븐", team_id: 33, position: "Defender" },
  { id: 328101, name: "T. Fredricson", korean_name: "토비 프레드릭슨", team_id: 33, position: "Defender" },
  { id: 475598, name: "D. León", korean_name: "디에고 레온", team_id: 33, position: "Defender" },

  // Midfielders (6명)
  { id: 886, name: "Diogo Dalot", korean_name: "디오구 달로트", team_id: 33, position: "Midfielder" },
  { id: 545, name: "N. Mazraoui", korean_name: "누사이르 마즈라위", team_id: 33, position: "Midfielder" },
  { id: 1485, name: "Bruno Fernandes", korean_name: "브루누 페르난데스", team_id: 33, position: "Midfielder" },
  { id: 157997, name: "A. Diallo", korean_name: "아마드 디알로", team_id: 33, position: "Midfielder" },
  { id: 747, name: "Casemiro", korean_name: "카제미루", team_id: 33, position: "Midfielder" },
  { id: 51494, name: "M. Ugarte", korean_name: "마누엘 우가르테", team_id: 33, position: "Midfielder" },
  { id: 284322, name: "K. Mainoo", korean_name: "코비 마이누", team_id: 33, position: "Midfielder" },

  // Attackers (10명)
  { id: 19220, name: "M. Mount", korean_name: "메이슨 마운트", team_id: 33, position: "Attacker" },
  { id: 9971, name: "Antony", korean_name: "안토니", team_id: 33, position: "Attacker" },
  { id: 389309, name: "O. Martin", korean_name: "오마리 마틴", team_id: 33, position: "Attacker" },
  { id: 1165, name: "Matheus Cunha", korean_name: "마테우스 쿠냐", team_id: 33, position: "Attacker" },
  { id: 70100, name: "J. Zirkzee", korean_name: "조슈아 지르크제", team_id: 33, position: "Attacker" },
  { id: 288006, name: "R. Højlund", korean_name: "라스무스 호일룬", team_id: 33, position: "Attacker" },
  { id: 20589, name: "B. Mbeumo", korean_name: "브라이언 음뵈모", team_id: 33, position: "Attacker" },
  { id: 115589, name: "B. Šeško", korean_name: "벤야민 셰슈코", team_id: 33, position: "Attacker" },
  { id: 284324, name: "A. Garnacho", korean_name: "알레한드로 가르나초", team_id: 33, position: "Attacker" },
];

// ============================================
// Newcastle (Team ID: 34) - 31명
// ============================================
export const NEWCASTLE_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (5명)
  { id: 18911, name: "N. Pope", korean_name: "닉 포프", team_id: 34, position: "Goalkeeper" },
  { id: 18737, name: "J. Ruddy", korean_name: "존 러디", team_id: 34, position: "Goalkeeper" },
  { id: 44912, name: "M. Gillespie", korean_name: "마크 길레스피", team_id: 34, position: "Goalkeeper" },
  { id: 284374, name: "Max Thompson", korean_name: "맥스 톰슨", team_id: 34, position: "Goalkeeper" },
  { id: 20355, name: "A. Ramsdale", korean_name: "애런 램즈데일", team_id: 34, position: "Goalkeeper" },

  // Defenders (12명)
  { id: 171058, name: "H. Ashby", korean_name: "해리슨 애쉬비", team_id: 34, position: "Defender" },
  { id: 169, name: "K. Trippier", korean_name: "키어런 트리피어", team_id: 34, position: "Defender" },
  { id: 18941, name: "M. Targett", korean_name: "맷 타겟", team_id: 34, position: "Defender" },
  { id: 284492, name: "L. Hall", korean_name: "루이스 홀", team_id: 34, position: "Defender" },
  { id: 38734, name: "S. Botman", korean_name: "스벤 보트만", team_id: 34, position: "Defender" },
  { id: 2806, name: "F. Schär", korean_name: "파비안 셰어", team_id: 34, position: "Defender" },
  { id: 18894, name: "J. Lascelles", korean_name: "제이미 라셀스", team_id: 34, position: "Defender" },
  { id: 163189, name: "M. Thiaw", korean_name: "말리크 티아우", team_id: 34, position: "Defender" },
  { id: 2855, name: "E. Krafth", korean_name: "에밀 크라프트", team_id: 34, position: "Defender" },
  { id: 158694, name: "T. Livramento", korean_name: "티노 리브라멘토", team_id: 34, position: "Defender" },
  { id: 18961, name: "D. Burn", korean_name: "댄 번", team_id: 34, position: "Defender" },
  { id: 318056, name: "A. Murphy", korean_name: "알렉스 머피", team_id: 34, position: "Defender" },

  // Midfielders (7명)
  { id: 723, name: "Joelinton", korean_name: "조엘린통", team_id: 34, position: "Midfielder" },
  { id: 31146, name: "S. Tonali", korean_name: "산드로 토날리", team_id: 34, position: "Midfielder" },
  { id: 18778, name: "H. Barnes", korean_name: "하비 반스", team_id: 34, position: "Midfielder" },
  { id: 19163, name: "J. Murphy", korean_name: "제이콥 머피", team_id: 34, position: "Midfielder" },
  { id: 1463, name: "J. Willock", korean_name: "조 윌록", team_id: 34, position: "Midfielder" },
  { id: 10135, name: "Bruno Guimarães", korean_name: "브루누 기마랑이스", team_id: 34, position: "Midfielder" },
  { id: 328105, name: "L. Miley", korean_name: "루이스 마일리", team_id: 34, position: "Midfielder" },

  // Attackers (7명)
  { id: 401389, name: "T. Sanusi", korean_name: "토니 사누시", team_id: 34, position: "Attacker" },
  { id: 2864, name: "A. Isak", korean_name: "알렉산더 이사크", team_id: 34, position: "Attacker" },
  { id: 138787, name: "A. Gordon", korean_name: "앤서니 고든", team_id: 34, position: "Attacker" },
  { id: 315237, name: "W. Osula", korean_name: "윌리엄 오술라", team_id: 34, position: "Attacker" },
  { id: 153430, name: "A. Elanga", korean_name: "앤서니 엘랑가", team_id: 34, position: "Attacker" },
  { id: 158054, name: "N. Woltemade", korean_name: "닉 볼테마데", team_id: 34, position: "Attacker" },
  { id: 423714, name: "Park Seung-Soo", korean_name: "박승수", team_id: 34, position: "Attacker" },
];

// ============================================
// Bournemouth (Team ID: 35) - 36명
// ============================================
export const BOURNEMOUTH_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (4명)
  { id: 118307, name: "Đ. Petrović", korean_name: "조르제 페트로비치", team_id: 35, position: "Goalkeeper" },
  { id: 394710, name: "C. McKenna", korean_name: "콜린 맥케나", team_id: 35, position: "Goalkeeper" },
  { id: 94360, name: "A. Paulsen", korean_name: "아담 폴센", team_id: 35, position: "Goalkeeper" },
  { id: 151756, name: "W. Dennis", korean_name: "윌 데니스", team_id: 35, position: "Goalkeeper" },

  // Defenders (12명)
  { id: 51051, name: "J. Araujo", korean_name: "훌리안 아라우호", team_id: 35, position: "Defender" },
  { id: 18866, name: "C. Mepham", korean_name: "크리스 멥햄", team_id: 35, position: "Defender" },
  { id: 162267, name: "A. Truffert", korean_name: "아드리앙 트뤼페르", team_id: 35, position: "Defender" },
  { id: 359942, name: "M. Akinmboni", korean_name: "마르코스 아킨봄보니", team_id: 35, position: "Defender" },
  { id: 6610, name: "M. Senesi", korean_name: "마르코스 세네시", team_id: 35, position: "Defender" },
  { id: 18869, name: "A. Smith", korean_name: "애덤 스미스", team_id: 35, position: "Defender" },
  { id: 22136, name: "B. Diakité", korean_name: "바요 디아키테", team_id: 35, position: "Defender" },
  { id: 363333, name: "J. Soler", korean_name: "후안 솔레르", team_id: 35, position: "Defender" },
  { id: 330437, name: "Álex Jiménez", korean_name: "알렉스 히메네스", team_id: 35, position: "Defender" },
  { id: 20093, name: "J. Hill", korean_name: "제임스 힐", team_id: 35, position: "Defender" },
  { id: 382163, name: "O. Bevan", korean_name: "오웬 베번", team_id: 35, position: "Defender" },
  { id: 412719, name: "Veljko Milosavljević", korean_name: "벨코 밀로사블레비치", team_id: 35, position: "Defender" },

  // Midfielders (11명)
  { id: 18872, name: "L. Cook", korean_name: "루이스 쿡", team_id: 35, position: "Midfielder" },
  { id: 18870, name: "D. Brooks", korean_name: "데이비드 브룩스", team_id: 35, position: "Midfielder" },
  { id: 304853, name: "A. Scott", korean_name: "알렉스 스콧", team_id: 35, position: "Midfielder" },
  { id: 2734, name: "P. Billing", korean_name: "필립 빌링", team_id: 35, position: "Midfielder" },
  { id: 84082, name: "R. Faivre", korean_name: "로맹 페브르", team_id: 35, position: "Midfielder" },
  { id: 1125, name: "R. Christie", korean_name: "라이언 크리스티", team_id: 35, position: "Midfielder" },
  { id: 1150, name: "T. Adams", korean_name: "타일러 애덤스", team_id: 35, position: "Midfielder" },
  { id: 402432, name: "Ben Winterburn", korean_name: "벤 윈터번", team_id: 35, position: "Midfielder" },
  { id: 19245, name: "M. Tavernier", korean_name: "마커스 태버니어", team_id: 35, position: "Midfielder" },
  { id: 31057, name: "H. Traorè", korean_name: "하메드 트라오레", team_id: 35, position: "Midfielder" },
  { id: 19281, name: "A. Semenyo", korean_name: "안투안 세메뇨", team_id: 35, position: "Midfielder" },

  // Attackers (9명)
  { id: 152856, name: "Evanilson", korean_name: "에바닐송", team_id: 35, position: "Attacker" },
  { id: 47499, name: "E. Ünal", korean_name: "에네스 위날", team_id: 35, position: "Attacker" },
  { id: 37161, name: "L. Sinisterra", korean_name: "루이스 시니스테라", team_id: 35, position: "Attacker" },
  { id: 382160, name: "D. Adu-Adjei", korean_name: "데이비드 아두-아제이", team_id: 35, position: "Attacker" },
  { id: 792, name: "J. Kluivert", korean_name: "저스틴 클루이베르트", team_id: 35, position: "Attacker" },
  { id: 129682, name: "A. Adli", korean_name: "아민 아들리", team_id: 35, position: "Attacker" },
  { id: 368030, name: "E. Kroupi", korean_name: "에디 크루피", team_id: 35, position: "Attacker" },
  { id: 402434, name: "Remy Rees-Dottin", korean_name: "레미 리스-도틴", team_id: 35, position: "Attacker" },
  { id: 343576, name: "B. Doak", korean_name: "벤 도크", team_id: 35, position: "Attacker" },
];

// ============================================
// Fulham (Team ID: 36) - 26명
// ============================================
export const FULHAM_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (2명)
  { id: 1438, name: "B. Leno", korean_name: "베른트 레노", team_id: 36, position: "Goalkeeper" },
  { id: 21566, name: "B. Lecomte", korean_name: "방자맹 르콩트", team_id: 36, position: "Goalkeeper" },

  // Defenders (6명)
  { id: 657, name: "K. Tete", korean_name: "케니 테테", team_id: 36, position: "Defender" },
  { id: 152967, name: "C. Bassey", korean_name: "캘빈 바시", team_id: 36, position: "Defender" },
  { id: 2729, name: "J. Andersen", korean_name: "요아킴 안데르센", team_id: 36, position: "Defender" },
  { id: 131, name: "Jorge Cuenca", korean_name: "호르헤 쿠엔카", team_id: 36, position: "Defender" },
  { id: 18814, name: "I. Diop", korean_name: "이사 디오프", team_id: 36, position: "Defender" },
  { id: 19549, name: "A. Robinson", korean_name: "안토니 로빈슨", team_id: 36, position: "Defender" },

  // Midfielders (8명)
  { id: 19480, name: "H. Reed", korean_name: "해리슨 리드", team_id: 36, position: "Midfielder" },
  { id: 899, name: "Andreas Pereira", korean_name: "안드레아스 페레이라", team_id: 36, position: "Midfielder" },
  { id: 19025, name: "T. Cairney", korean_name: "톰 케어니", team_id: 36, position: "Midfielder" },
  { id: 1934, name: "S. Berge", korean_name: "산데르 베르헤", team_id: 36, position: "Midfielder" },
  { id: 2823, name: "S. Lukić", korean_name: "사샤 루키치", team_id: 36, position: "Midfielder" },
  { id: 2920, name: "T. Castagne", korean_name: "티모시 카스타뉴", team_id: 36, position: "Midfielder" },
  { id: 19032, name: "R. Sessegnon", korean_name: "라이언 세세뇽", team_id: 36, position: "Midfielder" },
  { id: 1161, name: "E. Smith Rowe", korean_name: "에밀 스미스 로우", team_id: 36, position: "Midfielder" },

  // Attackers (10명)
  { id: 2887, name: "R. Jiménez", korean_name: "라울 히메네스", team_id: 36, position: "Attacker" },
  { id: 19221, name: "H. Wilson", korean_name: "해리 윌슨", team_id: 36, position: "Attacker" },
  { id: 195106, name: "Rodrigo Muniz", korean_name: "호드리구 무니스", team_id: 36, position: "Attacker" },
  { id: 18753, name: "Adama Traoré", korean_name: "아다마 트라오레", team_id: 36, position: "Attacker" },
  { id: 1455, name: "A. Iwobi", korean_name: "알렉스 이워비", team_id: 36, position: "Attacker" },
  { id: 436443, name: "J. Kusi-Asare", korean_name: "조던 쿠시-아사레", team_id: 36, position: "Attacker" },
  { id: 1696, name: "S. Chukwueze", korean_name: "사무엘 추크우에제", team_id: 36, position: "Attacker" },
  { id: 359386, name: "M. Godo", korean_name: "마르티 고도", team_id: 36, position: "Attacker" },
  { id: 237819, name: "Kevin", korean_name: "케빈", team_id: 36, position: "Attacker" },
  { id: 389315, name: "Joshua King", korean_name: "조슈아 킹", team_id: 36, position: "Attacker" },
];

// ============================================
// Wolves (Team ID: 39) - 29명
// ============================================
export const WOLVES_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (3명)
  { id: 1590, name: "José Sá", korean_name: "주제 사", team_id: 39, position: "Goalkeeper" },
  { id: 19341, name: "D. Bentley", korean_name: "댄 벤틀리", team_id: 39, position: "Goalkeeper" },
  { id: 19143, name: "S. Johnstone", korean_name: "샘 존스턴", team_id: 39, position: "Goalkeeper" },

  // Defenders (11명)
  { id: 18742, name: "M. Doherty", korean_name: "맷 도허티", team_id: 39, position: "Defender" },
  { id: 280687, name: "Hugo Bueno", korean_name: "우고 부에노", team_id: 39, position: "Defender" },
  { id: 135334, name: "S. Bueno", korean_name: "산티아고 부에노", team_id: 39, position: "Defender" },
  { id: 265782, name: "D. Møller Wolfe", korean_name: "다니엘 묄러 볼페", team_id: 39, position: "Defender" },
  { id: 135068, name: "E. Agbadou", korean_name: "엠마누엘 아그바두", team_id: 39, position: "Defender" },
  { id: 195717, name: "Y. Mosquera", korean_name: "야손 모스케라", team_id: 39, position: "Defender" },
  { id: 282770, name: "Rodrigo Gomes", korean_name: "호드리구 고메스", team_id: 39, position: "Defender" },
  { id: 41606, name: "Toti Gomes", korean_name: "토티 고메스", team_id: 39, position: "Defender" },
  { id: 285, name: "K. Hoever", korean_name: "키 후버르", team_id: 39, position: "Defender" },
  { id: 66407, name: "L. Krejčí", korean_name: "라디슬라프 크레이치", team_id: 39, position: "Defender" },
  { id: 296560, name: "J. Tchatchoua", korean_name: "잭슨 차추아", team_id: 39, position: "Defender" },
  { id: 449245, name: "Pedro Lima", korean_name: "페드루 리마", team_id: 39, position: "Defender" },

  // Midfielders (4명)
  { id: 3080, name: "M. Munetsi", korean_name: "마셜 무네치", team_id: 39, position: "Midfielder" },
  { id: 265784, name: "André", korean_name: "안드레", team_id: 39, position: "Midfielder" },
  { id: 195103, name: "João Gomes", korean_name: "주앙 고메스", team_id: 39, position: "Midfielder" },
  { id: 20665, name: "J. Bellegarde", korean_name: "장 벨가르드", team_id: 39, position: "Midfielder" },

  // Attackers (11명)
  { id: 2032, name: "J. Strand Larsen", korean_name: "요르겐 스트란 라르센", team_id: 39, position: "Attacker" },
  { id: 13708, name: "J. Arias", korean_name: "후안 아리아스", team_id: 39, position: "Attacker" },
  { id: 24888, name: "Hwang Hee-Chan", korean_name: "황희찬", team_id: 39, position: "Attacker" },
  { id: 110153, name: "T. Arokodare", korean_name: "토미 아로코다레", team_id: 39, position: "Attacker" },
  { id: 7722, name: "S. Kalajdzic", korean_name: "사샤 칼라이지치", team_id: 39, position: "Attacker" },
  { id: 171035, name: "T. Chirewa", korean_name: "타와나 치레와", team_id: 39, position: "Attacker" },
  { id: 391822, name: "Fer López", korean_name: "페르 로페스", team_id: 39, position: "Attacker" },
  { id: 385726, name: "E. González", korean_name: "에두아르도 곤살레스", team_id: 39, position: "Attacker" },
  { id: 456206, name: "M. Mane", korean_name: "마마두 마네", team_id: 39, position: "Attacker" },
  { id: 129791, name: "Fábio Silva", korean_name: "파비우 실바", team_id: 39, position: "Attacker" },
];

// ============================================
// Liverpool (Team ID: 40) - 29명
// ============================================
export const LIVERPOOL_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (4명)
  { id: 342467, name: "Á. Pécsi", korean_name: "아담 페치", team_id: 40, position: "Goalkeeper" },
  { id: 280, name: "Alisson Becker", korean_name: "알리송 베커", team_id: 40, position: "Goalkeeper" },
  { id: 24760, name: "G. Mamardashvili", korean_name: "기오르기 마마르다슈빌리", team_id: 40, position: "Goalkeeper" },
  { id: 18889, name: "F. Woodman", korean_name: "프레디 우드먼", team_id: 40, position: "Goalkeeper" },

  // Defenders (11명)
  { id: 284, name: "J. Gomez", korean_name: "조 고메즈", team_id: 40, position: "Defender" },
  { id: 135525, name: "C. Ramsay", korean_name: "캘빈 램지", team_id: 40, position: "Defender" },
  { id: 290, name: "V. van Dijk", korean_name: "버질 반 다이크", team_id: 40, position: "Defender" },
  { id: 1145, name: "I. Konaté", korean_name: "이브라히마 코나테", team_id: 40, position: "Defender" },
  { id: 206254, name: "M. Kerkez", korean_name: "미로슬라프 케르케즈", team_id: 40, position: "Defender" },
  { id: 1600, name: "K. Tsimikas", korean_name: "코스타스 치미카스", team_id: 40, position: "Defender" },
  { id: 180317, name: "C. Bradley", korean_name: "코너 브래들리", team_id: 40, position: "Defender" },
  { id: 409047, name: "G. Leoni", korean_name: "가브리엘 레오니", team_id: 40, position: "Defender" },
  { id: 289, name: "A. Robertson", korean_name: "앤디 로버트슨", team_id: 40, position: "Defender" },
  { id: 152654, name: "J. Frimpong", korean_name: "제레미 프림퐁", team_id: 40, position: "Defender" },
  { id: 162904, name: "R. Williams", korean_name: "라이스 윌리엄스", team_id: 40, position: "Defender" },

  // Midfielders (10명)
  { id: 8500, name: "W. Endo", korean_name: "엔도 와타루", team_id: 40, position: "Midfielder" },
  { id: 203224, name: "F. Wirtz", korean_name: "플로리안 비르츠", team_id: 40, position: "Midfielder" },
  { id: 1096, name: "D. Szoboszlai", korean_name: "도미니크 소보슬라이", team_id: 40, position: "Midfielder" },
  { id: 6716, name: "A. Mac Allister", korean_name: "알렉시스 맥 알리스터", team_id: 40, position: "Midfielder" },
  { id: 306, name: "Mohamed Salah", korean_name: "모하메드 살라", team_id: 40, position: "Midfielder" },
  { id: 293, name: "C. Jones", korean_name: "커티스 존스", team_id: 40, position: "Midfielder" },
  { id: 247, name: "C. Gakpo", korean_name: "코디 각포", team_id: 40, position: "Midfielder" },
  { id: 310187, name: "Stefan Bajčetić", korean_name: "스테판 바이체티치", team_id: 40, position: "Midfielder" },
  { id: 542, name: "R. Gravenberch", korean_name: "라이언 흐라번베르흐", team_id: 40, position: "Midfielder" },
  { id: 397997, name: "T. Nyoni", korean_name: "트레이 넌이", team_id: 40, position: "Midfielder" },

  // Attackers (4명)
  { id: 314661, name: "J. Danns", korean_name: "제이든 댄스", team_id: 40, position: "Attacker" },
  { id: 30410, name: "F. Chiesa", korean_name: "페데리코 키에사", team_id: 40, position: "Attacker" },
  { id: 174565, name: "H. Ekitike", korean_name: "위고 에키티케", team_id: 40, position: "Attacker" },
  { id: 452685, name: "R. Ngumoha", korean_name: "리오 응구모하", team_id: 40, position: "Attacker" },
];

// ============================================
// Arsenal (Team ID: 42) - 32명
// ============================================
export const ARSENAL_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (4명)
  { id: 19465, name: "David Raya", korean_name: "다비드 라야", team_id: 42, position: "Goalkeeper" },
  { id: 169295, name: "K. Hein", korean_name: "카를 하인", team_id: 42, position: "Goalkeeper" },
  { id: 2273, name: "Kepa", korean_name: "케파 아리사발라가", team_id: 42, position: "Goalkeeper" },
  { id: 342243, name: "T. Setford", korean_name: "토미 셋포드", team_id: 42, position: "Goalkeeper" },

  // Defenders (10명)
  { id: 22090, name: "W. Saliba", korean_name: "윌리엄 살리바", team_id: 42, position: "Defender" },
  { id: 127817, name: "P. Hincapié", korean_name: "페이로 인카피에", team_id: 42, position: "Defender" },
  { id: 333682, name: "Cristhian Mosquera", korean_name: "크리스티안 모스케라", team_id: 42, position: "Defender" },
  { id: 19959, name: "B. White", korean_name: "벤 화이트", team_id: 42, position: "Defender" },
  { id: 61431, name: "J. Kiwior", korean_name: "야쿱 키비오르", team_id: 42, position: "Defender" },
  { id: 380697, name: "M. Kacurri", korean_name: "마일스 카쿠리", team_id: 42, position: "Defender" },
  { id: 22224, name: "Gabriel Magalhães", korean_name: "가브리엘 마갈량이스", team_id: 42, position: "Defender" },
  { id: 38746, name: "J. Timber", korean_name: "유리엔 팀버", team_id: 42, position: "Defender" },
  { id: 157052, name: "R. Calafiori", korean_name: "리카르도 칼라피오리", team_id: 42, position: "Defender" },
  { id: 313245, name: "M. Lewis-Skelly", korean_name: "말도 루이스-스켈리", team_id: 42, position: "Defender" },

  // Midfielders (9명)
  { id: 1427, name: "A. Sambi Lokonga", korean_name: "알베르 삼비 로콩가", team_id: 42, position: "Midfielder" },
  { id: 37127, name: "M. Ødegaard", korean_name: "마르틴 외데고르", team_id: 42, position: "Midfielder" },
  { id: 30407, name: "C. Nørgaard", korean_name: "크리스티안 뇌르고르", team_id: 42, position: "Midfielder" },
  { id: 41725, name: "Fábio Vieira", korean_name: "파비우 비에이라", team_id: 42, position: "Midfielder" },
  { id: 313236, name: "E. Nwaneri", korean_name: "이단 누와네리", team_id: 42, position: "Midfielder" },
  { id: 47311, name: "Mikel Merino", korean_name: "미켈 메리노", team_id: 42, position: "Midfielder" },
  { id: 47315, name: "Martín Zubimendi", korean_name: "마르틴 수비멘디", team_id: 42, position: "Midfielder" },
  { id: 2937, name: "D. Rice", korean_name: "데클란 라이스", team_id: 42, position: "Midfielder" },
  { id: 442044, name: "M. Dowman", korean_name: "맥스 다우먼", team_id: 42, position: "Midfielder" },

  // Attackers (9명)
  { id: 1460, name: "B. Saka", korean_name: "부카요 사카", team_id: 42, position: "Attacker" },
  { id: 643, name: "Gabriel Jesus", korean_name: "가브리엘 제주스", team_id: 42, position: "Attacker" },
  { id: 457731, name: "A. Annous", korean_name: "아담 아누스", team_id: 42, position: "Attacker" },
  { id: 127769, name: "Gabriel Martinelli", korean_name: "가브리엘 마르티넬리", team_id: 42, position: "Attacker" },
  { id: 18979, name: "V. Gyökeres", korean_name: "빅토르 욕케레스", team_id: 42, position: "Attacker" },
  { id: 1946, name: "L. Trossard", korean_name: "레안드로 트로사르", team_id: 42, position: "Attacker" },
  { id: 136723, name: "N. Madueke", korean_name: "노니 마두에케", team_id: 42, position: "Attacker" },
  { id: 407033, name: "Ismeal Kabia", korean_name: "이스마엘 카비아", team_id: 42, position: "Attacker" },
  { id: 978, name: "K. Havertz", korean_name: "카이 하베르츠", team_id: 42, position: "Attacker" },
];

// ============================================
// Burnley (Team ID: 44) - 41명
// ============================================
export const BURNLEY_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (4명)
  { id: 18886, name: "M. Dúbravka", korean_name: "마르틴 두브라브카", team_id: 44, position: "Goalkeeper" },
  { id: 328273, name: "M. Weiß", korean_name: "마티아스 바이스", team_id: 44, position: "Goalkeeper" },
  { id: 44994, name: "V. Hladký", korean_name: "바츨라프 흘라드키", team_id: 44, position: "Goalkeeper" },
  { id: 174837, name: "E. Green", korean_name: "에단 그린", team_id: 44, position: "Goalkeeper" },

  // Defenders (13명)
  { id: 627, name: "K. Walker", korean_name: "카일 워커", team_id: 44, position: "Defender" },
  { id: 375915, name: "Q. Hartman", korean_name: "퀸튼 하트만", team_id: 44, position: "Defender" },
  { id: 1746, name: "J. Worrall", korean_name: "조 워럴", team_id: 44, position: "Defender" },
  { id: 179400, name: "M. Estève", korean_name: "막심 에스테브", team_id: 44, position: "Defender" },
  { id: 19182, name: "A. Tuanzebe", korean_name: "액슬 투안제베", team_id: 44, position: "Defender" },
  { id: 181797, name: "B. Humphreys", korean_name: "바질 험프리스", team_id: 44, position: "Defender" },
  { id: 19331, name: "C. Roberts", korean_name: "코너 로버츠", team_id: 44, position: "Defender" },
  { id: 25628, name: "J. Beyer", korean_name: "요르단 베이어", team_id: 44, position: "Defender" },
  { id: 47903, name: "H. Ekdal", korean_name: "한네스 에크달", team_id: 44, position: "Defender" },
  { id: 128895, name: "O. Sonne", korean_name: "올리버 손네", team_id: 44, position: "Defender" },
  { id: 330238, name: "Lucas Pires", korean_name: "루카스 피레스", team_id: 44, position: "Defender" },
  { id: 20303, name: "J. Laurent", korean_name: "조나단 로랑", team_id: 44, position: "Defender" },
  { id: 1411, name: "H. Delcroix", korean_name: "한네스 델크로이", team_id: 44, position: "Defender" },

  // Midfielders (11명)
  { id: 270508, name: "L. Ugochukwu", korean_name: "레슬리 우고추쿠", team_id: 44, position: "Midfielder" },
  { id: 196855, name: "J. Anthony", korean_name: "조쉬 앤서니", team_id: 44, position: "Midfielder" },
  { id: 575, name: "Florentino", korean_name: "플로렌티노", team_id: 44, position: "Midfielder" },
  { id: 105789, name: "D. Churlinov", korean_name: "다르코 추를리노프", team_id: 44, position: "Midfielder" },
  { id: 161621, name: "L. Tchaouna", korean_name: "로이크 차우나", team_id: 44, position: "Midfielder" },
  { id: 36927, name: "Z. Flemming", korean_name: "자크 플레밍", team_id: 44, position: "Midfielder" },
  { id: 278079, name: "A. Ramsey", korean_name: "애런 램지", team_id: 44, position: "Midfielder" },
  { id: 19827, name: "J. Cullen", korean_name: "조쉬 컬렌", team_id: 44, position: "Midfielder" },
  { id: 180560, name: "H. Mejbri", korean_name: "하니발 메즈브리", team_id: 44, position: "Midfielder" },
  { id: 416256, name: "Marley Leuluai", korean_name: "말리 레울루아이", team_id: 44, position: "Midfielder" },
  { id: 456637, name: "O. Pimlott", korean_name: "오웬 핌롯", team_id: 44, position: "Midfielder" },

  // Attackers (13명)
  { id: 361388, name: "E. Agyei", korean_name: "에녹 아게이", team_id: 44, position: "Attacker" },
  { id: 123469, name: "Z. Amdouni", korean_name: "자이두 암두니", team_id: 44, position: "Attacker" },
  { id: 22, name: "J. Bruun Larsen", korean_name: "야콥 브룬 라르센", team_id: 44, position: "Attacker" },
  { id: 98936, name: "L. Foster", korean_name: "라샤드 포스터", team_id: 44, position: "Attacker" },
  { id: 37882, name: "M. Edwards", korean_name: "마커스 에드워즈", team_id: 44, position: "Attacker" },
  { id: 18957, name: "M. Obafemi", korean_name: "마이클 오바페미", team_id: 44, position: "Attacker" },
  { id: 359603, name: "L. Koleosho", korean_name: "라자 콜레오쇼", team_id: 44, position: "Attacker" },
  { id: 8589, name: "B. Manuel", korean_name: "브라이언 마누엘", team_id: 44, position: "Attacker" },
  { id: 138822, name: "A. Broja", korean_name: "아르만도 브로야", team_id: 44, position: "Attacker" },
  { id: 37381, name: "M. Trésor", korean_name: "마이크 트레조르", team_id: 44, position: "Attacker" },
  { id: 336578, name: "J. Banel", korean_name: "제이 바넬", team_id: 44, position: "Attacker" },
  { id: 18927, name: "A. Barnes", korean_name: "애슐리 반스", team_id: 44, position: "Attacker" },
  { id: 339259, name: "Tom Tweedy", korean_name: "톰 트위디", team_id: 44, position: "Attacker" },
];

// ============================================
// Everton (Team ID: 45) - 29명
// ============================================
export const EVERTON_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (4명)
  { id: 2932, name: "J. Pickford", korean_name: "조던 픽포드", team_id: 45, position: "Goalkeeper" },
  { id: 18860, name: "M. Travers", korean_name: "마크 트래버스", team_id: 45, position: "Goalkeeper" },
  { id: 82855, name: "T. King", korean_name: "토니 킹", team_id: 45, position: "Goalkeeper" },
  { id: 138844, name: "H. Tyrer", korean_name: "해리 타이러", team_id: 45, position: "Goalkeeper" },

  // Defenders (9명)
  { id: 138417, name: "N. Patterson", korean_name: "네이선 패터슨", team_id: 45, position: "Defender" },
  { id: 2934, name: "M. Keane", korean_name: "마이클 킨", team_id: 45, position: "Defender" },
  { id: 17661, name: "J. Branthwaite", korean_name: "자라드 브랜스웨이트", team_id: 45, position: "Defender" },
  { id: 2936, name: "J. Tarkowski", korean_name: "제임스 타르코프스키", team_id: 45, position: "Defender" },
  { id: 270139, name: "J. O'Brien", korean_name: "제이크 오브라이언", team_id: 45, position: "Defender" },
  { id: 2165, name: "V. Mykolenko", korean_name: "비탈리 미콜렌코", team_id: 45, position: "Defender" },
  { id: 284385, name: "Elijah Xavier Campbell", korean_name: "일라이자 캠벨", team_id: 45, position: "Defender" },
  { id: 18758, name: "S. Coleman", korean_name: "셰이머스 콜먼", team_id: 45, position: "Defender" },
  { id: 431921, name: "Adam Aznou Ben Cheikh", korean_name: "아담 아즈누", team_id: 45, position: "Defender" },

  // Midfielders (11명)
  { id: 405360, name: "H. Armstrong", korean_name: "해리슨 암스트롱", team_id: 45, position: "Midfielder" },
  { id: 18592, name: "I. Ndiaye", korean_name: "일리만 은디아예", team_id: 45, position: "Midfielder" },
  { id: 19187, name: "J. Grealish", korean_name: "잭 그릴리쉬", team_id: 45, position: "Midfielder" },
  { id: 304317, name: "T. Dibling", korean_name: "타일러 디블링", team_id: 45, position: "Midfielder" },
  { id: 148099, name: "K. Dewsbury-Hall", korean_name: "키어넌 듀스버리-홀", team_id: 45, position: "Midfielder" },
  { id: 167657, name: "T. Onyango", korean_name: "타일러 온양고", team_id: 45, position: "Midfielder" },
  { id: 195993, name: "C. Alcaraz", korean_name: "카를로스 알카라스", team_id: 45, position: "Midfielder" },
  { id: 2990, name: "I. Gueye", korean_name: "이드리사 게예", team_id: 45, position: "Midfielder" },
  { id: 202854, name: "M. Röhl", korean_name: "제이미 뢸", team_id: 45, position: "Midfielder" },
  { id: 895, name: "J. Garner", korean_name: "제임스 가너", team_id: 45, position: "Midfielder" },
  { id: 284500, name: "T. Iroegbunam", korean_name: "팀 이로에그부남", team_id: 45, position: "Midfielder" },

  // Attackers (5명)
  { id: 18929, name: "D. McNeil", korean_name: "드와이트 맥닐", team_id: 45, position: "Attacker" },
  { id: 330412, name: "Youssef Chermiti", korean_name: "유세프 셰르미티", team_id: 45, position: "Attacker" },
  { id: 125743, name: "Beto", korean_name: "베투", team_id: 45, position: "Attacker" },
  { id: 343684, name: "T. Barry", korean_name: "테이든 배리", team_id: 45, position: "Attacker" },
  { id: 296664, name: "Isaac Heath", korean_name: "아이작 히스", team_id: 45, position: "Attacker" },
];

// ============================================
// Tottenham (Team ID: 47) - 35명
// ============================================
export const TOTTENHAM_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (3명)
  { id: 31354, name: "G. Vicario", korean_name: "굴리엘모 비카리오", team_id: 47, position: "Goalkeeper" },
  { id: 265826, name: "A. Kinský", korean_name: "안토닌 킨스키", team_id: 47, position: "Goalkeeper" },
  { id: 156428, name: "B. Austin", korean_name: "브랜든 오스틴", team_id: 47, position: "Goalkeeper" },

  // Defenders (12명)
  { id: 337593, name: "K. Takai", korean_name: "케이타 타카이", team_id: 47, position: "Defender" },
  { id: 459203, name: "Malachi Hardy", korean_name: "말라키 하디", team_id: 47, position: "Defender" },
  { id: 25287, name: "K. Danso", korean_name: "케빈 단소", team_id: 47, position: "Defender" },
  { id: 162498, name: "R. Drăgușin", korean_name: "라두 드라구신", team_id: 47, position: "Defender" },
  { id: 204039, name: "D. Udogie", korean_name: "데스티니 우도기", team_id: 47, position: "Defender" },
  { id: 30776, name: "C. Romero", korean_name: "크리스티안 로메로", team_id: 47, position: "Defender" },
  { id: 47519, name: "Pedro Porro", korean_name: "페드로 포로", team_id: 47, position: "Defender" },
  { id: 19235, name: "D. Spence", korean_name: "제드 스펜스", team_id: 47, position: "Defender" },
  { id: 164, name: "B. Davies", korean_name: "벤 데이비스", team_id: 47, position: "Defender" },
  { id: 152849, name: "M. van de Ven", korean_name: "미키 판 더 펜", team_id: 47, position: "Defender" },
  { id: 387521, name: "L. Vušković", korean_name: "루카 부슈코비치", team_id: 47, position: "Defender" },
  { id: 467839, name: "J. Byfield", korean_name: "제이든 바이필드", team_id: 47, position: "Defender" },

  // Midfielders (13명)
  { id: 380689, name: "Callum Latif Olusesi", korean_name: "칼럼 올루세시", team_id: 47, position: "Midfielder" },
  { id: 41104, name: "João Palhinha", korean_name: "주앙 팔리냐", team_id: 47, position: "Midfielder" },
  { id: 162016, name: "X. Simons", korean_name: "사비 시몬스", team_id: 47, position: "Midfielder" },
  { id: 18968, name: "Y. Bissouma", korean_name: "이브 비수마", team_id: 47, position: "Midfielder" },
  { id: 18784, name: "J. Maddison", korean_name: "제임스 매디슨", team_id: 47, position: "Midfielder" },
  { id: 328089, name: "A. Gray", korean_name: "아치 그레이", team_id: 47, position: "Midfielder" },
  { id: 347316, name: "L. Bergvall", korean_name: "루카스 베리발", team_id: 47, position: "Midfielder" },
  { id: 15911, name: "M. Kudus", korean_name: "모하메드 쿠두스", team_id: 47, position: "Midfielder" },
  { id: 30435, name: "D. Kulusevski", korean_name: "데얀 쿨루셉스키", team_id: 47, position: "Midfielder" },
  { id: 336564, name: "W. Odobert", korean_name: "윌슨 오도베르", team_id: 47, position: "Midfielder" },
  { id: 237129, name: "P. Sarr", korean_name: "파페 사르", team_id: 47, position: "Midfielder" },
  { id: 863, name: "R. Bentancur", korean_name: "로드리고 벤탄쿠르", team_id: 47, position: "Midfielder" },

  // Attackers (7명)
  { id: 697, name: "M. Solomon", korean_name: "마노르 솔로몬", team_id: 47, position: "Attacker" },
  { id: 2413, name: "Richarlison", korean_name: "히샤를리송", team_id: 47, position: "Attacker" },
  { id: 270510, name: "M. Tel", korean_name: "마티스 텔", team_id: 47, position: "Attacker" },
  { id: 18883, name: "D. Solanke", korean_name: "도미닉 솔란케", team_id: 47, position: "Attacker" },
  { id: 2061, name: "Bryan Gil", korean_name: "브라이언 힐", team_id: 47, position: "Attacker" },
  { id: 129711, name: "B. Johnson", korean_name: "브레넌 존슨", team_id: 47, position: "Attacker" },
  { id: 21104, name: "R. Kolo Muani", korean_name: "랑달 콜로 무아니", team_id: 47, position: "Attacker" },
  { id: 162552, name: "D. Scarlett", korean_name: "데인 스칼렛", team_id: 47, position: "Attacker" },
];

// ============================================
// West Ham (Team ID: 48) - 33명
// ============================================
export const WEST_HAM_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (5명)
  { id: 15870, name: "M. Hermansen", korean_name: "매즈 헤르만센", team_id: 48, position: "Goalkeeper" },
  { id: 1736, name: "W. Foderingham", korean_name: "웨스 포더링엄", team_id: 48, position: "Goalkeeper" },
  { id: 2997, name: "Ł. Fabiański", korean_name: "우카시 파비안스키", team_id: 48, position: "Goalkeeper" },
  { id: 253, name: "A. Areola", korean_name: "알폰스 아레올라", team_id: 48, position: "Goalkeeper" },
  { id: 144723, name: "K. Hegyi", korean_name: "크리스토퍼 헤지", team_id: 48, position: "Goalkeeper" },

  // Defenders (10명)
  { id: 171, name: "K. Walker-Peters", korean_name: "카일 워커-피터스", team_id: 48, position: "Defender" },
  { id: 18744, name: "M. Kilman", korean_name: "맥스 킬먼", team_id: 48, position: "Defender" },
  { id: 7600, name: "Igor", korean_name: "이고르", team_id: 48, position: "Defender" },
  { id: 409303, name: "E. Diouf", korean_name: "엘 디우프", team_id: 48, position: "Defender" },
  { id: 1445, name: "K. Mavropanos", korean_name: "콘스탄티노스 마브로파노스", team_id: 48, position: "Defender" },
  { id: 21694, name: "N. Aguerd", korean_name: "나예프 아게르드", team_id: 48, position: "Defender" },
  { id: 138, name: "J. Todibo", korean_name: "장-클레르 토디보", team_id: 48, position: "Defender" },
  { id: 18846, name: "A. Wan-Bissaka", korean_name: "애런 완-비사카", team_id: 48, position: "Defender" },
  { id: 327730, name: "O. Scarles", korean_name: "올리버 스칼스", team_id: 48, position: "Defender" },
  { id: 2284, name: "Emerson", korean_name: "에메르송", team_id: 48, position: "Defender" },

  // Midfielders (13명)
  { id: 37724, name: "C. Summerville", korean_name: "크리스웬 서머빌", team_id: 48, position: "Midfielder" },
  { id: 2938, name: "J. Ward-Prowse", korean_name: "제임스 워드-프라우스", team_id: 48, position: "Midfielder" },
  { id: 1646, name: "Lucas Paquetá", korean_name: "루카스 파케타", team_id: 48, position: "Midfielder" },
  { id: 2869, name: "E. Álvarez", korean_name: "에디손 알바레스", team_id: 48, position: "Midfielder" },
  { id: 336585, name: "Mateus Fernandes", korean_name: "마테우스 페르난데스", team_id: 48, position: "Midfielder" },
  { id: 19428, name: "J. Bowen", korean_name: "자로드 보웬", team_id: 48, position: "Midfielder" },
  { id: 2476, name: "G. Rodríguez", korean_name: "구이도 로드리게스", team_id: 48, position: "Midfielder" },
  { id: 288118, name: "L. Orford", korean_name: "루이스 오포드", team_id: 48, position: "Midfielder" },
  { id: 326176, name: "S. Magassa", korean_name: "소우마일라 마가사", team_id: 48, position: "Midfielder" },
  { id: 1243, name: "T. Souček", korean_name: "토마시 소우체크", team_id: 48, position: "Midfielder" },
  { id: 284446, name: "F. Potts", korean_name: "프레디 포츠", team_id: 48, position: "Midfielder" },
  { id: 68466, name: "A. Irving", korean_name: "앤디 어빙", team_id: 48, position: "Midfielder" },
  { id: 291363, name: "George Earthy", korean_name: "조지 어시", team_id: 48, position: "Midfielder" },

  // Attackers (5명)
  { id: 2939, name: "C. Wilson", korean_name: "칼럼 윌슨", team_id: 48, position: "Attacker" },
  { id: 25391, name: "N. Füllkrug", korean_name: "니클라스 퓔크루크", team_id: 48, position: "Attacker" },
  { id: 404574, name: "Luis Guilherme", korean_name: "루이스 기예르미", team_id: 48, position: "Attacker" },
  { id: 344707, name: "C. Marshall", korean_name: "칼럼 마셜", team_id: 48, position: "Attacker" },
  { id: 665, name: "M. Cornet", korean_name: "막심 코르네", team_id: 48, position: "Attacker" },
];

// ============================================
// Chelsea (Team ID: 49) - 42명
// ============================================
export const CHELSEA_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (5명)
  { id: 18959, name: "Robert Sánchez", korean_name: "로베르트 산체스", team_id: 49, position: "Goalkeeper" },
  { id: 298061, name: "Ted Curd", korean_name: "테드 커드", team_id: 49, position: "Goalkeeper" },
  { id: 286616, name: "F. Jörgensen", korean_name: "필립 요르겐센", team_id: 49, position: "Goalkeeper" },
  { id: 64167, name: "G. Słonina", korean_name: "가브리엘 슬로니나", team_id: 49, position: "Goalkeeper" },
  { id: 287868, name: "Max Merrick", korean_name: "맥스 메릭", team_id: 49, position: "Goalkeeper" },

  // Defenders (15명)
  { id: 2933, name: "B. Chilwell", korean_name: "벤 칠웰", team_id: 49, position: "Defender" },
  { id: 47380, name: "Marc Cucurella", korean_name: "마르크 쿠쿠레야", team_id: 49, position: "Defender" },
  { id: 19145, name: "T. Adarabioyo", korean_name: "토신 아다라비오요", team_id: 49, position: "Defender" },
  { id: 95, name: "B. Badiashile", korean_name: "브누아 바디아실", team_id: 49, position: "Defender" },
  { id: 152953, name: "L. Colwill", korean_name: "레비 콜윌", team_id: 49, position: "Defender" },
  { id: 284406, name: "A. Gilchrist", korean_name: "알피 길크리스트", team_id: 49, position: "Defender" },
  { id: 328093, name: "I. Samuels-Smith", korean_name: "이삭 사무엘스-스미스", team_id: 49, position: "Defender" },
  { id: 341642, name: "J. Hato", korean_name: "요르렐 하토", team_id: 49, position: "Defender" },
  { id: 19720, name: "T. Chalobah", korean_name: "트레보 찰로바", team_id: 49, position: "Defender" },
  { id: 19545, name: "R. James", korean_name: "리스 제임스", team_id: 49, position: "Defender" },
  { id: 422780, name: "A. Anselmino", korean_name: "아론 안셀미노", team_id: 49, position: "Defender" },
  { id: 22094, name: "W. Fofana", korean_name: "웨슬리 포파나", team_id: 49, position: "Defender" },
  { id: 366735, name: "Joshua Kofi Acheampong", korean_name: "조슈아 아첨퐁", team_id: 49, position: "Defender" },

  // Midfielders (13명)
  { id: 1864, name: "Pedro Neto", korean_name: "페드루 네투", team_id: 49, position: "Midfielder" },
  { id: 5996, name: "E. Fernández", korean_name: "엔소 페르난데스", team_id: 49, position: "Midfielder" },
  { id: 152982, name: "C. Palmer", korean_name: "콜 파머", team_id: 49, position: "Midfielder" },
  { id: 336671, name: "Renato Veiga", korean_name: "레나투 베이가", team_id: 49, position: "Midfielder" },
  { id: 308678, name: "Dário Essugo", korean_name: "다리우 에수구", team_id: 49, position: "Midfielder" },
  { id: 63577, name: "M. Mudryk", korean_name: "미하일로 무드리크", team_id: 49, position: "Midfielder" },
  { id: 138935, name: "C. Chukwuemeka", korean_name: "카니 추크우에메카", team_id: 49, position: "Midfielder" },
  { id: 305834, name: "Andrey Santos", korean_name: "안드레이 산투스", team_id: 49, position: "Midfielder" },
  { id: 116117, name: "M. Caicedo", korean_name: "모이세스 카이세도", team_id: 49, position: "Midfielder" },
  { id: 161907, name: "M. Gusto", korean_name: "말 구스토", team_id: 49, position: "Midfielder" },
  { id: 282125, name: "R. Lavia", korean_name: "로메오 라비아", team_id: 49, position: "Midfielder" },
  { id: 482888, name: "Reggie Walsh", korean_name: "레지 월시", team_id: 49, position: "Midfielder" },
  { id: 454935, name: "Landon Emenalo", korean_name: "랜던 에메날로", team_id: 49, position: "Midfielder" },
  { id: 394167, name: "Ollie Harrison", korean_name: "올리 해리슨", team_id: 49, position: "Midfielder" },

  // Attackers (9명)
  { id: 161948, name: "L. Delap", korean_name: "리암 델랩", team_id: 49, position: "Attacker" },
  { id: 286894, name: "J. Bynoe-Gittens", korean_name: "제이미 바이노-기텐스", team_id: 49, position: "Attacker" },
  { id: 283058, name: "N. Jackson", korean_name: "니콜라스 잭슨", team_id: 49, position: "Attacker" },
  { id: 269, name: "C. Nkunku", korean_name: "크리스토퍼 은쿤쿠", team_id: 49, position: "Attacker" },
  { id: 415001, name: "Deivid Washington", korean_name: "데이비드 워싱턴", team_id: 49, position: "Attacker" },
  { id: 10329, name: "João Pedro", korean_name: "주앙 페드루", team_id: 49, position: "Attacker" },
  { id: 334037, name: "Tyrique George", korean_name: "타이리크 조지", team_id: 49, position: "Attacker" },
  { id: 425733, name: "Estêvão", korean_name: "에스테방", team_id: 49, position: "Attacker" },
  { id: 359117, name: "Shumaira Mheuka", korean_name: "슈마이라 므후카", team_id: 49, position: "Attacker" },
  { id: 291476, name: "D. Fofana", korean_name: "다비드 포파나", team_id: 49, position: "Attacker" },
];

// ============================================
// Manchester City (Team ID: 50) - 39명
// ============================================
export const MANCHESTER_CITY_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (5명)
  { id: 162489, name: "J. Trafford", korean_name: "제임스 트래포드", team_id: 50, position: "Goalkeeper" },
  { id: 19012, name: "M. Bettinelli", korean_name: "마르쿠스 베티넬리", team_id: 50, position: "Goalkeeper" },
  { id: 25004, name: "S. Ortega", korean_name: "스테판 오르테가", team_id: 50, position: "Goalkeeper" },
  { id: 1622, name: "G. Donnarumma", korean_name: "잔루이지 돈나룸마", team_id: 50, position: "Goalkeeper" },
  { id: 617, name: "Ederson", korean_name: "에데르송", team_id: 50, position: "Goalkeeper" },

  // Defenders (13명)
  { id: 278128, name: "J. Wilson-Esbrand", korean_name: "조슈 윌슨-에스브랜드", team_id: 50, position: "Defender" },
  { id: 567, name: "Rúben Dias", korean_name: "후벤 디아스", team_id: 50, position: "Defender" },
  { id: 626, name: "J. Stones", korean_name: "존 스톤스", team_id: 50, position: "Defender" },
  { id: 18861, name: "N. Aké", korean_name: "나탄 아케", team_id: 50, position: "Defender" },
  { id: 140947, name: "I. Kaboré", korean_name: "이사 카보레", team_id: 50, position: "Defender" },
  { id: 21138, name: "R. Aït-Nouri", korean_name: "라얀 아이트-누리", team_id: 50, position: "Defender" },
  { id: 129033, name: "J. Gvardiol", korean_name: "요슈코 그바르디올", team_id: 50, position: "Defender" },
  { id: 5, name: "M. Akanji", korean_name: "마누엘 아칸지", team_id: 50, position: "Defender" },
  { id: 41621, name: "Matheus Nunes", korean_name: "마테우스 누네스", team_id: 50, position: "Defender" },
  { id: 307123, name: "N. O'Reilly", korean_name: "니코 오라일리", team_id: 50, position: "Defender" },
  { id: 360114, name: "A. Khusanov", korean_name: "아브두코디르 후사노프", team_id: 50, position: "Defender" },
  { id: 451583, name: "Kaden Braithwaite", korean_name: "케이든 브레이스웨이트", team_id: 50, position: "Defender" },
  { id: 284230, name: "R. Lewis", korean_name: "리코 루이스", team_id: 50, position: "Defender" },
  { id: 382358, name: "S. Mfuni", korean_name: "심바 음푸니", team_id: 50, position: "Defender" },

  // Midfielders (15명)
  { id: 36902, name: "T. Reijnders", korean_name: "테윈 레인더르스", team_id: 50, position: "Midfielder" },
  { id: 2291, name: "M. Kovačić", korean_name: "마테오 코바치치", team_id: 50, position: "Midfielder" },
  { id: 414385, name: "C. Echeverri", korean_name: "클라우디오 에체베리", team_id: 50, position: "Midfielder" },
  { id: 156477, name: "R. Cherki", korean_name: "라얀 셰르키", team_id: 50, position: "Midfielder" },
  { id: 161933, name: "Nico González", korean_name: "니코 곤살레스", team_id: 50, position: "Midfielder" },
  { id: 44, name: "Rodri", korean_name: "로드리", team_id: 50, position: "Midfielder" },
  { id: 633, name: "İ. Gündoğan", korean_name: "일카이 귄도안", team_id: 50, position: "Midfielder" },
  { id: 636, name: "Bernardo Silva", korean_name: "베르나르두 실바", team_id: 50, position: "Midfielder" },
  { id: 266657, name: "Sávio", korean_name: "사비우", team_id: 50, position: "Midfielder" },
  { id: 323591, name: "S. Nypan", korean_name: "스벤드 니판", team_id: 50, position: "Midfielder" },
  { id: 19130, name: "K. Phillips", korean_name: "칼빈 필립스", team_id: 50, position: "Midfielder" },
  { id: 631, name: "P. Foden", korean_name: "필 포든", team_id: 50, position: "Midfielder" },
  { id: 278133, name: "Oscar Bobb", korean_name: "오스카 봅", team_id: 50, position: "Midfielder" },
  { id: 380681, name: "D. Mukasa", korean_name: "디오니시오 무카사", team_id: 50, position: "Midfielder" },

  // Attackers (6명)
  { id: 81573, name: "Omar Marmoush", korean_name: "오마르 마르무시", team_id: 50, position: "Attacker" },
  { id: 1100, name: "E. Haaland", korean_name: "엘링 홀란", team_id: 50, position: "Attacker" },
  { id: 1422, name: "J. Doku", korean_name: "제레미 도쿠", team_id: 50, position: "Attacker" },
  { id: 442048, name: "Ryan McAidoo", korean_name: "라이언 맥아이두", team_id: 50, position: "Attacker" },
  { id: 347305, name: "Jaden Heskey", korean_name: "제이든 헤스키", team_id: 50, position: "Attacker" },
  { id: 448969, name: "Reigan Heskey", korean_name: "레이건 헤스키", team_id: 50, position: "Attacker" },
];

// ============================================
// Brighton (Team ID: 51) - 36명
// ============================================
export const BRIGHTON_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (3명)
  { id: 129058, name: "B. Verbruggen", korean_name: "바르트 페르브뤼헌", team_id: 51, position: "Goalkeeper" },
  { id: 18960, name: "J. Steele", korean_name: "제이슨 스틸", team_id: 51, position: "Goalkeeper" },
  { id: 167663, name: "T. McGill", korean_name: "톰 맥길", team_id: 51, position: "Goalkeeper" },

  // Defenders (11명)
  { id: 19265, name: "A. Webster", korean_name: "애덤 웹스터", team_id: 51, position: "Defender" },
  { id: 18963, name: "L. Dunk", korean_name: "루이스 덩크", team_id: 51, position: "Defender" },
  { id: 38695, name: "J. van Hecke", korean_name: "얀 판 헤케", team_id: 51, position: "Defender" },
  { id: 22160, name: "O. Boscagli", korean_name: "올리비에 보스카글리", team_id: 51, position: "Defender" },
  { id: 1361, name: "F. Kadıoğlu", korean_name: "페르디 카디오글루", team_id: 51, position: "Defender" },
  { id: 92993, name: "M. Wieffer", korean_name: "마츠 비퍼", team_id: 51, position: "Defender" },
  { id: 162007, name: "M. De Cuyper", korean_name: "막심 더 카위퍼", team_id: 51, position: "Defender" },
  { id: 537, name: "J. Veltman", korean_name: "요엘 펠트만", team_id: 51, position: "Defender" },
  { id: 342063, name: "D. Coppola", korean_name: "디에고 코폴라", team_id: 51, position: "Defender" },
  { id: 138815, name: "T. Lamptey", korean_name: "타리크 램프티", team_id: 51, position: "Defender" },
  { id: 328076, name: "C. Tasker", korean_name: "찰리 태스커", team_id: 51, position: "Defender" },
  { id: 412086, name: "F. Simmonds", korean_name: "핀리 시몬즈", team_id: 51, position: "Defender" },

  // Midfielders (14명)
  { id: 18973, name: "S. March", korean_name: "솔리 마치", team_id: 51, position: "Midfielder" },
  { id: 328225, name: "B. Gruda", korean_name: "브라얀 그루다", team_id: 51, position: "Midfielder" },
  { id: 70747, name: "J. Enciso", korean_name: "훌리오 엔시소", team_id: 51, position: "Midfielder" },
  { id: 383685, name: "Y. Minteh", korean_name: "양켈 민테", team_id: 51, position: "Midfielder" },
  { id: 305730, name: "J. Hinshelwood", korean_name: "잭 힌셀우드", team_id: 51, position: "Midfielder" },
  { id: 356041, name: "C. Baleba", korean_name: "카를로스 발레바", team_id: 51, position: "Midfielder" },
  { id: 19030, name: "M. O'Riley", korean_name: "맷 오라일리", team_id: 51, position: "Midfielder" },
  { id: 137220, name: "A. Moran", korean_name: "앤드류 모란", team_id: 51, position: "Midfielder" },
  { id: 202086, name: "J. Sarmiento", korean_name: "제레미 사르미엔토", team_id: 51, position: "Midfielder" },
  { id: 296, name: "J. Milner", korean_name: "제임스 밀너", team_id: 51, position: "Midfielder" },
  { id: 106835, name: "K. Mitoma", korean_name: "미토마 가오루", team_id: 51, position: "Midfielder" },
  { id: 278370, name: "D. Gómez", korean_name: "디에고 고메스", team_id: 51, position: "Midfielder" },
  { id: 265820, name: "Y. Ayari", korean_name: "야신 아야리", team_id: 51, position: "Midfielder" },
  { id: 311334, name: "F. Buonanotte", korean_name: "파쿤도 부오나노테", team_id: 51, position: "Midfielder" },
  { id: 392610, name: "H. Howell", korean_name: "해리 하웰", team_id: 51, position: "Midfielder" },

  // Attackers (8명)
  { id: 343311, name: "S. Tzimas", korean_name: "스테파노스 치마스", team_id: 51, position: "Attacker" },
  { id: 90590, name: "G. Rutter", korean_name: "조르지니오 루터", team_id: 51, position: "Attacker" },
  { id: 329369, name: "T. Watson", korean_name: "타일러 왓슨", team_id: 51, position: "Attacker" },
  { id: 277191, name: "A. Sima", korean_name: "압둘라예 시마", team_id: 51, position: "Attacker" },
  { id: 1469, name: "D. Welbeck", korean_name: "대니 웰벡", team_id: 51, position: "Attacker" },
  { id: 392482, name: "C. Kostoulas", korean_name: "크리스토스 코스툴라스", team_id: 51, position: "Attacker" },
];

// ============================================
// Crystal Palace (Team ID: 52) - 35명
// ============================================
export const CRYSTAL_PALACE_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (3명)
  { id: 19088, name: "D. Henderson", korean_name: "딘 헨더슨", team_id: 52, position: "Goalkeeper" },
  { id: 19684, name: "R. Matthews", korean_name: "라이언 매튜스", team_id: 52, position: "Goalkeeper" },
  { id: 22157, name: "W. Benítez", korean_name: "월터 베니테스", team_id: 52, position: "Goalkeeper" },

  // Defenders (8명)
  { id: 380679, name: "C. Kporha", korean_name: "칼빈 크포르하", team_id: 52, position: "Defender" },
  { id: 20995, name: "M. Lacroix", korean_name: "막심 라크루아", team_id: 52, position: "Defender" },
  { id: 67971, name: "M. Guéhi", korean_name: "마크 게이", team_id: 52, position: "Defender" },
  { id: 18862, name: "N. Clyne", korean_name: "나다니엘 클라인", team_id: 52, position: "Defender" },
  { id: 412759, name: "J. Canvot", korean_name: "제시 칸보", team_id: 52, position: "Defender" },
  { id: 26303, name: "B. Sosa", korean_name: "보르나 소사", team_id: 52, position: "Defender" },
  { id: 126949, name: "C. Richards", korean_name: "크리스 리차즈", team_id: 52, position: "Defender" },
  { id: 278898, name: "C. Riad", korean_name: "샤디 리아드", team_id: 52, position: "Defender" },

  // Midfielders (15명)
  { id: 13736, name: "D. Muñoz", korean_name: "다니엘 무뇨스", team_id: 52, position: "Midfielder" },
  { id: 182201, name: "T. Mitchell", korean_name: "타이릭 미첼", team_id: 52, position: "Midfielder" },
  { id: 2490, name: "J. Lerma", korean_name: "제퍼슨 레르마", team_id: 52, position: "Midfielder" },
  { id: 19586, name: "E. Eze", korean_name: "에베레치 에제", team_id: 52, position: "Midfielder" },
  { id: 284449, name: "J. Rak-Sakyi", korean_name: "제수런 락-사키", team_id: 52, position: "Midfielder" },
  { id: 403554, name: "Christantus Uche", korean_name: "크리스탄투스 우체", team_id: 52, position: "Midfielder" },
  { id: 152418, name: "N. Ahamada", korean_name: "나오엘 아하마다", team_id: 52, position: "Midfielder" },
  { id: 2601, name: "D. Kamada", korean_name: "가마다 다이치", team_id: 52, position: "Midfielder" },
  { id: 18806, name: "W. Hughes", korean_name: "윌 휴즈", team_id: 52, position: "Midfielder" },
  { id: 288102, name: "A. Wharton", korean_name: "애덤 와튼", team_id: 52, position: "Midfielder" },
  { id: 402640, name: "R. Esse", korean_name: "로니 에세", team_id: 52, position: "Midfielder" },
  { id: 3339, name: "C. Doucouré", korean_name: "셰이크 두쿠레", team_id: 52, position: "Midfielder" },
  { id: 301295, name: "K. Rodney", korean_name: "카일 로드니", team_id: 52, position: "Midfielder" },
  { id: 286458, name: "J. Devenny", korean_name: "저스틴 데베니", team_id: 52, position: "Midfielder" },
  { id: 380703, name: "Rio Cardines", korean_name: "리오 카디네스", team_id: 52, position: "Midfielder" },
  { id: 367634, name: "A. Agbinone", korean_name: "아담 아그비논", team_id: 52, position: "Midfielder" },

  // Attackers (9명)
  { id: 340136, name: "F. Umeh", korean_name: "프랭클린 우메", team_id: 52, position: "Attacker" },
  { id: 2218, name: "I. Sarr", korean_name: "이스마일라 사르", team_id: 52, position: "Attacker" },
  { id: 311157, name: "Matheus França", korean_name: "마테우스 프랑사", team_id: 52, position: "Attacker" },
  { id: 1468, name: "E. Nketiah", korean_name: "에디 은케티아", team_id: 52, position: "Attacker" },
  { id: 184226, name: "Yeremy Pino", korean_name: "예레미 피노", team_id: 52, position: "Attacker" },
  { id: 1135, name: "O. Édouard", korean_name: "우스만 에두아르", team_id: 52, position: "Attacker" },
  { id: 25927, name: "J. Mateta", korean_name: "장-필립 마테타", team_id: 52, position: "Attacker" },
  { id: 363974, name: "Z. Marsh", korean_name: "잭 마시", team_id: 52, position: "Attacker" },
];

// ============================================
// Brentford (Team ID: 55) - 34명
// ============================================
export const BRENTFORD_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (5명)
  { id: 389579, name: "J. Eyestone", korean_name: "조 아이스톤", team_id: 55, position: "Goalkeeper" },
  { id: 281, name: "C. Kelleher", korean_name: "카오임힌 켈러허", team_id: 55, position: "Goalkeeper" },
  { id: 278041, name: "M. Cox", korean_name: "매튜 콕스", team_id: 55, position: "Goalkeeper" },
  { id: 61742, name: "H. Valdimarsson", korean_name: "하콘 발디마르손", team_id: 55, position: "Goalkeeper" },
  { id: 19340, name: "E. Balcombe", korean_name: "엘리엇 밸컴", team_id: 55, position: "Goalkeeper" },

  // Defenders (10명)
  { id: 15745, name: "M. Roerslev", korean_name: "마즈 뢰르슬레우", team_id: 55, position: "Defender" },
  { id: 44871, name: "A. Hickey", korean_name: "애런 히키", team_id: 55, position: "Defender" },
  { id: 19346, name: "R. Henry", korean_name: "리코 헨리", team_id: 55, position: "Defender" },
  { id: 36922, name: "S. van den Berg", korean_name: "세프 판 덴 베르흐", team_id: 55, position: "Defender" },
  { id: 19789, name: "E. Pinnock", korean_name: "에단 피녹", team_id: 55, position: "Defender" },
  { id: 1119, name: "K. Ajer", korean_name: "크리스토퍼 아예르", team_id: 55, position: "Defender" },
  { id: 19495, name: "N. Collins", korean_name: "네이선 콜린스", team_id: 55, position: "Defender" },
  { id: 350625, name: "J. Meghoma", korean_name: "지 메고마", team_id: 55, position: "Defender" },
  { id: 342022, name: "M. Kayode", korean_name: "미카엘 카요데", team_id: 55, position: "Defender" },
  { id: 430827, name: "Benjamin Arthur", korean_name: "벤자민 아서", team_id: 55, position: "Defender" },

  // Midfielders (11명)
  { id: 430734, name: "Y. Konak", korean_name: "유누스 코나크", team_id: 55, position: "Midfielder" },
  { id: 292, name: "J. Henderson", korean_name: "조던 헨더슨", team_id: 55, position: "Midfielder" },
  { id: 402317, name: "R. Donovan", korean_name: "라이언 도노반", team_id: 55, position: "Midfielder" },
  { id: 47438, name: "M. Jensen", korean_name: "마티아스 옌센", team_id: 55, position: "Midfielder" },
  { id: 162075, name: "P. Maghoma", korean_name: "파리스 마고마", team_id: 55, position: "Midfielder" },
  { id: 153066, name: "Fábio Carvalho", korean_name: "파비우 카르발류", team_id: 55, position: "Midfielder" },
  { id: 15799, name: "F. Onyeka", korean_name: "프랭크 온예카", team_id: 55, position: "Midfielder" },
  { id: 319517, name: "A. Milambo", korean_name: "안토니 밀람보", team_id: 55, position: "Midfielder" },
  { id: 263538, name: "Y. Yarmolyuk", korean_name: "예호르 야르몰류크", team_id: 55, position: "Midfielder" },
  { id: 15908, name: "M. Damsgaard", korean_name: "미켈 담스고르", team_id: 55, position: "Midfielder" },
  { id: 180308, name: "M. Peart-Harris", korean_name: "매튜 피어트-해리스", team_id: 55, position: "Midfielder" },
  { id: 25073, name: "V. Janelt", korean_name: "비탈리 야넬트", team_id: 55, position: "Midfielder" },

  // Attackers (8명)
  { id: 178077, name: "K. Schade", korean_name: "케빈 샤데", team_id: 55, position: "Attacker" },
  { id: 196156, name: "Thiago", korean_name: "치아구", team_id: 55, position: "Attacker" },
  { id: 727, name: "R. Nelson", korean_name: "레이스 넬슨", team_id: 55, position: "Attacker" },
  { id: 20649, name: "Y. Wissa", korean_name: "요안 위사", team_id: 55, position: "Attacker" },
  { id: 284797, name: "D. Ouattara", korean_name: "다고 우아타라", team_id: 55, position: "Attacker" },
  { id: 106725, name: "K. Lewis-Potter", korean_name: "키언 루이스-포터", team_id: 55, position: "Attacker" },
  { id: 427736, name: "Gustavo Gomes", korean_name: "구스타부 고메스", team_id: 55, position: "Attacker" },
];

// ============================================
// Leeds (Team ID: 63) - 32명
// ============================================
export const LEEDS_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (4명)
  { id: 20619, name: "I. Meslier", korean_name: "일랑 메슬리에", team_id: 63, position: "Goalkeeper" },
  { id: 80296, name: "Lucas Perri", korean_name: "루카스 페리", team_id: 63, position: "Goalkeeper" },
  { id: 20068, name: "A. Cairns", korean_name: "알렉스 케언스", team_id: 63, position: "Goalkeeper" },
  { id: 18885, name: "K. Darlow", korean_name: "칼 달로우", team_id: 63, position: "Goalkeeper" },

  // Defenders (10명)
  { id: 19201, name: "J. Bogle", korean_name: "제이든 보글", team_id: 63, position: "Defender" },
  { id: 47969, name: "G. Gudmundsson", korean_name: "가브리엘 구드문손", team_id: 63, position: "Defender" },
  { id: 64003, name: "P. Struijk", korean_name: "파스칼 스트라위크", team_id: 63, position: "Defender" },
  { id: 19321, name: "J. Rodon", korean_name: "조 로돈", team_id: 63, position: "Defender" },
  { id: 833, name: "J. Bijol", korean_name: "야카 비욜", team_id: 63, position: "Defender" },
  { id: 1408, name: "S. Bornauw", korean_name: "세바스티안 보르나우", team_id: 63, position: "Defender" },
  { id: 265372, name: "I. Schmidt", korean_name: "이사크 슈미트", team_id: 63, position: "Defender" },
  { id: 19760, name: "J. Justin", korean_name: "제임스 저스틴", team_id: 63, position: "Defender" },
  { id: 19287, name: "S. Byram", korean_name: "샘 바이럼", team_id: 63, position: "Defender" },

  // Midfielders (8명)
  { id: 2279, name: "E. Ampadu", korean_name: "에단 암파두", team_id: 63, position: "Midfielder" },
  { id: 19329, name: "D. James", korean_name: "대니얼 제임스", team_id: 63, position: "Midfielder" },
  { id: 18901, name: "S. Longstaff", korean_name: "션 롱스태프", team_id: 63, position: "Midfielder" },
  { id: 351344, name: "S. Chambers", korean_name: "샘 체임버스", team_id: 63, position: "Midfielder" },
  { id: 177665, name: "A. Stach", korean_name: "안톤 슈타흐", team_id: 63, position: "Midfielder" },
  { id: 32966, name: "A. Tanaka", korean_name: "다나카 아오", team_id: 63, position: "Midfielder" },
  { id: 282124, name: "D. Gyabi", korean_name: "다릴 자비", team_id: 63, position: "Midfielder" },
  { id: 129142, name: "I. Gruev", korean_name: "일리안 그루에프", team_id: 63, position: "Midfielder" },

  // Attackers (10명)
  { id: 18766, name: "D. Calvert-Lewin", korean_name: "도미닉 칼버트-르윈", team_id: 63, position: "Attacker" },
  { id: 250, name: "J. Piroe", korean_name: "욜 피로에", team_id: 63, position: "Attacker" },
  { id: 50739, name: "B. Aaronson", korean_name: "브렌던 아론슨", team_id: 63, position: "Attacker" },
  { id: 19461, name: "L. Nmecha", korean_name: "루카스 은메차", team_id: 63, position: "Attacker" },
  { id: 138776, name: "L. Ramazani", korean_name: "라르지 라마자니", team_id: 63, position: "Attacker" },
  { id: 48389, name: "N. Okafor", korean_name: "노아 오카포르", team_id: 63, position: "Attacker" },
  { id: 19128, name: "J. Harrison", korean_name: "잭 해리슨", team_id: 63, position: "Attacker" },
  { id: 162128, name: "W. Gnonto", korean_name: "윌프리드 그논토", team_id: 63, position: "Attacker" },
  { id: 443634, name: "H. Gray", korean_name: "해리 그레이", team_id: 63, position: "Attacker" },
  { id: 444291, name: "Harry Gray", korean_name: "해리 그레이", team_id: 63, position: "Attacker" },
  { id: 153400, name: "S. Greenwood", korean_name: "샘 그린우드", team_id: 63, position: "Attacker" },
];

// ============================================
// Nottingham Forest (Team ID: 65) - 35명
// ============================================
export const NOTTINGHAM_FOREST_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (3명)
  { id: 70366, name: "John", korean_name: "존", team_id: 65, position: "Goalkeeper" },
  { id: 18933, name: "A. Gunn", korean_name: "앵거스 건", team_id: 65, position: "Goalkeeper" },
  { id: 2919, name: "M. Sels", korean_name: "마츠 셀스", team_id: 65, position: "Goalkeeper" },

  // Defenders (10명)
  { id: 67943, name: "Morato", korean_name: "모라투", team_id: 65, position: "Defender" },
  { id: 363695, name: "Murillo", korean_name: "무리요", team_id: 65, position: "Defender" },
  { id: 353034, name: "Cuiabano", korean_name: "쿠이아바누", team_id: 65, position: "Defender" },
  { id: 41970, name: "David Carmo", korean_name: "다비드 카르무", team_id: 65, position: "Defender" },
  { id: 362711, name: "Jair", korean_name: "자이르", team_id: 65, position: "Defender" },
  { id: 18739, name: "W. Boly", korean_name: "윌리 볼리", team_id: 65, position: "Defender" },
  { id: 2817, name: "N. Milenković", korean_name: "니콜라 밀렌코비치", team_id: 65, position: "Defender" },
  { id: 2771, name: "O. Aina", korean_name: "올라 아이나", team_id: 65, position: "Defender" },
  { id: 641, name: "O. Zinchenko", korean_name: "올렉산드르 진첸코", team_id: 65, position: "Defender" },
  { id: 329357, name: "Z. Abbott", korean_name: "잭 애벗", team_id: 65, position: "Defender" },
  { id: 19610, name: "O. Richards", korean_name: "오마르 리차즈", team_id: 65, position: "Defender" },

  // Midfielders (11명)
  { id: 138780, name: "N. Williams", korean_name: "니코 윌리엄스", team_id: 65, position: "Midfielder" },
  { id: 22149, name: "I. Sangaré", korean_name: "이브라힘 상가레", team_id: 65, position: "Midfielder" },
  { id: 179862, name: "M. Stamenić", korean_name: "마르코 스타메니치", team_id: 65, position: "Midfielder" },
  { id: 138908, name: "E. Anderson", korean_name: "엘리엇 앤더슨", team_id: 65, position: "Midfielder" },
  { id: 47522, name: "Douglas Luiz", korean_name: "더글라스 루이스", team_id: 65, position: "Midfielder" },
  { id: 6056, name: "N. Domínguez", korean_name: "니콜라스 도밍게스", team_id: 65, position: "Midfielder" },
  { id: 19305, name: "R. Yates", korean_name: "라이언 예이츠", team_id: 65, position: "Midfielder" },
  { id: 158697, name: "J. McAtee", korean_name: "제임스 맥아티", team_id: 65, position: "Midfielder" },
  { id: 181806, name: "N. Savona", korean_name: "니콜로 사보나", team_id: 65, position: "Midfielder" },

  // Attackers (11명)
  { id: 380492, name: "Eric Emanuel da Silva Moreira", korean_name: "에릭 다 실바", team_id: 65, position: "Attacker" },
  { id: 2298, name: "C. Hudson-Odoi", korean_name: "칼럼 허드슨-오도이", team_id: 65, position: "Attacker" },
  { id: 8598, name: "T. Awoniyi", korean_name: "타이요 아워니이", team_id: 65, position: "Attacker" },
  { id: 18746, name: "M. Gibbs-White", korean_name: "모건 깁스-화이트", team_id: 65, position: "Attacker" },
  { id: 18931, name: "C. Wood", korean_name: "크리스 우드", team_id: 65, position: "Attacker" },
  { id: 48648, name: "D. Ndoye", korean_name: "단 은도예", team_id: 65, position: "Attacker" },
  { id: 147831, name: "A. Kalimuendo", korean_name: "아르노 칼리무엔도", team_id: 65, position: "Attacker" },
  { id: 9366, name: "Igor Jesus", korean_name: "이고르 제주스", team_id: 65, position: "Attacker" },
  { id: 284428, name: "O. Hutchinson", korean_name: "오마리 허친슨", team_id: 65, position: "Attacker" },
  { id: 141901, name: "Jota Silva", korean_name: "조타 실바", team_id: 65, position: "Attacker" },
  { id: 129695, name: "D. Bakwa", korean_name: "딜란 바크와", team_id: 65, position: "Attacker" },
  { id: 80, name: "E. Dennis", korean_name: "에마뉴엘 데니스", team_id: 65, position: "Attacker" },
];

// ============================================
// Aston Villa (Team ID: 66) - 37명
// ============================================
export const ASTON_VILLA_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (5명)
  { id: 19599, name: "E. Martínez", korean_name: "에밀리아노 마르티네스", team_id: 66, position: "Goalkeeper" },
  { id: 36878, name: "M. Bizot", korean_name: "마르크 비조", team_id: 66, position: "Goalkeeper" },
  { id: 398004, name: "S. Proctor", korean_name: "샘 프록터", team_id: 66, position: "Goalkeeper" },
  { id: 284390, name: "J. Wright", korean_name: "조 라이트", team_id: 66, position: "Goalkeeper" },
  { id: 452427, name: "Russ Oakley", korean_name: "러스 오클리", team_id: 66, position: "Goalkeeper" },

  // Defenders (11명)
  { id: 360269, name: "Triston Rowe", korean_name: "트리스톤 로우", team_id: 66, position: "Defender" },
  { id: 19298, name: "M. Cash", korean_name: "매티 캐시", team_id: 66, position: "Defender" },
  { id: 308843, name: "T. Patterson", korean_name: "트레이 패터슨", team_id: 66, position: "Defender" },
  { id: 889, name: "V. Lindelöf", korean_name: "빅토르 린델뢰프", team_id: 66, position: "Defender" },
  { id: 19354, name: "E. Konsa", korean_name: "에즈리 콘사", team_id: 66, position: "Defender" },
  { id: 19179, name: "T. Mings", korean_name: "타이론 밍스", team_id: 66, position: "Defender" },
  { id: 2724, name: "L. Digne", korean_name: "뤼카 디뉴", team_id: 66, position: "Defender" },
  { id: 46815, name: "Pau Torres", korean_name: "파우 토레스", team_id: 66, position: "Defender" },
  { id: 388013, name: "Andrés García", korean_name: "안드레스 가르시아", team_id: 66, position: "Defender" },
  { id: 138816, name: "I. Maatsen", korean_name: "이안 마첸", team_id: 66, position: "Defender" },
  { id: 47547, name: "Álex Moreno", korean_name: "알렉스 모레노", team_id: 66, position: "Defender" },

  // Midfielders (13명)
  { id: 2287, name: "R. Barkley", korean_name: "로스 바클리", team_id: 66, position: "Midfielder" },
  { id: 19191, name: "J.  McGinn", korean_name: "존 맥긴", team_id: 66, position: "Midfielder" },
  { id: 2926, name: "Y. Tielemans", korean_name: "유리 틸레망스", team_id: 66, position: "Midfielder" },
  { id: 19035, name: "H. Elliott", korean_name: "하비 엘리엇", team_id: 66, position: "Midfielder" },
  { id: 19071, name: "E. Buendía", korean_name: "에밀리아노 부엔디아", team_id: 66, position: "Midfielder" },
  { id: 249, name: "D. Malen", korean_name: "도니엘 말렌", team_id: 66, position: "Midfielder" },
  { id: 360268, name: "J. Jimoh", korean_name: "제임스 지모", team_id: 66, position: "Midfielder" },
  { id: 2922, name: "L. Dendoncker", korean_name: "레안더르 덴동케르", team_id: 66, position: "Midfielder" },
  { id: 162714, name: "A. Onana", korean_name: "아마두 오나나", team_id: 66, position: "Midfielder" },
  { id: 284457, name: "L. Bogarde", korean_name: "라마르 보가르드", team_id: 66, position: "Midfielder" },
  { id: 19170, name: "M. Rogers", korean_name: "모건 로저스", team_id: 66, position: "Midfielder" },
  { id: 19192, name: "J. Ramsey", korean_name: "제이콥 램지", team_id: 66, position: "Midfielder" },
  { id: 1904, name: "B. Kamara", korean_name: "부바카르 카마라", team_id: 66, position: "Midfielder" },
  { id: 434180, name: "Aidan Borland", korean_name: "에이단 보를랜드", team_id: 66, position: "Midfielder" },
  { id: 453101, name: "B. Burrows", korean_name: "벤 버로우스", team_id: 66, position: "Midfielder" },

  // Attackers (8명)
  { id: 19366, name: "O. Watkins", korean_name: "올리 왓킨스", team_id: 66, position: "Attacker" },
  { id: 153425, name: "L. Dobbin", korean_name: "루이스 도빈", team_id: 66, position: "Attacker" },
  { id: 18, name: "J. Sancho", korean_name: "제이든 산초", team_id: 66, position: "Attacker" },
  { id: 162173, name: "S. Iling-Junior", korean_name: "새뮤얼 일링-주니어", team_id: 66, position: "Attacker" },
  { id: 137303, name: "E. Guessand", korean_name: "에브랑 게상", team_id: 66, position: "Attacker" },
  { id: 983, name: "L. Bailey", korean_name: "레온 베일리", team_id: 66, position: "Attacker" },
];

// ============================================
// Sunderland (Team ID: 746) - 51명
// ============================================
export const SUNDERLAND_PLAYERS: PlayerMapping[] = [
  // Goalkeepers (4명)
  { id: 19881, name: "A. Patterson", korean_name: "앤서니 패터슨", team_id: 746, position: "Goalkeeper" },
  { id: 265712, name: "Blondy Rudolph Nna Noukeu", korean_name: "블론디 누쿠", team_id: 746, position: "Goalkeeper" },
  { id: 19089, name: "S. Moore", korean_name: "사이먼 무어", team_id: 746, position: "Goalkeeper" },
  { id: 194536, name: "R. Roefs", korean_name: "로이 로프스", team_id: 746, position: "Goalkeeper" },

  // Defenders (14명)
  { id: 162067, name: "T. Pembélé", korean_name: "티모테 팸벨레", team_id: 746, position: "Defender" },
  { id: 162076, name: "D. Cirkin", korean_name: "데니스 서킨", team_id: 746, position: "Defender" },
  { id: 55904, name: "D. Ballard", korean_name: "댄 발라드", team_id: 746, position: "Defender" },
  { id: 138853, name: "J. Anderson", korean_name: "조 앤더슨", team_id: 746, position: "Defender" },
  { id: 284225, name: "Z. Johnson", korean_name: "자덴 존슨", team_id: 746, position: "Defender" },
  { id: 37143, name: "L. Geertruida", korean_name: "루츠 헤르트라위다", team_id: 746, position: "Defender" },
  { id: 6168, name: "O. Alderete", korean_name: "오마르 알데레테", team_id: 746, position: "Defender" },
  { id: 22225, name: "Reinildo", korean_name: "헤이닐두", team_id: 746, position: "Defender" },
  { id: 1146, name: "N. Mukiele", korean_name: "노르디 무키엘레", team_id: 746, position: "Defender" },
  { id: 169282, name: "N. Huggins", korean_name: "니코 허긴스", team_id: 746, position: "Defender" },
  { id: 290545, name: "J. Seelt", korean_name: "얀 셀트", team_id: 746, position: "Defender" },
  { id: 216812, name: "N. Triantis", korean_name: "네오 트리안티스", team_id: 746, position: "Defender" },
  { id: 18816, name: "A. Masuaku", korean_name: "아르튀르 마수아쿠", team_id: 746, position: "Defender" },
  { id: 119121, name: "T. Hume", korean_name: "트레이 흄", team_id: 746, position: "Defender" },
  { id: 297187, name: "L. Hjelde", korean_name: "레오 옐데", team_id: 746, position: "Defender" },
  { id: 141133, name: "A. Alese", korean_name: "아지 알레세", team_id: 746, position: "Defender" },
  { id: 381014, name: "Jenson Jones", korean_name: "젠슨 존스", team_id: 746, position: "Defender" },

  // Midfielders (16명)
  { id: 19910, name: "D. Neil", korean_name: "댄 닐", team_id: 746, position: "Midfielder" },
  { id: 339201, name: "C. Rigg", korean_name: "크리스 리그", team_id: 746, position: "Midfielder" },
  { id: 19911, name: "L. O'Nien", korean_name: "루크 오니언", team_id: 746, position: "Midfielder" },
  { id: 19446, name: "A. Browne", korean_name: "앨런 브라운", team_id: 746, position: "Midfielder" },
  { id: 47521, name: "P. Roberts", korean_name: "패트릭 로버츠", team_id: 746, position: "Midfielder" },
  { id: 327631, name: "H. Diarra", korean_name: "하미두 디아라", team_id: 746, position: "Midfielder" },
  { id: 301771, name: "S. Adingra", korean_name: "시몽 아딩그라", team_id: 746, position: "Midfielder" },
  { id: 671, name: "B. Traoré", korean_name: "베르트랑 트라오레", team_id: 746, position: "Midfielder" },
  { id: 365331, name: "N. Sadiki", korean_name: "네일 사디키", team_id: 746, position: "Midfielder" },
  { id: 152696, name: "J. Matete", korean_name: "제이 마테테", team_id: 746, position: "Midfielder" },
  { id: 20638, name: "E. Le Fée", korean_name: "엔조 르 페", team_id: 746, position: "Midfielder" },
  { id: 282531, name: "A. Ba", korean_name: "압둘라예 바", team_id: 746, position: "Midfielder" },
  { id: 1464, name: "G. Xhaka", korean_name: "그라니트 자카", team_id: 746, position: "Midfielder" },
  { id: 330640, name: "Harrison Jones", korean_name: "해리슨 존스", team_id: 746, position: "Midfielder" },
  { id: 362768, name: "Jayden Jones", korean_name: "제이든 존스", team_id: 746, position: "Midfielder" },
  { id: 362766, name: "J. Whittaker", korean_name: "잭 위태커", team_id: 746, position: "Midfielder" },
  { id: 328086, name: "B. Middlemas", korean_name: "벤 미들마스", team_id: 746, position: "Midfielder" },

  // Attackers (17명)
  { id: 638, name: "I. Poveda", korean_name: "이안 포베다", team_id: 746, position: "Attacker" },
  { id: 336659, name: "C. Talbi", korean_name: "체디 탈비", team_id: 746, position: "Attacker" },
  { id: 428076, name: "M. AleksiÄ", korean_name: "밀란 알렉시치", team_id: 746, position: "Attacker" },
  { id: 38750, name: "B. Brobbey", korean_name: "브라이언 브로베이", team_id: 746, position: "Attacker" },
  { id: 392270, name: "Marc Guiu", korean_name: "마르크 기우", team_id: 746, position: "Attacker" },
  { id: 335054, name: "Luís Semedo", korean_name: "루이스 세메두", team_id: 746, position: "Attacker" },
  { id: 349799, name: "Eliezer Mayenda", korean_name: "엘리에제르 마옌다", team_id: 746, position: "Attacker" },
  { id: 84087, name: "W. Isidor", korean_name: "윌슨 이시도르", team_id: 746, position: "Attacker" },
  { id: 388461, name: "A. Abdullahi", korean_name: "아흐메드 압둘라히", team_id: 746, position: "Attacker" },
  { id: 2186, name: "N. Rusyn", korean_name: "나자리 루신", team_id: 746, position: "Attacker" },
  { id: 400739, name: "T. Ogunsuyi", korean_name: "토미 오군수이", team_id: 746, position: "Attacker" },
  { id: 284414, name: "R. Mundle", korean_name: "로미 먼들", team_id: 746, position: "Attacker" },
  { id: 400033, name: "Timur Tuterov", korean_name: "티무르 투테로프", team_id: 746, position: "Attacker" },
];

// ============================================
// 전체 선수 배열 (693명 완성!)
// ============================================
export const ALL_PREMIER_LEAGUE_PLAYERS: PlayerMapping[] = [
  ...MANCHESTER_UNITED_PLAYERS,
  ...NEWCASTLE_PLAYERS,
  ...BOURNEMOUTH_PLAYERS,
  ...FULHAM_PLAYERS,
  ...WOLVES_PLAYERS,
  ...LIVERPOOL_PLAYERS,
  ...ARSENAL_PLAYERS,
  ...BURNLEY_PLAYERS,
  ...EVERTON_PLAYERS,
  ...TOTTENHAM_PLAYERS,
  ...WEST_HAM_PLAYERS,
  ...CHELSEA_PLAYERS,
  ...MANCHESTER_CITY_PLAYERS,
  ...BRIGHTON_PLAYERS,
  ...CRYSTAL_PALACE_PLAYERS,
  ...BRENTFORD_PLAYERS,
  ...LEEDS_PLAYERS,
  ...NOTTINGHAM_FOREST_PLAYERS,
  ...ASTON_VILLA_PLAYERS,
  ...SUNDERLAND_PLAYERS,
];
