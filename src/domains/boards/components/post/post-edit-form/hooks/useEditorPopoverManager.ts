import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Editor } from '@tiptap/react';

type PopoverSource = 'selection' | 'toolbar' | null;

type LocalPopoverPosition = {
  top: number;
  left: number;
  width: number;
};

type EditorToolDropdown = 'link' | 'youtube' | 'match' | 'social' | 'team' | 'player' | 'table' | 'poll';
type EditorDropdownWithoutPoll = Exclude<EditorToolDropdown, 'poll'>;

type UseEditorPopoverManagerParams = {
  editor: Editor | null;
  extensionsLoaded: boolean;
  tableInsertionRangeRef: MutableRefObject<{ from: number; to: number } | null>;
  entityReplacementRangeRef: MutableRefObject<{ from: number; to: number } | null>;
  linkPopoverAnchorRef: MutableRefObject<{ from: number; to: number; popoverContentTop?: number; popoverLeft?: number } | null>;
  moveCursorAfterSelectedNode: () => void;
  ensureAdditionalExtensions: () => Promise<boolean>;
  handleToggleDropdown: (dropdown: EditorDropdownWithoutPoll) => void;
  setLinkPopoverSource: Dispatch<SetStateAction<PopoverSource>>;
  setSelectionLinkPopoverPosition: Dispatch<SetStateAction<{ top: number; left: number } | null>>;
  setToolbarLinkPopoverPosition: Dispatch<SetStateAction<LocalPopoverPosition | null>>;
  setToolbarYoutubePopoverPosition: Dispatch<SetStateAction<LocalPopoverPosition | null>>;
  setToolbarSocialPopoverPosition: Dispatch<SetStateAction<LocalPopoverPosition | null>>;
  setToolbarMatchPopoverPosition: Dispatch<SetStateAction<LocalPopoverPosition | null>>;
  setToolbarTeamPopoverPosition: Dispatch<SetStateAction<LocalPopoverPosition | null>>;
  setToolbarPlayerPopoverPosition: Dispatch<SetStateAction<LocalPopoverPosition | null>>;
  setToolbarTablePopoverPosition: Dispatch<SetStateAction<LocalPopoverPosition | null>>;
  setToolbarPollPopoverPosition: Dispatch<SetStateAction<LocalPopoverPosition | null>>;
  setShowLinkModal: (show: boolean) => void;
  setShowYoutubeModal: (show: boolean) => void;
  setShowMatchModal: (show: boolean) => void;
  setShowSocialModal: (show: boolean) => void;
  setShowTeamModal: (show: boolean) => void;
  setShowPlayerModal: (show: boolean) => void;
  setShowTableModal: (show: boolean) => void;
  setShowPollModal: Dispatch<SetStateAction<boolean>>;
};

export function useEditorPopoverManager({
  editor,
  extensionsLoaded,
  tableInsertionRangeRef,
  entityReplacementRangeRef,
  linkPopoverAnchorRef,
  moveCursorAfterSelectedNode,
  ensureAdditionalExtensions,
  handleToggleDropdown,
  setLinkPopoverSource,
  setSelectionLinkPopoverPosition,
  setToolbarLinkPopoverPosition,
  setToolbarYoutubePopoverPosition,
  setToolbarSocialPopoverPosition,
  setToolbarMatchPopoverPosition,
  setToolbarTeamPopoverPosition,
  setToolbarPlayerPopoverPosition,
  setToolbarTablePopoverPosition,
  setToolbarPollPopoverPosition,
  setShowLinkModal,
  setShowYoutubeModal,
  setShowMatchModal,
  setShowSocialModal,
  setShowTeamModal,
  setShowPlayerModal,
  setShowTableModal,
  setShowPollModal,
}: UseEditorPopoverManagerParams) {
  const handleEditorToolToggle = useCallback((dropdown: EditorToolDropdown) => {
    moveCursorAfterSelectedNode();

    if (dropdown === 'poll') {
      setLinkPopoverSource(null);
      setShowPollModal((value) => !value);
      return;
    }

    setShowPollModal(false);
    setToolbarPollPopoverPosition(null);

    if (dropdown === 'youtube' || dropdown === 'match' || dropdown === 'social' || dropdown === 'team' || dropdown === 'player' || dropdown === 'table') {
      if (dropdown === 'table' && editor) {
        const { from, to } = editor.state.selection;
        tableInsertionRangeRef.current = { from, to };
      }

      if (dropdown === 'table' && !extensionsLoaded) {
        setLinkPopoverSource(null);
        void ensureAdditionalExtensions().then(() => handleToggleDropdown('table'));
        return;
      }

      void ensureAdditionalExtensions();
    }

    if (dropdown === 'link') {
      if (editor?.isActive('link')) {
        editor.chain().focus().extendMarkRange('link').run();
      }

      setLinkPopoverSource('toolbar');
      setShowLinkModal(true);
      return;
    }

    setLinkPopoverSource(null);
    handleToggleDropdown(dropdown);
  }, [
    editor,
    ensureAdditionalExtensions,
    extensionsLoaded,
    handleToggleDropdown,
    moveCursorAfterSelectedNode,
    setLinkPopoverSource,
    setShowLinkModal,
    setShowPollModal,
    setToolbarPollPopoverPosition,
    tableInsertionRangeRef,
  ]);

  const closeLinkPopover = useCallback(() => {
    linkPopoverAnchorRef.current = null;
    setLinkPopoverSource(null);
    setToolbarLinkPopoverPosition(null);
    setSelectionLinkPopoverPosition(null);
    setShowLinkModal(false);
  }, [linkPopoverAnchorRef, setLinkPopoverSource, setSelectionLinkPopoverPosition, setShowLinkModal, setToolbarLinkPopoverPosition]);

  const closeYoutubePopover = useCallback(() => {
    setToolbarYoutubePopoverPosition(null);
    setShowYoutubeModal(false);
  }, [setShowYoutubeModal, setToolbarYoutubePopoverPosition]);

  const closeSocialPopover = useCallback(() => {
    setToolbarSocialPopoverPosition(null);
    setShowSocialModal(false);
  }, [setShowSocialModal, setToolbarSocialPopoverPosition]);

  const closeMatchPopover = useCallback(() => {
    setToolbarMatchPopoverPosition(null);
    setShowMatchModal(false);
  }, [setShowMatchModal, setToolbarMatchPopoverPosition]);

  const closeTeamPopover = useCallback(() => {
    setToolbarTeamPopoverPosition(null);
    setShowTeamModal(false);
    entityReplacementRangeRef.current = null;
  }, [entityReplacementRangeRef, setShowTeamModal, setToolbarTeamPopoverPosition]);

  const closePlayerPopover = useCallback(() => {
    setToolbarPlayerPopoverPosition(null);
    setShowPlayerModal(false);
    entityReplacementRangeRef.current = null;
  }, [entityReplacementRangeRef, setShowPlayerModal, setToolbarPlayerPopoverPosition]);

  const closeTablePopover = useCallback(() => {
    setToolbarTablePopoverPosition(null);
    setShowTableModal(false);
  }, [setShowTableModal, setToolbarTablePopoverPosition]);

  const closePollPopover = useCallback(() => {
    setToolbarPollPopoverPosition(null);
    setShowPollModal(false);
  }, [setShowPollModal, setToolbarPollPopoverPosition]);

  return {
    handleEditorToolToggle,
    closeLinkPopover,
    closeYoutubePopover,
    closeSocialPopover,
    closeMatchPopover,
    closeTeamPopover,
    closePlayerPopover,
    closeTablePopover,
    closePollPopover,
  };
}
