'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
  DialogBody,
  DialogFooter,
} from '@/shared/components/ui';
import { endDeal } from '../../actions/hotdeal';

interface HotdealEndButtonProps {
  postId: string;
}

const END_REASONS = [
  { value: '품절', label: '품절' },
  { value: '마감', label: '마감' },
  { value: '가격변동', label: '가격 변동' },
  { value: '링크오류', label: '링크 오류' },
  { value: '기타', label: '기타' },
] as const;

/**
 * 핫딜 종료 버튼 및 모달
 * 작성자만 핫딜을 종료 처리할 수 있음
 */
export function HotdealEndButton({ postId }: HotdealEndButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('품절');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('종료 사유를 선택해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await endDeal({
        postId,
        reason: selectedReason as any,
      });

      if (result.success) {
        toast.success('핫딜이 종료되었습니다');
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || '핫딜 종료 처리에 실패했습니다');
      }
    } catch (error) {
      console.error('핫딜 종료 오류:', error);
      toast.error('핫딜 종료 처리 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
        >
          종료 처리
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>핫딜 종료 처리</DialogTitle>
          <DialogCloseButton disabled={isSubmitting} />
        </DialogHeader>

        <DialogBody>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            종료 사유를 선택해주세요. 종료 후에는 게시글 목록에서 "종료" 배지가 표시됩니다.
          </p>

          {/* 종료 사유 선택 */}
          <div className="space-y-2">
            {END_REASONS.map((reason) => (
              <label
                key={reason.value}
                className="flex items-center gap-3 p-3 rounded-lg border border-black/5 dark:border-white/10 cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors"
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 text-red-600 dark:text-red-400"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">
                  {reason.label}
                </span>
              </label>
            ))}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? '처리 중...' : '종료 처리'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
