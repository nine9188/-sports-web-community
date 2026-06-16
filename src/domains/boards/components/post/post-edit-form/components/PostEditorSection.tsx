import type { ChangeEvent, MutableRefObject } from 'react';
import { EditorContent, type Editor } from '@tiptap/react';
import EditorToolbar from '@/domains/boards/components/createnavigation/EditorToolbar';
import type { PostPollDraft } from '@/domains/boards/types/poll';
import { EditorToolbarPopovers } from './EditorToolbarPopovers';
import { EditorBubbleMenus } from './EditorBubbleMenus';
import { TableFloatingMenu } from './TableFloatingMenu';
import { SelectionFloatingTools } from './SelectionFloatingTools';

type LocalPopoverPosition = {
  top: number;
  left: number;
  width: number;
};

type Position = {
  top: number;
  left: number;
};

type LinkState = {
  currentUrl: string;
  selectedText: string;
  isActive: boolean;
};

type PostEditorSectionProps = {
  editor: Editor | null;
  editorShellRef: MutableRefObject<HTMLDivElement | null>;
  setEditorViewportElement: (node: HTMLDivElement | null) => void;
  editorViewportElement: HTMLDivElement | null;
  extensionsLoaded: boolean;
  isImageUploading: boolean;
  isVideoUploading: boolean;
  imageFileInputRef: MutableRefObject<HTMLInputElement | null>;
  videoFileInputRef: MutableRefObject<HTMLInputElement | null>;
  showLinkModal: boolean;
  showYoutubeModal: boolean;
  showMatchModal: boolean;
  showSocialModal: boolean;
  showTeamModal: boolean;
  showPlayerModal: boolean;
  showTableModal: boolean;
  showPollModal: boolean;
  linkPopoverSource: 'selection' | 'toolbar' | null;
  toolbarLinkPopoverPosition: LocalPopoverPosition | null;
  toolbarYoutubePopoverPosition: LocalPopoverPosition | null;
  toolbarSocialPopoverPosition: LocalPopoverPosition | null;
  toolbarMatchPopoverPosition: LocalPopoverPosition | null;
  toolbarTablePopoverPosition: LocalPopoverPosition | null;
  toolbarPollPopoverPosition: LocalPopoverPosition | null;
  toolbarTeamPopoverPosition: LocalPopoverPosition | null;
  toolbarPlayerPopoverPosition: LocalPopoverPosition | null;
  selectionMenuPosition: Position | null;
  selectionLinkPopoverPosition: Position | null;
  tableMenuPosition: Position | null;
  linkState: LinkState;
  pollDraft: PostPollDraft | null;
  tableInsertionRangeRef: MutableRefObject<{ from: number; to: number } | null>;
  handleEditorToolToggle: Parameters<typeof EditorToolbar>[0]['handleToggleDropdown'];
  handleImageToolbarClick: () => void;
  handleVideoToolbarClick: () => void;
  handleImageFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleVideoFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleToolbarLinkButtonRect: (rect: DOMRect) => void;
  handleToolbarYoutubeButtonRect: (rect: DOMRect) => void;
  handleToolbarSocialButtonRect: (rect: DOMRect) => void;
  handleToolbarMatchButtonRect: (rect: DOMRect) => void;
  handleToolbarTeamButtonRect: (rect: DOMRect) => void;
  handleToolbarPlayerButtonRect: (rect: DOMRect) => void;
  handleToolbarTableButtonRect: (rect: DOMRect) => void;
  handleToolbarPollButtonRect: (rect: DOMRect) => void;
  closeLinkPopover: () => void;
  closeYoutubePopover: () => void;
  closeSocialPopover: () => void;
  closeMatchPopover: () => void;
  closeTablePopover: () => void;
  closePollPopover: () => void;
  closeTeamPopover: () => void;
  closePlayerPopover: () => void;
  handleAddLink: (url: string, text?: string) => void | Promise<void>;
  handleRemoveLink: () => void;
  handleAddYoutube: (url: string) => Promise<void>;
  handleAddSocialEmbed: (...args: any[]) => void | Promise<void>;
  handleAddMatch: (...args: any[]) => void | Promise<void>;
  handleAddTable: (rows: number, cols: number, range?: { from: number; to: number }) => void | Promise<void>;
  handleSavePollDraft: (draft: PostPollDraft) => void;
  handleSelectTeam: (...args: any[]) => void | Promise<void>;
  handleSelectPlayer: (...args: any[]) => void | Promise<void>;
  isPollBlockSelected: (editor: Editor) => boolean;
  isEntityCardSelected: (editor: Editor) => boolean;
  handleOpenSelectedPollEditor: () => void;
  handleRemovePollDraft: () => void;
  handleOpenSelectedEntityEditor: () => void;
  updateTableMenuAfterCommand: (nearPosition: number, restoreSelection?: boolean) => void;
  setTableMenuPosition: (position: Position | null) => void;
  openLinkPopover: () => void;
};

