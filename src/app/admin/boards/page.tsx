'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useAdminBoards,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
  useSwapBoardOrderMutation,
} from '@/domains/admin/hooks/useAdminBoards';
import {
  BoardForm,
  BoardTable,
  generateSlug,
  validateSlug,
  isSlugExists,
  isChildBoard,
  DEFAULT_FORM_DATA,
  type Board,
  type BoardFormData,
} from '@/domains/admin/components/boards';

export default function BoardsAdminPage() {
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [formData, setFormData] = useState<BoardFormData>(DEFAULT_FORM_DATA);

  // React Query hooks
  const { boards, flatBoards, isLoading } = useAdminBoards();
  const createMutation = useCreateBoardMutation();
  const updateMutation = useUpdateBoardMutation();
  const deleteMutation = useDeleteBoardMutation();
  const swapOrderMutation = useSwapBoardOrderMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isUpdatingOrder = swapOrderMutation.isPending;

  // 폼 초기화
  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingBoard(null);
  };

  // 게시판 추가 또는 수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('게시판 이름은 필수입니다.');
      return;
    }

    // 슬러그 자동 생성 (비어있을 경우)
    let slugToUse = formData.slug;
    if (!slugToUse) {
      slugToUse = generateSlug(formData.name);

      let slugSuffix = 1;
      let candidateSlug = slugToUse;
      while (isSlugExists(boards, candidateSlug, editingBoard?.id)) {
        candidateSlug = `${slugToUse}-${slugSuffix}`;
        slugSuffix++;
      }
      slugToUse = candidateSlug;
    }

    // 슬러그 검증
    if (slugToUse) {
      if (!validateSlug(slugToUse)) {
        toast.error('슬러그는 영문 소문자, 숫자, 하이픈(-), 언더스코어(_)만 포함할 수 있습니다.');
        return;
      }

      if (isSlugExists(boards, slugToUse, editingBoard?.id)) {
        toast.error('이미 사용 중인 슬러그입니다. 다른 슬러그를 입력해주세요.');
        return;
      }
    }

    // 순환 참조 검사
    if (editingBoard && formData.parent_id) {
      if (formData.parent_id === editingBoard.id) {
        toast.error('자기 자신을 상위 게시판으로 지정할 수 없습니다.');
        return;
      }

      if (isChildBoard(boards, formData.parent_id, editingBoard.id)) {
        toast.error('하위 게시판을 상위 게시판으로 지정할 수 없습니다.');
        return;
      }
    }

    // 같은 부모 내에서 마지막 순서 계산
    let newDisplayOrder = formData.display_order;
    if (!editingBoard) {
      const sameParentBoards = boards.filter((b) => b.parent_id === (formData.parent_id || null));
      if (sameParentBoards.length > 0) {
        const maxOrder = Math.max(...sameParentBoards.map((b) => b.display_order));
        newDisplayOrder = maxOrder + 10;
      } else {
        newDisplayOrder = 10;
      }
    }

    const boardData = {
      name: formData.name,
      slug: slugToUse,
      description: formData.description,
      access_level: formData.access_level,
      parent_id: formData.parent_id || null,
      display_order: newDisplayOrder,
      team_id: formData.team_id,
      view_type: formData.view_type,
    };

    if (editingBoard) {
      updateMutation.mutate(
        { id: editingBoard.id, formData: boardData },
        {
          onSuccess: (result) => {
            if (result.success) {
              toast.success('게시판이 수정되었습니다.');
              resetForm();
            } else {
              toast.error(result.error || '게시판 수정에 실패했습니다.');
            }
          },
          onError: (error) => {
            console.error('게시판 수정 오류:', error);
            toast.error('게시판 수정 중 오류가 발생했습니다.');
          },
        }
      );
    } else {
      createMutation.mutate(boardData, {
        onSuccess: (result) => {
          if (result.success) {
            toast.success('게시판이 추가되었습니다.');
            resetForm();
          } else {
            toast.error(result.error || '게시판 추가에 실패했습니다.');
          }
        },
        onError: (error) => {
          console.error('게시판 추가 오류:', error);
          toast.error('게시판 추가 중 오류가 발생했습니다.');
        },
      });
    }
  };

  // 게시판 수정 모드
  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setFormData({
      name: board.name,
      slug: board.slug || '',
      description: board.description || '',
      access_level: board.access_level || 'public',
      parent_id: board.parent_id || '',
      display_order: board.display_order || 0,
      team_id: board.team_id || null,
      view_type: (board.view_type as 'list' | 'image-table' | null) ?? 'list',
    });
  };

  // 게시판 삭제
  const handleDelete = async (id: string) => {
    const hasChildren = boards.some((board) => board.parent_id === id);

    if (hasChildren) {
      toast.error('하위 게시판이 있는 게시판은 삭제할 수 없습니다. 먼저 하위 게시판을 삭제하세요.');
      return;
    }

    if (!confirm('정말 이 게시판을 삭제하시겠습니까? 관련된 모든 게시글도 삭제됩니다.')) {
      return;
    }

    deleteMutation.mutate(id, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('게시판이 삭제되었습니다.');
        } else {
          toast.error(result.error || '게시판 삭제에 실패했습니다.');
        }
      },
      onError: (error) => {
        console.error('게시판 삭제 오류:', error);
        toast.error('게시판 삭제 중 오류가 발생했습니다.');
      },
    });
  };

  // 게시판 순서 변경
  const changeOrder = async (board: Board, direction: 'up' | 'down') => {
    const siblingBoards = boards
      .filter((b) => b.parent_id === board.parent_id)
      .sort((a, b) => a.display_order - b.display_order);

    const currentIndex = siblingBoards.findIndex((b) => b.id === board.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= siblingBoards.length) {
      toast.info('더 이상 이동할 수 없습니다.');
      return;
    }

    const targetBoard = siblingBoards[targetIndex];

    swapOrderMutation.mutate(
      {
        boardId: board.id,
        targetId: targetBoard.id,
        boardOrder: board.display_order,
        targetOrder: targetBoard.display_order,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success('게시판 순서가 변경되었습니다.');
          } else {
            toast.error(result.error || '순서 변경에 실패했습니다.');
          }
        },
        onError: (error) => {
          console.error('순서 변경 오류:', error);
          toast.error('순서 변경에 실패했습니다.');
        },
      }
    );
  };

  return (
    <>
      <BoardForm
        formData={formData}
        boards={boards}
        editingBoard={editingBoard}
        isSubmitting={isSubmitting}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onCancel={resetForm}
      />

      <BoardTable
        boards={boards}
        flatBoards={flatBoards}
        isLoading={isLoading}
        isUpdatingOrder={isUpdatingOrder}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onChangeOrder={changeOrder}
      />
    </>
  );
}
