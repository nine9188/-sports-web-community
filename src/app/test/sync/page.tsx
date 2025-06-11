import { syncAllFootballTeamsFromApi, getFootballTeams } from '@/domains/livescore/actions/footballTeamsSync'

interface FootballTeam {
  id: string
  name: string
  league_name: string
  country: string
  current_position?: number | null
}

async function SyncButton() {
  async function handleSync() {
    'use server'
    const result = await syncAllFootballTeamsFromApi()
    console.log('동기화 결과:', result)
    // void 반환
  }

  return (
    <form action={handleSync}>
      <button 
        type="submit"
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          backgroundColor: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🚀 API 데이터 동기화 시작
      </button>
    </form>
  )
}

export default async function SyncTestPage() {
  // 현재 저장된 팀 데이터 조회
  const existingTeams = await getFootballTeams({ limit: 10 })
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔄 Football Teams API 동기화 테스트</h1>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h2>📋 동기화 기능</h2>
        <p>이 버튼을 클릭하면 테스트 페이지에서 받아오는 모든 35개 리그의 팀 데이터를 Supabase football_teams 테이블에 저장합니다.</p>
        <SyncButton />
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
        <h2>📊 현재 저장된 데이터 (최근 10개)</h2>
        <p><strong>총 팀 수:</strong> {existingTeams.length > 0 ? '데이터 있음' : '데이터 없음'}</p>
        
        {existingTeams.length > 0 ? (
          <div style={{ marginTop: '15px' }}>
            {existingTeams.map((team: FootballTeam, index: number) => (
              <div key={team.id} style={{ 
                padding: '10px', 
                margin: '5px 0', 
                backgroundColor: 'white', 
                borderRadius: '3px',
                border: '1px solid #ddd'
              }}>
                <strong>{index + 1}. {team.name}</strong> 
                <span style={{ color: '#666', marginLeft: '10px' }}>
                  ({team.league_name} | {team.country})
                </span>
                {team.current_position && (
                  <span style={{ color: '#2196f3', marginLeft: '10px' }}>
                    순위: {team.current_position}위
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            저장된 팀 데이터가 없습니다. 위의 동기화 버튼을 클릭해주세요.
          </p>
        )}
      </div>

      <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '5px' }}>
        <h2>ℹ️ 동기화 과정</h2>
        <ol style={{ lineHeight: '1.6' }}>
          <li><strong>API 호출:</strong> getMajorLeagueIds()에서 반환하는 35개 리그 각각에 대해 teams & standings API 호출</li>
          <li><strong>데이터 가공:</strong> API 응답을 football_teams 테이블 구조에 맞게 변환</li>
          <li><strong>DB 저장:</strong> upsert를 사용하여 team_id 기준으로 데이터 저장/업데이트</li>
          <li><strong>검색 최적화:</strong> 팀명, 도시명 등을 기반으로 search_vector 생성</li>
        </ol>
        
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <strong>참고:</strong> 동기화는 시간이 걸릴 수 있습니다. 브라우저 개발자 도구의 콘솔에서 진행 상황을 확인할 수 있습니다.
        </p>
      </div>
    </div>
  )
} 