// This script will output SQL queries to fetch data team by team
const TEAM_IDS = [2929, 2977, 2934, 2931, 2944, 2945, 2932, 2938, 2928, 10509, 2992, 2939, 2933, 10511, 2940, 2936, 2956, 10513];

const TEAM_INFO = {
  2929: { english: 'Al-Ahli Jeddah', korean: '알 아흘리', const_name: 'AL_AHLI_JEDDAH' },
  2977: { english: 'Al-Ittihad Jeddah', korean: '알 이티하드', const_name: 'AL_ITTIHAD_JEDDAH' },
  2934: { english: 'Al-Nassr', korean: '알 나스르', const_name: 'AL_NASSR' },
  2931: { english: 'Al-Hilal', korean: '알 힐랄', const_name: 'AL_HILAL' },
  2944: { english: 'Al-Fateh', korean: '알 파테', const_name: 'AL_FATEH' },
  2945: { english: 'Al-Fayha', korean: '알 파이하', const_name: 'AL_FAYHA' },
  2932: { english: 'Al-Shabab', korean: '알 샤바브', const_name: 'AL_SHABAB' },
  2938: { english: 'Al-Taawoun', korean: '알 타아운', const_name: 'AL_TAAWOUN' },
  2928: { english: 'Al-Ettifaq', korean: '알 에티파크', const_name: 'AL_ETTIFAQ' },
  10509: { english: 'Al-Qadsiah', korean: '알 카디시아', const_name: 'AL_QADSIAH' },
  2992: { english: 'Al-Khaleej', korean: '알 칼리즈', const_name: 'AL_KHALEEJ' },
  2939: { english: 'Al-Raed', korean: '알 라이드', const_name: 'AL_RAED' },
  2933: { english: 'Al-Riyadh', korean: '알 리야드', const_name: 'AL_RIYADH' },
  10511: { english: 'Al-Okhdood', korean: '알 악두드', const_name: 'AL_OKHDOOD' },
  2940: { english: 'Al-Tai', korean: '알 타이', const_name: 'AL_TAI' },
  2936: { english: 'Al-Wehda', korean: '알 웨흐다', const_name: 'AL_WEHDA' },
  2956: { english: 'Damac', korean: '다막', const_name: 'DAMAC' },
  10513: { english: 'Al-Akhdoud', korean: '알 악두드', const_name: 'AL_AKHDOUD' }
};

// Known player translations
const KNOWN_PLAYERS = {
  'Riyad Mahrez': '리야드 마레즈',
  'Roberto Firmino': '호베르투 피르미누',
  'Édouard Mendy': '에두아르 멘디',
  'Edouard Mendy': '에두아르 멘디',
  'Ivan Toney': '이반 토니',
  'Rúben Neves': '후벤 네베스',
  'Ruben Neves': '후벤 네베스',
  'Aleksandar Mitrović': '알렉산다르 미트로비치',
  'Aleksandar Mitrovic': '알렉산다르 미트로비치',
  'Sergej Milinković-Savić': '세르게이 밀린코비치사비치',
  'Sergej Milinkovic-Savic': '세르게이 밀린코비치사비치',
  'Cristiano Ronaldo': '크리스티아누 호날두',
  'Sadio Mané': '사디오 마네',
  'Sadio Mane': '사디오 마네',
  'Marcelo Brozović': '마르셀로 브로조비치',
  'Marcelo Brozovic': '마르셀로 브로조비치',
  "N'Golo Kanté": '은골로 캉테',
  "N'Golo Kante": '은골로 캉테',
  'Kalidou Koulibaly': '칼리두 쿨리발리',
  'Neymar Jr': '네이마르',
  'Neymar': '네이마르',
  'Malcom': '말콤',
  'Malcolm': '말콤',
  'João Cancelo': '주앙 칸셀루',
  'Joao Cancelo': '주앙 칸셀루',
  'Moussa Dembélé': '무사 뎀벨레',
  'Moussa Dembele': '무사 뎀벨레',
  'Gabri Veiga': '가브리 베이가',
  'Merih Demiral': '메리흐 데미랄',
  'Yassine Bounou': '야신 부누',
  'Gelson Dala': '젤손 달라',
  'Karim Benzema': '카림 벤제마',
  'Fabinho': '파비뉴',
  'Jordan Henderson': '조던 헨더슨',
  'Otávio': '오타비우',
  'Otavio': '오타비우',
  'Talisca': '탈리스카',
  'Anderson Talisca': '안데르손 탈리스카',
  'Aymeric Laporte': '에메릭 라포르트',
  'Franck Kessié': '프랑크 케시에',
  'Franck Kessie': '프랑크 케시에',
  'Allan Saint-Maximin': '알랑 생막시맹',
  'Aleksandar Kolarov': '알렉산다르 콜라로프',
  'Salem Al-Dawsari': '살렘 알 다우사리',
  'Mohammed Al-Owais': '모하메드 알 오와이스',
  'Ali Al-Bulayhi': '알리 알 불라이히',
  'Saud Abdulhamid': '사우드 압둘하미드',
  'Yasir Al-Shahrani': '야시르 알 샤흐라니',
  'Salman Al-Faraj': '살만 알 파라즈',
  'Abdullah Otayf': '압둘라 오타이프',
  'Firas Al-Buraikan': '피라스 알 부라이칸',
  'Saleh Al-Shehri': '살레흐 알 셰흐리',
  'Abdulrahman Ghareeb': '압둘라흐만 가리브',
  'Fahad Al-Muwallad': '파하드 알 무왈라드',
  'Hassan Tambakti': '하산 탐박티',
  'Nasser Al-Dawsari': '나세르 알 다우사리',
  'Matheus Pereira': '마테우스 페레이라',
  'Roger Guedes': '호제르 게지스',
  'Luiz Felipe': '루이스 펠리페',
  'Gabriel Veiga': '가브리엘 베이가',
  'Odion Ighalo': '오디온 이갈로',
  'Georginio Wijnaldum': '헤오르지니오 베이날둠',
  'Ever Banega': '에베르 바네가',
  'Jota': '조타',
  'Romarinho': '호마리뉴',
};

