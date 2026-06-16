import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { Editor } from '@tiptap/react';

type SelectionPositionAnchor = {
  from: number;
  to: number;
  popoverContentTop?: number;
  popoverLeft?: number;
};

const SELECTION_MENU_WIDTH = 200;
const SELECTION_MENU_HEIGHT = 42;
const LINK_POPOVER_WIDTH = 300;
const LINK_POPOVER_HEIGHT = 96;
const TABLE_MENU_WIDTH = 274;
const TABLE_MENU_HEIGHT = 42;

type UseSelectionPositionParams = {
  editor: Editor | null;
  editorViewportElement: HTMLDivElement | null;
  linkPopoverAnchorRef: MutableRefObject<SelectionPositionAnchor | null>;
};

export function useSelectionPosition({
  editor,
  editorViewportElement,
  linkPopoverAnchorRef,
}: UseSelectionPositionParams) {
  const calculateSelectionPopoverPosition = useCallback((
    preferredWidth: number,
    estimatedHeight: number,
    options: { anchor?: SelectionPositionAnchor | null; useDomSelection?: boolean; horizontalAlign?: 'center' | 'end' } = {}
  ) => {
    if (!editor || !editorViewportElement) return null;

    const docSize = editor.state.doc.content.size;
    const anchor = options.anchor ?? editor.state.selection;
    const from = Math.min(Math.max(anchor.from, 0), docSize);
    const to = Math.min(Math.max(anchor.to, from), docSize);
    const boundary = editorViewportElement.getBoundingClientRect();
    const padding = 8;
    const scrollbarWidth = Math.max(0, editorViewportElement.offsetWidth - editorViewportElement.clientWidth);
    const contentRight = boundary.right - scrollbarWidth;
    const contentBottom = boundary.bottom;
    const contentWidth = editorViewportElement.clientWidth;
    const width = Math.min(preferredWidth, Math.max(120, contentWidth - padding * 2));
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const domSelection = options.useDomSelection === false ? null : window.getSelection();

    const rects = domSelection && domSelection.rangeCount > 0
      ? Array.from(domSelection.getRangeAt(0).getClientRects()).filter((rect) => {
          return rect.width > 0
            && rect.height > 0
            && rect.bottom >= boundary.top
            && rect.top <= boundary.bottom
            && rect.right >= boundary.left
            && rect.left <= contentRight;
        })
      : [];

    const anchorRect = rects.length > 0
      ? rects[rects.length - 1]
      : {
          left: Math.min(start.left, end.left),
          right: Math.max(start.right, end.right),
          top: Math.min(start.top, end.top),
          bottom: Math.max(start.bottom, end.bottom),
        };

    const selectionRect = {
      left: Math.max(anchorRect.left, boundary.left + padding),
      right: Math.min(anchorRect.right, contentRight - padding),
      top: anchorRect.top,
      bottom: anchorRect.bottom,
    };

    if (selectionRect.bottom < boundary.top || selectionRect.top > contentBottom) {
      return null;
    }

    const selectionCenterX = selectionRect.left + (selectionRect.right - selectionRect.left) / 2;
    const preferredLeft = options.horizontalAlign === 'end'
      ? selectionRect.right - boundary.left - width
      : selectionCenterX - boundary.left - width / 2;

    const minLeft = padding;
    const maxLeft = contentWidth - width - padding;
    const left = Math.min(Math.max(preferredLeft, minLeft), Math.max(minLeft, maxLeft));
    const aboveTop = selectionRect.top - boundary.top - estimatedHeight - padding;
    const belowTop = selectionRect.bottom - boundary.top + padding;
    const minTop = padding;
    const maxTop = editorViewportElement.clientHeight - estimatedHeight - padding;

    const top = aboveTop >= minTop
      ? aboveTop
      : Math.min(Math.max(belowTop, minTop), Math.max(minTop, maxTop));

    return { top, left };
  }, [editor, editorViewportElement]);

  const calculateSelectionLinkPopoverPosition = useCallback(() => {
    const anchor = linkPopoverAnchorRef.current;

    if (anchor?.popoverContentTop !== undefined && anchor.popoverLeft !== undefined && editorViewportElement) {
      const padding = 8;
      const contentWidth = editorViewportElement.clientWidth;
      const width = Math.min(LINK_POPOVER_WIDTH, Math.max(120, contentWidth - padding * 2));
      const maxLeft = contentWidth - width - padding;
      const top = anchor.popoverContentTop - editorViewportElement.scrollTop;

      if (top + LINK_POPOVER_HEIGHT < 0 || top > editorViewportElement.clientHeight) {
        return null;
      }

      return {
        top,
        left: Math.min(Math.max(anchor.popoverLeft, padding), Math.max(padding, maxLeft)),
      };
    }

    return calculateSelectionPopoverPosition(LINK_POPOVER_WIDTH, LINK_POPOVER_HEIGHT, {
      anchor,
      useDomSelection: false,
      horizontalAlign: 'end',
    });
  }, [calculateSelectionPopoverPosition, editorViewportElement, linkPopoverAnchorRef]);

  const calculateSelectionMenuPosition = useCallback(() => {
    return calculateSelectionPopoverPosition(SELECTION_MENU_WIDTH, SELECTION_MENU_HEIGHT, {
      useDomSelection: true,
      horizontalAlign: 'end',
    });
  }, [calculateSelectionPopoverPosition]);

  const calculateTableMenuPosition = useCallback(() => {
    if (!editor || !editorViewportElement || !editor.isActive('table')) return null;

    const boundary = editorViewportElement.getBoundingClientRect();
    const padding = 8;
    const width = Math.min(TABLE_MENU_WIDTH, Math.max(160, editorViewportElement.clientWidth - padding * 2));
    const domAtPos = editor.view.domAtPos(editor.state.selection.from);
    const sourceNode = domAtPos.node.nodeType === Node.ELEMENT_NODE
      ? domAtPos.node as Element
      : domAtPos.node.parentElement;
    const tableElement = sourceNode?.closest('table');

    if (!tableElement) return null;

    const rect = tableElement.getBoundingClientRect();
    const contentWidth = editorViewportElement.clientWidth;
    const preferredLeft = rect.left - boundary.left;
    const maxLeft = contentWidth - width - padding;
    const left = Math.min(Math.max(preferredLeft, padding), Math.max(padding, maxLeft));
    const aboveTop = rect.top - boundary.top - TABLE_MENU_HEIGHT - padding;
    const belowTop = rect.bottom - boundary.top + padding;
    const maxTop = editorViewportElement.clientHeight - TABLE_MENU_HEIGHT - padding;

    const top = aboveTop >= padding
      ? aboveTop
      : Math.min(Math.max(belowTop, padding), Math.max(padding, maxTop));

    return { top, left };
  }, [editor, editorViewportElement]);

  return {
    calculateSelectionPopoverPosition,
    calculateSelectionLinkPopoverPosition,
    calculateSelectionMenuPosition,
    calculateTableMenuPosition,
  };
}
