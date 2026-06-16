import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import type { PostPollDraft } from '@/domains/boards/types/poll';

const POLL_POPOVER_WIDTH = 360;

type PollBlockMatch = {
  pos: number;
  nodeSize: number;
  draft: PostPollDraft;
};

function findPollBlock(editor: Editor): PollBlockMatch | null {
  let match: PollBlockMatch | null = null;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'pollBlock') return true;

    match = {
      pos,
      nodeSize: node.nodeSize,
      draft: {
        question: String(node.attrs.question || ''),
        options: Array.isArray(node.attrs.options)
          ? node.attrs.options.filter((option): option is string => typeof option === 'string')
          : [],
      },
    };
    return false;
  });

  return match;
}

function findCurrentTableEnd(editor: Editor) {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'table') {
      return $from.after(depth);
    }
  }

  return null;
}

type UsePollEditorParams = {
  editor: Editor | null;
  pollDraft: PostPollDraft | null;
  editorShellRef: MutableRefObject<HTMLDivElement | null>;
  setPollDraft: Dispatch<SetStateAction<PostPollDraft | null>>;
  setToolbarPollPopoverPosition: Dispatch<SetStateAction<{ top: number; left: number; width: number } | null>>;
  setShowPollModal: Dispatch<SetStateAction<boolean>>;
};

export function usePollEditor({
  editor,
  pollDraft,
  editorShellRef,
  setPollDraft,
  setToolbarPollPopoverPosition,
  setShowPollModal,
}: UsePollEditorParams) {
  const handleSavePollDraft = useCallback((nextPoll: PostPollDraft) => {
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    const existingPoll = findPollBlock(editor);
    const attrs = {
      question: nextPoll.question,
      options: nextPoll.options,
    };

    if (existingPoll) {
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setNodeMarkup(existingPoll.pos, undefined, attrs);
          return true;
        })
        .run();
    } else {
      const pollContent = [
        { type: 'pollBlock', attrs },
        { type: 'paragraph' },
      ];
      const tableEnd = findCurrentTableEnd(editor);

      if (tableEnd !== null) {
        editor.chain().focus().insertContentAt(tableEnd, pollContent).run();
      } else {
        editor.chain().focus().insertContent(pollContent).run();
      }
    }

    setPollDraft(nextPoll);
    toast.success(existingPoll || pollDraft ? '투표가 수정되었습니다.' : '투표가 추가되었습니다.');
  }, [editor, pollDraft, setPollDraft]);

  const handleRemovePollDraft = useCallback(() => {
    if (editor) {
      const existingPoll = findPollBlock(editor);
      if (existingPoll) {
        editor
          .chain()
          .focus()
          .deleteRange({ from: existingPoll.pos, to: existingPoll.pos + existingPoll.nodeSize })
          .run();
      }
    }

    setPollDraft(null);
    toast.success('투표가 삭제되었습니다.');
  }, [editor, setPollDraft]);

  const handleOpenSelectedPollEditor = useCallback(() => {
    if (!editor) return;

    const existingPoll = findPollBlock(editor);
    if (existingPoll) {
      setPollDraft(existingPoll.draft);
    }

    const shell = editorShellRef.current;
    const selectionRect = editor.view.coordsAtPos(editor.state.selection.from);
    const boundary = shell?.getBoundingClientRect();
    const padding = 8;
    const width = Math.min(POLL_POPOVER_WIDTH, Math.max(120, (boundary?.width ?? POLL_POPOVER_WIDTH) - padding * 2));

    setToolbarPollPopoverPosition({
      top: boundary ? selectionRect.bottom - boundary.top + 6 : 0,
      left: boundary
        ? Math.min(Math.max(selectionRect.left - boundary.left, padding), Math.max(padding, boundary.width - width - padding))
        : 12,
      width,
    });
    setShowPollModal(true);
  }, [editor, editorShellRef, setPollDraft, setShowPollModal, setToolbarPollPopoverPosition]);

  return {
    handleSavePollDraft,
    handleRemovePollDraft,
    handleOpenSelectedPollEditor,
  };
}