export function PostEditorSection({
  editor,
  editorShellRef,
  setEditorViewportElement,
  editorViewportElement,
  extensionsLoaded,
  isImageUploading,
  isVideoUploading,
  imageFileInputRef,
  videoFileInputRef,
  showLinkModal,
  showYoutubeModal,
  showMatchModal,
  showSocialModal,
  showTeamModal,
  showPlayerModal,
  showTableModal,
  showPollModal,
  linkPopoverSource,
  toolbarLinkPopoverPosition,
  toolbarYoutubePopoverPosition,
  toolbarSocialPopoverPosition,
  toolbarMatchPopoverPosition,
  toolbarTablePopoverPosition,
  toolbarPollPopoverPosition,
  toolbarTeamPopoverPosition,
  toolbarPlayerPopoverPosition,
  selectionMenuPosition,
  selectionLinkPopoverPosition,
  tableMenuPosition,
  linkState,
  pollDraft,
  tableInsertionRangeRef,
  handleEditorToolToggle,
  handleImageToolbarClick,
  handleVideoToolbarClick,
  handleImageFileChange,
  handleVideoFileChange,
  handleToolbarLinkButtonRect,
  handleToolbarYoutubeButtonRect,
  handleToolbarSocialButtonRect,
  handleToolbarMatchButtonRect,
  handleToolbarTeamButtonRect,
  handleToolbarPlayerButtonRect,
  handleToolbarTableButtonRect,
  handleToolbarPollButtonRect,
  closeLinkPopover,
  closeYoutubePopover,
  closeSocialPopover,
  closeMatchPopover,
  closeTablePopover,
  closePollPopover,
  closeTeamPopover,
  closePlayerPopover,
  handleAddLink,
  handleRemoveLink,
  handleAddYoutube,
  handleAddSocialEmbed,
  handleAddMatch,
  handleAddTable,
  handleSavePollDraft,
  handleSelectTeam,
  handleSelectPlayer,
  isPollBlockSelected,
  isEntityCardSelected,
  handleOpenSelectedPollEditor,
  handleRemovePollDraft,
  handleOpenSelectedEntityEditor,
  updateTableMenuAfterCommand,
  setTableMenuPosition,
  openLinkPopover,
}: PostEditorSectionProps) {
  return (
    <div ref={editorShellRef} className="relative space-y-2">
      <label htmlFor="content" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">내용</label>

      <EditorToolbar
        editor={editor}
        extensionsLoaded={extensionsLoaded}
        isImageUploading={isImageUploading}
        isVideoUploading={isVideoUploading}
        showLinkModal={showLinkModal}
        showYoutubeModal={showYoutubeModal}
        showMatchModal={showMatchModal}
        showSocialModal={showSocialModal}
        showTeamModal={showTeamModal}
        showPlayerModal={showPlayerModal}
        showTableModal={showTableModal}
        showPollModal={showPollModal}
        handleToggleDropdown={handleEditorToolToggle}
        onImageClick={handleImageToolbarClick}
        onVideoClick={handleVideoToolbarClick}
        onToolbarLinkButtonRect={handleToolbarLinkButtonRect}
        onToolbarYoutubeButtonRect={handleToolbarYoutubeButtonRect}
        onToolbarSocialButtonRect={handleToolbarSocialButtonRect}
        onToolbarMatchButtonRect={handleToolbarMatchButtonRect}
        onToolbarTeamButtonRect={handleToolbarTeamButtonRect}
        onToolbarPlayerButtonRect={handleToolbarPlayerButtonRect}
        onToolbarTableButtonRect={handleToolbarTableButtonRect}
        onToolbarPollButtonRect={handleToolbarPollButtonRect}
      />

      <input ref={imageFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
      <input ref={videoFileInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />

      <EditorToolbarPopovers
        linkPopoverSource={linkPopoverSource}
        showLinkModal={showLinkModal}
        showYoutubeModal={showYoutubeModal}
        showSocialModal={showSocialModal}
        showMatchModal={showMatchModal}
        showTableModal={showTableModal}
        showPollModal={showPollModal}
        showTeamModal={showTeamModal}
        showPlayerModal={showPlayerModal}
        toolbarLinkPopoverPosition={toolbarLinkPopoverPosition}
        toolbarYoutubePopoverPosition={toolbarYoutubePopoverPosition}
        toolbarSocialPopoverPosition={toolbarSocialPopoverPosition}
        toolbarMatchPopoverPosition={toolbarMatchPopoverPosition}
        toolbarTablePopoverPosition={toolbarTablePopoverPosition}
        toolbarPollPopoverPosition={toolbarPollPopoverPosition}
        toolbarTeamPopoverPosition={toolbarTeamPopoverPosition}
        toolbarPlayerPopoverPosition={toolbarPlayerPopoverPosition}
        linkState={linkState}
        pollDraft={pollDraft}
        closeLinkPopover={closeLinkPopover}
        closeYoutubePopover={closeYoutubePopover}
        closeSocialPopover={closeSocialPopover}
        closeMatchPopover={closeMatchPopover}
        closeTablePopover={closeTablePopover}
        closePollPopover={closePollPopover}
        closeTeamPopover={closeTeamPopover}
        closePlayerPopover={closePlayerPopover}
        handleAddLink={handleAddLink}
        handleRemoveLink={handleRemoveLink}
        handleAddYoutube={handleAddYoutube}
        handleAddSocialEmbed={handleAddSocialEmbed}
        handleAddMatch={handleAddMatch}
        handleAddTable={(rows, cols) => handleAddTable(rows, cols, tableInsertionRangeRef.current ?? undefined)}
        handleSavePollDraft={handleSavePollDraft}
        handleSelectTeam={handleSelectTeam}
        handleSelectPlayer={handleSelectPlayer}
      />

      <div
        ref={setEditorViewportElement}
        className="relative border border-black/7 dark:border-white/10 rounded-b-md h-[60vh] min-h-[420px] max-h-[680px] overflow-x-hidden overflow-y-auto overscroll-contain bg-white dark:bg-[#262626]"
      >
        {editor && (
          <EditorBubbleMenus
            editor={editor}
            editorViewportElement={editorViewportElement}
            showPollModal={showPollModal}
            showTeamModal={showTeamModal}
            showPlayerModal={showPlayerModal}
            isPollBlockSelected={isPollBlockSelected}
            isEntityCardSelected={isEntityCardSelected}
            onOpenSelectedPollEditor={handleOpenSelectedPollEditor}
            onRemovePollDraft={handleRemovePollDraft}
            onOpenSelectedEntityEditor={handleOpenSelectedEntityEditor}
          />
        )}

        <div className="sticky left-0 top-0 z-20 h-0 w-full overflow-visible">
          {editor && tableMenuPosition && !showTableModal && (
            <TableFloatingMenu
              editor={editor}
              tableMenuPosition={tableMenuPosition}
              onUpdateAfterCommand={updateTableMenuAfterCommand}
              onDeleteTable={() => {
                editor.chain().focus().deleteTable().run();
                setTableMenuPosition(null);
              }}
            />
          )}

          {editor && (
            <SelectionFloatingTools
              editor={editor}
              selectionMenuPosition={selectionMenuPosition}
              selectionLinkPopoverPosition={selectionLinkPopoverPosition}
              showLinkModal={showLinkModal}
              linkPopoverSource={linkPopoverSource}
              linkState={linkState}
              openLinkPopover={openLinkPopover}
              closeLinkPopover={closeLinkPopover}
              handleAddLink={handleAddLink}
              handleRemoveLink={handleRemoveLink}
            />
          )}
        </div>

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
