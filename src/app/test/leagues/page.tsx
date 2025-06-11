import { getMajorLeagueIds, LEAGUE_NAMES_MAP } from '@/domains/livescore/constants/league-mappings';

const API_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.FOOTBALL_API_KEY!;

// 실제 API 응답을 가져오는 함수
async function fetchRawLeagueData(leagueId: number) {
  try {
    // K리그는 2025 시즌, 다른 리그는 2024 시즌 사용
    const kLeagueIds = [292, 293, 294];
    const season = kLeagueIds.includes(leagueId) ? '2025' : '2024';

    // 팀 목록, 순위 정보를 병렬로 가져오기
    const [teamsResponse, standingsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/teams?league=${leagueId}&season=${season}`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': API_KEY,
        },
        cache: 'no-store'
      }),
      fetch(`${API_BASE_URL}/standings?league=${leagueId}&season=${season}`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': API_KEY,
        },
        cache: 'no-store'
      })
    ]);

    const teamsData = teamsResponse.ok ? await teamsResponse.json() : null;
    const standingsData = standingsResponse.ok ? await standingsResponse.json() : null;

    return {
      leagueId,
      season,
      teamsApiResponse: teamsData,
      standingsApiResponse: standingsData,
      teamsStatus: teamsResponse.status,
      standingsStatus: standingsResponse.status,
    };
  } catch (error) {
    return {
      leagueId,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

export default async function LeaguesTestPage() {
  // getMajorLeagueIds()에서 반환하는 모든 35개 리그 ID 가져오기
  const allLeagueIds = getMajorLeagueIds();

  console.log('🔍 조회할 리그 ID들:', allLeagueIds);
  console.log('📊 총 리그 수:', allLeagueIds.length);

  const allRawData = await Promise.all(
    allLeagueIds.map(leagueId => fetchRawLeagueData(leagueId))
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#f5f5f5' }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>
        🔍 실제 API 응답 데이터 - 모든 {allLeagueIds.length}개 리그
      </h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
        <h2>📊 전체 통계</h2>
        <p><strong>조회한 리그 수:</strong> {allRawData.length}</p>
        <p><strong>성공한 요청:</strong> {allRawData.filter(data => !data.error).length}</p>
        <p><strong>실패한 요청:</strong> {allRawData.filter(data => data.error).length}</p>
        <p><strong>총 팀 수:</strong> {allRawData.reduce((total, data) => {
          if (data.error || !data.teamsApiResponse?.response) return total;
          return total + (data.teamsApiResponse.response.length || 0);
        }, 0)}</p>
      </div>

      {/* 리그 ID 목록 표시 */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '5px' }}>
        <h2>📋 조회 대상 리그 ID 목록</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
          {allLeagueIds.map(id => (
            <div key={id} style={{ padding: '5px', backgroundColor: 'white', borderRadius: '3px', border: '1px solid #ddd' }}>
              <strong>{id}</strong>: {LEAGUE_NAMES_MAP[id] || '이름 없음'}
            </div>
          ))}
        </div>
      </div>

      {allRawData.map((rawData, index) => {
        const leagueName = LEAGUE_NAMES_MAP[rawData.leagueId] || `리그 ID ${rawData.leagueId}`;
        const teamCount = rawData.teamsApiResponse?.response?.length || 0;
        
        return (
          <div key={rawData.leagueId} style={{ 
            marginBottom: '50px', 
            border: '2px solid #ddd', 
            borderRadius: '10px',
            backgroundColor: 'white'
          }}>
            <div style={{ 
              padding: '15px', 
              backgroundColor: rawData.error ? '#ffebee' : '#e8f5e9',
              borderRadius: '8px 8px 0 0',
              borderBottom: '1px solid #ddd'
            }}>
              <h2 style={{ margin: 0, color: rawData.error ? '#c62828' : '#2e7d32' }}>
                {index + 1}. {leagueName} (ID: {rawData.leagueId})
                {rawData.error ? ' ❌ 실패' : ` ✅ 성공 (${teamCount}개 팀)`}
              </h2>
              {!rawData.error && (
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                  시즌: {rawData.season} | 팀 API: {rawData.teamsStatus} | 순위 API: {rawData.standingsStatus}
                </p>
              )}
            </div>

            <div style={{ padding: '20px' }}>
              {rawData.error ? (
                <div style={{ color: '#c62828', fontSize: '16px' }}>
                  <strong>오류:</strong> {rawData.error}
                </div>
              ) : (
                <>
                  {/* 팀 목록 API 응답 */}
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ 
                      color: '#1976d2', 
                      borderBottom: '2px solid #1976d2', 
                      paddingBottom: '5px' 
                    }}>
                      🏟️ 팀 목록 API 응답 (teams) - {teamCount}개 팀
                    </h3>
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '15px', 
                      borderRadius: '5px',
                      border: '1px solid #dee2e6',
                      maxHeight: '400px',
                      overflow: 'auto'
                    }}>
                      <pre style={{ 
                        margin: 0, 
                        fontSize: '12px', 
                        lineHeight: '1.4',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {JSON.stringify(rawData.teamsApiResponse, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* 순위 API 응답 */}
                  <div>
                    <h3 style={{ 
                      color: '#388e3c', 
                      borderBottom: '2px solid #388e3c', 
                      paddingBottom: '5px' 
                    }}>
                      🏆 순위 API 응답 (standings)
                    </h3>
                    <div style={{ 
                      backgroundColor: '#f1f8e9', 
                      padding: '15px', 
                      borderRadius: '5px',
                      border: '1px solid #c8e6c9',
                      maxHeight: '400px',
                      overflow: 'auto'
                    }}>
                      <pre style={{ 
                        margin: 0, 
                        fontSize: '12px', 
                        lineHeight: '1.4',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {JSON.stringify(rawData.standingsApiResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#fff3e0',
        borderRadius: '10px',
        border: '2px solid #ff9800'
      }}>
        <h2 style={{ color: '#e65100', margin: '0 0 15px 0' }}>
          📝 API 응답 구조 설명
        </h2>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <p><strong>데이터 소스:</strong> getMajorLeagueIds() 함수에서 반환하는 모든 {allLeagueIds.length}개 리그</p>
          <p><strong>teams API:</strong> 각 리그에 소속된 모든 팀의 정보 (팀명, 로고, 창단년도, 홈구장 등)</p>
          <p><strong>standings API:</strong> 해당 시즌의 리그 순위표 (순위, 승점, 승/무/패 등)</p>
          <p><strong>fetchLeagueTeams 함수:</strong> 위 두 API 응답을 조합하여 LeagueTeam[] 타입으로 가공</p>
        </div>
      </div>
    </div>
  );
} 