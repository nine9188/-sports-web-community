const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM_IDS = [2929, 2977, 2934, 2931, 2944, 2945, 2932, 2938, 2928, 10509, 2992, 2939, 2933, 10511, 2940, 2936, 2956, 10513];

const TEAM_NAMES = {
  2929: { english: 'Al-Ahli Jeddah', arabic: 'الأهلي جدة', korean: '알 아흘리' },
  2977: { english: 'Al-Ittihad Jeddah', arabic: 'الاتحاد جدة', korean: '알 이티하드' },
  2934: { english: 'Al-Nassr', arabic: 'النصر', korean: '알 나스르' },
  2931: { english: 'Al-Hilal', arabic: 'الهلال', korean: '알 힐랄' },
  2944: { english: 'Al-Fateh', arabic: 'الفتح', korean: '알 파테' },
  2945: { english: 'Al-Fayha', arabic: 'الفيحاء', korean: '알 파이하' },
  2932: { english: 'Al-Shabab', arabic: 'الشباب', korean: '알 샤바브' },
  2938: { english: 'Al-Taawoun', arabic: 'التعاون', korean: '알 타아운' },
  2928: { english: 'Al-Ettifaq', arabic: 'الاتفاق', korean: '알 에티파크' },
  10509: { english: 'Al-Qadsiah', arabic: 'القادسية', korean: '알 카디시아' },
  2992: { english: 'Al-Khaleej', arabic: 'الخليج', korean: '알 칼리즈' },
  2939: { english: 'Al-Raed', arabic: 'الرائد', korean: '알 라이드' },
  2933: { english: 'Al-Riyadh', arabic: 'الرياض', korean: '알 리야드' },
  10511: { english: 'Al-Okhdood', arabic: 'الأخدود', korean: '알 악두드' },
  2940: { english: 'Al-Tai', arabic: 'الطائي', korean: '알 타이' },
  2936: { english: 'Al-Wehda', arabic: 'الوحدة', korean: '알 웨흐다' },
  2956: { english: 'Damac', arabic: 'ضمك', korean: '다막' },
  10513: { english: 'Al-Akhdoud', arabic: 'الأخدود', korean: '알 악두드' }
};

// Korean name translation function
function translateToKorean(name, nationality) {
  // Dictionary of known player names
  const knownPlayers = {
    // Famous players
    'Riyad Mahrez': '리야드 마레즈',
    'Roberto Firmino': '호베르투 피르미누',
    'Édouard Mendy': '에두아르 멘디',
    'Ivan Toney': '이반 토니',
    'Rúben Neves': '후벤 네베스',
    'Aleksandar Mitrović': '알렉산다르 미트로비치',
    'Sergej Milinković-Savić': '세르게이 밀린코비치사비치',
    'Cristiano Ronaldo': '크리스티아누 호날두',
    'Sadio Mané': '사디오 마네',
    'Marcelo Brozović': '마르셀로 브로조비치',
    'N\'Golo Kanté': '은골로 캉테',
    'Kalidou Koulibaly': '칼리두 쿨리발리',
    'Neymar Jr': '네이마르',
    'Malcom': '말콤',
    'João Cancelo': '주앙 칸셀루',
    'Aleksandar Mitrovic': '알렉산다르 미트로비치',
    'Moussa Dembélé': '무사 뎀벨레',
    'Gabri Veiga': '가브리 베이가',
    'Ruben Neves': '후벤 네베스',
    'Merih Demiral': '메리흐 데미랄',
    'Yassine Bounou': '야신 부누',
    'Gelson Dala': '젤손 달라',
    'Karim Benzema': '카림 벤제마',
    'Fabinho': '파비뉴',
    'Jordan Henderson': '조던 헨더슨',
    'Otávio': '오타비우',
    'Mohammed Al-Owais': '모하메드 알 오와이스',
    'Salem Al-Dawsari': '살렘 알 다우사리',
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
    'Abdulelah Al-Malki': '압둘엘라 알 말키',
    'Sami Al-Najei': '사미 알 나제이',
    'Ali Lajami': '알리 라자미',
    'Abdullah Al-Khaibari': '압둘라 알 카이바리'
  };

  if (knownPlayers[name]) {
    return knownPlayers[name];
  }

  // Split name into parts
  const parts = name.split(' ');

  // Translation rules for common Arabic prefixes
  const arabicPrefixes = {
    'Al-': '알 ',
    'Al': '알',
    'Abd': '압드',
    'Abdul': '압둘',
    'Abdel': '압델',
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
    'Yazid': '야지드',
    'Yasser': '야세르',
    'Yasir': '야시르',
    'Firas': '피라스',
    'Nawaf': '나와프',
    'Walid': '왈리드',
    'Saad': '사드',
    'Ziyad': '지야드'
  };

  // Brazilian/Portuguese names
  const brazilianNames = {
    'Fabinho': '파비뉴',
    'Firmino': '피르미누',
    'Malcom': '말콤',
    'Talisca': '탈리스카',
    'João': '주앙',
    'Pedro': '페드루',
    'Gabriel': '가브리엘',
    'Otávio': '오타비우',
    'Danilo': '다닐루',
    'Bruno': '브루누',
    'Matheus': '마테우스',
    'Luiz': '루이스',
    'Roger': '호제르',
    'Wesley': '웨슬리',
    'Cristian': '크리스티안'
  };

  // European names common patterns
  const europeanPatterns = {
    'ić': 'ic', // Serbian/Croatian
    'ović': 'ovic'
  };

  let translatedParts = parts.map(part => {
    // Check if it's a known Arabic name
    for (const [arabic, korean] of Object.entries(arabicPrefixes)) {
      if (part.startsWith(arabic)) {
        return korean + part.substring(arabic.length).toLowerCase();
      }
    }

    // Check Brazilian names
    if (brazilianNames[part]) {
      return brazilianNames[part];
    }

    // Basic transliteration for common patterns
    return transliterateBasic(part);
  });

  return translatedParts.join(' ');
}

