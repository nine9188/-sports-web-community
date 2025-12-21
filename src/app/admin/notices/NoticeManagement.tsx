'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getNotices, setPostAsNotice, removeNotice, updateNoticeType } from '@/domains/boards/actions/posts';
import type { Post, NoticeType } from '@/domains/boards/types/post';
import { NoticeBadge } from '@/domains/boards/components/notice';
import { getSupabaseBrowser } from '@/shared/lib/supabase';

interface Board {
  id: string;
  name: string;
  slug: string;
}

export default function NoticeManagement() {
  const [notices, setNotices] = useState<Post[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostNumber, setSelectedPostNumber] = useState<string>('');
  const [selectedNoticeType, setSelectedNoticeType] = useState<NoticeType>('global');
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);
  const [noticeOrder, setNoticeOrder] = useState<number>(0);
  const [isMustRead, setIsMustRead] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  // 게시판 목록 불러오기
  const fetchBoards = async () => {
    try {
      const supabase = getSupabaseBrowser();

      if (!supabase) {
        console.error('Supabase 클라이언트를 생성할 수 없습니다.');
        return;
      }

      const { data, error } = await supabase
        .from('boards')
        .select('id, name, slug')
        .order('name', { ascending: true });

      if (error) {
        console.error('게시판 목록 조회 오류:', error);
        return;
      }

      if (data) {
        console.log('게시판 목록 불러오기 성공:', data.length);
        setBoards(data as Board[]);
      }
    } catch (error) {
      console.error('게시판 목록 불러오기 실패:', error);
    }
  };

  // 공지사항 목록 불러오기
  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await getNotices(); // boardId 없이 호출하면 모든 공지
      setNotices(data);
    } catch (error) {
      console.error('공지사항 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 클라이언트 마운트 감지
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 마운트된 후에만 데이터 로드
  useEffect(() => {
    if (isMounted) {
      fetchBoards();
      fetchNotices();
    }
  }, [isMounted]);

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
      const supabase = getSupabaseBrowser();

      if (!supabase) {
        alert('Supabase 클라이언트 생성 실패');
        return;
      }

      // post_number로 게시글 ID 찾기 (post_number는 전체적으로 유니크)
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('id')
        .eq('post_number', parseInt(selectedPostNumber, 10))
        .single();

      if (postError || !postData) {
        alert(`게시글 번호 "${selectedPostNumber}"를 찾을 수 없습니다.`);
        return;
      }

      // 공지 설정
      const result = await setPostAsNotice(
        postData.id,
        selectedNoticeType,
        selectedNoticeType === 'board' ? selectedBoardIds : undefined,
        noticeOrder,
        isMustRead
      );

      if (result.success) {
        alert(result.message);
        setSelectedPostNumber('');
        setSelectedBoardIds([]);
        setNoticeOrder(0);
        setIsMustRead(false);
        fetchNotices();
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
      const result = await removeNotice(postId);
      if (result.success) {
        alert(result.message);
        fetchNotices();
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
        const result = await updateNoticeType(postId, newType, boardIds);
        if (result.success) {
          alert(result.message);
          fetchNotices();
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
        const result = await updateNoticeType(postId, newType);
        if (result.success) {
          alert(result.message);
          fetchNotices();
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('공지 타입 변경 실패:', error);
        alert('공지 타입 변경 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 공지 설정 폼 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              min="1"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              💡 URL에서 확인: /boards/게시판/<strong>번호</strong>
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
              <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                {boards.length === 0 ? (
                  <p className="text-sm text-gray-500">게시판을 불러오는 중...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {boards.map((board) => (
                      <label key={board.id} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            onClick={handleSetNotice}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            공지로 설정
          </button>
        </div>
      </div>

      {/* 현재 공지사항 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
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
                className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750"
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
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                    className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  >
                    타입 변경
                  </button>
                  <button
                    onClick={() => handleRemoveNotice(notice.id)}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded transition-colors"
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
