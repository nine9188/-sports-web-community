'use client'

import { useState, useTransition } from 'react'
import { updateTeamMappings } from './actions'

interface UpdateButtonProps {
  count: number
}

export function UpdateButton({ count }: UpdateButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await updateTeamMappings()
      setResult(res)
      
      // 3초 후 메시지 자동 숨김
      setTimeout(() => {
        setResult(null)
      }, 3000)
    })
  }

  return (
    <div>
      <button
        onClick={handleUpdate}
        disabled={isPending || count === 0}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          isPending || count === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {isPending ? '업데이트 중...' : `🔄 한글명 일괄 업데이트 (${count}개)`}
      </button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <p
            className={`text-sm font-medium ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {result.success ? '✅ ' : '❌ '}
            {result.message}
          </p>
        </div>
      )}

      <p className="mt-2 text-sm text-gray-600">
        * 이 버튼을 클릭하면 매핑 데이터가 있는 모든 팀의 name_ko와 country_ko를 업데이트합니다.
      </p>
    </div>
  )
}