function transliterateBasic(word) {
  // Simple transliteration rules
  const map = {
    'a': '아', 'b': '브', 'c': '크', 'd': '드', 'e': '에', 'f': '프',
    'g': '그', 'h': '흐', 'i': '이', 'j': '즈', 'k': '크', 'l': '르',
    'm': '므', 'n': '느', 'o': '오', 'p': '프', 'q': '크', 'r': '르',
    's': '스', 't': '트', 'u': '우', 'v': '브', 'w': '우', 'x': '크스',
    'y': '이', 'z': '즈'
  };

  // This is a very basic transliteration - keeping original for now
  // Will need manual review for accurate Korean names
  return word;
}

async function fetchTeamPlayers(teamId) {
  const { data, error } = await supabase
    .from('football_players')
    .select(`
      player_id,
      name,
      team_id,
      position,
      number,
      age,
      nationality
    `)
    .eq('team_id', teamId)
    .order('position', { ascending: true })
    .order('number', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (error) {
    console.error(`Error fetching team ${teamId}:`, error);
    return [];
  }

  return data || [];
}

async function generateFile() {
  console.log('Fetching Saudi Pro League player data...');

  const allTeams = [];

  for (const teamId of TEAM_IDS) {
    console.log(`Fetching team ${teamId} (${TEAM_NAMES[teamId]?.korean || 'Unknown'})...`);
    const players = await fetchTeamPlayers(teamId);

    if (players.length > 0) {
      allTeams.push({
        teamId,
        teamInfo: TEAM_NAMES[teamId],
        players: players.map(p => ({
          ...p,
          korean_name: translateToKorean(p.name, p.nationality)
        }))
      });
    }
  }

  // Generate TypeScript file
  let fileContent = `import { PlayerMapping } from './index';\n\n`;

  let allPlayersArrays = [];

  for (const team of allTeams) {
    const constName = team.teamInfo.english.toUpperCase().replace(/[^A-Z0-9]+/g, '_') + '_PLAYERS';
    allPlayersArrays.push(constName);

    fileContent += `// ${team.teamInfo.english} (Team ID: ${team.teamId}) - ${team.players.length}명\n`;
    fileContent += `export const ${constName}: PlayerMapping[] = [\n`;

    for (const player of team.players) {
      fileContent += `  { id: ${player.player_id}, name: "${player.name}", korean_name: "${player.korean_name}", team_id: ${player.team_id}, position: "${player.position || 'Unknown'}", number: ${player.number || 'null'}, age: ${player.age || 'null'} },\n`;
    }

    fileContent += `];\n\n`;
  }

  // Add combined export
  fileContent += `// 사우디 프로리그 전체 선수 통합\n`;
  fileContent += `export const SAUDI_PRO_LEAGUE_PLAYERS: PlayerMapping[] = [\n`;
  for (const arrayName of allPlayersArrays) {
    fileContent += `  ...${arrayName},\n`;
  }
  fileContent += `];\n`;

  // Save to file
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '123', '1234', 'src', 'domains', 'livescore', 'constants', 'players', 'saudi-pro-league.ts');

  fs.writeFileSync(filePath, fileContent, 'utf8');
  console.log(`✅ File generated: ${filePath}`);
  console.log(`Total teams: ${allTeams.length}`);
  console.log(`Total players: ${allTeams.reduce((sum, t) => sum + t.players.length, 0)}`);
}

generateFile().catch(console.error);
