'use client';

import React from 'react';
import { Board } from '@/domains/boards/types/board';

interface NoticeAdminSectionProps {
  isNotice: boolean;
  setIsNotice: (value: boolean) => void;
  noticeType: 'global' | 'board';
  setNoticeType: (value: 'global' | 'board') => void;
  noticeBoards: string[];
  setNoticeBoards: (boards: string[]) => void;
  allBoardsFlat: Board[];
}

export default function NoticeAdminSection({
  isNotice,
  setIsNotice,
  noticeType,
  setNoticeType,
  noticeBoards,
  setNoticeBoards,
  allBoardsFlat
}: NoticeAdminSectionProps) {
  return (
    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isNotice"
          checked={isNotice}
          onChange={(e) => setIsNotice(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-white dark:bg-[#333333] border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="isNotice" className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
          공지로 등록
        </label>
      </div>

      {isNotice && (
        <div className="space-y-4 pl-6">
          {/* 공지 타입 선택 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
              공지 타입
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="global"
                  checked={noticeType === 'global'}
                  onChange={(e) => {
                    setNoticeType(e.target.value as 'global' | 'board');
                    setNoticeBoards([]); // 전체 공지로 변경 시 게시판 선택 초기화
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">전체 공지</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="board"
                  checked={noticeType === 'board'}
                  onChange={(e) => setNoticeType(e.target.value as 'global' | 'board')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">게시판 공지</span>
              </label>
            </div>
          </div>

          {/* 게시판 선택 (게시판 공지인 경우) */}
          {noticeType === 'board' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                공지를 표시할 게시판 선택 (다중 선택 가능)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-[#262626]">
                {allBoardsFlat.length === 0 ? (
                  <p className="text-sm text-gray-500">게시판을 불러오는 중...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {allBoardsFlat.map((board) => (
                      <label
                        key={board.id}
                        className="flex items-center p-2 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={noticeBoards.includes(board.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNoticeBoards([...noticeBoards, board.id]);
                            } else {
                              setNoticeBoards(noticeBoards.filter(id => id !== board.id));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {board.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {noticeBoards.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  선택된 게시판: {noticeBoards.length}개
                </p>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
