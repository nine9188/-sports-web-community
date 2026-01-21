import { Suspense } from 'react'
import LogViewer from './components/LogViewer'
import Spinner from '@/shared/components/Spinner';

export default function AdminLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-[#F0F0F0]">시스템 로그 관리</h1>
        <p className="text-gray-600 dark:text-gray-400">
          모든 사용자 활동과 시스템 이벤트를 조회하고 분석할 수 있습니다.
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      }>
        <LogViewer />
      </Suspense>
    </div>
  )
} 