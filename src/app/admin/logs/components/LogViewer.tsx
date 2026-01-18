'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  SelectRadix as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui'
import Spinner from '@/shared/components/Spinner';
import {
  getApplicationLogs,
  getLogStatistics,
  LogLevel,
  LogCategory,
  LogStatistics
} from '@/shared/actions/log-actions'

// 데이터베이스 로그 엔트리 타입 (DB 응답용)
interface DatabaseLogEntry {
  id: string
  level: string
  category: string
  action: string
  message: string
  user_id?: string
  session_id?: string
  ip_address?: string
  user_agent?: string
  request_id?: string
  endpoint?: string
  method?: string
  status_code?: number
  response_time_ms?: number
  metadata?: Record<string, unknown>
  error_code?: string
  error_details?: Record<string, unknown>
  stack_trace?: string
  created_at: string
  profiles?: {
    nickname?: string
    username?: string
    email?: string
  }
}

// 레벨별 색상 매핑
const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: 'bg-gray-100 text-gray-800',
  INFO: 'bg-blue-100 text-blue-800',
  WARN: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
  FATAL: 'bg-red-200 text-red-900'
}

// 카테고리별 색상 매핑
const CATEGORY_COLORS: Record<LogCategory, string> = {
  auth: 'bg-green-100 text-green-800',
  api: 'bg-blue-100 text-blue-800',
  database: 'bg-purple-100 text-purple-800',
  user_action: 'bg-orange-100 text-orange-800',
  system: 'bg-gray-100 text-gray-800',
  admin: 'bg-red-100 text-red-800',
  security: 'bg-yellow-100 text-yellow-800'
}

export default function LogViewer() {
  const [logs, setLogs] = useState<DatabaseLogEntry[]>([])
  const [statistics, setStatistics] = useState<LogStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: ''
  })

  const limit = 50

  // 로그 조회
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 빈 문자열 필터 제거
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '')
      )
      
      const response = await getApplicationLogs(page, limit, cleanFilters)
      
      setLogs(response.logs as DatabaseLogEntry[])
      setTotalPages(response.totalPages)
      setTotalCount(response.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그 조회 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [page, filters, limit])

  // 통계 조회
  const fetchStatistics = async () => {
    try {
      const stats = await getLogStatistics('today')
      setStatistics(stats)
    } catch (err) {
      console.error('통계 조회 실패:', err)
    }
  }

  // 초기 로딩 및 필터 변경 시 조회
  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    fetchStatistics()
  }, [])

  // 필터 변경 시 페이지를 1로 리셋
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      level: '',
      category: '',
      action: '',
      userId: '',
      startDate: '',
      endDate: '',
      search: ''
    })
    setPage(1)
  }

  // 행 확장/축소 토글
  const toggleExpanded = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="mb-4">{error}</p>
            <Button onClick={fetchLogs}>다시 시도</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 대시보드 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statistics.totalLogs.toLocaleString()}</div>
              <p className="text-sm text-gray-600">오늘 총 로그</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{statistics.errorCount.toLocaleString()}</div>
              <p className="text-sm text-gray-600">오늘 에러</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm space-y-1">
                {Object.entries(statistics.levelStats).map(([level, count]) => (
                  <div key={level} className="flex justify-between">
                    <Badge className={LEVEL_COLORS[level as LogLevel]}>{level}</Badge>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm space-y-1">
                {Object.entries(statistics.categoryStats).slice(0, 4).map(([category, count]) => (
                  <div key={category} className="flex justify-between">
                    <Badge className={CATEGORY_COLORS[category as LogCategory]}>{category}</Badge>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 영역 */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <Select value={filters.level || 'all'} onValueChange={(value) => handleFilterChange('level', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="레벨" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 레벨</SelectItem>
                <SelectItem value="DEBUG">DEBUG</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="WARN">WARN</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="FATAL">FATAL</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 카테고리</SelectItem>
                <SelectItem value="auth">인증</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="database">데이터베이스</SelectItem>
                <SelectItem value="user_action">사용자 액션</SelectItem>
                <SelectItem value="system">시스템</SelectItem>
                <SelectItem value="admin">관리자</SelectItem>
                <SelectItem value="security">보안</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="액션"
              value={filters.action}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('action', e.target.value)}
            />

            <Input
              placeholder="사용자 ID"
              value={filters.userId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('userId', e.target.value)}
            />

            <Input
              type="datetime-local"
              placeholder="시작 날짜"
              value={filters.startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('startDate', e.target.value)}
            />

            <Input
              type="datetime-local"
              placeholder="종료 날짜"
              value={filters.endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('endDate', e.target.value)}
            />

            <Input
              placeholder="검색"
              value={filters.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={fetchLogs} disabled={loading}>
              {loading ? '조회 중...' : '조회'}
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              필터 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 로그 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>
            로그 목록 ({totalCount.toLocaleString()}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Spinner size="lg" className="mx-auto" />
              <p className="mt-2 text-gray-600">로그를 불러오는 중...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              조회된 로그가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={LEVEL_COLORS[log.level as LogLevel]}>
                          {log.level}
                        </Badge>
                        <Badge className={CATEGORY_COLORS[log.category as LogCategory]}>
                          {log.category}
                        </Badge>
                        <span className="text-sm font-medium">{log.action}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-800 mb-2">{log.message}</p>
                      
                      <div className="flex gap-4 text-xs text-gray-500">
                        {log.user_id && (
                          <span>사용자: {log.profiles?.nickname || log.user_id}</span>
                        )}
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                        {log.endpoint && (
                          <span>엔드포인트: {log.method} {log.endpoint}</span>
                        )}
                        {log.status_code && (
                          <span>상태: {log.status_code}</span>
                        )}
                        {log.response_time_ms && (
                          <span>응답시간: {log.response_time_ms}ms</span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(log.id)}
                      className="ml-2"
                    >
                      {expandedRows.has(log.id) ? '접기' : '펼치기'}
                    </Button>
                  </div>
                  
                  {expandedRows.has(log.id) && (
                    <div className="mt-4 pt-4 border-t bg-gray-50 rounded p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">기본 정보</h4>
                          <div className="space-y-1">
                            <div><span className="font-medium">ID:</span> {log.id}</div>
                            <div><span className="font-medium">세션:</span> {log.session_id || 'N/A'}</div>
                            <div><span className="font-medium">요청 ID:</span> {log.request_id || 'N/A'}</div>
                            <div><span className="font-medium">User-Agent:</span> {log.user_agent || 'N/A'}</div>
                          </div>
                        </div>
                        
                        {(log.metadata || log.error_details || log.stack_trace) && (
                          <div>
                            <h4 className="font-medium mb-2">상세 정보</h4>
                            {log.metadata && (
                              <div className="mb-2">
                                <span className="font-medium">메타데이터:</span>
                                <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {log.error_details && (
                              <div className="mb-2">
                                <span className="font-medium text-red-600">에러 상세:</span>
                                <pre className="text-xs bg-red-50 p-2 rounded border mt-1 overflow-x-auto">
                                  {JSON.stringify(log.error_details, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {log.stack_trace && (
                              <div>
                                <span className="font-medium text-red-600">스택 트레이스:</span>
                                <pre className="text-xs bg-red-50 p-2 rounded border mt-1 overflow-x-auto">
                                  {log.stack_trace}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                이전
              </Button>
              
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 