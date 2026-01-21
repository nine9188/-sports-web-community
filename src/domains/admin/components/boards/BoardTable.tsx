'use client';

import { ArrowUp, ArrowDown, ChevronRight, ChevronsRight } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import { getAccessLevelText } from './utils';
import type { Board, FlatBoard } from './types';

interface BoardTableProps {
  boards: Board[];
  flatBoards: FlatBoard[];
  isLoading: boolean;
  isUpdatingOrder: boolean;
  onEdit: (board: Board) => void;
  onDelete: (id: string) => void;
  onChangeOrder: (board: Board, direction: 'up' | 'down') => void;
}

function Indentation({ level }: { level: number }) {
  if (level === 0) return null;

  return (
    <div className="flex items-center" style={{ marginLeft: `${level * 16}px` }}>
      {level === 1 ? (
        <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
      ) : (
        <ChevronsRight className="h-4 w-4 text-gray-400 mr-1" />
      )}
    </div>
  );
}

export function BoardTable({
  boards,
  flatBoards,
  isLoading,
  isUpdatingOrder,
  onEdit,
  onDelete,
  onChangeOrder,
}: BoardTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#1D1D1D] shadow overflow-hidden sm:rounded-lg border border-black/7 dark:border-white/10">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-[#F0F0F0]">게시판 목록</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1D1D1D] shadow overflow-hidden sm:rounded-lg border border-black/7 dark:border-white/10">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-[#F0F0F0]">게시판 목록</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            현재 생성된 모든 게시판 목록입니다. 화살표를 클릭하여 순서를 변경할 수 있습니다.
          </p>
        </div>
      </div>

      {boards.length > 0 ? (
        <div className="border-t border-black/7 dark:border-white/10">
          <table className="w-full divide-y divide-black/7 dark:divide-white/10">
            <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  순서
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  게시판 이름
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  슬러그
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  권한
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  상위 게시판
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  팀ID
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1D1D1D] divide-y divide-black/7 dark:divide-white/10">
              {flatBoards.map((board) => {
                const parentBoard = board.parent_id ? boards.find((b) => b.id === board.parent_id) : null;
                const hasChildBoards = boards.some((b) => b.parent_id === board.id);

                const siblingBoards = boards
                  .filter((b) => b.parent_id === board.parent_id)
                  .sort((a, b) => a.display_order - b.display_order);

                const sameLevelIndex = siblingBoards.findIndex((b) => b.id === board.id);
                const isFirst = sameLevelIndex === 0;
                const isLast = sameLevelIndex === siblingBoards.length - 1;

                return (
                  <tr
                    key={board.id}
                    className={board.level && board.level > 0 ? 'bg-[#FAFAFA] dark:bg-[#232323]' : ''}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span>{board.display_order}</span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => onChangeOrder(board, 'up')}
                            disabled={isUpdatingOrder || isFirst}
                            className={`focus:outline-none ${
                              isFirst
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                            title={isFirst ? '이미 최상위입니다' : '위로 이동'}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => onChangeOrder(board, 'down')}
                            disabled={isUpdatingOrder || isLast}
                            className={`focus:outline-none ${
                              isLast
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                            title={isLast ? '이미 최하위입니다' : '아래로 이동'}
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                      <div className="flex items-center">
                        <Indentation level={board.level || 0} />
                        <span
                          className={`${board.level === 0 ? 'font-semibold' : ''} ${
                            board.level === 1 ? 'text-gray-700 dark:text-gray-300' : ''
                          }`}
                        >
                          {board.name}
                        </span>
                        {hasChildBoards && (
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(하위)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{board.slug || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {getAccessLevelText(board.access_level || 'public')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {parentBoard ? parentBoard.name : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{board.team_id || '-'}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <button
                        onClick={() => onEdit(board)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => onDelete(board.id)}
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                          hasChildBoards ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={hasChildBoards}
                        title={hasChildBoards ? '하위 게시판이 있는 게시판은 삭제할 수 없습니다' : ''}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400">등록된 게시판이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
