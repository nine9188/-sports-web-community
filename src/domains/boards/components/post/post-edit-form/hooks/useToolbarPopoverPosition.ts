import { useCallback } from 'react';
import type { MutableRefObject } from 'react';

type LocalPopoverPosition = {
  top: number;
  left: number;
  width: number;
};

type UseToolbarPopoverPositionParams = {
  editorShellRef: MutableRefObject<HTMLDivElement | null>;
  setToolbarLinkPopoverPosition: (position: LocalPopoverPosition | null) => void;
  setToolbarYoutubePopoverPosition: (position: LocalPopoverPosition | null) => void;
  setToolbarSocialPopoverPosition: (position: LocalPopoverPosition | null) => void;
  setToolbarMatchPopoverPosition: (position: LocalPopoverPosition | null) => void;
  setToolbarTeamPopoverPosition: (position: LocalPopoverPosition | null) => void;
  setToolbarPlayerPopoverPosition: (position: LocalPopoverPosition | null) => void;
  setToolbarTablePopoverPosition: (position: LocalPopoverPosition | null) => void;
  setToolbarPollPopoverPosition: (position: LocalPopoverPosition | null) => void;
  onTableButtonRect?: () => void;
};

const LINK_POPOVER_WIDTH = 300;
const YOUTUBE_POPOVER_WIDTH = 320;
const SOCIAL_POPOVER_WIDTH = 360;
const MATCH_POPOVER_WIDTH = 430;
const TEAM_POPOVER_WIDTH = 360;
const PLAYER_POPOVER_WIDTH = 390;
const TABLE_POPOVER_WIDTH = 202;
const POLL_POPOVER_WIDTH = 360;

export function useToolbarPopoverPosition({
  editorShellRef,
  setToolbarLinkPopoverPosition,
  setToolbarYoutubePopoverPosition,
  setToolbarSocialPopoverPosition,
  setToolbarMatchPopoverPosition,
  setToolbarTeamPopoverPosition,
  setToolbarPlayerPopoverPosition,
  setToolbarTablePopoverPosition,
  setToolbarPollPopoverPosition,
  onTableButtonRect,
}: UseToolbarPopoverPositionParams) {
  const calculateToolbarPopoverPosition = useCallback((rect: DOMRect, preferredWidth: number) => {
    const shell = editorShellRef.current;
    if (!shell) return null;

    const boundary = shell.getBoundingClientRect();
    const padding = 8;
    const width = Math.min(preferredWidth, Math.max(120, boundary.width - padding * 2));
    const left = Math.min(
      Math.max(rect.left - boundary.left, padding),
      Math.max(padding, boundary.width - width - padding)
    );
    const top = rect.bottom - boundary.top + 6;

    return { top, left, width };
  }, [editorShellRef]);

  const handleToolbarLinkButtonRect = useCallback((rect: DOMRect) => {
    setToolbarLinkPopoverPosition(calculateToolbarPopoverPosition(rect, LINK_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition, setToolbarLinkPopoverPosition]);

  const handleToolbarYoutubeButtonRect = useCallback((rect: DOMRect) => {
    setToolbarYoutubePopoverPosition(calculateToolbarPopoverPosition(rect, YOUTUBE_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition, setToolbarYoutubePopoverPosition]);

  const handleToolbarSocialButtonRect = useCallback((rect: DOMRect) => {
    setToolbarSocialPopoverPosition(calculateToolbarPopoverPosition(rect, SOCIAL_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition, setToolbarSocialPopoverPosition]);

  const handleToolbarMatchButtonRect = useCallback((rect: DOMRect) => {
    setToolbarMatchPopoverPosition(calculateToolbarPopoverPosition(rect, MATCH_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition, setToolbarMatchPopoverPosition]);

  const handleToolbarTeamButtonRect = useCallback((rect: DOMRect) => {
    setToolbarTeamPopoverPosition(calculateToolbarPopoverPosition(rect, TEAM_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition, setToolbarTeamPopoverPosition]);

  const handleToolbarPlayerButtonRect = useCallback((rect: DOMRect) => {
    setToolbarPlayerPopoverPosition(calculateToolbarPopoverPosition(rect, PLAYER_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition, setToolbarPlayerPopoverPosition]);

  const handleToolbarTableButtonRect = useCallback((rect: DOMRect) => {
    onTableButtonRect?.();
    setToolbarTablePopoverPosition(calculateToolbarPopoverPosition(rect, TABLE_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition, onTableButtonRect, setToolbarTablePopoverPosition]);

  const handleToolbarPollButtonRect = useCallback((rect: DOMRect) => {
    setToolbarPollPopoverPosition(calculateToolbarPopoverPosition(rect, POLL_POPOVER_WIDTH));
  }, [calculateToolbarPopoverPosition, setToolbarPollPopoverPosition]);

  return {
    handleToolbarLinkButtonRect,
    handleToolbarYoutubeButtonRect,
    handleToolbarSocialButtonRect,
    handleToolbarMatchButtonRect,
    handleToolbarTeamButtonRect,
    handleToolbarPlayerButtonRect,
    handleToolbarTableButtonRect,
    handleToolbarPollButtonRect,
  };
}
