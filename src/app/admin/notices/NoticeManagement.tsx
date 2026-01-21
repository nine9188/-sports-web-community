'use client';

import { useState } from 'react';
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
} from '@/domains/admin/hooks/useAdminNotices';

export default function NoticeManagement() {
  // React Query hooks
  const { data: notices = [], isLoading: noticesLoading } = useAdminNotices();
  const { data: boards = [], isLoading: boardsLoading } = useBoardsForNotice();

  // Mutations
  const setNoticeMutation = useSetNoticeByNumberMutation();
  const removeNoticeMutation = useRemoveNoticeMutation();
  const updateNoticeTypeMutation = useUpdateNoticeTypeMutation();

  // Form state
  const [selectedPostNumber, setSelectedPostNumber] = useState<string>('');
  const [selectedNoticeType, setSelectedNoticeType] = useState<NoticeType>('global');
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);
  const [noticeOrder, setNoticeOrder] = useState<number>(0);
  const [isMustRead, setIsMustRead] = useState<boolean>(false);

  // 게시판 선택 토글
  const toggleBoard = (boardId: string) => {
    setSelectedBoardIds((prev) =>
      prev.includes(boardId)
        ? prev.filter((id) => id !== boardId)
        : [...prev, boardId]
    );
  };

  // 공지 설정
  const handleSetNotice = async () => {
    if (!selectedPostNumber) {
      alert('게시글 번호를 입력하세요.');
      return;
    }

    if (selectedNoticeType === 'board' && selectedBoardIds.length === 0) {
      alert('게시판 공지는 최소 하나 이상의 게시판을 선택해야 합니다.');
      return;
    }

    try {
      const result = await setNoticeMutation.mutateAsync({
        postNumber: parseInt(selectedPostNumber, 10),
        noticeType: selectedNoticeType,
        boardIds: selectedNoticeType === 'board' ? selectedBoardIds : undefined,
        noticeOrder,
        isMustRead,
      });

      if (result.success) {
        alert(result.message);
        setSelectedPostNumber('');
        setSelectedBoardIds([]);
        setNoticeOrder(0);
        setIsMustRead(false);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('공지 설정 실패:', error);
      alert('공지 설정 중 오류가 발생했습니다.');
    }
  };

  // 공지 해제
  const handleRemoveNotice = async (postId: string) => {
    if (!confirm('이 게시글의 공지를 해제하시겠습니까?')) {
      return;
    }

    try {
      const result = await removeNoticeMutation.mutateAsync(postId);
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('공지 해제 실패:', error);
      alert('공지 해제 중 오류가 발생했습니다.');
    }
  };

  // 공지 타입 변경
  const handleChangeType = async (postId: string, newType: NoticeType, currentNotice: Post) => {
    // 게시판 공지로 변경하는 경우, 게시판 선택 필요
    if (newType === 'board') {
      const boardIdsInput = prompt(
        '공지를 표시할 게시판 ID들을 쉼표로 구분하여 입력하세요.\n\n사용 가능한 게시판:\n' +
        boards.map(b => `${b.name} (${b.id})`).join('\n'),
        currentNotice.notice_boards?.join(',') || ''
      );

      if (!boardIdsInput) {
        alert('게시판을 선택하지 않았습니다.');
        return;
      }

      const boardIds = boardIdsInput.split(',').map(id => id.trim()).filter(Boolean);
      if (boardIds.length === 0) {
        alert('최소 하나 이상의 게시판을 선택해야 합니다.');
        return;
      }

      try {
        const result = await updateNoticeTypeMutation.mutateAsync({
          postId,
          noticeType: newType,
          boardIds,
        });
        if (result.success) {
          alert(result.message);
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('공지 타입 변경 실패:', error);
        alert('공지 타입 변경 중 오류가 발생했습니다.');
      }
    } else {
      // 전체 공지로 변경
      try {
        const result = await updateNoticeTypeMutation.mutateAsync({
          postId,
          noticeType: newType,
        });
        if (result.success) {
          alert(result.message);
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('공지 타입 변경 실패:', error);
        alert('공지 타입 변경 중 오류가 발생했습니다.');
      }
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
      {/* 공지 설정 폼 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-black/7 dark:border-white/10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#F0F0F0]">
          게시글을 공지로 설정
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              게시글 번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={selectedPostNumber}
              onChange={(e) => setSelectedPostNumber(e.target.value)}
              placeholder="게시글 번호를 입력하세요 (예: 123)"
              className={cn("w-full px-4 py-2 rounded-lg", inputBaseStyles, focusStyles)}
              min="1"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              URL에서 확인: /boards/게시판/<strong>번호</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              중요도 선택
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
                  필독 공지 <span className="text-xs text-gray-500">(가장 상단에 표시)</span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    setSelectedBoardIds([]); // 전체 공지로 변경 시 게시판 선택 초기화
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
                <span className="text-gray-700 dark:text-gray-300">게시판 공지 (다중 선택 가능)</span>
              </label>
            </div>
          </div>

          {/* 게시판 공지 선택 시 게시판 다중 선택 표시 */}
          {selectedNoticeType === 'board' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                공지를 표시할 게시판 선택 (다중 선택)
              </label>
              <div className="max-h-64 overflow-y-auto border border-black/7 dark:border-white/10 rounded-lg p-3 bg-[#F5F5F5] dark:bg-[#232323]">
                {boardsLoading ? (
                  <p className="text-sm text-gray-500">게시판을 불러오는 중...</p>
                ) : boards.length === 0 ? (
                  <p className="text-sm text-gray-500">게시판이 없습니다.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {boards.map((board) => (
                      <label key={board.id} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-[#2D2D2D] rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBoardIds.includes(board.id)}
                          onChange={() => toggleBoard(board.id)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{board.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedBoardIds.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  선택된 게시판: {selectedBoardIds.length}개
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              공지 순서 (낮은 숫자가 먼저 표시됩니다)
            </label>
            <input
              type="number"
              value={noticeOrder}
              onChange={(e) => setNoticeOrder(parseInt(e.target.value, 10) || 0)}
              className={cn("w-full px-4 py-2 rounded-lg", inputBaseStyles, focusStyles)}
            />
          </div>

          <button
            onClick={handleSetNotice}
            disabled={setNoticeMutation.isPending}
            className="w-full px-4 py-2 bg-[#262626] dark:bg-[#3F3F3F] text-white font-medium rounded-lg hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] transition-colors disabled:opacity-50"
          >
            {setNoticeMutation.isPending ? '처리 중...' : '공지로 설정'}
          </button>
        </div>
      </div>

      {/* 현재 공지사항 목록 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-black/7 dark:border-white/10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#F0F0F0]">
          현재 공지사항 목록 ({notices.length}개)
        </h2>

        {notices.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            설정된 공지사항이 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="flex items-center gap-4 p-4 border border-black/7 dark:border-white/10 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#2D2D2D]"
              >
                {/* 공지 배지 */}
                {notice.notice_type && (
                  <NoticeBadge type={notice.notice_type} isMustRead={notice.is_must_read} />
                )}

                {/* 게시글 정보 */}
                <div className="flex-1">
                  <Link
                    href={`/boards/${notice.board?.slug || 'unknown'}/${notice.id}`}
                    className="group"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-[#F0F0F0] group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                      {notice.title}
                    </h3>
                  </Link>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {notice.is_must_read && <span className="text-red-600 dark:text-red-400 font-semibold">필독 | </span>}
                    게시판: {notice.board?.name || '알 수 없음'} |
                    순서: {notice.notice_order || 0} |
                    ID: {notice.id}
                    {notice.notice_type === 'board' && notice.notice_boards && (
                      <>
                        <br />
                        대상 게시판: {notice.notice_boards.length}개 ({notice.notice_boards.join(', ').substring(0, 50)}...)
                      </>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newType = notice.notice_type === 'global' ? 'board' : 'global';
                      handleChangeType(notice.id, newType, notice);
                    }}
                    disabled={updateNoticeTypeMutation.isPending}
                    className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-[#262626] dark:hover:bg-[#333333] text-gray-700 dark:text-gray-300 rounded transition-colors disabled:opacity-50"
                  >
                    타입 변경
                  </button>
                  <button
                    onClick={() => handleRemoveNotice(notice.id)}
                    disabled={removeNoticeMutation.isPending}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded transition-colors disabled:opacity-50"
                  >
                    공지 해제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
