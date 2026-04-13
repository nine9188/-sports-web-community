/**
 * 한국어 위키피디아에서 선수 한글명 가져오기
 * 팀 문서 → 선수단 명단 → DB 매칭 → 업데이트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 팀 → 한국어 위키피디아 문서 제목 매핑
// 위키 검색으로 못 찾는 경우를 위한 수동 매핑
const TEAM_WIKI_MAP = {
  // EPL
  42: '아스널 FC', 40: '리버풀 FC', 50: '맨체스터 시티 FC', 49: '첼시 FC',
  33: '맨체스터 유나이티드 FC', 47: '토트넘 홋스퍼 FC', 34: '뉴캐슬 유나이티드 FC',
  66: '애스턴 빌라 FC', 65: '노팅엄 포레스트 FC', 35: 'AFC 본머스',
  51: '브라이턴 & 호브 앨비언 FC', 44: '번리 FC', 52: '크리스털 팰리스 FC',
  45: '에버턴 FC', 36: '풀럼 FC', 48: '웨스트 햄 유나이티드 FC',
  39: '울버햄프턴 원더러스 FC', 55: '브렌트퍼드 FC', 63: '리즈 유나이티드 FC',
  746: '선덜랜드 AFC',
  // 라리가
  541: '레알 마드리드 CF', 529: 'FC 바르셀로나', 530: '아틀레티코 마드리드',
  532: '발렌시아 CF', 536: '세비야 FC', 543: '레알 베티스', 533: '비야레알 CF',
  546: '레알 소시에다드', 531: '아틀레틱 빌바오', 548: '레알 발라돌리드',
  727: '에스파뇰', 728: '라요 바예카노', 534: '헤타페 CF', 798: '마요르카',
  723: '알라베스', 535: '레가네스', 538: '셀타 비고', 547: '지로나 FC',
  537: '오사수나', 540: '라스팔마스',
  // 분데스리가
  157: 'FC 바이에른 뮌헨', 165: '보루시아 도르트문트', 168: '바이어 04 레버쿠젠',
  169: 'RB 라이프치히', 160: 'SC 프라이부르크', 161: 'VfL 볼프스부르크',
  162: '베르더 브레멘', 163: '보루시아 묀헨글라트바흐', 164: '1. FSV 마인츠 05',
  167: 'TSG 1899 호펜하임', 170: 'FC 아우크스부르크', 172: 'VfB 슈투트가르트',
  173: '1. FC 우니온 베를린', 176: 'VfL 보훔', 174: 'FC 장크트파울리',
  180: '하이덴하임', 192: '홀슈타인 킬',
  // 세리에A
  489: 'AC 밀란', 505: '인테르나치오날레 밀라노', 496: '유벤투스 FC',
  492: 'SSC 나폴리', 497: 'AS 로마', 499: '아탈란타 BC', 487: 'SS 라치오',
  502: 'ACF 피오렌티나', 503: '토리노 FC', 500: '볼로냐 FC',
  504: '헬라스 베로나 FC', 498: '삼프도리아', 511: '제노아 CFC',
  514: '레체', 520: '엠폴리 FC', 515: '칼리아리 칼초', 519: '우디네세 칼초',
  523: '파르마 칼초', 1579: '코모 1907', 867: '모넬라',
  // 리그앙
  85: '파리 생제르맹 FC', 91: '모나코 AS', 80: '올림피크 리옹',
  81: '올림피크 드 마르세유', 94: '릴 OSC', 95: '스타드 렌',
  96: '랑스', 97: 'FC 낭트', 93: '스타드 드 랭스', 82: '니스',
  83: '몽펠리에 HSC', 84: '스트라스부르', 98: 'AS 생테티엔',
  99: 'RC 랑스', 86: 'SC 앙제', 100: '파리 FC', 101: '르아브르', 108: '오세르',
  // K리그
  2742: 'FC 서울', 2752: '수원 삼성 블루윙즈', 2741: '전북 현대 모터스',
  2744: '울산 HD FC', 2745: '포항 스틸러스', 2753: '대구 FC',
  2743: '인천 유나이티드 FC', 2750: '강원 FC', 2754: '제주 유나이티드 FC',
  2748: '대전 시티즌', 2751: '광주 FC', 15498: '김천 상무 FC',
};

/**
 * 한국어 위키에서 팀 선수단 가져오기
 */
