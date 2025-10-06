'use client'

import { useState } from 'react'

export default function SyncTeamsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/sync-teams', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || data.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">팀 데이터 동기화</h1>
          <p className="text-gray-600">
            ALLOWED_LEAGUE_IDS에 정의된 리그의 팀 데이터를 Football API에서 가져와 DB에 저장합니다.
          </p>
        </div>

        <div className="border-t pt-6">
          <button
            onClick={handleSync}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? '동기화 중...' : '동기화 시작'}
          </button>
        </div>

        {loading && (
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-700">팀 데이터를 동기화하고 있습니다. 시간이 다소 걸릴 수 있습니다...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="font-semibold text-red-800 mb-2">❌ 오류 발생</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-green-50 border-b border-green-200 px-4 py-3">
              <h3 className="font-semibold text-green-800">✅ 동기화 완료</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded p-3">
                  <div className="text-sm text-gray-600">총 리그 수</div>
                  <div className="text-2xl font-bold text-gray-900">{result.totalLeagues}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-sm text-gray-600">성공한 리그</div>
                  <div className="text-2xl font-bold text-green-600">{result.successfulLeagues}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-sm text-gray-600">총 팀 수</div>
                  <div className="text-2xl font-bold text-blue-600">{result.totalTeams}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-sm text-gray-600">실패 수</div>
                  <div className="text-2xl font-bold text-red-600">{result.errors?.length || 0}</div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="text-sm font-medium text-gray-700 mb-2">요약</div>
                <div className="text-gray-600">{result.summary}</div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">오류 목록</div>
                  <div className="bg-gray-50 rounded p-3 max-h-60 overflow-y-auto">
                    {result.errors.map((err: string, idx: number) => (
                      <div key={idx} className="text-sm text-red-600 mb-1">
                        • {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <h3 className="font-semibold mb-2">참고 사항</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 기존 데이터는 자동으로 삭제되고 새로 저장됩니다</li>
            <li>• API 요청 제한으로 인해 리그당 약 0.1초씩 딜레이가 있습니다</li>
            <li>• 동기화 후 <a href="/test" className="text-blue-600 hover:underline">/test</a> 페이지에서 결과를 확인하세요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
