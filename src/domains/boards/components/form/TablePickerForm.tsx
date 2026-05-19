'use client';

import { useEffect, useRef, useState } from 'react';

interface TablePickerFormProps {
  isOpen: boolean;
  onCancel: () => void;
  onTableAdd: (rows: number, cols: number) => void;
}

const MAX_ROWS = 8;
const MAX_COLS = 8;

export default function TablePickerForm({ isOpen, onCancel, onTableAdd }: TablePickerFormProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState({ rows: 3, cols: 3 });

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (popoverRef.current?.contains(event.target as Node)) return;
      onCancel();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) {
      setHovered({ rows: 3, cols: 3 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateHoveredFromPoint = (clientX: number, clientY: number) => {
    const grid = gridRef.current;
    if (!grid) return;

    const rect = grid.getBoundingClientRect();
    const cellWidth = rect.width / MAX_COLS;
    const cellHeight = rect.height / MAX_ROWS;
    const cols = Math.min(MAX_COLS, Math.max(1, Math.ceil((clientX - rect.left) / cellWidth)));
    const rows = Math.min(MAX_ROWS, Math.max(1, Math.ceil((clientY - rect.top) / cellHeight)));

    setHovered({ rows, cols });
  };

  return (
    <div
      ref={popoverRef}
      className="w-full rounded-md border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        ref={gridRef}
        className="grid touch-none grid-cols-8 gap-1"
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse') {
            updateHoveredFromPoint(event.clientX, event.clientY);
          }
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== 'mouse') {
            onTableAdd(hovered.rows, hovered.cols);
          }
        }}
      >
        {Array.from({ length: MAX_ROWS }).map((_, rowIndex) =>
          Array.from({ length: MAX_COLS }).map((__, colIndex) => {
            const rows = rowIndex + 1;
            const cols = colIndex + 1;
            const selected = rows <= hovered.rows && cols <= hovered.cols;

            return (
              <button
                key={`${rows}-${cols}`}
                type="button"
                aria-label={`${rows} x ${cols} 표 삽입`}
                onMouseEnter={() => setHovered({ rows, cols })}
                onFocus={() => setHovered({ rows, cols })}
                onClick={() => onTableAdd(rows, cols)}
                className={`h-5 w-5 rounded-[2px] border transition-colors ${
                  selected
                    ? 'border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-500/25'
                    : 'border-black/15 bg-[#F5F5F5] hover:bg-[#EAEAEA] dark:border-white/15 dark:bg-[#262626] dark:hover:bg-[#333333]'
                }`}
              />
            );
          })
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
          {hovered.rows} x {hovered.cols}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          표 크기 선택
        </span>
      </div>
    </div>
  );
}