async function fetchSquadFromWiki(teamId, teamName) {
  const wikiTitle = TEAM_WIKI_MAP[teamId];
  if (!wikiTitle) {
    console.log(`  ⚠ ${teamName}: 위키 매핑 없음`);
    return [];
  }

  try {
    const encoded = encodeURIComponent(wikiTitle);
    const url = `https://ko.wikipedia.org/w/api.php?action=parse&page=${encoded}&prop=wikitext&format=json`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.log(`  ⚠ ${teamName}: 위키 문서 없음 (${wikiTitle})`);
      return [];
    }

    const wikitext = data.parse?.wikitext?.['*'] || '';

    // Fs player 템플릿에서 선수 추출
    // 형식: {{Fs player|no=7|nat=ENG|pos=FW|name=[[부카요 사카]]}}
    const playerRegex = /\{\{(?:Fs player|축구 선수)\|[^}]*name\s*=\s*\[\[([^\]|]+)(?:\|[^\]]+)?\]\][^}]*\}\}/gi;
    const players = [];
    let match;

    while ((match = playerRegex.exec(wikitext)) !== null) {
      const koreanName = match[1].trim();
      if (koreanName) {
        players.push({ koreanName });
      }
    }

    // 만약 Fs player로 못 찾으면 다른 패턴 시도
    if (players.length === 0) {
      // name=한글이름 (링크 없는 버전)
      const altRegex = /\{\{(?:Fs player|축구 선수)\|[^}]*name\s*=\s*([^|}]+)/gi;
      while ((match = altRegex.exec(wikitext)) !== null) {
        const name = match[1].trim().replace(/\[|\]/g, '');
        if (name && /[가-힣]/.test(name)) {
          players.push({ koreanName: name });
        }
      }
    }

    return players;
  } catch (error) {
    console.log(`  ❌ ${teamName}: ${error.message}`);
    return [];
  }
}

/**
 * 위키 한글명을 DB 선수와 매칭
 * 한글명끼리 유사도 비교 (기존 GPT 번역값과 위키값)
 */
function findBestMatch(wikiName, dbPlayers) {
  // 1. 정확히 일치
  const exact = dbPlayers.find(p => p.korean_name === wikiName);
  if (exact) return exact;

  // 2. 성(마지막 단어)이 같은 선수 찾기
  const wikiLastName = wikiName.split(' ').pop();
  const candidates = dbPlayers.filter(p => {
    if (!p.korean_name) return false;
    const dbLastName = p.korean_name.split(' ').pop();
    return dbLastName === wikiLastName;
  });

  if (candidates.length === 1) return candidates[0];

  // 3. 첫글자 + 성 매칭
  if (candidates.length > 1) {
    const wikiFirst = wikiName.charAt(0);
    const better = candidates.find(p => p.korean_name?.charAt(0) === wikiFirst);
    if (better) return better;
  }

  return null;
}

async function main() {
  console.log('=== 위키피디아 한글명 동기화 시작 ===\n');

  const LEAGUE_IDS = [39, 140, 78, 135, 61, 292, 98, 307, 253, 88, 94, 119];
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const leagueId of LEAGUE_IDS) {
    const { data: teams } = await supabase
      .from('football_teams')
      .select('team_id, name, league_name')
      .eq('league_id', leagueId)
      .eq('is_active', true);

    if (!teams?.length) continue;

    console.log(`\n📋 ${teams[0].league_name}`);

    for (const team of teams) {
      const wikiPlayers = await fetchSquadFromWiki(team.team_id, team.name);

      if (wikiPlayers.length === 0) {
        totalSkipped++;
        continue;
      }

      // DB에서 이 팀 선수 가져오기
      const { data: dbPlayers } = await supabase
        .from('football_players')
        .select('player_id, name, korean_name, number, position')
        .eq('team_id', team.team_id)
        .eq('is_active', true);

      if (!dbPlayers?.length) continue;

      let teamUpdated = 0;

      for (const wikiPlayer of wikiPlayers) {
        const matched = findBestMatch(wikiPlayer.koreanName, dbPlayers);

        if (matched && matched.korean_name !== wikiPlayer.koreanName) {
          const { error } = await supabase
            .from('football_players')
            .update({ korean_name: wikiPlayer.koreanName })
            .eq('player_id', matched.player_id);

          if (!error) {
            teamUpdated++;
            totalUpdated++;
          }
        }
      }

      if (teamUpdated > 0) {
        console.log(`  ✅ ${team.name}: ${wikiPlayers.length}명 중 ${teamUpdated}명 업데이트`);
      } else if (wikiPlayers.length > 0) {
        console.log(`  ⏭ ${team.name}: ${wikiPlayers.length}명 확인, 변경 없음`);
      }

      // rate limit
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`\n=== 완료 ===`);
  console.log(`업데이트: ${totalUpdated}명, 스킵: ${totalSkipped}팀`);
}

main().catch(e => console.error('오류:', e));
