/**
 * 전체 선수 한글명 AI 번역 스크립트
 * 한국 스포츠 미디어 기준 표기로 통일
 *
 * 사용법: node scripts/sync-korean-names.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BATCH_SIZE = 60; // 한 번에 번역할 선수 수

const LEAGUE_ORDER = [
  39,  // 프리미어리그
  140, // 라리가
  78,  // 분데스리가
  135, // 세리에A
  61,  // 리그앙
  292, // K리그1
  98,  // J1 리그
  307, // 사우디
  253, // MLS
  88,  // 에레디비지에
  94,  // 프리메이라
  119, // 덴마크
];

/**
 * GPT로 선수 이름 한글 번역
 */
async function translateBatch(players, leagueName) {
  const nameList = players.map(p => `${p.player_id}|${p.name}|${p.position || ''}|${p.nationality || ''}`).join('\n');

  const prompt = `축구 선수 이름을 한국 스포츠 미디어(네이버 스포츠, 골닷컴 코리아, 풋볼리스트 등)에서 통용되는 한글 표기로 번역해주세요.

규칙:
1. 단순 음역이 아니라, 한국 축구팬/미디어가 실제로 사용하는 이름을 우선합니다.
   - 예: Gyökeres → 요케레스 (O), 욕케레스 (X)
   - 예: De Bruyne → 더브라위너 (O), 데 브라이네 (X)
   - 예: Szoboszlai → 소보슬라이 (O)
2. 유명 선수는 반드시 한국에서 통용되는 표기를 사용하세요.
3. 이름이 약자(예: "B. Saka")인 경우 풀네임 기반 한글명을 주세요: "부카요 사카"
4. 한국인/일본인/중국인 선수는 원어 한글 표기 사용 (예: 손흥민, 이강인, 김민재, 미토마 카오루)
5. 리그: ${leagueName}
6. nationality(국적) 정보를 참고해서 해당 언어 발음에 맞게 음역하세요.

각 줄은 "player_id|영문이름|포지션|국적" 형식입니다.
응답은 반드시 "player_id|한글이름" 형식으로만, 줄바꿈으로 구분해서 주세요. 다른 설명 없이 결과만 주세요.

${nameList}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content || '';
    const results = {};

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split('|');
      if (parts.length >= 2) {
        const id = parseInt(parts[0].trim());
        const koreanName = parts[1].trim();
        if (!isNaN(id) && koreanName) {
          results[id] = koreanName;
        }
      }
    }

    return results;
  } catch (error) {
    console.error('GPT 호출 실패:', error.message);
    return {};
  }
}

/**
 * DB 업데이트
 */
async function updateKoreanNames(translations) {
  let updated = 0;
  let failed = 0;

  for (const [playerId, koreanName] of Object.entries(translations)) {
    const { error } = await supabase
      .from('football_players')
      .update({ korean_name: koreanName, updated_at: new Date().toISOString() })
      .eq('player_id', parseInt(playerId));

    if (error) {
      failed++;
    } else {
      updated++;
    }
  }

  return { updated, failed };
}

async function main() {
  console.log('=== 전체 선수 한글명 AI 번역 시작 ===\n');

  let grandTotal = 0;
  let grandUpdated = 0;

  for (const leagueId of LEAGUE_ORDER) {
    const { data: teams } = await supabase
      .from('football_teams')
      .select('team_id, league_name')
      .eq('league_id', leagueId)
      .eq('is_active', true);

    if (!teams?.length) continue;

    const teamIds = teams.map(t => t.team_id);
    const leagueName = teams[0].league_name;

    const { data: leaguePlayers } = await supabase
      .from('football_players')
      .select('player_id, name, position, nationality, korean_name')
      .eq('is_active', true)
      .in('team_id', teamIds)
      .order('name');

    if (!leaguePlayers?.length) continue;

    console.log(`\n📋 ${leagueName} (${leaguePlayers.length}명)`);

    let leagueUpdated = 0;

    // 배치 처리
    for (let i = 0; i < leaguePlayers.length; i += BATCH_SIZE) {
      const batch = leaguePlayers.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(leaguePlayers.length / BATCH_SIZE);

      process.stdout.write(`  배치 ${batchNum}/${totalBatches} (${batch.length}명)...`);

      const translations = await translateBatch(batch, leagueName);
      const translatedCount = Object.keys(translations).length;

      if (translatedCount > 0) {
        const { updated, failed } = await updateKoreanNames(translations);
        leagueUpdated += updated;
        console.log(` ✅ ${updated}명 업데이트${failed > 0 ? `, ${failed}건 실패` : ''}`);
      } else {
        console.log(' ⚠ 번역 결과 없음');
      }

      // rate limit 방지
      await new Promise(r => setTimeout(r, 500));
    }

    grandTotal += leaguePlayers.length;
    grandUpdated += leagueUpdated;
    console.log(`  → ${leagueName} 완료: ${leagueUpdated}/${leaguePlayers.length}명 업데이트`);
  }

  console.log('\n=== 완료 ===');
  console.log(`전체: ${grandTotal}명 처리, ${grandUpdated}명 업데이트`);
}

main().catch(e => console.error('스크립트 오류:', e));
