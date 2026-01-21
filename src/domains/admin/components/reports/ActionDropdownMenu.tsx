'use client';

import { createPortal } from 'react-dom';
import { Trash2, EyeOff, UserX } from 'lucide-react';
import type { ReportWithReporter, DropdownPosition, ActionType } from './types';

interface ActionDropdownMenuProps {
  report: ReportWithReporter;
  position: DropdownPosition;
  onAction: (action: ActionType, suspendDays?: number) => void;
  onOpenAuthorSuspension: () => void;
}

export function ActionDropdownMenu({
  report,
  position,
  onAction,
  onOpenAuthorSuspension,
}: ActionDropdownMenuProps) {
  const isContentType =
    report.target_type === 'post' ||
    report.target_type === 'comment' ||
    report.target_type === 'match_comment';

  const isUserType = report.target_type === 'user';

  return createPortal(
    <div
      className="fixed w-52 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg shadow-xl z-[9999] overflow-hidden action-menu max-h-96 overflow-y-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="py-2">
        {/* 게시글/댓글/응원댓글 조치 */}
        {isContentType && (
          <>
            <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-black/7 dark:border-white/10">
              콘텐츠 조치
            </div>
            <button
              onClick={() => onAction('delete')}
              className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-3 flex-shrink-0" />
              <div>
                <div className="font-medium">완전 삭제</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">되돌릴 수 없습니다</div>
              </div>
            </button>
            <button
              onClick={() => onAction('hide')}
              className="w-full text-left px-4 py-3 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 flex items-center transition-colors"
            >
              <EyeOff className="w-4 h-4 mr-3 flex-shrink-0" />
              <div>
                <div className="font-medium">숨김 처리</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">복구 가능합니다</div>
              </div>
            </button>
          </>
        )}

        {/* 사용자 정지 조치 */}
        {isUserType && (
          <>
            <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-black/7 dark:border-white/10">
              사용자 정지
            </div>
            <button
              onClick={() => onAction('suspend_user', 3)}
              className="w-full text-left px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 flex items-center transition-colors"
            >
              <UserX className="w-4 h-4 mr-3 flex-shrink-0" />
              <div>
                <div className="font-medium">3일 정지</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">경고 수준</div>
              </div>
            </button>
            <button
              onClick={() => onAction('suspend_user', 7)}
              className="w-full text-left px-4 py-3 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 flex items-center transition-colors"
            >
              <UserX className="w-4 h-4 mr-3 flex-shrink-0" />
              <div>
                <div className="font-medium">7일 정지</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">일반 제재</div>
              </div>
            </button>
            <button
              onClick={() => onAction('suspend_user', 30)}
              className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center transition-colors"
            >
              <UserX className="w-4 h-4 mr-3 flex-shrink-0" />
              <div>
                <div className="font-medium">30일 정지</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">강력 제재</div>
              </div>
            </button>
          </>
        )}

        {/* 작성자 정지 옵션 */}
        {isContentType && (
          <div className="border-t border-black/7 dark:border-white/10 mt-2 pt-2">
            <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              작성자 정지
            </div>
            <button
              onClick={onOpenAuthorSuspension}
              className="w-full text-left px-4 py-3 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center transition-colors"
            >
              <UserX className="w-4 h-4 mr-3 flex-shrink-0" />
              <div>
                <div className="font-medium">작성자 정지 관리</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">정지 기간과 사유를 설정합니다</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
