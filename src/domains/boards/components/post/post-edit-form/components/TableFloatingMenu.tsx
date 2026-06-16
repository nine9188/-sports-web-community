import type { Editor } from '@tiptap/react';

type Position = {
  top: number;
  left: number;
};

type TableFloatingMenuProps = {
  editor: Editor;
  tableMenuPosition: Position;
  onUpdateAfterCommand: (nearPosition: number, restoreSelection?: boolean) => void;
  onDeleteTable: () => void;
};

export function TableFloatingMenu({
  editor,
  tableMenuPosition,
  onUpdateAfterCommand,
  onDeleteTable,
}: TableFloatingMenuProps) {
  return (
    <div
      className="absolute z-20 flex items-center gap-1 rounded-md border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
      style={{
        top: tableMenuPosition.top,
        left: tableMenuPosition.left,
      }}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
        onClick={() => {
          const nearPosition = editor.state.selection.from;
          editor.chain().focus().addRowAfter().run();
          onUpdateAfterCommand(nearPosition);
        }}
      >
        행+
      </button>

      <button
        type="button"
        className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
        onClick={() => {
          const nearPosition = editor.state.selection.from;
          editor.chain().focus().addColumnAfter().run();
          onUpdateAfterCommand(nearPosition);
        }}
      >
        열+
      </button>

      <button
        type="button"
        className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
        onClick={() => {
          const nearPosition = editor.state.selection.from;
          editor.chain().focus().deleteRow().run();
          onUpdateAfterCommand(nearPosition, true);
        }}
      >
        행-
      </button>

      <button
        type="button"
        className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
        onClick={() => {
          const nearPosition = editor.state.selection.from;
          editor.chain().focus().deleteColumn().run();
          onUpdateAfterCommand(nearPosition, true);
        }}
      >
        열-
      </button>

      <button
        type="button"
        className="h-8 rounded px-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
        title="표 삭제"
        onClick={onDeleteTable}
      >
        삭제
      </button>
    </div>
  );
}
