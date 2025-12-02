const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// 사우디 팀 정보
const SAUDI_TEAMS = [
  { id: 2929, name: 'Al-Ahli Jeddah', const_name: 'AL_AHLI_JEDDAH' },
  { id: 2977, name: 'Al Akhdoud', const_name: 'AL_AKHDOUD' },
  { id: 2934, name: 'Al-Ettifaq', const_name: 'AL_ETTIFAQ' },
  { id: 2931, name: 'Al-Fateh', const_name: 'AL_FATEH' },
  { id: 2944, name: 'Al-Fayha', const_name: 'AL_FAYHA' },
  { id: 2945, name: 'Al-Hazm', const_name: 'AL_HAZM' },
  { id: 2932, name: 'Al-Hilal Saudi FC', const_name: 'AL_HILAL' },
  { id: 2938, name: 'Al-Ittihad FC', const_name: 'AL_ITTIHAD' },
  { id: 2928, name: 'Al Khaleej Saihat', const_name: 'AL_KHALEEJ' },
  { id: 10509, name: 'Al Kholood', const_name: 'AL_KHOLOOD' },
  { id: 2992, name: 'Al Najma', const_name: 'AL_NAJMA' },
  { id: 2939, name: 'Al-Nassr', const_name: 'AL_NASSR' },
  { id: 2933, name: 'Al-Qadisiyah FC', const_name: 'AL_QADISIYAH' },
  { id: 10511, name: 'Al Riyadh', const_name: 'AL_RIYADH' },
  { id: 2940, name: 'Al Shabab', const_name: 'AL_SHABAB' },
  { id: 2936, name: 'Al Taawon', const_name: 'AL_TAAWON' },
  { id: 2956, name: 'Damac', const_name: 'DAMAC' },
  { id: 10513, name: 'NEOM', const_name: 'NEOM' }
];

async function generateSaudiPlayersFile() {
  console.log('🏁 사우디 프로리그 선수 데이터 가져오기 시작...\n');

  let fileContent = `import { PlayerMapping } from './index';\n\n`;

  for (const team of SAUDI_TEAMS) {
    const { data: players, error } = await supabase
      .from('football_players')
      .select('player_id, name, korean_name, team_id, position, number, age')
      .eq('team_id', team.id)
      .order('position', { ascending: true })
      .order('number', { ascending: true });

    if (error) {
      console.error(`❌ ${team.name} 데이터 가져오기 실패:`, error);
      continue;
    }

    console.log(`✅ ${team.name}: ${players.length}명`);

    // 팀 주석 및 배열 시작
    fileContent += `// ${team.name} (Team ID: ${team.id}) - ${players.length}명\n`;
    fileContent += `export const ${team.const_name}_PLAYERS: PlayerMapping[] = [\n`;

    // 각 선수 추가
    for (const player of players) {
      const koreanName = player.korean_name || 'null';
      const koreanNameStr = koreanName === 'null' ? 'null' : `"${koreanName}"`;

      fileContent += `  { id: ${player.player_id}, name: "${player.name}", korean_name: ${koreanNameStr}, team_id: ${player.team_id}, position: "${player.position || ''}", number: ${player.number || 'null'}, age: ${player.age || 'null'} },\n`;
    }

    fileContent += `];\n\n`;
  }

  // 파일 저장
  const outputPath = path.join(__dirname, '123', '1234', 'src', 'domains', 'livescore', 'constants', 'players', 'saudi-pro-league.ts');
  fs.writeFileSync(outputPath, fileContent, 'utf-8');

  console.log(`\n✅ 파일 생성 완료: ${outputPath}`);
  console.log('📝 다음 단계: korean_name이 null인 선수들을 한국어 이름으로 채워넣으세요.');
}

generateSaudiPlayersFile().catch(console.error);
