'use client';

import { useState, useEffect } from 'react';
import { Search, X, Award } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import { inputBaseStyles, focusStyles } from '@/shared/styles';
import { cn } from '@/shared/utils/cn';

interface UserInfo {
  id: string;
  nickname: string;
  exp: number;
  level: number;
}

interface UserListProps {
  users: UserInfo[];
  loading: boolean;
  selectedUser: UserInfo | null;
  onSelectUser: (user: UserInfo) => void;
}

export default function UserList({ users, loading, selectedUser, onSelectUser }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([]);

  // 검색어에 따른 필터링
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6 h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] mb-2">사용자 목록</h2>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="이름으로 검색"
            className={cn("w-full p-2 pr-10 rounded-md", inputBaseStyles, focusStyles)}
          />
          <div className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500">
            {searchTerm ? (
              <X
                className="h-5 w-5 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setSearchTerm('')}
              />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Spinner size="md" className="mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 mt-2">로딩 중...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="overflow-y-auto max-h-[560px]">
          <ul className="divide-y divide-black/7 dark:divide-white/10">
            {filteredUsers.map(user => (
              <li
                key={user.id}
                className={`py-3 px-3 cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#2D2D2D] ${
                  selectedUser?.id === user.id ? 'bg-[#F5F5F5] dark:bg-[#2D2D2D]' : ''
                }`}
                onClick={() => onSelectUser(user)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-[#F0F0F0]">{user.nickname || '이름 없음'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Lv. {user.level || 1}</span>
                  </div>
                </div>

                {/* 경험치 진행바 */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gray-600 dark:bg-gray-400 h-1.5 rounded-full"
                      style={{ width: `${calculateExpPercentage(user)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>{user.exp || 0} EXP</span>
                    <span>{(user.level || 1) * 100} EXP</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

// 경험치 퍼센트 계산 함수
function calculateExpPercentage(user: UserInfo): number {
  const currentExp = user.exp || 0;
  
  // 간단한 진행률 계산 (레벨당 100 경험치로 가정)
  const levelExp = 100;
  const progress = (currentExp % levelExp) / levelExp * 100;
  return Math.min(progress, 100);
} 