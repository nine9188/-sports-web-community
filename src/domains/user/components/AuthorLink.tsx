'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { User, Flag, AlertTriangle } from 'lucide-react';
import UserIcon from '@/shared/components/UserIcon';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseButton,
  NativeSelect
} from '@/shared/components/ui';
import { focusStyles, inputGrayBgStyles } from '@/shared/styles';
import { cn } from '@/shared/utils/cn';
import { toast } from 'react-toastify';
import { createReport } from '@/domains/reports/actions';
import { REPORT_REASONS, ReportReason } from '@/domains/reports/types';

// 신고 사유 옵션
const REPORT_REASON_OPTIONS = Object.entries(REPORT_REASONS).map(([, value]) => ({
  value,
  label: value
}));

interface AuthorLinkProps {
  nickname: string;
  oddsUserId?: string;
  publicId?: string | null;
  iconUrl?: string | null;
  level?: number;
  exp?: number;
  iconSize?: number;
  className?: string;
  showIcon?: boolean;
  /** 이미지 우선 로딩 (LCP 요소에 사용) */
  priority?: boolean;
}

/**
 * 작성자 링크 컴포넌트
 * 클릭 시 드롭다운 메뉴를 표시하고, 프로필 보기 클릭 시 페이지로 이동합니다.
 */
export default function AuthorLink({
  nickname,
  oddsUserId,
  publicId,
  iconUrl,
  level = 1,
  exp,
  iconSize = 16,
  className = '',
  showIcon = true,
  priority = false,
}: AuthorLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalDropdownRef = useRef<HTMLDivElement>(null);

  // 클라이언트 마운트 체크 및 모바일 감지
  useEffect(() => {
    setIsMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);
      const isOutsideDropdown = portalDropdownRef.current && !portalDropdownRef.current.contains(target);

      if (isOutsideButton && isOutsideDropdown) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (publicId && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
      setIsOpen(prev => !prev);
    }
  }, [publicId]);

  const handleReportClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    setIsReportOpen(true);
  }, []);

  const handleReportSubmit = async () => {
    if (!reason) {
      toast.error('신고 사유를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createReport({
        targetType: 'user',
        targetId: oddsUserId,
        reason: reason as ReportReason,
        description: description.trim() || undefined
      });

      if (result.success) {
        toast.success('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
        setIsReportOpen(false);
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

  const content = (
    <>
      {showIcon && (
        <div className="mr-0.5 flex-shrink-0" aria-hidden="true">
          <UserIcon
            iconUrl={iconUrl}
            level={level}
            exp={exp}
            size={iconSize}
            alt=""
            priority={priority}
          />
        </div>
      )}
      <span
        className="text-xs text-gray-600 dark:text-gray-400 truncate"
        title={nickname || '익명'}
        style={{ maxWidth: '100px' }}
      >
        {nickname || '익명'}
      </span>
    </>
  );

  // 모바일에서는 클릭 비활성화 - 단순 텍스트로 표시
  // PC에서만 프로필 드롭다운 활성화
  if (publicId && !isMobile) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`flex items-center flex-shrink-0 hover:underline cursor-pointer ${className}`}
        >
          {content}
        </button>

        {isOpen && isMounted && createPortal(
          <div
            ref={portalDropdownRef}
            className="fixed z-[9999] min-w-[120px] bg-white dark:bg-[#1D1D1D] border border-black/10 dark:border-white/10 rounded-md overflow-hidden"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <Link
              href={`/user/${publicId}`}
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] flex items-center gap-2 transition-colors"
            >
              <User className="w-4 h-4" />
              프로필 보기
            </Link>
            {oddsUserId && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleReportClick}
                className="w-full px-3 py-2 h-auto justify-start text-sm text-gray-700 dark:text-gray-300 rounded-none"
              >
                <Flag className="w-4 h-4 mr-2" />
                신고하기
              </Button>
            )}
          </div>,
          document.body
        )}

        {/* 신고 모달 */}
        {oddsUserId && (
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                사용자 신고
              </DialogTitle>
              <DialogCloseButton />
            </DialogHeader>

            <DialogBody className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  신고 사유 <span className="text-red-500">*</span>
                </label>
                <NativeSelect
                  value={reason || ''}
                  onValueChange={(value) => setReason(value as ReportReason)}
                  options={REPORT_REASON_OPTIONS}
                  placeholder="신고 사유를 선택해주세요"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  상세 설명 (선택사항)
                </label>
                <textarea
                  className={cn('w-full min-h-[80px] rounded-md px-3 py-2 text-sm resize-none', inputGrayBgStyles, focusStyles)}
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

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsReportOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleReportSubmit}
                disabled={!reason || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? '처리 중...' : '신고하기'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      {content}
    </div>
  );
}
