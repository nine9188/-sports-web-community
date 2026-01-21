'use client';

import { Users } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import type { NotificationUser, SendMode } from './types';

interface UserSelectionProps {
  users: NotificationUser[];
  selectedUserIds: Set<string>;
  sendMode: SendMode;
  isLoading: boolean;
  onToggleUser: (userId: string) => void;
  onToggleAll: () => void;
}

export function UserSelection({
  users,
  selectedUserIds,
  sendMode,
  isLoading,
  onToggleUser,
  onToggleAll,
}: UserSelectionProps) {
  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-black/7 dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">사용자 선택</h2>
        {sendMode === 'selected' && (
          <button
            onClick={onToggleAll}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            {selectedUserIds.size === users.length ? '전체 해제' : '전체 선택'}
          </button>
        )}
      </div>

      {sendMode === 'all' ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>전체 사용자에게 발송됩니다</p>
          <p className="text-sm mt-2">총 {users.length}명의 사용자</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <Spinner size="lg" className="mx-auto" />
              <p className="text-gray-500 dark:text-gray-400 mt-2">사용자 목록 로딩 중...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>사용자가 없습니다</p>
            </div>
          ) : (
            users.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-black/7 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#2D2D2D] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.has(user.id)}
                  onChange={() => onToggleUser(user.id)}
                  className="w-4 h-4 rounded accent-gray-700 dark:accent-gray-400"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {user.nickname || '닉네임 없음'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email} • Lv.{user.level}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
