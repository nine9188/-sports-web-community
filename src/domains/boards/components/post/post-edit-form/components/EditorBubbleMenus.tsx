import { BubbleMenu, type Editor } from '@tiptap/react';
import { Trash2 } from 'lucide-react';

type EditorBubbleMenusProps = {
  editor: Editor;
  editorViewportElement: HTMLDivElement | null;
  showPollModal: boolean;
  showTeamModal: boolean;
  showPlayerModal: boolean;
  isPollBlockSelected: (editor: Editor) => boolean;
  isEntityCardSelected: (editor: Editor) => boolean;
  onOpenSelectedPollEditor: () => void;
  onRemovePollDraft: () => void;
  onOpenSelectedEntityEditor: () => void;
};

function getEditorBubbleMenuTippyOptions(editorViewportElement: HTMLDivElement | null) {
  return {
    appendTo: () => editorViewportElement ?? document.body,
    duration: 0,
    maxWidth: 'none',
    zIndex: 30,
    popperOptions: {
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            boundary: editorViewportElement ?? 'clippingParents',
            padding: 8,
          },
        },
        {
          name: 'flip',
          options: {
            boundary: editorViewportElement ?? 'clippingParents',
            padding: 8,
          },
        },
      ],
    },
  };
}

export function EditorBubbleMenus({
  editor,
  editorViewportElement,
  showPollModal,
  showTeamModal,
  showPlayerModal,
  isPollBlockSelected,
  isEntityCardSelected,
  onOpenSelectedPollEditor,
  onRemovePollDraft,
  onOpenSelectedEntityEditor,
}: EditorBubbleMenusProps) {
  const tippyOptions = getEditorBubbleMenuTippyOptions(editorViewportElement);

  return (
    <>
      <BubbleMenu
        editor={editor}
        pluginKey="pollBubbleMenu"
        updateDelay={0}
        shouldShow={({ editor }) => isPollBlockSelected(editor) && !showPollModal}
        tippyOptions={tippyOptions}
      >
        <div
          className="flex items-center gap-1 rounded-md border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <button
            type="button"
            className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
            onClick={onOpenSelectedPollEditor}
          >
            수정
          </button>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            title="투표 삭제"
            onClick={onRemovePollDraft}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </BubbleMenu>

      <BubbleMenu
        editor={editor}
        pluginKey="entityCardBubbleMenu"
        updateDelay={0}
        shouldShow={({ editor }) => isEntityCardSelected(editor) && !showTeamModal && !showPlayerModal}
        tippyOptions={tippyOptions}
      >
        <div
          className="flex items-center gap-1 rounded-md border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <button
            type="button"
            className="h-8 rounded px-2 text-[12px] font-semibold text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
            onClick={onOpenSelectedEntityEditor}
          >
            변경
          </button>
        </div>
      </BubbleMenu>
    </>
  );
}
