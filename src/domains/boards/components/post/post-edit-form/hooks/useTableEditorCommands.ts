import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Editor } from '@tiptap/react';

type Position = {
  top: number;
  left: number;
};

function findNearestTableCellTextPosition(editor: Editor, nearPosition: number) {
  let nearestPosition: number | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'tableCell' && node.type.name !== 'tableHeader') return true;

    const textPosition = Math.min(pos + 2, pos + node.nodeSize - 1);
    const distance = Math.abs(pos - nearPosition);

    if (distance < nearestDistance) {
      nearestPosition = textPosition;
      nearestDistance = distance;
    }

    return false;
  });

  return nearestPosition;
}

type UseTableEditorCommandsParams = {
  editor: Editor | null;
  calculateTableMenuPosition: () => Position | null;
  setTableMenuPosition: Dispatch<SetStateAction<Position | null>>;
};

export function useTableEditorCommands({
  editor,
  calculateTableMenuPosition,
  setTableMenuPosition,
}: UseTableEditorCommandsParams) {
  const updateTableMenuAfterCommand = useCallback((nearPosition: number, restoreSelection = false) => {
    window.requestAnimationFrame(() => {
      if (!editor) return;

      if (restoreSelection && !editor.isActive('table')) {
        const nextPosition = findNearestTableCellTextPosition(editor, nearPosition);
        if (nextPosition !== null) {
          editor.commands.setTextSelection(nextPosition);
        }
      }

      setTableMenuPosition(calculateTableMenuPosition());
    });
  }, [calculateTableMenuPosition, editor, setTableMenuPosition]);

  return {
    updateTableMenuAfterCommand,
  };
}
