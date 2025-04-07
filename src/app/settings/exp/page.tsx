'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase-browser';
import { Award, Heart, MessageSquare, FileText, TrendingUp } from 'lucide-react';

interface ExpHistory {
  id: string;
  user_id: string;
  exp: number;
  reason: string;
  created_at: string;
}

export default function ExpSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);
  const [expPercentage, setExpPercentage] = useState(0);
  const [nextLevelExp, setNextLevelExp] = useState(100);
  const [expHistory, setExpHistory] = useState<ExpHistory[]>([]);
  
  // 경험치 및 레벨 정보 가져오기
  useEffect(() => {
    if (!user) return;
    
    const fetchExpData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // 프로필에서 경험치와 레벨 정보 가져오기
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('exp, level')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('프로필 데이터 조회 오류:', profileError);
          if (profileError.code === 'PGRST116') {
            // 프로필이 없는 경우 생성 시도
            try {
              await supabase.from('profiles').insert({
                id: user.id,
                exp: 0,
                level: 1,
                points: 0
              });
            } catch (insertError) {
              console.error('프로필 생성 실패:', insertError);
            }
          }
          
          // 기본값 설정
          setExp(0);
          setLevel(1);
          setNextLevelExp(100);
          setExpPercentage(0);
          return;
        }
        
        // exp_history 테이블이 없는 경우를 대비한 조회
        let historyData: ExpHistory[] = [];
        try {
          const { data, error: historyError } = await supabase
            .from('exp_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
            
          if (!historyError && data) {
            historyData = data;
          } else if (historyError && historyError.code !== 'PGRST116') {
            console.error('경험치 내역 조회 오류:', historyError);
          }
        } catch (historyQueryError) {
          console.error('경험치 내역 조회 중 오류:', historyQueryError);
        }
        
        // 상태 업데이트
        if (profileData) {
          const currentExp = profileData.exp || 0;
          const currentLevel = profileData.level || 1;
          
          // 다음 레벨에 필요한 경험치 계산 (간단한 공식 예시)
          const requiredExp = currentLevel * 100;
          
          // 현재 레벨에서의 최소 경험치
          const currentLevelMinExp = (currentLevel - 1) * 100;
          
          // 경험치 퍼센트 계산
          const expInCurrentLevel = currentExp - currentLevelMinExp;
          const expNeededForNextLevel = requiredExp - currentLevelMinExp;
          const percentage = Math.min(Math.round((expInCurrentLevel / expNeededForNextLevel) * 100), 100);
          
          setExp(currentExp);
          setLevel(currentLevel);
          setNextLevelExp(requiredExp);
          setExpPercentage(percentage);
        }
        
        // 경험치 내역 설정
        setExpHistory(historyData);
        
      } catch (error) {
        console.error('경험치 데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpData();
  }, [user]);
  
  // 히스토리 이유에 따른 아이콘 렌더링
  const renderReasonIcon = (reason: string) => {
    if (reason.includes('게시글')) return <FileText className="h-3.5 w-3.5 text-blue-500" />;
    if (reason.includes('댓글')) return <MessageSquare className="h-3.5 w-3.5 text-green-500" />;
    if (reason.includes('좋아요')) return <Heart className="h-3.5 w-3.5 text-red-500" />;
    if (reason.includes('로그인')) return <TrendingUp className="h-3.5 w-3.5 text-purple-500" />;
    if (reason.includes('레벨')) return <Award className="h-3.5 w-3.5 text-yellow-500" />;
    return null;
  };
  
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  
  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">경험치</h2>
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">경험치</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg border mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">레벨</span>
          </div>
          <span className="text-base font-bold">{level}</span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">경험치</span>
          </div>
          <span className="text-base font-bold">{exp} EXP</span>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span>다음 레벨까지</span>
            <span>{expPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${expPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-1 text-gray-500">
            <span>레벨 {level}</span>
            <span>레벨 {level + 1} ({nextLevelExp} EXP)</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-medium mb-3">경험치 획득 내역</h3>
        {expHistory.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내역</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">경험치</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expHistory.map((history) => (
                  <tr key={history.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {renderReasonIcon(history.reason) && (
                          <span className="mr-2">{renderReasonIcon(history.reason)}</span>
                        )}
                        <span className="text-xs">{history.reason}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-medium ${history.exp > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {history.exp > 0 ? `+${history.exp}` : history.exp} EXP
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(history.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">경험치 획득 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
} 