'use client';

import { Button } from '@/shared/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select-radix';
import { generateSlug, getParentLevel } from './utils';
import type { Board, BoardFormData } from './types';

interface BoardFormProps {
  formData: BoardFormData;
  boards: Board[];
  editingBoard: Board | null;
  isSubmitting: boolean;
  onFormDataChange: (data: BoardFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function BoardForm({
  formData,
  boards,
  editingBoard,
  isSubmitting,
  onFormDataChange,
  onSubmit,
  onCancel,
}: BoardFormProps) {
  const inputClassName =
    'w-full px-3 py-2 rounded-md bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 text-gray-900 dark:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-gray-400';

  return (
    <div className="bg-white dark:bg-[#1D1D1D] shadow overflow-hidden sm:rounded-lg mb-8 p-6 border border-black/7 dark:border-white/10">
      <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-[#F0F0F0]">
        {editingBoard ? '게시판 수정' : '새 게시판 추가'}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            게시판 이름
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => {
              const newName = e.target.value;
              const shouldUpdateSlug = !formData.slug || formData.slug === generateSlug(formData.name);
              onFormDataChange({
                ...formData,
                name: newName,
                slug: shouldUpdateSlug ? generateSlug(newName) : formData.slug,
              });
            }}
            className={`mt-1 block ${inputClassName}`}
            required
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            슬러그 (URL)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ''),
                })
              }
              className={`block ${inputClassName}`}
              placeholder="board-name"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            영문 소문자, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능합니다. 게시판 이름을 입력하면 자동으로 생성됩니다.
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            설명
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
            rows={3}
            className={`mt-1 block ${inputClassName}`}
          />
        </div>

        <div>
          <label htmlFor="access_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            접근 권한
          </label>
          <Select
            value={formData.access_level}
            onValueChange={(value) => onFormDataChange({ ...formData, access_level: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="접근 권한 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">공개</SelectItem>
              <SelectItem value="members">회원 전용</SelectItem>
              <SelectItem value="admin">관리자 전용</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="view_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            게시판 유형
          </label>
          <Select
            value={formData.view_type}
            onValueChange={(value) =>
              onFormDataChange({ ...formData, view_type: value as 'list' | 'image-table' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="게시판 유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">일반 목록</SelectItem>
              <SelectItem value="image-table">이미지형 테이블</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            이미지형 테이블: 우측 썸네일이 포함된 목록 UI
          </p>
        </div>

        <div>
          <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            상위 게시판 (선택사항)
          </label>
          <Select
            value={formData.parent_id || '__none__'}
            onValueChange={(value) =>
              onFormDataChange({ ...formData, parent_id: value === '__none__' ? '' : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="상위 게시판 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">없음 (최상위 게시판)</SelectItem>
              {boards
                .filter((board) => {
                  if (editingBoard && board.id === editingBoard.id) return false;

                  if (editingBoard) {
                    const isChild = (parentId: string): boolean => {
                      const directChildren = boards.filter((b) => b.parent_id === parentId);
                      return directChildren.some(
                        (child) => child.id === board.id || isChild(child.id)
                      );
                    };
                    if (isChild(editingBoard.id)) return false;
                  }

                  return true;
                })
                .map((board) => {
                  const level = getParentLevel(boards, board.id);
                  const indent = '　'.repeat(level);

                  return (
                    <SelectItem key={board.id} value={board.id}>
                      {indent}
                      {level > 0 ? '└ ' : ''}
                      {board.name}
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="team_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            팀 ID (선택사항)
          </label>
          <input
            type="number"
            id="team_id"
            value={formData.team_id || ''}
            onChange={(e) =>
              onFormDataChange({
                ...formData,
                team_id: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className={`mt-1 block ${inputClassName}`}
            placeholder="예: 40 (리버풀), 33 (맨유)"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {editingBoard && (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : editingBoard ? '수정하기' : '추가하기'}
          </Button>
        </div>
      </form>
    </div>
  );
}
