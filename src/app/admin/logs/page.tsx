import { Suspense } from 'react'
import LogViewer from './components/LogViewer'

export default function AdminLogsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">시스템 로그 관리</h1>
        <p className="text-gray-600">
          모든 사용자 활동과 시스템 이벤트를 조회하고 분석할 수 있습니다.
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      }>
        <LogViewer />
      </Suspense>
    </div>
  )
} 