'use client';

import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import type { Post, NoticeType } from '@/domains/boards/types/post';
import { NoticeBadge } from '@/domains/boards/components/notice';
import Spinner from '@/shared/components/Spinner';
import { inputBaseStyles, focusStyles } from '@/shared/styles';
import { cn } from '@/shared/utils/cn';
import {
  useAdminNotices,
  useBoardsForNotice,
  useSetNoticeByNumberMutation,
  useRemoveNoticeMutation,
  useUpdateNoticeTypeMutation,
  useToggleWidgetMutation,
} from '@/domains/admin/hooks/useAdminNotices';
import HierarchicalBoardPicker from './HierarchicalBoardPicker';

export default function NoticeManagement() {
  const { data: notices = [], isLoading: noticesLoading } = useAdminNotices();
  const { data: boards = [], isLoading: boardsLoading } = useBoardsForNotice();

  const setNoticeMutation = useSetNoticeByNumberMutation();
  const removeNoticeMutation = useRemoveNoticeMutation();
  const updateNoticeTypeMutation = useUpdateNoticeTypeMutation();
  const toggleWidgetMutation = useToggleWidgetMutation();

  const [selectedPostNumber, setSelectedPostNumber] = useState<string>('');
  const [selectedNoticeType, setSelectedNoticeType] = useState<NoticeType>('global');
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);
  const [isMustRead, setIsMustRead] = useState<boolean>(false);
  const [showInWidget, setShowInWidget] = useState<boolean>(false);
  const [boardPickerNoticeId, setBoardPickerNoticeId] = useState<string | null>(null);
  const [boardPickerBoardIds, setBoardPickerBoardIds] = useState<string[]>([]);

  const orderedNotices = useMemo(() => {
    const noticeCreatedAtTs = (value?: string | null) => {
      if (!value) return 0;
      const ts = Date.parse(value);
      return Number.isNaN(ts) ? 0 : ts;
    };
    const noticeGroupRank = (notice: { is_must_read?: boolean; notice_type?: NoticeType | null }) => {
      if (notice.is_must_read) return 0;
      if (notice.notice_type === 'global') return 1;
      if (notice.notice_type === 'board') return 2;
      return 3;
    };

    return [...notices].sort((a, b) => {
      const groupDiff = noticeGroupRank(a) - noticeGroupRank(b);
      if (groupDiff !== 0) return groupDiff;
      return noticeCreatedAtTs(b.created_at) - noticeCreatedAtTs(a.created_at);
    });
  }, [notices]);

  const toggleBoard = (boardId: string) => {
    setSelectedBoardIds((prev) =>
      prev.includes(boardId)
        ? prev.filter((id) => id !== boardId)
        : [...prev, boardId]
    );
  };

  const toggleBoardForPicker = (boardId: string) => {
    setBoardPickerBoardIds((prev) =>
      prev.includes(boardId)
        ? prev.filter((id) => id !== boardId)
        : [...prev, boardId]
    );
  };

  const cancelBoardPicker = () => {
    setBoardPickerNoticeId(null);
    setBoardPickerBoardIds([]);
  };

  const handleSetNotice = async () => {
    if (!selectedPostNumber) {
      toast.warning('게시글 번호를 입력하세요.');
      return;
    }

    if (selectedNoticeType === 'board' && selectedBoardIds.length === 0) {
      toast.warning('게시판을 하나 이상 선택하세요.');
      return;
    }

    try {
      const result = await setNoticeMutation.mutateAsync({
        postNumber: parseInt(selectedPostNumber, 10),
        noticeType: selectedNoticeType,
        boardIds: selectedNoticeType === 'board' ? selectedBoardIds : undefined,
        isMustRead,
        showInWidget,
      });

      if (result.success) {
        toast.success(result.message);
        setSelectedPostNumber('');
        setSelectedBoardIds([]);
        setIsMustRead(false);
        setShowInWidget(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('공지 설정 실패:', error);
      toast.error('공지 설정 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveNotice = async (postId: string) => {
    if (!confirm('이 공지를 해제하시겠습니까?')) {
      return;
    }

    try {
      const result = await removeNoticeMutation.mutateAsync(postId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('공지 해제 실패:', error);
      toast.error('공지 해제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleWidget = async (postId: string, currentValue: boolean) => {
    try {
      const result = await toggleWidgetMutation.mutateAsync({
        postId,
        showInWidget: !currentValue,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('위젯 표시 변경 실패:', error);
      toast.error('위젯 표시 변경 중 오류가 발생했습니다.');
    }
  };

  const handleChangeType = async (postId: string, newType: NoticeType, currentNotice: Post) => {
    if (newType === 'board') {
      setBoardPickerNoticeId(postId);
      setBoardPickerBoardIds(currentNotice.notice_boards ?? []);
      return;
    }

    try {
      const result = await updateNoticeTypeMutation.mutateAsync({
        postId,
        noticeType: newType,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('공지 타입 변경 실패:', error);
      toast.error('공지 타입 변경 중 오류가 발생했습니다.');
    }
  };

  const handleApplyBoardTypeChange = async (postId: string) => {
    if (boardPickerBoardIds.length === 0) {
      toast.warning('게시판을 하나 이상 선택하세요.');
      return;
    }

    try {
      const result = await updateNoticeTypeMutation.mutateAsync({
        postId,
        noticeType: 'board',
        boardIds: boardPickerBoardIds,
      });
      if (result.success) {
        toast.success(result.message);
        cancelBoardPicker();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('공지 타입 변경 실패:', error);
      toast.error('공지 타입 변경 중 오류가 발생했습니다.');
    }
  };

  if (noticesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-black/7 dark:border-white/10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#F0F0F0]">
          공지 설정
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
              게시글 번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={selectedPostNumber}
              onChange={(e) => setSelectedPostNumber(e.target.value)}
              placeholder="게시글 번호 (예: 123)"
              className={cn('w-full px-4 py-2 rounded-lg', inputBaseStyles, focusStyles)}
              min="1"
            />
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
              URL에서 확인: /boards/게시판/<strong>번호</strong>
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
              중요도
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isMustRead}
                  onChange={(e) => setIsMustRead(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  필독
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInWidget}
                onChange={(e) => setShowInWidget(e.target.checked)}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">
                전체 게시글 위젯에 표시
              </span>
            </label>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
              공지 타입
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="global"
                  checked={selectedNoticeType === 'global'}
                  onChange={(e) => {
                    setSelectedNoticeType(e.target.value as NoticeType);
                    setSelectedBoardIds([]);
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">전체 공지</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="board"
                  checked={selectedNoticeType === 'board'}
                  onChange={(e) => setSelectedNoticeType(e.target.value as NoticeType)}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">게시판 공지</span>
              </label>
            </div>
          </div>

          {selectedNoticeType === 'board' && (
            <div>
              <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                공지를 표시할 게시판 선택
              </label>
              <HierarchicalBoardPicker
                boards={boards}
                boardsLoading={boardsLoading}
                selectedBoardIds={selectedBoardIds}
                onToggleBoard={toggleBoard}
              />
            </div>
          )}

          <button
            onClick={handleSetNotice}
            disabled={setNoticeMutation.isPending}
            className="w-full px-4 py-2 bg-[#262626] dark:bg-[#3F3F3F] text-white font-medium rounded-lg hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] transition-colors disabled:opacity-50"
          >
            {setNoticeMutation.isPending ? '저장 중...' : '공지로 설정'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-black/7 dark:border-white/10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#F0F0F0]">
          현재 공지사항 목록 ({orderedNotices.length}개)
        </h2>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4">
          정렬: 필독(최신순) &gt; 전체공지(최신순) &gt; 게시판공지(최신순)
        </p>

        {orderedNotices.length === 0 ? (
          <p className="text-center text-gray-500 py-8">설정된 공지사항이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {orderedNotices.map((notice) => (
              <div
                key={notice.id}
                className="border border-black/7 dark:border-white/10 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#2D2D2D] transition-colors"
              >
                <div className="flex items-center gap-4 p-4">
                  {notice.notice_type && (
                    <NoticeBadge type={notice.notice_type} isMustRead={notice.is_must_read} />
                  )}

                  <div className="flex-1">
                    <Link
                      href={`/boards/${notice.board?.slug || 'unknown'}/${notice.id}`}
                      className="group"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-[#F0F0F0] group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                        {notice.title}
                      </h3>
                    </Link>
                    <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                      {notice.is_must_read && <span className="text-red-600 dark:text-red-400 font-semibold">필독 | </span>}
                      게시판 {notice.board?.name || '알 수 없음'} | ID: {notice.id}
                      {notice.notice_type === 'board' && notice.notice_boards && (
                        <>
                          <br />
                          대상 게시판: {notice.notice_boards.length}개
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleWidget(notice.id, Boolean((notice as any).show_in_widget))}
                      disabled={toggleWidgetMutation.isPending}
                      className={`px-3 py-1 text-[13px] rounded transition-colors disabled:opacity-50 ${
                        (notice as any).show_in_widget
                          ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-200'
                          : 'bg-gray-200 hover:bg-gray-300 dark:bg-[#262626] dark:hover:bg-[#333333] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      위젯 {(notice as any).show_in_widget ? 'ON' : 'OFF'}
                    </button>
                    <select
                      value={notice.notice_type || 'global'}
                      onChange={(e) => {
                        const newType = e.target.value as NoticeType;
                        handleChangeType(notice.id, newType, notice);
                      }}
                      disabled={updateNoticeTypeMutation.isPending}
                      className="px-2 py-1 text-[13px] bg-gray-200 dark:bg-[#262626] text-gray-700 dark:text-gray-300 rounded transition-colors disabled:opacity-50 border-none cursor-pointer"
                    >
                      <option value="global">전체 공지</option>
                      <option value="board">게시판 공지</option>
                    </select>
                    <button
                      onClick={() => handleRemoveNotice(notice.id)}
                      disabled={removeNoticeMutation.isPending}
                      className="px-3 py-1 text-[13px] bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded transition-colors disabled:opacity-50"
                    >
                      공지 해제
                    </button>
                  </div>
                </div>

                {boardPickerNoticeId === notice.id && (
                  <div className="px-4 pb-4">
                    <div className="text-[13px] text-gray-700 dark:text-gray-300 mb-2">
                      공지를 표시할 게시판 선택
                    </div>
                    <HierarchicalBoardPicker
                      boards={boards}
                      boardsLoading={boardsLoading}
                      selectedBoardIds={boardPickerBoardIds}
                      onToggleBoard={toggleBoardForPicker}
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleApplyBoardTypeChange(notice.id)}
                        disabled={updateNoticeTypeMutation.isPending}
                        className="px-3 py-1 text-[13px] bg-gray-200 hover:bg-gray-300 dark:bg-[#262626] dark:hover:bg-[#333333] text-gray-700 dark:text-gray-300 rounded transition-colors disabled:opacity-50"
                      >
                        적용
                      </button>
                      <button
                        onClick={cancelBoardPicker}
                        className="px-3 py-1 text-[13px] bg-gray-100 hover:bg-gray-200 dark:bg-[#1F1F1F] dark:hover:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 rounded transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
