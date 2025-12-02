'use client';

import { useState, useEffect } from 'react';
import { Search, X, Coins } from 'lucide-react';

interface UserInfo {
  id: string;
  nickname?: string;
  points?: number;
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
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">사용자 목록</h2>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="이름 또는 이메일로 검색"
            className="w-full p-2 pr-10 border rounded-md"
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            {searchTerm ? (
              <X 
                className="h-5 w-5 cursor-pointer" 
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
          <p>로딩 중...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="overflow-y-auto max-h-[560px]">
          <ul className="divide-y">
            {filteredUsers.map(user => (
              <li 
                key={user.id}
                className={`py-3 px-3 cursor-pointer hover:bg-gray-50 ${
                  selectedUser?.id === user.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelectUser(user)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{user.nickname || '이름 없음'}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-blue-600">{user.points || 0} P</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
} 