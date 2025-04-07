'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import useSoccersAPI from '../../hooks/useSoccersAPI'

interface Match {
  id: number
  status: {
    code: string
    name: string
  }
  time: {
    date: string
    time: number
  }
  league: {
    id: number
    name: string
    country_name: string
    country_flag: string
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string
      score: number
    }
    away: {
      id: number
      name: string
      logo: string
      score: number
    }
  }
}

export default function MatchList() {
  const { getMatches, loading, error } = useSoccersAPI()
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getMatches()
        if (data) {
          setMatches(data)
        }
      } catch (err) {
        console.error('Failed to fetch matches:', err)
      }
    }

    fetchMatches()
    // 1분마다 데이터 갱신
    const interval = setInterval(fetchMatches, 60 * 1000)
    return () => clearInterval(interval)
  }, [getMatches])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center rounded-lg border border-red-200 bg-red-50">
        {error}
      </div>
    )
  }

  if (!matches.length) {
    return (
      <div className="text-gray-500 p-8 text-center rounded-lg border border-gray-200 bg-gray-50">
        현재 진행중인 경기가 없습니다.
      </div>
    )
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-100 text-red-800'
      case 'FT':
        return 'bg-gray-100 text-gray-800'
      case 'NS':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div 
          key={match.id} 
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border"
        >
          {/* League & Status */}
          <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-2">
              <Image 
                src={match.league.country_flag}
                alt={match.league.country_name}
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
              <span>{match.league.name}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyle(match.status.code)}`}>
              {match.status.name}
            </span>
          </div>
          
          {/* Match Details */}
          <div className="flex justify-between items-center space-x-4">
            {/* Home Team */}
            <div className="flex items-center space-x-2 flex-1">
              <Image 
                src={match.teams.home.logo}
                alt={match.teams.home.name}
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span className="font-medium truncate">{match.teams.home.name}</span>
            </div>
            
            {/* Score */}
            <div className="flex items-center space-x-3 min-w-[80px] justify-center">
              <span className="text-xl font-bold">{match.teams.home.score || '0'}</span>
              <span className="text-gray-400">-</span>
              <span className="text-xl font-bold">{match.teams.away.score || '0'}</span>
            </div>
            
            {/* Away Team */}
            <div className="flex items-center space-x-2 flex-1 justify-end">
              <span className="font-medium truncate">{match.teams.away.name}</span>
              <Image 
                src={match.teams.away.logo}
                alt={match.teams.away.name}
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>

          {/* Time */}
          <div className="text-center text-sm text-gray-500 mt-2">
            {match.time.time ? `${match.time.time}'` : new Date(match.time.date).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  )
}