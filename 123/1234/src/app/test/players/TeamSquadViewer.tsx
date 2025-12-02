'use client'

import { useState } from 'react'
import { fetchTeamSquad, savePlayersToDatabase } from './actions'

interface Player {
  id: number
  name: string
  age: number
  number: number | null
  position: string
  photo: string
}

interface Team {
  team_id: number
  name: string
  name_ko: string | null
  logo_url: string | null
}

interface TeamSquadViewerProps {
  team: Team
}

export function TeamSquadViewer({ team }: TeamSquadViewerProps) {
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleFetchPlayers = async () => {
    if (loading || players.length > 0) {
      setIsExpanded(!isExpanded)
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const fetchedPlayers = await fetchTeamSquad(team.team_id)
      setPlayers(fetchedPlayers)
      setIsExpanded(true)
      
      if (fetchedPlayers.length === 0) {
        setMessage('⚠️ API에서 선수 데이터를 가져오지 못했습니다.')
      }
    } catch (error) {
      setMessage(`❌ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlayers = async () => {
    if (saving || players.length === 0) return

    if (!confirm(`${team.name}의 선수 ${players.length}명을 DB에 저장하시겠습니까?`)) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const result = await savePlayersToDatabase(team.team_id, team.name, players)
      
      if (result.success) {
        setMessage(`✅ ${result.message}`)
      } else {
        setMessage(`❌ ${result.message}`)
      }
    } catch (error) {
      setMessage(`❌ 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setSaving(false)
    }
  }

  // 포지션별로 그룹화
  const playersByPosition = players.reduce((acc, player) => {
    const pos = player.position || 'Unknown'
    if (!acc[pos]) acc[pos] = []
    acc[pos].push(player)
    return acc
  }, {} as Record<string, Player[]>)

  const positionOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker', 'Unknown']
  const positionNames: Record<string, string> = {
    'Goalkeeper': '골키퍼',
    'Defender': '수비수',
    'Midfielder': '미드필더',
    'Attacker': '공격수',
    'Unknown': '기타'
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-4">
        {/* 팀 정보 */}
        <div className="flex items-center gap-3 flex-1">
          {team.logo_url && (
            <img 
              src={team.logo_url} 
              alt={team.name}
              className="w-12 h-12 object-contain"
            />
          )}
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {team.name_ko || team.name}
            </div>
            <div className="text-sm text-gray-500">{team.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              Team ID: {team.team_id}
            </div>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex items-center gap-3">
          {players.length > 0 && (
            <div className="text-center px-3 py-1 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">{players.length}</div>
              <div className="text-xs text-blue-600">명</div>
            </div>
          )}
          
          <button
            onClick={handleFetchPlayers}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {loading ? '조회 중...' : players.length > 0 ? (isExpanded ? '접기' : '펼치기') : '선수 조회'}
          </button>

          {players.length > 0 && (
            <button
              onClick={handleSavePlayers}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {saving ? '저장 중...' : 'DB 저장'}
            </button>
          )}
        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`mt-3 p-3 rounded text-sm ${
          message.startsWith('✅') ? 'bg-green-50 text-green-800' : 
          message.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-800' :
          'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* 선수 목록 */}
      {isExpanded && players.length > 0 && (
        <div className="mt-4 space-y-4">
          {positionOrder.map(position => {
            const posPlayers = playersByPosition[position]
            if (!posPlayers || posPlayers.length === 0) return null

            return (
              <div key={position} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold text-sm">
                  {positionNames[position] || position} ({posPlayers.length}명)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
                  {posPlayers
                    .sort((a, b) => (a.number || 999) - (b.number || 999))
                    .map((player) => (
                      <div 
                        key={player.id} 
                        className="flex items-center gap-3 p-3 bg-white border rounded hover:shadow-sm transition-shadow"
                      >
                        <img 
                          src={player.photo} 
                          alt={player.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = '/images/player-placeholder.png'
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {player.name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            {player.number && (
                              <span className="font-semibold text-blue-600">#{player.number}</span>
                            )}
                            {player.age && (
                              <span>{player.age}세</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}

          {/* 요약 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">선수 구성</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {positionOrder.map(position => {
                const count = playersByPosition[position]?.length || 0
                if (count === 0) return null
                return (
                  <div key={position} className="flex justify-between">
                    <span className="text-gray-600">{positionNames[position] || position}</span>
                    <span className="font-semibold">{count}명</span>
                  </div>
                )
              })}
              <div className="flex justify-between font-bold text-blue-600 col-span-full border-t pt-2">
                <span>전체</span>
                <span>{players.length}명</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

