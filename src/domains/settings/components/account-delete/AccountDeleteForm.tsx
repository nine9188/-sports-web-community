'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
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

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, Math.min(3, Math.ceil(local.length / 2)));
  return `${visible}${'*'.repeat(local.length - visible.length)}@${domain}`;
}

function maskNickname(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

const CONFIRM_TEXT = '삭제하겠습니다';

export default function AccountDeleteForm({ email, nickname }: AccountDeleteFormProps) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handlePasswordConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordConfirm(e.target.value);
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('비밀번호를 입력해주세요.');
      return;
    }
    if (!passwordConfirm) {
      toast.error('비밀번호 확인을 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    setConfirmInput('');
    setIsConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setConfirmInput('');
  };

  const handleDeleteAccount = async () => {
    if (confirmInput !== CONFIRM_TEXT) return;

    setIsLoading(true);

    try {
      const response = await deleteAccount(password);

      if (response.success) {
        window.location.href = '/signin?message=계정이 성공적으로 삭제되었습니다.';
        return;
      } else {
        toast.error(response.message);
        setIsConfirmOpen(false);
      }
    } catch (error) {
      console.error('회원탈퇴 처리 중 오류:', error);
      toast.error('회원탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* 계정 정보 확인 */}
      <div className="space-y-1">
        <div className="flex items-center text-[13px]">
          <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">계정 정보:</span>
          <span className="ml-1 text-gray-900 dark:text-[#F0F0F0]">{maskNickname(nickname)} ({maskEmail(email)})</span>
        </div>
      </div>

      {/* 비밀번호 확인 폼 */}
      <form onSubmit={handleOpenConfirm} className="mt-6">
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="password" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
              비밀번호
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
          </div>

          <div className="space-y-1">
            <label htmlFor="passwordConfirm" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
              비밀번호 확인
            </label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={passwordConfirm}
              onChange={handlePasswordConfirmChange}
              placeholder="비밀번호 재입력"
              className="w-full px-3 py-2 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-md outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] transition-colors"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              계정 삭제를 진행하려면 비밀번호를 두 번 입력해주세요.
            </p>
          </div>

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
              <div className="text-[13px] text-gray-700 dark:text-gray-300">
                <p className="mb-2">정말로 계정을 삭제하시겠습니까?</p>
                <p className="mb-2">계정 삭제 시 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.</p>
                <p className="font-medium text-red-600 dark:text-red-400">이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <label className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                삭제하시려면 <span className="text-red-600 dark:text-red-400">{CONFIRM_TEXT}</span>를 입력해주세요.
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={CONFIRM_TEXT}
                className="w-full px-3 py-2 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-md outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] transition-colors"
                disabled={isLoading}
              />
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
              disabled={isLoading || confirmInput !== CONFIRM_TEXT}
            >
              {isLoading ? '처리 중...' : '삭제 확인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
