import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // 서비스 키 필요

const supabase = createClient(supabaseUrl, supabaseKey)

// 팀 ID 매핑 (football_teams 테이블 기준)
const TEAM_IDS = {
  Liverpool: 40,
  NottinghamForest: 65,
  Arsenal: 42,
  Newcastle: 34, // 임시 (DB에 없음)
  Chelsea: 49,
  ManchesterCity: 50,
  AstonVilla: 66,
  Bournemouth: 35,
  Fulham: 36,
  Brighton: 51,
}

// 선수 데이터 (premier-teams.ts에서 복사)
const liverpoolPlayers = [
  { id: 280, name: "Alisson Becker", koreanName: "알리송 베커" },
  { id: 162687, name: "V. Jaroš", koreanName: "비테크 야로시" },
  { id: 281, name: "C. Kelleher", koreanName: "카오이민 켈레허" },
  { id: 180316, name: "H. Davies", koreanName: "하비 데이비스" },
  { id: 284, name: "J. Gomez", koreanName: "조 고메즈" },
  { id: 290, name: "V. van Dijk", koreanName: "버질 반 다이크" },
  { id: 1145, name: "I. Konaté", koreanName: "이브라히마 코나테" },
  { id: 1600, name: "K. Tsimikas", koreanName: "코스타스 치미카스" },
  { id: 289, name: "A. Robertson", koreanName: "앤드류 로버트슨" },
  { id: 407032, name: "A. Nallo", koreanName: "암브로즈 날로" },
  { id: 283, name: "T. Alexander-Arnold", koreanName: "트렌트 알렉산더-아놀드" },
  { id: 158698, name: "J. Quansah", koreanName: "자렐 쿠안사" },
  { id: 180317, name: "C. Bradley", koreanName: "코너 브래들리" },
  { id: 284286, name: "Isaac Mabaya", koreanName: "아이작 마바야" },
  { id: 8500, name: "W. Endo", koreanName: "엔도 와타루" },
  { id: 1096, name: "D. Szoboszlai", koreanName: "도미니크 소보슬라이" },
  { id: 6716, name: "A. Mac Allister", koreanName: "알렉시스 맥 알리스터" },
  { id: 293, name: "C. Jones", koreanName: "커티스 존스" },
  { id: 19035, name: "H. Elliott", koreanName: "하비 엘리엇" },
  { id: 542, name: "R. Gravenberch", koreanName: "라이언 흐라번베르흐" },
  { id: 287109, name: "J. McConnell", koreanName: "제임스 맥코넬" },
  { id: 389032, name: "K. Morrison", koreanName: "루이스 모리슨" },
  { id: 162590, name: "T. Morton", koreanName: "타일러 모튼" },
  { id: 397997, name: "T. Nyoni", koreanName: "트레이 넌이" },
  { id: 2489, name: "L. Díaz", koreanName: "루이스 디아스" },
  { id: 51617, name: "D. Núñez", koreanName: "다르윈 누녜스" },
  { id: 306, name: "Mohamed Salah", koreanName: "모하메드 살라" },
  { id: 30410, name: "F. Chiesa", koreanName: "페데리코 키에사" },
  { id: 247, name: "C. Gakpo", koreanName: "코디 각포" },
  { id: 2678, name: "Diogo Jota", koreanName: "디오고 조타" },
  { id: 340246, name: "Trent Toure Kone Doherty", koreanName: "트렌트 투레 코네 도허티" },
  { id: 452685, name: "R. Ngumoha", koreanName: "루엘 응구모하" },
  { id: 380657, name: "R. Young", koreanName: "루이스 영" },
]

