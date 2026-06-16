import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';

const TEAM_POPOVER_WIDTH = 360;
const PLAYER_POPOVER_WIDTH = 390;

function getSelectedEntityPickerMode(editor: Editor): 'team' | 'player' {
  const { selection } = editor.state;
  if (!(selection instanceof NodeSelection)) return 'team';

  if (selection.node.type.name === 'playerCard') return 'player';
  if (selection.node.type.name === 'entityCardGroup') {
    const items = selection.node.attrs.items;
    const firstItem = Array.isArray(items) ? items[0] : null;
    return firstItem?.type === 'player' ? 'player' : 'team';
  }

  return 'team';
}

type LocalPopoverPosition = {
  top: number;
  left: number;
  width: number;
};

type UseEntitySelectionEditorParams<TTeamArgs extends unknown[], TPlayerArgs extends unknown[]> = {
  editor: Editor | null;
  editorShellRef: MutableRefObject<HTMLDivElement | null>;
  entityReplacementRangeRef: MutableRefObject<{ from: number; to: number } | null>;
  handleAddTeam: (...args: TTeamArgs) => Promise<void> | void;
  handleAddPlayer: (...args: TPlayerArgs) => Promise<void> | void;
  setToolbarTeamPopoverPosition: Dispatch<SetStateAction<LocalPopoverPosition | null>>;
  setToolbarPlayerPopoverPosition: Dispatch<SetStateAction<LocalPopoverPosition | null>>;
  setShowTeamModal: (show: boolean) => void;
  setShowPlayerModal: (show: boolean) => void;
};

export function useEntitySelectionEditor<TTeamArgs extends unknown[], TPlayerArgs extends unknown[]>({
  editor,
  editorShellRef,
  entityReplacementRangeRef,
  handleAddTeam,
  handleAddPlayer,
  setToolbarTeamPopoverPosition,
  setToolbarPlayerPopoverPosition,
  setShowTeamModal,
  setShowPlayerModal,
}: UseEntitySelectionEditorParams<TTeamArgs, TPlayerArgs>) {
  const handleOpenSelectedEntityEditor = useCallback(() => {
    if (!editor || !(editor.state.selection instanceof NodeSelection)) return;

    const { from, to } = editor.state.selection;
    const mode = getSelectedEntityPickerMode(editor);
    const shell = editorShellRef.current;
    const selectionRect = editor.view.coordsAtPos(from);
    const boundary = shell?.getBoundingClientRect();
    const padding = 8;
    const maxWidth = mode === 'player' ? PLAYER_POPOVER_WIDTH : TEAM_POPOVER_WIDTH;
    const width = Math.min(maxWidth, Math.max(120, (boundary?.width ?? maxWidth) - padding * 2));

    entityReplacementRangeRef.current = { from, to };
    setToolbarTeamPopoverPosition(null);
    setToolbarPlayerPopoverPosition(null);

    const position = {
      top: boundary ? selectionRect.bottom - boundary.top + 6 : 0,
      left: boundary
        ? Math.max(padding, Math.min(selectionRect.left - boundary.left, boundary.width - width - padding))
        : 12,
      width,
    };

    if (mode === 'player') {
      setToolbarPlayerPopoverPosition(position);
      setShowTeamModal(false);
      setShowPlayerModal(true);
    } else {
      setToolbarTeamPopoverPosition(position);
      setShowPlayerModal(false);
      setShowTeamModal(true);
    }
  }, [
    editor,
    editorShellRef,
    entityReplacementRangeRef,
    setShowPlayerModal,
    setShowTeamModal,
    setToolbarPlayerPopoverPosition,
    setToolbarTeamPopoverPosition,
  ]);

  const replaceSelectedEntityIfNeeded = useCallback(() => {
    if (!editor || !entityReplacementRangeRef.current) return;

    const { from, to } = entityReplacementRangeRef.current;
    editor.chain().focus().deleteRange({ from, to }).setTextSelection(from).run();
    entityReplacementRangeRef.current = null;
  }, [editor, entityReplacementRangeRef]);

  const handleSelectTeam = useCallback(async (...args: TTeamArgs) => {
    replaceSelectedEntityIfNeeded();
    await handleAddTeam(...args);
  }, [handleAddTeam, replaceSelectedEntityIfNeeded]);

  const handleSelectPlayer = useCallback(async (...args: TPlayerArgs) => {
    replaceSelectedEntityIfNeeded();
    await handleAddPlayer(...args);
  }, [handleAddPlayer, replaceSelectedEntityIfNeeded]);

  return {
    handleOpenSelectedEntityEditor,
    handleSelectTeam,
    handleSelectPlayer,
  };
}
