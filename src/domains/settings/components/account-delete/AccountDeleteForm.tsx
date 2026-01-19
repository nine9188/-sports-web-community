'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, AlertTriangle } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
  DialogBody,
  DialogFooter,
} from '@/shared/components/ui';
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
          <Button
            type="submit"
            variant="destructive"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '회원 탈퇴'}
          </Button>
        </div>
      </form>

      {/* 확인 모달 */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>회원 탈퇴 확인</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>

          <DialogBody>
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="mb-2">정말로 계정을 삭제하시겠습니까?</p>
                <p className="mb-2">계정 삭제 시 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.</p>
                <p className="font-medium text-red-600 dark:text-red-400">이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancelDelete}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : '삭제 확인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
