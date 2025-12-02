const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

// Comprehensive Korean name dictionary
const KNOWN_PLAYERS = {
  // Top international stars
  'Cristiano Ronaldo': '크리스티아누 호날두',
  'Neymar Jr': '네이마르',
  'Neymar': '네이마르',
  'Karim Benzema': '카림 벤제마',
  'Sadio Mané': '사디오 마네',
  'Sadio Mane': '사디오 마네',
  "N'Golo Kanté": '은골로 캉테',
  "N'Golo Kante": '은골로 캉테',
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
  'Marcelo Brozović': '마르셀로 브로조비치',
  'Marcelo Brozovic': '마르셀로 브로조비치',
  'Kalidou Koulibaly': '칼리두 쿨리발리',
  'Malcom': '말콤',
  'Malcolm': '말콤',
  'João Cancelo': '주앙 칸셀루',
  'Joao Cancelo': '주앙 칸셀루',
  'Moussa Dembélé': '무사 뎀벨레',
  'Moussa Dembele': '무사 뎀벨레',
  'Gabri Veiga': '가브리 베이가',
  'Gabriel Veiga': '가브리엘 베이가',
  'Merih Demiral': '메리흐 데미랄',
  'Yassine Bounou': '야신 부누',
  'Gelson Dala': '젤손 달라',
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
  'Matheus Pereira': '마테우스 페레이라',
  'Roger Guedes': '호제르 게지스',
  'Luiz Felipe': '루이스 펠리페',
  'Odion Ighalo': '오디온 이갈로',
  'Georginio Wijnaldum': '헤오르지니오 베이날둠',
  'Ever Banega': '에베르 바네가',
  'Jota': '조타',
  'Romarinho': '호마리뉴',

  // Saudi national team and local stars
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
};

function translateToKorean(name) {
  // Check known players first
  if (KNOWN_PLAYERS[name]) {
    return KNOWN_PLAYERS[name];
  }

  // Handle Al- prefix (common in Saudi/Arabic names)
  if (name.startsWith('Al-') || name.startsWith('Al ')) {
    const parts = name.replace('Al-', 'Al ').split(/\s+/);
    if (parts.length >= 2) {
      const restOfName = parts.slice(1).join(' ');
      // Try to translate the rest
      const translated = translateArabicComponent(restOfName);
      return '알 ' + translated;
    }
  }

  // Try to translate as Arabic name
  return translateArabicComponent(name);
}

function translateArabicComponent(name) {
  const arabicMap = {
    // Abdul- names
    'Abdulrahman': '압둘라흐만',
    'Abdullah': '압둘라',
    'Abdulaziz': '압둘아지즈',
    'Abdulfattah': '압둘파타흐',
    'Abdulelah': '압둘엘라',
    'Abdulhamid': '압둘하미드',
    'Abdulmajeed': '압둘마지드',

    // Common first names
    'Mohammed': '모하메드',
    'Muhammad': '무함마드',
    'Ahmad': '아흐마드',
    'Ahmed': '아흐메드',
    'Hassan': '하산',
    'Hussein': '후세인',
    'Hussain': '후사인',
    'Khalid': '칼리드',
    'Khaled': '칼레드',
    'Salman': '살만',
    'Salem': '살렘',
    'Fahad': '파하드',
    'Faisal': '파이살',
    'Omar': '오마르',
    'Umar': '우마르',
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
    'Hamad': '하마드',
    'Osama': '오사마',
    'Othman': '오스만',
    'Rayan': '라얀',
    'Saeed': '사이드',
    'Sultan': '술탄',

    // Common last name components
    'Dawsari': '다우사리',
    'Shahrani': '샤흐라니',
    'Bulayhi': '불라이히',
    'Buraikan': '부라이칸',
    'Shehri': '셰흐리',
    'Ghareeb': '가리브',
    'Muwallad': '무왈라드',
    'Tambakti': '탐박티',
    'Owais': '오와이스',
    'Faraj': '파라즈',
    'Otayf': '오타이프',
  };

  // Try to find and replace components
  let translated = name;
  for (const [eng, kor] of Object.entries(arabicMap)) {
    if (translated.includes(eng)) {
      translated = translated.replace(new RegExp(eng, 'g'), kor);
    }
  }

  return translated;
}

async function fetchTeamPlayers(teamId) {
  const { data, error } = await supabase
    .from('football_players')
    .select('player_id, name, team_id, position, number, age')
    .eq('team_id', teamId)
    .order('position', { ascending: true })
    .order('number', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (error) {
    console.error(`❌ Error fetching team ${teamId}:`, error);
    return [];
  }

  return data || [];
}

async function generateFile() {
  console.log('🚀 Fetching Saudi Pro League player data...\n');

  const allTeams = [];
  let totalPlayers = 0;

  for (const teamId of TEAM_IDS) {
    const teamInfo = TEAM_INFO[teamId];
    console.log(`📥 Fetching ${teamInfo.english} (${teamInfo.korean})...`);

    const players = await fetchTeamPlayers(teamId);

    if (players.length > 0) {
      allTeams.push({
        teamId,
        teamInfo,
        players: players.map(p => ({
          id: p.player_id,
          name: p.name,
          korean_name: translateToKorean(p.name),
          team_id: p.team_id,
          position: p.position || 'Unknown',
          number: p.number,
          age: p.age
        }))
      });
      totalPlayers += players.length;
      console.log(`   ✓ ${players.length} players`);
    } else {
      console.log(`   ⚠ No players found`);
    }
  }

  console.log(`\n📝 Generating TypeScript file...`);

  // Generate TypeScript file content
  let content = `import { PlayerMapping } from './index';\n\n`;
  content += `// Saudi Pro League (사우디 프로리그) Player Mappings\n`;
  content += `// Auto-generated - ${new Date().toISOString()}\n`;
  content += `// Total: ${totalPlayers} players across ${allTeams.length} teams\n\n`;

  const allConstNames = [];

  for (const team of allTeams) {
    const constName = `${team.teamInfo.const_name}_PLAYERS`;
    allConstNames.push(constName);

    content += `// ${team.teamInfo.english} (${team.teamInfo.korean}) - Team ID: ${team.teamId} - ${team.players.length}명\n`;
    content += `export const ${constName}: PlayerMapping[] = [\n`;

    for (const player of team.players) {
      const numberStr = player.number !== null ? player.number : 'null';
      const ageStr = player.age !== null ? player.age : 'null';
      content += `  { id: ${player.id}, name: "${player.name}", korean_name: "${player.korean_name}", team_id: ${player.team_id}, position: "${player.position}", number: ${numberStr}, age: ${ageStr} },\n`;
    }

    content += `];\n\n`;
  }

  // Add combined export
  content += `// 사우디 프로리그 전체 선수 통합\n`;
  content += `export const SAUDI_PRO_LEAGUE_PLAYERS: PlayerMapping[] = [\n`;
  for (const constName of allConstNames) {
    content += `  ...${constName},\n`;
  }
  content += `];\n`;

  // Write file
  const outputPath = path.join(__dirname, '..', 'src', 'domains', 'livescore', 'constants', 'players', 'saudi-pro-league.ts');
  fs.writeFileSync(outputPath, content, 'utf8');

  console.log(`✅ Success!`);
  console.log(`   File: ${outputPath}`);
  console.log(`   Teams: ${allTeams.length}`);
  console.log(`   Players: ${totalPlayers}`);
}

generateFile().catch(console.error);
