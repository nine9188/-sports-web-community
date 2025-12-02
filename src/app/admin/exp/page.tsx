'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/shared/context/AuthContext';
import { getExpUsers } from '@/shared/actions/admin-actions';
import UserList from './components/UserList';
import ExpManager from './components/ExpManager';
import { calculateLevelFromExp } from '@/shared/utils/level-icons';

interface UserInfo {
  id: string;
  nickname: string;
  exp: number;
  level: number;
}

export default function ExpManagementPage() {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

  // 사용자 데이터 불러오기 함수
  const fetchUsers = useCallback(async () => {
    if (!adminUser) {
      return;
    }
    
    try {
      setLoading(true);
      
      const result = await getExpUsers();
      
      if (!result.success) {
        toast.error(`사용자 목록을 불러오지 못했습니다: ${result.error}`);
        return;
      }
      
      // 결과 처리 - 레벨은 경험치에 따라 재계산
      const formattedData = (result.users || []).map(user => {
        const exp = user.exp || 0;
        const calculatedLevel = calculateLevelFromExp(exp);
        
        return {
          id: user.id,
          nickname: user.nickname || '이름 없음',
          exp: exp,
          level: calculatedLevel // 계산된 레벨 사용
        };
      });
      
      setUsers(formattedData);
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
  }, [fetchUsers]);

  // 데이터 새로고침
  const refreshData = async () => {
    await fetchUsers();
    
    // 선택된 사용자가 있는 경우 최신 정보로 업데이트
    if (selectedUser) {
      const result = await getExpUsers();
      if (result.success && result.users) {
        const updatedUser = result.users.find(user => user.id === selectedUser.id);
        if (updatedUser) {
          const exp = updatedUser.exp || 0;
          const calculatedLevel = calculateLevelFromExp(exp);
          setSelectedUser({
            id: updatedUser.id,
            nickname: updatedUser.nickname || '이름 없음',
            exp: exp,
            level: calculatedLevel
          });
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">경험치 & 레벨 관리</h1>
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
        
        {/* 경험치 관리 컴포넌트 */}
        <div className="lg:col-span-2">
          <ExpManager
            adminUser={adminUser}
            selectedUser={selectedUser}
            onRefreshData={refreshData}
          />
        </div>
      </div>
    </div>
  );
} 