const nottinghamForestPlayers = [
  { id: 18836, name: "W. Hennessey", korean_name: "웨인 헤네시" },
  { id: 2919, name: "M. Sels", korean_name: "마르크 셀스" },
  { id: 10373, name: "Carlos Miguel", korean_name: "카를로스 미겔" },
  { id: 67943, name: "Morato", korean_name: "모라토" },
  { id: 363695, name: "Murillo", korean_name: "무리요" },
  { id: 138780, name: "N. Williams", korean_name: "니콜라 윌리엄스" },
  { id: 17365, name: "H. Toffolo", korean_name: "해리 토폴로" },
  { id: 47547, name: "Álex Moreno", korean_name: "알렉스 모레노" },
  { id: 18739, name: "W. Boly", korean_name: "윌리 볼리" },
  { id: 2817, name: "N. Milenković", korean_name: "니콜라 밀렌코비치" },
  { id: 2771, name: "O. Aina", korean_name: "오소리 아이나" },
  { id: 329357, name: "Z. Abbott", korean_name: "제이크 애보트" },
  { id: 22149, name: "I. Sangaré", korean_name: "이브상 가레" },
  { id: 138908, name: "E. Anderson", korean_name: "엘리슨 앤더슨" },
  { id: 18746, name: "M. Gibbs-White", korean_name: "마커스 깁스 화이트" },
  { id: 6056, name: "N. Domínguez", korean_name: "니콜라스 도밍게즈" },
  { id: 19305, name: "R. Yates", korean_name: "라이언 예이츠" },
  { id: 275170, name: "Danilo", korean_name: "다니로" },
  { id: 8598, name: "T. Awoniyi", korean_name: "타이워 아워니이" },
  { id: 18931, name: "C. Wood", korean_name: "크리스 우드" },
  { id: 2298, name: "C. Hudson-Odoi", korean_name: "칼럼 허드슨 오도이" },
  { id: 380492, name: "Eric Emanuel da Silva Moreira", korean_name: "에릭 에마누엘 다 실바 모레이라" },
  { id: 141901, name: "Jota Silva", korean_name: "조타 실바" },
  { id: 153430, name: "A. Elanga", korean_name: "안드레아스 엘랑가" },
  { id: 196298, name: "R. Sosa", korean_name: "르앙소사" },
  { id: 328096, name: "Joel Tshisanga Ndala", korean_name: "조엘 시상가 은달라" }
]

// 나머지 팀들도 추가...
const arsenalPlayers = [
  {id: 19465, name: "David Raya", korean_name: "데이비드 라야"},
  {id: 912, name: "Neto", korean_name: "네토"},
  {id: 342243, name: "T. Setford", korean_name: "T. 셋포드"},
  // ... 나머지 선수들
]

interface Player {
  id: number
  name?: string
  english_name?: string
  koreanName?: string
  korean_name?: string
  englishName?: string
}

async function migrateTeamPlayers(teamId: number, teamName: string, players: Player[]) {
  console.log(`\n🔵 ${teamName} 선수 마이그레이션 시작... (${players.length}명)`)
  
  const playersData = players.map(p => ({
    player_id: p.id,
    name: p.name || p.english_name || p.englishName || 'Unknown',
    korean_name: p.koreanName || p.korean_name || null,
    display_name: p.name || p.english_name || p.englishName || 'Unknown',
    team_id: teamId,
    team_name: teamName,
    is_active: true,
  }))

  const { data, error } = await supabase
    .from('football_players')
    .upsert(playersData, { 
      onConflict: 'player_id',
      ignoreDuplicates: false 
    })
    .select()

  if (error) {
    console.error(`❌ ${teamName} 실패:`, error.message)
    return { success: false, count: 0 }
  }

  console.log(`✅ ${teamName}: ${data?.length || 0}명 삽입 완료`)
  return { success: true, count: data?.length || 0 }
}

async function main() {
  console.log('🚀 프리미어리그 선수 데이터 마이그레이션 시작...\n')

  const results = await Promise.all([
    migrateTeamPlayers(TEAM_IDS.Liverpool, 'Liverpool', liverpoolPlayers),
    migrateTeamPlayers(TEAM_IDS.NottinghamForest, 'Nottingham Forest', nottinghamForestPlayers),
    // migrateTeamPlayers(TEAM_IDS.Arsenal, 'Arsenal', arsenalPlayers),
    // 나머지 팀들 추가...
  ])

  const totalCount = results.reduce((sum, r) => sum + r.count, 0)
  const successCount = results.filter(r => r.success).length

  console.log('\n' + '='.repeat(50))
  console.log(`✅ 마이그레이션 완료: ${successCount}/${results.length}개 팀`)
  console.log(`📊 총 ${totalCount}명 선수 데이터 삽입됨`)
  console.log('='.repeat(50))
}

main()
  .then(() => {
    console.log('\n✨ 모든 작업 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 오류 발생:', error)
    process.exit(1)
  })




























