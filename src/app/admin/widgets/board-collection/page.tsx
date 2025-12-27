'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { getAllBoards, getBoardCollectionSettings, saveBoardCollectionSettings } from '@/domains/widgets/actions/boardCollectionSettings';

interface Board {
  id: string;
  name: string;
  slug: string;
}

interface SelectedBoard extends Board {
  display_order: number;
}

// 드래그 가능한 게시판 아이템
function SortableItem({ board, onRemove }: { board: SelectedBoard; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: board.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-gray-400" />
      </button>
      <div className="flex-1">
        <span className="font-medium">{board.name}</span>
        <span className="text-sm text-gray-500 ml-2">({board.slug})</span>
      </div>
      <button
        onClick={() => onRemove(board.id)}
        className="p-2 text-red-600 hover:bg-red-50 rounded"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function BoardCollectionWidgetSettingsPage() {
  const [allBoards, setAllBoards] = useState<Board[]>([]);
  const [selectedBoards, setSelectedBoards] = useState<SelectedBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [boards, settings] = await Promise.all([
        getAllBoards(),
        getBoardCollectionSettings()
      ]);

      setAllBoards(boards);

      // 설정된 게시판 목록 구성
      const selected = settings
        .map((s: any) => {
          const boardData = s.boards;
          if (!boardData) {
            return null;
          }
          return {
            id: s.board_id,
            name: boardData.name || '',
            slug: boardData.slug || '',
            display_order: s.display_order
          };
        })
        .filter((item): item is SelectedBoard => item !== null)
        .sort((a, b) => a.display_order - b.display_order);

      setSelectedBoards(selected);
      setLoading(false);
    }

    loadData();
  }, []);

  // 드래그 앤 드롭 처리
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedBoards((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // display_order 재계산
        return newItems.map((item, index) => ({ ...item, display_order: index }));
      });
    }
  }

  // 게시판 추가
  function handleAddBoard(boardId: string) {
    const board = allBoards.find((b) => b.id === boardId);
    if (!board) return;

    // 이미 추가된 게시판인지 확인
    if (selectedBoards.some((b) => b.id === boardId)) {
      alert('이미 추가된 게시판입니다.');
      return;
    }

    setSelectedBoards([...selectedBoards, { ...board, display_order: selectedBoards.length }]);
  }

  // 게시판 제거
  function handleRemoveBoard(boardId: string) {
    setSelectedBoards((prev) => {
      const filtered = prev.filter((b) => b.id !== boardId);
      // display_order 재계산
      return filtered.map((item, index) => ({ ...item, display_order: index }));
    });
  }

  // 저장
  async function handleSave() {
    setSaving(true);
    const settings = selectedBoards.map((b) => ({
      board_id: b.id,
      display_order: b.display_order
    }));

    const result = await saveBoardCollectionSettings(settings);

    if (result.success) {
      alert('저장되었습니다.');
    } else {
      alert(`저장 실패: ${result.error}`);
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">게시판 모음 위젯 설정</h1>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">게시판 모음 위젯 설정</h1>

        {/* 게시판 추가 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">게시판 추가</h2>
          <select
            className="w-full p-2 border rounded"
            onChange={(e) => handleAddBoard(e.target.value)}
            value=""
          >
            <option value="">게시판을 선택하세요</option>
            {allBoards
              .filter((b) => !selectedBoards.some((sb) => sb.id === b.id))
              .map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name} ({board.slug})
                </option>
              ))}
          </select>
        </div>

        {/* 선택된 게시판 목록 (드래그 가능) */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">표시할 게시판 (드래그로 순서 변경)</h2>
          {selectedBoards.length === 0 ? (
            <p className="text-gray-500">선택된 게시판이 없습니다.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={selectedBoards.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {selectedBoards.map((board) => (
                    <SortableItem key={board.id} board={board} onRemove={handleRemoveBoard} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={saving || selectedBoards.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
