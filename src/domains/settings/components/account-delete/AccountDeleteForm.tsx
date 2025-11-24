'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, AlertTriangle } from 'lucide-react';
import { deleteAccount } from '@/domains/settings/actions/account';

interface AccountDeleteFormProps {
  email: string;
  nickname: string;
}

export default function AccountDeleteForm({ email, nickname }: AccountDeleteFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 패스워드 입력 핸들러
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setErrorMessage('');
  };

  // 회원탈퇴 확인 모달 열기
  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }
    setIsConfirmOpen(true);
  };

  // 회원탈퇴 취소
  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setPassword('');
  };

  // 회원탈퇴 처리
  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await deleteAccount(password);

      if (response.success) {
        // 탈퇴 성공 시 로그인 페이지로 리다이렉트
        router.push('/auth/sign-in?message=계정이 성공적으로 삭제되었습니다.');
      } else {
        setErrorMessage(response.message);
        setIsConfirmOpen(false);
      }
    } catch (error) {
      console.error('회원탈퇴 처리 중 오류:', error);
      setErrorMessage('회원탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* 계정 정보 확인 */}
      <div className="space-y-1">
        <div className="flex items-center text-sm">
          <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">계정 정보:</span>
          <span className="ml-1 text-gray-900 dark:text-[#F0F0F0]">{nickname} ({email})</span>
        </div>
      </div>

      {/* 비밀번호 확인 폼 */}
      <form onSubmit={handleOpenConfirm}>
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
            비밀번호 확인
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="현재 비밀번호"
            className="w-full px-3 py-2 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-md outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] transition-colors"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            계정 삭제를 진행하려면 현재 비밀번호를 입력해주세요.
          </p>
          {errorMessage && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '회원 탈퇴'}
          </button>
        </div>
      </form>

      {/* 확인 모달 */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 max-w-md w-full mx-4 border border-black/7 dark:border-white/10">
            <div className="mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-[#F0F0F0]">회원 탈퇴 확인</h3>
            </div>

            <div className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              <p className="mb-2">정말로 계정을 삭제하시겠습니까?</p>
              <p className="mb-2">계정 삭제 시 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.</p>
              <p className="font-medium text-red-600 dark:text-red-400">이 작업은 되돌릴 수 없습니다.</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="inline-flex justify-center py-2 px-4 border border-black/7 dark:border-white/10 text-sm font-medium rounded-md text-gray-900 dark:text-[#F0F0F0] bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
