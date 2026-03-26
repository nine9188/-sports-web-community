'use client';

import { useEffect, useState, useCallback } from 'react';
import { Image, RefreshCw, AlertTriangle } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import {
  getAssetCacheStats,
  getAssetErrors,
  forceRefreshAsset,
} from '@/domains/admin/actions/cacheManagement';
import type { AssetType } from '@/domains/livescore/actions/images/constants';

interface AssetError {
  type: string;
  entity_id: number;
  error_message: string | null;
  checked_at: string | null;
}

interface AssetStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  team_logo: '팀 로고',
  league_logo: '리그 로고',
  player_photo: '선수 사진',
  coach_photo: '감독 사진',
  venue_photo: '경기장 사진',
};

export default function AssetCacheManagement() {
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [errors, setErrors] = useState<AssetError[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshResult, setRefreshResult] = useState<{ id: string; success: boolean; url: string } | null>(null);

  // 수동 검색
  const [searchType, setSearchType] = useState<AssetType>('team_logo');
  const [searchEntityId, setSearchEntityId] = useState('');

  const loadData = useCallback(async () => {
    const [statsResult, errorsResult] = await Promise.all([
      getAssetCacheStats(),
      getAssetErrors(),
    ]);
    setStats(statsResult);
    if (errorsResult.success) setErrors(errorsResult.data);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async (type: AssetType, entityId: number) => {
    const key = `${type}-${entityId}`;
    setRefreshingId(key);
    setRefreshResult(null);
    const result = await forceRefreshAsset(type, entityId);
    setRefreshResult({ id: key, success: result.success, url: result.url });
    setRefreshingId(null);
    await loadData();
  };

  const handleManualSearch = async () => {
    const id = parseInt(searchEntityId);
    if (isNaN(id)) return;
    await handleRefresh(searchType, id);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">이미지 캐시 관리</h2>

      {/* 통계 */}
      {stats && (
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">{stats.total.toLocaleString()}</div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400">전체</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{(stats.byStatus['ready'] || 0).toLocaleString()}</div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400">정상 (ready)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">{stats.byStatus['pending'] || 0}</div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400">대기 (pending)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{stats.byStatus['error'] || 0}</div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400">에러</div>
            </div>
          </div>

          <div className="text-[13px] text-gray-500 dark:text-gray-400">
            <span className="font-medium">타입별:</span>{' '}
            {Object.entries(stats.byType).map(([type, count]) => (
              <span key={type} className="mr-3">{ASSET_TYPE_LABELS[type] || type} {count.toLocaleString()}</span>
            ))}
          </div>
        </div>
      )}

      {/* 수동 검색 및 강제 재다운로드 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-[#F0F0F0] mb-3">이미지 강제 재다운로드</h3>
        <div className="flex gap-2">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as AssetType)}
            className="px-3 py-2 border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-[13px]"
          >
            {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            type="number"
            value={searchEntityId}
            onChange={(e) => setSearchEntityId(e.target.value)}
            placeholder="ID 입력"
            className="flex-1 px-3 py-2 border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-[13px]"
            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
          />
          <button
            onClick={handleManualSearch}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-[13px]"
          >
            <RefreshCw className="w-4 h-4" />
            재다운로드
          </button>
        </div>
        {refreshResult && (
          <div className={`mt-3 p-3 rounded-lg text-[13px] ${
            refreshResult.success
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
          }`}>
            {refreshResult.success ? '재다운로드 성공' : '재다운로드 실패'}: {refreshResult.url}
          </div>
        )}
      </div>

      {/* 에러 목록 */}
      {errors.length > 0 && (
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-[#F0F0F0] mb-3">
            에러 목록 ({errors.length}건)
          </h3>
          <div className="space-y-2">
            {errors.map((err) => {
              const key = `${err.type}-${err.entity_id}`;
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <div>
                      <span className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                        {ASSET_TYPE_LABELS[err.type] || err.type} #{err.entity_id}
                      </span>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {err.error_message || '알 수 없는 에러'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400">
                      {err.checked_at ? new Date(err.checked_at).toLocaleDateString('ko-KR') : '-'}
                    </span>
                    <button
                      onClick={() => handleRefresh(err.type as AssetType, err.entity_id)}
                      disabled={refreshingId === key}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      {refreshingId === key ? <Spinner size="xs" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
