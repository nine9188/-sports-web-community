"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { saveEmoticonPackOrder, type PickerPackage } from '@/domains/boards/actions/emoticons';
import { usePickerData, useEmoticonInvalidation } from '@/domains/boards/hooks/useEmoticonQueries';
import { DESKTOP_CONTENT_HEIGHT } from './constants';

interface SettingsViewProps {
  isMobile: boolean;
  onBack: () => void;
  onSave: () => void;
}

export default function SettingsView({ isMobile, onBack, onSave }: SettingsViewProps) {
  const { data: pickerData, isLoading } = usePickerData();
  const { invalidateAfterOrderChange } = useEmoticonInvalidation();
  const [packages, setPackages] = useState<PickerPackage[]>([]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 수직 이동만 허용
  const restrictToVerticalAxis: Modifier = ({ transform }) => ({
    ...transform,
    x: 0,
  });

  // 피커 데이터가 로드되면 로컬 상태에 복사 (드래그용)
  useEffect(() => {
    if (pickerData) {
      setPackages(pickerData);
    }
  }, [pickerData]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = packages.findIndex(p => p.pack_id === active.id);
      const newIndex = packages.findIndex(p => p.pack_id === over.id);
      setPackages(arrayMove(packages, oldIndex, newIndex));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const order = packages.map(p => p.pack_id);
      await saveEmoticonPackOrder(order);
      toast.success('순서가 저장되었습니다.');
      invalidateAfterOrderChange();
      onSave();
    } catch {
      toast.error('순서 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const toolbar = (
    <div className="flex items-center justify-between px-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11 flex-shrink-0">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-[13px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>돌아가기</span>
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className={"flex flex-col flex-1 min-h-0 overflow-hidden"}>
        {toolbar}
        <div className={isMobile ? 'flex-1 min-h-0' : DESKTOP_CONTENT_HEIGHT} />
        <div className="h-[64px] flex-shrink-0 border-t border-black/5 dark:border-white/10" />
      </div>
    );
  }

  return (
    <div className={"flex flex-col flex-1 min-h-0 overflow-hidden"}>
      {toolbar}

      <div
        data-emoticon-scroll
        className={`${isMobile ? 'flex-1 min-h-0 overflow-y-auto overscroll-contain' : `${DESKTOP_CONTENT_HEIGHT} overflow-y-auto`} ${isMobile ? 'px-3 py-3' : 'px-4 py-4'}`}
      >
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">이모티콘 순서 설정</p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">드래그하여 순서를 변경하세요</p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
          <SortableContext items={packages.map(p => p.pack_id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {packages.map((pkg) => (
                <SortablePackItem key={pkg.pack_id} pack={pkg} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className={`flex items-center justify-center px-4 border-t border-black/5 dark:border-white/10 h-[64px] flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)] ${isMobile ? 'mb-10' : ''}`}>
        <button type="button" onClick={handleSave} disabled={saving}
          className="w-full max-w-xs h-10 rounded-lg text-[13px] font-medium bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] disabled:opacity-50 transition-colors">
          {saving ? '저장 중...' : '순서 저장'}
        </button>
      </div>
    </div>
  );
}

function SortablePackItem({ pack }: { pack: PickerPackage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pack.pack_id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
        isDragging
          ? 'border-[#262626] dark:border-[#F0F0F0] bg-[#F5F5F5] dark:bg-[#262626] shadow-lg z-10'
          : 'border-black/5 dark:border-white/10 bg-white dark:bg-[#1D1D1D]'
      }`}>
      <button type="button" className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none"
        {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        <Image src={pack.pack_thumbnail} alt={pack.pack_name} width={24} height={24} className="w-6 h-6 object-contain" />
      </div>
      <span className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] flex-1 min-w-0 truncate">{pack.pack_name}</span>
      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">{pack.emoticons.length}개</span>
    </div>
  );
}