function translateToKorean(name) {
  // Check known players first
  if (KNOWN_PLAYERS[name]) {
    return KNOWN_PLAYERS[name];
  }

  // Arabic name component map
  const arabicMap = {
    'Al-Dawsari': '알 다우사리',
    'Al-Shahrani': '알 샤흐라니',
    'Al-Bulayhi': '알 불라이히',
    'Al-Buraikan': '알 부라이칸',
    'Al-Shehri': '알 셰흐리',
    'Al-Owais': '알 오와이스',
    'Al-Faraj': '알 파라즈',
    'Al-Muwallad': '알 무왈라드',
    'Abdulhamid': '압둘하미드',
    'Abdulrahman': '압둘라흐만',
    'Abdullah': '압둘라',
    'Abdulaziz': '압둘아지즈',
    'Abdulfattah': '압둘파타흐',
    'Abdulelah': '압둘엘라',
    'Mohammed': '모하메드',
    'Muhammad': '무함마드',
    'Ahmad': '아흐마드',
    'Ahmed': '아흐메드',
    'Hassan': '하산',
    'Hussein': '후세인',
    'Khalid': '칼리드',
    'Salman': '살만',
    'Salem': '살렘',
    'Fahad': '파하드',
    'Faisal': '파이살',
    'Omar': '오마르',
    'Ali': '알리',
    'Nasser': '나세르',
    'Saud': '사우드',
    'Yasir': '야시르',
    'Yasser': '야세르',
    'Firas': '피라스',
    'Nawaf': '나와프',
    'Walid': '왈리드',
    'Saad': '사드',
    'Ziyad': '지야드',
    'Majed': '마제드',
    'Turki': '투르키',
  };

  // Try to match full name or parts
  for (const [eng, kor] of Object.entries(arabicMap)) {
    if (name.includes(eng)) {
      return name.replace(new RegExp(eng, 'g'), kor);
    }
  }

  // If starts with Al- or Al , translate it
  if (name.startsWith('Al-') || name.startsWith('Al ')) {
    const parts = name.split(/[-\s]/);
    return '알 ' + parts.slice(1).join(' ');
  }

  // Return original for now (needs manual review)
  return name;
}

console.log('Teams to fetch:');
TEAM_IDS.forEach(id => {
  const info = TEAM_INFO[id];
  console.log(`${id}: ${info.english} (${info.korean}) -> ${info.const_name}_PLAYERS`);
});

console.log('\nTranslation test:');
console.log('Cristiano Ronaldo =>', translateToKorean('Cristiano Ronaldo'));
console.log('Salem Al-Dawsari =>', translateToKorean('Salem Al-Dawsari'));
console.log('Mohammed Al-Owais =>', translateToKorean('Mohammed Al-Owais'));

module.exports = { TEAM_IDS, TEAM_INFO, translateToKorean, KNOWN_PLAYERS };
