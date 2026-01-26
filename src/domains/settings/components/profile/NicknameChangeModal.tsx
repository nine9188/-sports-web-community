'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AlertCircle, Check } from 'lucide-react';
import { useNicknameTicket } from '@/domains/shop/actions/consumables';
import { toast } from 'react-toastify';
import Spinner from '@/shared/components/Spinner';
import { siteConfig } from '@/shared/config';
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

interface NicknameChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname: string;
  ticketCount: number;
  onSuccess: (newNickname: string) => void;
}

export default function NicknameChangeModal({
  isOpen,
  onClose,
  currentNickname,
  ticketCount,
  onSuccess
}: NicknameChangeModalProps) {
  const [newNickname, setNewNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = newNickname.trim();

    if (trimmed.length < 2) {
      setError('닉네임은 최소 2자 이상이어야 합니다.');
      return;
    }

    if (trimmed.length > 20) {
      setError('닉네임은 최대 20자까지 가능합니다.');
      return;
    }

    if (trimmed === currentNickname) {
      setError('현재 닉네임과 동일합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await useNicknameTicket(trimmed);

      if (result.success && result.newNickname) {
        toast.success('닉네임이 변경되었습니다!');
        onSuccess(result.newNickname);
        setNewNickname('');
        onClose();
      } else {
        setError(result.error || '닉네임 변경에 실패했습니다.');
      }
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNewNickname('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent variant="bottomSheet">
        <DialogHeader>
          <DialogTitle>닉네임 변경</DialogTitle>
          <DialogCloseButton disabled={isSubmitting} />
        </DialogHeader>

        <DialogBody>
          {/* 보유 티켓 안내 */}
          <div className="mb-4 p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Image
                src={siteConfig.logo}
                alt="변경권"
                width={16}
                height={16}
                className="dark:invert"
              />
              <span>보유 변경권: <strong className="text-gray-900 dark:text-[#F0F0F0]">{ticketCount}개</strong></span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              변경 시 1개가 소모됩니다.
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit}>
            {/* 현재 닉네임 */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                현재 닉네임
              </label>
              <div className="px-3 py-2 bg-[#EAEAEA] dark:bg-[#333333] rounded-md text-gray-900 dark:text-[#F0F0F0]">
                {currentNickname}
              </div>
            </div>

            {/* 새 닉네임 */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                새 닉네임
              </label>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => {
                  setNewNickname(e.target.value);
                  setError(null);
                }}
                placeholder="새 닉네임을 입력하세요"
                maxLength={20}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                2~20자
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center gap-2 text-sm text-red-800 dark:text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* 버튼 */}
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !newNickname.trim()}
                className="flex-1 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="xs" />
                    변경 중...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    변경하기
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
