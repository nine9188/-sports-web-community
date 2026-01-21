'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/shared/context/AuthContext';
import { getPointsUsers } from '@/shared/actions/admin-actions';
import UserList from './components/UserList';
import PointManager from './components/PointManager';

interface UserInfo {
  id: string;
  nickname?: string;
  points?: number;
}

export default function PointsManagementPage() {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

    // 사용자 데이터 불러오기 함수 - useCallback으로 메모이제이션
  const fetchUsers = useCallback(async () => {
    if (!adminUser) {
      return;
    }
    
    try {
      setLoading(true);
      
      const result = await getPointsUsers();
      
      if (!result.success) {
        toast.error(`사용자 목록을 불러오지 못했습니다: ${result.error}`);
        return;
      }
      
      setUsers(result.users || []);
    } catch (err) {
      console.error('사용자 목록 조회 예외:', err);
      toast.error('사용자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [adminUser]);

  // 모든 사용자 불러오기
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // fetchUsers를 의존성 배열에 추가

  // 데이터 새로고침
  const refreshData = async () => {
    await fetchUsers();
    
    if (selectedUser) {
      // 새로고침 후 선택된 사용자 정보 업데이트
      const result = await getPointsUsers();
      if (result.success && result.users) {
        const updatedUser = result.users.find(user => user.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">포인트 관리</h1>
        <Button onClick={refreshData} variant="outline">새로고침</Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 사용자 목록 컴포넌트 */}
        <div className="lg:col-span-1">
          <UserList
            users={users}
            loading={loading}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
          />
        </div>
        
        {/* 포인트 관리 컴포넌트 */}
        <div className="lg:col-span-2">
          <PointManager
            adminUser={adminUser}
            selectedUser={selectedUser}
            onRefreshData={refreshData}
          />
        </div>
      </div>
    </div>
  );
} 