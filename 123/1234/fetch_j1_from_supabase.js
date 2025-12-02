// Supabase에서 J1리그 선수 데이터를 가져와서 TypeScript 파일 생성
const fs = require('fs');

// generate_j1_players.py의 translate_to_korean 함수를 JavaScript로 변환
function translateToKorean(name) {
  const koreanNames = {
    'Kim Jin-Hyeon': '김진현',
    'Kim Tae-Hyeon': '김태현', 
    'Kim Seung-Gyu': '김승규',
    'Kim Ju-Sung': '김주성',
    'Kim Min-Tae': '김민태',
    'Jeong Min-Ki': '정민기',
    // 일본 선수 이름 매핑은 성씨로 처리
  };

  if (koreanNames[name]) {
    return koreanNames[name];
  }

  // 성씨 매핑
  const japaneseSurnames = {
    'Jesiel': '제시엘', 'Erison': '에리손', 'Marcinho': '마르시뉴',
    'Yamaguchi': '야마구치', 'Wermeskerken': '베르메스케르켄',
    'Sasaki': '사사키', 'Tanabe': '타나베', 'Kawahara': '카와하라',
    'Yamamoto': '야마모토', 'Ito': '이토', 'Wakizaka': '와키자카'
  };

  // 성씨 추출 (마지막 단어)
  const parts = name.split(' ');
  const lastName = parts[parts.length - 1];
  
  if (japaneseSurnames[lastName]) {
    // 이니셜 + 성씨 형태로 반환
    const initials = parts.slice(0, -1).map(p => p.charAt(0)).join('.');
    return initials ? `${initials}. ${japaneseSurnames[lastName]}` : japaneseSurnames[lastName];
  }

  return null; // 매핑 없음
}

console.log('Korean name test:', translateToKorean('Erison'));
console.log('Korean name test 2:', translateToKorean('L. Yamaguchi'));
