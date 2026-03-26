'use client';

import { useEffect, useState, useCallback } from 'react';
import { Database, Trash2, Search, RefreshCw } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import {
  getMatchCacheStats,
  getIncompleteCacheEntries,
  searchMatchCache,
  deleteMatchCache,
  runCleanup,
} from '@/domains/admin/actions/cacheManagement';

interface CacheEntry {
  match_id: number;
  data_type: string;
  match_status: string;
  is_complete: boolean;
  updated_at: string;
  created_at: string;
}

interface CacheStats {
  totalEntries: number;
  completeEntries: number;
  incompleteEntries: number;
  byDataType: Record<string, number>;
}

export default function MatchCacheManagement() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [incompleteEntries, setIncompleteEntries] = useState<CacheEntry[]>([]);
  const [searchResults, setSearchResults] = useState<CacheEntry[] | null>(null);
  const [searchId, setSearchId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cleanupResult, setCleanupResult] = useState<Record<string, number> | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [statsResult, incompleteResult] = await Promise.all([
      getMatchCacheStats(),
      getIncompleteCacheEntries(),
    ]);
    setStats(statsResult);
    if (incompleteResult.success) setIncompleteEntries(incompleteResult.data);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = async () => {
    const id = parseInt(searchId);
    if (isNaN(id)) return;
    const result = await searchMatchCache(id);
    if (result.success) setSearchResults(result.data);
  };

  const handleDelete = async (matchId: number, dataType?: string) => {
    const key = `${matchId}-${dataType || 'all'}`;
    setDeletingId(key);
    const result = await deleteMatchCache(matchId, dataType as 'full' | 'matchPlayerStats' | 'power' | undefined);
    if (result.success) {
      await loadData();
      if (searchResults) {
        const updated = await searchMatchCache(matchId);
        if (updated.success) setSearchResults(updated.data);
      }
    }
    setDeletingId(null);
  };

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    setCleanupResult(null);
    const result = await runCleanup();
    if (result.success && result.result) {
      setCleanupResult(result.result as Record<string, number>);
      await loadData();
    }
    setIsCleaningUp(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">경기 캐시 관리</h2>

      {/* 통계 */}
      {stats && (
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">{stats.totalEntries.toLocaleString()}</div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400">전체</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.completeEntries.toLocaleString()}</div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400">완전</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{stats.incompleteEntries}</div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400">불완전</div>
            </div>
            <div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400 space-y-1">
                {Object.entries(stats.byDataType).map(([type, count]) => (
                  <div key={type}>{type}: {count.toLocaleString()}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 만료 데이터 정리 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-[#F0F0F0]">만료 데이터 정리</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">AI 예측 만료, 에러 이미지, 오래된 투표 등 정리</p>
          </div>
          <button
            onClick={handleCleanup}
            disabled={isCleaningUp}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-[13px]"
          >
            {isCleaningUp ? <Spinner size="xs" /> : <RefreshCw className="w-4 h-4" />}
            실행
          </button>
        </div>
        {cleanupResult && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-[13px]">
            {Object.entries(cleanupResult).map(([key, value]) => (
              <div key={key} className="text-green-800 dark:text-green-400">{key}: {value}건</div>
            ))}
          </div>
        )}
      </div>

      {/* 경기 ID 검색 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-[#F0F0F0] mb-3">경기 ID 검색</h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="경기 ID 입력"
            className="flex-1 px-3 py-2 border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-[13px]"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-[13px]"
          >
            <Search className="w-4 h-4" />
            검색
          </button>
        </div>
        {searchResults !== null && (
          <div className="mt-4">
            {searchResults.length === 0 ? (
              <p className="text-[13px] text-gray-500 dark:text-gray-400">캐시 없음</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((entry) => (
                  <CacheEntryRow
                    key={`${entry.match_id}-${entry.data_type}`}
                    entry={entry}
                    onDelete={handleDelete}
                    isDeleting={deletingId === `${entry.match_id}-${entry.data_type}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 불완전 캐시 목록 */}
      {incompleteEntries.length > 0 && (
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-[#F0F0F0] mb-3">
            불완전 캐시 ({incompleteEntries.length}건)
          </h3>
          <div className="space-y-2">
            {incompleteEntries.map((entry) => (
              <CacheEntryRow
                key={`${entry.match_id}-${entry.data_type}`}
                entry={entry}
                onDelete={handleDelete}
                isDeleting={deletingId === `${entry.match_id}-${entry.data_type}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CacheEntryRow({
  entry,
  onDelete,
  isDeleting,
}: {
  entry: CacheEntry;
  onDelete: (matchId: number, dataType?: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
      <div className="flex items-center gap-3">
        <Database className="w-4 h-4 text-gray-400" />
        <div>
          <span className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
            #{entry.match_id}
          </span>
          <span className="ml-2 px-2 py-0.5 text-[11px] rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {entry.data_type}
          </span>
          <span className={`ml-2 px-2 py-0.5 text-[11px] rounded ${
            entry.is_complete
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
          }`}>
            {entry.is_complete ? '완전' : '불완전'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-gray-400">
          {new Date(entry.updated_at).toLocaleDateString('ko-KR')}
        </span>
        <button
          onClick={() => onDelete(entry.match_id, entry.data_type)}
          disabled={isDeleting}
          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
        >
          {isDeleting ? <Spinner size="xs" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
