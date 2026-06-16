import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';

type Position = {
  top: number;
  left: number;
};

type LinkPopoverSource = 'selection' | 'toolbar' | null;

type UseEditorSelectionEffectsParams = {
  editor: Editor | null;
  editorViewportElement: HTMLDivElement | null;
  showLinkModal: boolean;
  showYoutubeModal: boolean;
  linkPopoverSource: LinkPopoverSource;
  calculateSelectionLinkPopoverPosition: () => Position | null;
  calculateSelectionMenuPosition: () => Position | null;
  calculateTableMenuPosition: () => Position | null;
  closeLinkPopover: () => void;
  closeYoutubePopover: () => void;
  openLinkPopover: () => void;
  isPollBlockSelected: (editor: Editor) => boolean;
  setSelectionLinkPopoverPosition: Dispatch<SetStateAction<Position | null>>;
  setSelectionMenuPosition: Dispatch<SetStateAction<Position | null>>;
  setTableMenuPosition: Dispatch<SetStateAction<Position | null>>;
};

export function useEditorSelectionEffects({
  editor,
  editorViewportElement,
  showLinkModal,
  showYoutubeModal,
  linkPopoverSource,
  calculateSelectionLinkPopoverPosition,
  calculateSelectionMenuPosition,
  calculateTableMenuPosition,
  closeLinkPopover,
  closeYoutubePopover,
  openLinkPopover,
  isPollBlockSelected,
  setSelectionLinkPopoverPosition,
  setSelectionMenuPosition,
  setTableMenuPosition,
}: UseEditorSelectionEffectsParams) {
  useEffect(() => {
    if (!showLinkModal) return;

    const handlePointerOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-editor-link-popover="true"]')) return;

      closeLinkPopover();
    };

    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside);

    return () => {
      document.removeEventListener('mousedown', handlePointerOutside);
      document.removeEventListener('touchstart', handlePointerOutside);
    };
  }, [closeLinkPopover, showLinkModal]);

  useEffect(() => {
    if (!showYoutubeModal) return;

    const handlePointerOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-editor-youtube-popover="true"]')) return;

      closeYoutubePopover();
    };

    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside);

    return () => {
      document.removeEventListener('mousedown', handlePointerOutside);
      document.removeEventListener('touchstart', handlePointerOutside);
    };
  }, [closeYoutubePopover, showYoutubeModal]);

  useEffect(() => {
    if (!showLinkModal || linkPopoverSource !== 'selection') return;

    const updatePosition = (keepHorizontalPosition = false) => {
      const position = calculateSelectionLinkPopoverPosition();
      if (position) {
        setSelectionLinkPopoverPosition((previousPosition) => {
          if (!keepHorizontalPosition || !previousPosition) {
            return position;
          }

          return {
            top: position.top,
            left: previousPosition.left,
          };
        });
      } else {
        closeLinkPopover();
      }
    };

    const updateVerticalPositionOnEditorScroll = () => updatePosition(true);
    const updateFullPositionOnResize = () => updatePosition(false);

    editorViewportElement?.addEventListener('scroll', updateVerticalPositionOnEditorScroll, { passive: true });
    window.addEventListener('resize', updateFullPositionOnResize);

    return () => {
      editorViewportElement?.removeEventListener('scroll', updateVerticalPositionOnEditorScroll);
      window.removeEventListener('resize', updateFullPositionOnResize);
    };
  }, [
    calculateSelectionLinkPopoverPosition,
    closeLinkPopover,
    editorViewportElement,
    linkPopoverSource,
    setSelectionLinkPopoverPosition,
    showLinkModal,
  ]);

  useEffect(() => {
    if (!editor || !editorViewportElement) return;

    const updateSelectionMenuPosition = () => {
      if (showLinkModal) {
        setSelectionMenuPosition(null);
        setTableMenuPosition(null);
        return;
      }

      if (editor.isActive('table')) {
        setSelectionMenuPosition(null);
        setTableMenuPosition(calculateTableMenuPosition());
        return;
      }

      setTableMenuPosition(null);

      if (isPollBlockSelected(editor)) {
        setSelectionMenuPosition(null);
        return;
      }

      if (editor.state.selection instanceof NodeSelection) {
        setSelectionMenuPosition(null);
        return;
      }

      if (editor.state.selection.empty && !editor.isActive('link')) {
        setSelectionMenuPosition(null);
        return;
      }

      setSelectionMenuPosition(calculateSelectionMenuPosition());
    };

    const hideOnPageScroll = () => {
      setSelectionMenuPosition(null);
      setTableMenuPosition(null);
      closeLinkPopover();
    };

    const hideSelectionMenu = () => {
      setSelectionMenuPosition(null);
      setTableMenuPosition(null);
    };

    editor.on('selectionUpdate', updateSelectionMenuPosition);
    editor.on('focus', updateSelectionMenuPosition);
    editor.on('blur', hideSelectionMenu);
    editorViewportElement.addEventListener('scroll', updateSelectionMenuPosition, { passive: true });
    window.addEventListener('resize', updateSelectionMenuPosition);
    window.addEventListener('scroll', hideOnPageScroll, { passive: true });

    updateSelectionMenuPosition();

    return () => {
      editor.off('selectionUpdate', updateSelectionMenuPosition);
      editor.off('focus', updateSelectionMenuPosition);
      editor.off('blur', hideSelectionMenu);
      editorViewportElement.removeEventListener('scroll', updateSelectionMenuPosition);
      window.removeEventListener('resize', updateSelectionMenuPosition);
      window.removeEventListener('scroll', hideOnPageScroll);
    };
  }, [
    calculateSelectionMenuPosition,
    calculateTableMenuPosition,
    closeLinkPopover,
    editor,
    editorViewportElement,
    isPollBlockSelected,
    setSelectionMenuPosition,
    setTableMenuPosition,
    showLinkModal,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!editor) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openLinkPopover();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, openLinkPopover]);
}
