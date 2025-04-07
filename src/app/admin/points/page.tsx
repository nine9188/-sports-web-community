'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { toast } from 'react-toastify';
import { Button } from '@/app/ui/button';
import { useAuth } from '@/app/context/AuthContext';
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
    if (!adminUser) return;
    
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, points');
      
      if (error) {
        toast.error('사용자 목록을 불러오지 못했습니다.');
        return;
      }
      
      const formattedData = (data || []).map(user => ({
        id: user.id,
        nickname: user.nickname || '이름 없음',
        points: user.points || 0
      }));
      
      setUsers(formattedData);
    } catch {
      // 오류 처리
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
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, points')
        .eq('id', selectedUser.id)
        .single();
        
      if (!error && data) {
        const updatedUser = {
          ...data,
          nickname: data.nickname || '사용자'
        };
        setSelectedUser(updatedUser);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">포인트 관리</h1>
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