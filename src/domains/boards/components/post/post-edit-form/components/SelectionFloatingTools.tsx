import type { Editor } from '@tiptap/react';
import { Bold, Heading2, Heading3, Italic, Link as LinkIcon } from 'lucide-react';
import LinkForm from '@/domains/boards/components/form/LinkForm';

type LinkState = {
  currentUrl: string;
  selectedText: string;
  isActive: boolean;
};

type Position = {
  top: number;
  left: number;
};

type SelectionFloatingToolsProps = {
  editor: Editor;
  selectionMenuPosition: Position | null;
  selectionLinkPopoverPosition: Position | null;
  showLinkModal: boolean;
  linkPopoverSource: 'selection' | 'toolbar' | null;
  linkState: LinkState;
  openLinkPopover: () => void;
  closeLinkPopover: () => void;
  handleAddLink: React.ComponentProps<typeof LinkForm>['onLinkAdd'];
  handleRemoveLink: React.ComponentProps<typeof LinkForm>['onLinkRemove'];
};

export function SelectionFloatingTools({
  editor,
  selectionMenuPosition,
  selectionLinkPopoverPosition,
  showLinkModal,
  linkPopoverSource,
  linkState,
  openLinkPopover,
  closeLinkPopover,
  handleAddLink,
  handleRemoveLink,
}: SelectionFloatingToolsProps) {
  return (
    <>
      {selectionMenuPosition && !showLinkModal && (
        <div
          className="absolute z-20 flex items-center gap-1 rounded-md border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
          style={{
            top: selectionMenuPosition.top,
            left: selectionMenuPosition.left,
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }}
            className={`inline-flex h-8 w-8 items-center justify-center rounded text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333] ${editor.isActive('heading', { level: 2 }) ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
            aria-label="제목 2"
          >
            <Heading2 size={16} />
          </button>

          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            }}
            className={`inline-flex h-8 w-8 items-center justify-center rounded text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333] ${editor.isActive('heading', { level: 3 }) ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
            aria-label="제목 3"
          >
            <Heading3 size={16} />
          </button>

          <span className="mx-1 h-5 w-px bg-black/10 dark:bg-white/10" />

          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              editor.chain().focus().toggleBold().run();
            }}
            className={`inline-flex h-8 w-8 items-center justify-center rounded text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333] ${editor.isActive('bold') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
            aria-label="굵게"
          >
            <Bold size={16} />
          </button>

          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              editor.chain().focus().toggleItalic().run();
            }}
            className={`inline-flex h-8 w-8 items-center justify-center rounded text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333] ${editor.isActive('italic') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
            aria-label="기울임"
          >
            <Italic size={16} />
          </button>

          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openLinkPopover();
            }}
            className={`inline-flex h-8 w-8 items-center justify-center rounded text-gray-900 hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333] ${editor.isActive('link') ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
            aria-label="링크"
          >
            <LinkIcon size={16} />
          </button>
        </div>
      )}

      {showLinkModal && linkPopoverSource === 'selection' && selectionLinkPopoverPosition && (
        <div
          className="absolute z-20"
          style={{
            top: selectionLinkPopoverPosition.top,
            left: selectionLinkPopoverPosition.left,
          }}
        >
          <LinkForm
            onCancel={closeLinkPopover}
            onLinkAdd={handleAddLink}
            onLinkRemove={handleRemoveLink}
            isOpen={showLinkModal}
            currentUrl={linkState.currentUrl}
            selectedText={linkState.selectedText}
            canRemove={linkState.isActive}
          />
        </div>
      )}
    </>
  );
}
