'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase-browser';
import { Heart, MessageSquare, FileText, Coins } from 'lucide-react';

interface PointHistory {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  created_at: string;
}

export default function PointsSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // 포인트 정보 가져오기
  useEffect(() => {
    if (!user) return;
    
    const fetchPointsData = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        
        // 프로필에서 포인트 정보 가져오기
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('프로필 데이터 조회 오류 상세:', profileError.message, profileError.details);
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
          setPoints(0);
        } else if (profileData) {
          const currentPoints = profileData.points || 0;
          setPoints(currentPoints);
        }
        
        // DB 함수로 포인트 내역 조회 시도
        try {
          // 먼저 RPC 함수로 조회 시도
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_user_point_history', { 
              user_id: user.id 
            });
            
          if (!rpcError && rpcData) {
            setPointHistory(rpcData);
          } else {
            // RPC 함수가 없으면 일반 쿼리로 시도
            const { data, error: historyError } = await supabase
              .from('point_history')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(10);
              
            if (historyError) {
              console.error('포인트 내역 조회 오류 상세:', historyError.message, historyError.details);
              setError('포인트 내역을 불러올 수 없습니다.');
            } else {
              setPointHistory(data || []);
            }
          }
        } catch (historyQueryError) {
          console.error('포인트 내역 조회 중 예외 발생:', historyQueryError);
          setError('포인트 내역 조회 중 오류가 발생했습니다.');
        }
        
      } catch (error) {
        console.error('포인트 데이터 로딩 오류 상세:', error);
        setError('포인트 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPointsData();
  }, [user]);
  
  // 히스토리 이유에 따른 아이콘 렌더링
  const renderReasonIcon = (reason: string) => {
    if (reason.includes('게시글')) return <FileText className="h-3.5 w-3.5 text-blue-500" />;
    if (reason.includes('댓글')) return <MessageSquare className="h-3.5 w-3.5 text-green-500" />;
    if (reason.includes('좋아요') || reason.includes('추천')) return <Heart className="h-3.5 w-3.5 text-red-500" />;
    if (reason.includes('로그인')) return <Coins className="h-3.5 w-3.5 text-purple-500" />;
    return null;
  };
  
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dateString || '날짜 정보 없음';
    }
  };
  
  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">포인트</h2>
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">포인트</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg border mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">보유 포인트</span>
          </div>
          <span className="text-base font-bold">{points} P</span>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          <p>포인트는 게시판 이용 및 각종 활동을 통해 획득할 수 있습니다.</p>
          <p>포인트는 특별 서비스 이용 시 사용될 수 있습니다.</p>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-medium mb-3">포인트 내역</h3>
        
        {error && (
          <div className="text-center py-3 bg-red-50 text-red-500 rounded-lg mb-3">
            <p className="text-xs">{error}</p>
          </div>
        )}
        
        {!error && pointHistory.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내역</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">포인트</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pointHistory.map((history) => (
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
                      <span className={`text-xs font-medium ${history.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {history.points > 0 ? `+${history.points}` : history.points} P
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
        ) : !error ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">포인트 내역이 없습니다.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
} 