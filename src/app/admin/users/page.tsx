'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/shared/context/AuthContext';
import SuspensionManager from '@/domains/admin/components/SuspensionManager';
import { checkUserSuspension } from '@/domains/admin/actions/suspension';
import { useAdminUsers, useToggleAdminMutation, useConfirmEmailMutation } from '@/domains/admin/hooks/useAdminUsers';
import { Button } from '@/shared/components/ui';
import Spinner from '@/shared/components/Spinner';

interface User {
  id: string;
  email: string;
  nickname: string;
  is_admin: boolean;
  created_at?: string;
  last_sign_in_at?: string | null;
  is_suspended?: boolean;
  suspended_until?: string | null;
  suspended_reason?: string | null;
  email_confirmed?: boolean;
}

export default function UsersAdminPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const { user: currentUser } = useAuth();

  // React Query hooks
  const { data: users = [], isLoading, refetch } = useAdminUsers();
  const toggleAdminMutation = useToggleAdminMutation();
  const confirmEmailMutation = useConfirmEmailMutation();

  // 관리자 권한 토글
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    toggleAdminMutation.mutate(
      { userId, currentStatus },
      {
        onSuccess: ({ newStatus }) => {
          toast.success(`사용자의 관리자 권한이 ${newStatus ? '부여' : '해제'}되었습니다.`);
        },
        onError: (error) => {
          console.error('권한 변경 오류:', error);
          toast.error(error instanceof Error ? error.message : '권한 변경 중 오류가 발생했습니다.');
        },
      }
    );
  };

  // 계정 정지 관리 모달 열기
  const openSuspensionModal = async (user: User) => {
    try {
      const result = await checkUserSuspension(user.id);
      if (result.success) {
        setSelectedUser({
          ...user,
          is_suspended: result.isSuspended,
          suspended_until: result.suspendedUntil,
          suspended_reason: result.suspendedReason
        });
      } else {
        setSelectedUser(user);
      }
      setShowSuspensionModal(true);
    } catch (error) {
      console.error('정지 상태 확인 오류:', error);
      setSelectedUser(user);
      setShowSuspensionModal(true);
    }
  };

  // 정지 상태 업데이트 후 콜백
  const handleSuspensionUpdate = () => {
    refetch();
    setShowSuspensionModal(false);
    setSelectedUser(null);
  };

  // 이메일 인증 처리
  const handleConfirmEmail = async (userId: string) => {
    confirmEmailMutation.mutate(userId, {
      onSuccess: () => {
        toast.success('이메일 인증이 완료되었습니다.');
      },
      onError: (error) => {
        console.error('이메일 인증 처리 오류:', error);
        toast.error(error instanceof Error ? error.message : '이메일 인증 처리 중 오류가 발생했습니다.');
      },
    });
  };

  // mutation 처리 중인 ID 목록
  const processingIds = [
    ...(toggleAdminMutation.isPending ? [toggleAdminMutation.variables?.userId] : []),
    ...(confirmEmailMutation.isPending ? [confirmEmailMutation.variables] : []),
  ].filter(Boolean) as string[];

  return (
    <>
      <div className="bg-white dark:bg-[#1D1D1D] shadow overflow-hidden sm:rounded-lg border border-black/7 dark:border-white/10">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-[#F0F0F0]">
            사용자 목록
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            관리자 권한을 부여하거나 해제하고, 계정 정지를 관리할 수 있습니다.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : users.length > 0 ? (
          <div className="border-t border-black/7 dark:border-white/10 px-4 py-5 sm:p-0">
            <table className="min-w-full divide-y divide-black/7 dark:divide-white/10">
              <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    이메일
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    닉네임
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    가입일
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    마지막 접속
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1D1D1D] divide-y divide-black/7 dark:divide-white/10">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.nickname || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.last_sign_in_at ?
                        new Date(user.last_sign_in_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) :
                        '정보 없음'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="space-y-1">
                        {user.is_admin ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                            관리자
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            일반 사용자
                          </span>
                        )}

                        {user.is_suspended ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                            정지됨
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            정상
                          </span>
                        )}

                        {user.email_confirmed ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                            이메일 인증됨
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                            이메일 미인증
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="space-y-2">
                        <Button
                          variant="link"
                          onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                          className={`block p-0 h-auto ${
                            user.is_admin
                              ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                          disabled={user.id === currentUser?.id || processingIds.includes(user.id)}
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
                        </Button>

                        <Button
                          variant="link"
                          onClick={() => openSuspensionModal(user)}
                          className="block p-0 h-auto text-orange-600 hover:text-orange-900"
                          disabled={user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? '자신의 계정은 정지할 수 없습니다' : ''}
                        >
                          계정 정지 관리
                        </Button>

                        {!user.email_confirmed && (
                          <Button
                            variant="link"
                            onClick={() => handleConfirmEmail(user.id)}
                            className="block p-0 h-auto text-emerald-600 hover:text-emerald-900"
                            disabled={processingIds.includes(user.id)}
                          >
                            {processingIds.includes(user.id) ? '처리 중...' : '이메일 인증 처리'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">등록된 사용자가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 계정 정지 관리 모달 */}
      {showSuspensionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-black/7 dark:border-white/10 w-96 shadow-lg rounded-md bg-white dark:bg-[#1D1D1D]">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-[#F0F0F0]">
                  계정 정지 관리
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSuspensionModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 h-8 w-8"
                >
                  ✕
                </Button>
              </div>
              
              <SuspensionManager
                userId={selectedUser.id}
                userNickname={selectedUser.nickname || selectedUser.email}
                currentSuspension={{
                  is_suspended: selectedUser.is_suspended || false,
                  suspended_until: selectedUser.suspended_until || null,
                  suspended_reason: selectedUser.suspended_reason || null
                }}
                onUpdate={handleSuspensionUpdate}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 