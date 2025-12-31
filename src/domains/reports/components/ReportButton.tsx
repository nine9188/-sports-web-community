'use client';

import { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DialogCloseButton
} from '@/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from 'react-toastify';
import { createReport } from '../actions';
import { REPORT_REASONS, ReportTargetType, ReportReason } from '../types';

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'lg';
  showText?: boolean;
}

export default function ReportButton({
  targetType,
  targetId,
  className = '',
  variant = 'ghost',
  size = 'sm',
  showText = false
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('신고 사유를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createReport({
        targetType,
        targetId,
        reason: reason as ReportReason,
        description: description.trim() || undefined
      });

      if (result.success) {
        toast.success('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
        setIsOpen(false);
        setReason('');
        setDescription('');
      } else {
        toast.error(result.error || '신고 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('신고 제출 오류:', error);
      toast.error('신고 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetText = () => {
    switch (targetType) {
      case 'post':
        return '게시글';
      case 'comment':
        return '댓글';
      case 'user':
        return '사용자';
      default:
        return '내용';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`text-gray-500 hover:text-red-500 ${className}`}
        >
          <Flag className="w-4 h-4" />
          {showText && <span className="ml-1">신고</span>}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {/* 헤더 */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {getTargetText()} 신고
          </DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        {/* 본문 */}
        <DialogBody className="space-y-4">
          {/* 신고 사유 */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              신고 사유 <span className="text-red-500">*</span>
            </label>
            <Select value={reason} onValueChange={(value: ReportReason) => setReason(value)}>
              <SelectTrigger>
                <SelectValue placeholder="신고 사유를 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REPORT_REASONS).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 상세 설명 */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              상세 설명 (선택사항)
            </label>
            <Textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="신고 사유에 대한 자세한 설명을 입력해주세요..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description.length}/500
            </div>
          </div>

          {/* 신고 전 확인사항 */}
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-400">
                <p className="font-medium mb-1">신고 전 확인사항</p>
                <ul className="text-xs space-y-1">
                  <li>• 허위 신고 시 제재를 받을 수 있습니다</li>
                  <li>• 신고 내용은 관리자가 검토 후 조치합니다</li>
                  <li>• 중복 신고는 불가능합니다</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogBody>

        {/* 푸터 */}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? '처리 중...' : '신고하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
