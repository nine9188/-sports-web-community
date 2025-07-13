'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/shared/api/supabase';
import { toast } from 'react-toastify';
import { Button } from '@/shared/components/ui/button';
import { Coins } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { getPointHistory } from '@/shared/actions/admin-actions';
import { formatDate } from '@/shared/utils/date';

interface UserInfo {
  id: string;
  nickname?: string;
  points?: number;
}

interface PointHistoryItem {
  id: string;
  user_id: string | null;
  points: number;
  reason: string;
  created_at: string | null;
  admin_id?: string | null;
}

interface PointManagerProps {
  adminUser: User | null;
  selectedUser: UserInfo | null;
  onRefreshData: () => Promise<void>;
}

export default function PointManager({ adminUser, selectedUser, onRefreshData }: PointManagerProps) {
  const [pointHistory, setPointHistory] = useState<PointHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pointAmount, setPointAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 선택한 사용자가 변경될 때 내역 불러오기
  useEffect(() => {
    if (selectedUser) {
      fetchPointHistory(selectedUser.id);
    }
  }, [selectedUser]);

  // 포인트 내역 불러오기
  const fetchPointHistory = async (userId: string) => {
    try {
      setLoadingHistory(true);
      
      // 서버 액션을 사용하여 전체 내역 가져오기
      const result = await getPointHistory(50);
      
             if (result.success && result.history) {
         // 특정 사용자의 내역만 필터링
         const userHistory = result.history.filter(item => item.userId === userId);
         setPointHistory(userHistory.map(item => ({
           id: item.id,
           user_id: item.userId,
           points: item.points,
           reason: item.reason,
           created_at: item.createdAt,
           admin_id: item.adminId
         })));
       } else {
         console.error('포인트 내역 조회 실패:', result.error);
         setPointHistory([]);
       }
    } catch (error) {
      console.error('포인트 내역 조회 중 오류:', error);
      setPointHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 포인트 조정 함수
  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('사용자를 선택해주세요.');
      return;
    }
    
    if (!pointAmount) {
      toast.error('포인트 금액을 입력해주세요.');
      return;
    }
    
    if (!reason) {
      toast.error('사유를 입력해주세요.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const supabase = createClient();
      
      try {
        const { error } = await supabase.rpc('admin_adjust_points', {
          admin_id: adminUser?.id || '',
          target_user_id: selectedUser.id,
          points_amount: pointAmount,
          reason_text: reason
        });
        
        if (error) throw error;
        
      } catch {
        // RPC 실패 시 수동으로 처리
        // 1. 현재 포인트 조회
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', selectedUser.id)
          .single();
          
        if (userError) throw userError;
        
        const currentPoints = userData?.points || 0;
        const newPoints = Math.max(0, currentPoints + pointAmount);
        
        // 2. 포인트 업데이트
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', selectedUser.id);
          
        if (updateError) throw updateError;
        
        // 3. 내역 테이블 존재 여부 확인 및 추가 시도
        try {
          const { error: historyError } = await supabase
            .from('point_history')
            .insert([{
              user_id: selectedUser.id,
              points: pointAmount,
              reason: reason,
              admin_id: adminUser?.id
            }]);
            
          if (historyError && historyError.code !== '42P01') {
            console.error('포인트 내역 추가 실패:', historyError);
          }
        } catch {
          console.error('포인트 내역 추가 중 예외 발생');
        }
      }
      
      // 성공 메시지 표시
      toast.success(`${selectedUser.nickname || '사용자'}님의 포인트가 ${pointAmount > 0 ? '증가' : '차감'}되었습니다.`);
      
      // 입력 폼 초기화
      setPointAmount(0);
      setReason('');
      
      // 데이터 새로고침
      await onRefreshData();
      
      // 내역 다시 불러오기
      if (selectedUser) {
        fetchPointHistory(selectedUser.id);
      }
      
    } catch (error) {
      console.error('포인트 조정 실패:', error);
      toast.error('포인트 조정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 선택된 사용자가 없는 경우
  if (!selectedUser) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Coins className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">좌측에서 사용자를 선택하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">
          {selectedUser.nickname || '사용자'}님의 포인트 관리
        </h2>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <span>현재 포인트:</span>
          <span className="font-bold text-blue-600">{selectedUser.points || 0} P</span>
        </div>
        
        <form onSubmit={handleAdjustPoints} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">포인트 금액</label>
              <div className="relative">
                <input
                  type="number"
                  value={pointAmount}
                  onChange={e => setPointAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-md"
                  placeholder="예: 100 또는 -50"
                />
                <div className="absolute inset-y-0 right-3 flex items-center text-gray-500">
                  <Coins className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                양수는 포인트 추가, 음수는 차감입니다.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">사유</label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="예: 이벤트 보상"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !pointAmount || !reason}
              className="w-32"
            >
              {isSubmitting ? '처리 중...' : '저장'}
            </Button>
          </div>
        </form>
      </div>
      
      {/* 포인트 내역 */}
      <div>
        <h3 className="text-lg font-medium mb-3">최근 포인트 내역</h3>
        
        {loadingHistory ? (
          <div className="text-center py-6">
            <p>로딩 중...</p>
          </div>
        ) : pointHistory.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">일시</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">사유</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">포인트</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">관리자</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pointHistory.map(history => (
                  <tr key={history.id}>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {history.created_at ? (formatDate(history.created_at as string) || '-') : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {history.reason}
                    </td>
                    <td className={`px-4 py-2 text-sm font-medium text-right ${
                      history.points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {history.points > 0 ? `+${history.points}` : history.points}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {history.admin_id ? '관리자' : '시스템'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <p className="text-gray-500">포인트 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
} 