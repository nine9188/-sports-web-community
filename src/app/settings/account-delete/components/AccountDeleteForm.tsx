'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, AlertTriangle } from 'lucide-react';
import { deleteAccount } from '../actions';

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
    <div className="space-y-6">
      {/* 계정 정보 확인 */}
      <div className="space-y-1">
        <div className="flex items-center text-sm">
          <User className="h-4 w-4 mr-2 text-gray-400" />
          <span className="font-medium">계정 정보:</span>
          <span className="ml-1">{nickname} ({email})</span>
        </div>
      </div>
      
      {/* 비밀번호 확인 폼 */}
      <form onSubmit={handleOpenConfirm}>
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            비밀번호 확인
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="현재 비밀번호"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">
            계정 삭제를 진행하려면 현재 비밀번호를 입력해주세요.
          </p>
          {errorMessage && (
            <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '회원 탈퇴'}
          </button>
        </div>
      </form>

      {/* 확인 모달 */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <h3 className="text-lg font-medium text-gray-900">회원 탈퇴 확인</h3>
            </div>
            
            <div className="text-sm text-gray-500 mb-6">
              <p className="mb-2">정말로 계정을 삭제하시겠습니까?</p>
              <p className="mb-2">계정 삭제 시 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.</p>
              <p className="font-medium text-red-600">이 작업은 되돌릴 수 없습니다.</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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