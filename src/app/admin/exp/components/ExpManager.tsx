'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { toast } from 'react-toastify';
import { Button } from '@/shared/ui/button';
import { Award } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { 
  LEVEL_EXP_REQUIREMENTS, 
  calculateLevelFromExp as calcLevelFromExp,
  calculateLevelProgress as calcProgress
} from '@/shared/utils/level-icons';
import { getExpHistory } from '@/shared/actions/admin-actions';

interface UserInfo {
  id: string;
  nickname?: string;
  exp?: number;
  level?: number;
}

interface ExpHistoryItem {
  id: string;
  user_id: string | null;
  exp: number;
  reason: string;
  created_at: string | null;
}

interface ExpManagerProps {
  adminUser: User | null;
  selectedUser: UserInfo | null;
  onRefreshData: () => Promise<void>;
  onSelectUser?: (user: UserInfo) => void;
}

export default function ExpManager({ 
  adminUser, 
  selectedUser, 
  onRefreshData,
  onSelectUser
}: ExpManagerProps) {
  const [expAmountInput, setExpAmountInput] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expHistory, setExpHistory] = useState<ExpHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 사용자 선택 시 내역 불러오기
  useEffect(() => {
    if (selectedUser) {
      fetchExpHistory(selectedUser.id);
    }
  }, [selectedUser]);

  // 경험치 내역 조회 함수
  const fetchExpHistory = async (userId: string) => {
    try {
      setLoadingHistory(true);
      
      // 서버 액션을 사용하여 전체 내역 가져오기
      const result = await getExpHistory(50);
      
      if (result.success && result.history) {
        // 특정 사용자의 내역만 필터링
        const userHistory = result.history.filter(item => item.userId === userId);
        setExpHistory(userHistory.map(item => ({
          id: item.id,
          user_id: item.userId,
          exp: item.exp,
          reason: item.reason,
          created_at: item.createdAt
        })));
      } else {
        console.error('경험치 내역 조회 실패:', result.error);
        setExpHistory([]);
      }
    } catch (error) {
      console.error('경험치 내역 조회 중 오류:', error);
      setExpHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 경험치 조정 함수
  const handleAdjustExp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 문자열을 숫자로 변환
    const expAmount = parseInt(expAmountInput, 10);
    
    if (!selectedUser) {
      toast.error('사용자를 선택해주세요.');
      return;
    }
    
    if (isNaN(expAmount) || expAmountInput === '') {
      toast.error('유효한 경험치 금액을 입력해주세요.');
      return;
    }
    
    if (!reason) {
      toast.error('사유를 입력해주세요.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const supabase = getSupabaseBrowser();
      
      // 현재 사용자의 경험치 및 레벨 데이터
      const userExp = selectedUser.exp || 0;
      let updatedExp = 0;
      let updatedLevel = 1;
      
      // 1. RPC 함수 호출 시도
      try {
        const { error } = await supabase.rpc('admin_adjust_exp', {
          admin_id: adminUser?.id || '',
          target_user_id: selectedUser.id,
          exp_amount: expAmount,
          reason_text: reason
        });
        
        if (error) {
          throw error;
        }
        
        // RPC 성공했으므로 최신 데이터 조회 (테이블에 변경된 데이터)
        const { data: updatedUserData, error: fetchError } = await supabase
          .from('profiles')
          .select('id, nickname, exp, level')
          .eq('id', selectedUser.id)
          .single();
          
        if (fetchError) {
          // 오류 발생해도 계속 진행, UI는 계산된 값으로 업데이트
          updatedExp = Math.max(0, userExp + expAmount);
          updatedLevel = calcLevelFromExp(updatedExp);
        } else {
          // 서버에서 가져온 최신 값 사용
          updatedExp = updatedUserData.exp || 0;
          updatedLevel = updatedUserData.level || 1;
        }
        
      } catch {
        // 2. RPC 실패 시 직접 처리
        // 2.1. 새 경험치 및 레벨 계산
        updatedExp = Math.max(0, userExp + expAmount);
        updatedLevel = calcLevelFromExp(updatedExp);
        
        // 2.2. 프로필 업데이트
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            exp: updatedExp,
            level: updatedLevel
          })
          .eq('id', selectedUser.id);
          
        if (updateError) {
          throw updateError;
        }
        
        // 2.3. 경험치 내역 기록 시도
        try {
          const { error: historyError } = await supabase
            .from('exp_history')
            .insert({
              user_id: selectedUser.id,
              exp: expAmount,
              reason: reason
            });
            
          if (historyError) {
            console.error("경험치 기록 실패:", historyError);
          }
        } catch {
          console.error("경험치 기록 예외 발생");
        }
      }
      
      // 성공 메시지 표시
      toast.success(`${selectedUser.nickname}님의 경험치가 ${expAmount > 0 ? '증가' : '차감'}되었습니다.`);
      
      // 입력 폼 초기화
      setExpAmountInput('');
      setReason('');
      
      // 사용자 정보 UI 업데이트 (로컬 상태)
      const updatedUser = {
        ...selectedUser,
        exp: updatedExp,
        level: updatedLevel
      };
      
      // onSelectUser prop이 있으면 호출
      if (typeof onSelectUser === 'function') {
        onSelectUser(updatedUser);
      }
      
      // 데이터 다시 불러오기
      onRefreshData();
      
      // 내역 다시 불러오기
      fetchExpHistory(selectedUser.id);
      
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`경험치 조정 실패: ${error.message}`);
      } else {
        toast.error('경험치 조정에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 경험치 백분율 계산 함수
  const calculateExpPercentage = (user: UserInfo): number => {
    const currentLevel = user.level || 1;
    const currentExp = user.exp || 0;
    
    // 유틸리티 함수 사용
    return calcProgress(currentLevel, currentExp);
  };
  
  // 선택된 사용자가 없는 경우
  if (!selectedUser) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">좌측에서 사용자를 선택하세요</p>
        </div>
      </div>
    );
  }

  // 레벨 안전하게 계산
  const safeLevel = selectedUser.level || 1;
  const currentLevelExp = LEVEL_EXP_REQUIREMENTS[safeLevel - 1] || 0;
  const nextLevelExp = LEVEL_EXP_REQUIREMENTS[safeLevel] || '최대';

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">
          {selectedUser.nickname || '사용자'}님의 경험치 관리
        </h2>
        
        {/* 경험치 정보 표시 */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">레벨:</div>
            <div className="font-semibold text-blue-700">Lv. {safeLevel}</div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">현재 경험치:</div>
            <div className="font-semibold text-blue-700">{selectedUser.exp || 0} EXP</div>
          </div>
          
          {/* 경험치 조정 미리보기 */}
          {expAmountInput && !isNaN(parseInt(expAmountInput, 10)) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">조정 후:</span>
                <span className={`font-medium ${parseInt(expAmountInput, 10) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.max(0, (selectedUser.exp || 0) + parseInt(expAmountInput, 10))} EXP
                  {' '}
                  <span className="text-gray-500">
                    (Lv. {calcLevelFromExp(Math.max(0, (selectedUser.exp || 0) + parseInt(expAmountInput, 10)))})
                  </span>
                </span>
              </div>
            </div>
          )}
          
          {/* 경험치 진행바 */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${calculateExpPercentage(selectedUser)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>레벨 {safeLevel} ({currentLevelExp} EXP)</span>
              <span>레벨 {safeLevel + 1} ({nextLevelExp} EXP)</span>
            </div>
          </div>
        </div>
        
        {/* 경험치 조정 폼 */}
        <form onSubmit={handleAdjustExp} className="mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">경험치 조정</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  value={expAmountInput}
                  onChange={(e) => setExpAmountInput(e.target.value)}
                  className="block w-full pr-12 p-2 sm:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">EXP</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                양수(+)는 증가, 음수(-)는 차감입니다
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="block w-full p-2 sm:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="경험치 조정 사유"
              />
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '경험치 조정하기'}
          </Button>
        </form>
        
        {/* 경험치 내역 */}
        <div>
          <h3 className="text-md font-semibold mb-2">최근 경험치 내역</h3>
          
          {loadingHistory ? (
            <div className="text-center py-4 text-gray-500">
              내역을 불러오는 중...
            </div>
          ) : expHistory.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              경험치 내역이 없습니다
            </div>
          ) : (
            <div className="overflow-hidden border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일시</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">경험치</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사유</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {new Date(item.created_at || '').toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className={`px-4 py-2 text-sm font-medium ${item.exp > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.exp > 0 ? `+${item.exp}` : item.exp}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
