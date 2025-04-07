'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createClient } from '@/app/lib/supabase-browser';
import { useAuth } from '@/app/context/AuthContext';

interface User {
  id: string;
  email: string;
  nickname: string;
  is_admin: boolean;
  created_at: string;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const { user: currentUser } = useAuth();

  // 사용자 목록 불러오기
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      const supabase = createClient();
      // profiles 테이블에서 사용자 정보 가져오기
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // 데이터 가공
      const formattedUsers = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        nickname: profile.nickname || profile.full_name || '',
        is_admin: profile.is_admin || false,
        created_at: profile.created_at || '',
      })) || [];
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      toast.error('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 관리자 권한 토글
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // 처리 중인 상태 추가
      setProcessingIds(prev => [...prev, userId]);
      
      const supabase = createClient();
      
      // 업데이트 실행 (.select() 제거)
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);
        
      if (error) {
        console.error('Supabase 에러:', error);
        throw error;
      }
      
      // 성공 메시지
      toast.success(`사용자의 관리자 권한이 ${!currentStatus ? '부여' : '해제'}되었습니다.`);
      
      // 페이지 새로고침 대신 데이터 다시 불러오기
      await fetchUsers();
      
    } catch (error) {
      console.error('권한 변경 오류:', error);
      
      // 사용자 친화적인 오류 메시지
      if (error instanceof Error) {
        toast.error(error.message || '권한 변경 중 오류가 발생했습니다.');
      } else {
        toast.error('권한 변경 중 오류가 발생했습니다.');
      }
      
      // UI 상태 원복 (에러 발생 시 변경된 상태를 원복)
      setUsers(prevUsers => [...prevUsers]);
    } finally {
      // 처리 중인 상태 제거
      setProcessingIds(prev => prev.filter(id => id !== userId));
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          사용자 목록
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          관리자 권한을 부여하거나 해제할 수 있습니다.
        </p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-6">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : users.length > 0 ? (
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이메일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  닉네임
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리자 권한
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.nickname || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.is_admin ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        관리자
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        일반 사용자
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                      className={`${
                        user.is_admin 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-blue-600 hover:text-blue-900'
                      }`}
                      disabled={user.id === currentUser?.id || processingIds.includes(user.id)} // 자기 자신의 권한은 변경 불가 + 처리 중인 항목 비활성화
                      title={
                        user.id === currentUser?.id 
                          ? '자신의 권한은 변경할 수 없습니다' 
                          : processingIds.includes(user.id)
                            ? '처리 중...'
                            : ''
                      }
                    >
                      {processingIds.includes(user.id) 
                        ? '처리 중...' 
                        : user.is_admin 
                          ? '관리자 권한 해제' 
                          : '관리자 권한 부여'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">등록된 사용자가 없습니다.</p>
        </div>
      )}
    </div>
  );
} 