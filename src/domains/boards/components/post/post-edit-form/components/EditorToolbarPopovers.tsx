import type { ComponentProps } from 'react';
import LinkForm from '@/domains/boards/components/form/LinkForm';
import YoutubeForm from '@/domains/boards/components/form/YoutubeForm';
import MatchResultForm from '@/domains/boards/components/form/MatchResultForm';
import SocialEmbedForm from '@/domains/boards/components/form/SocialEmbedForm';
import TablePickerForm from '@/domains/boards/components/form/TablePickerForm';
import PollForm from '@/domains/boards/components/form/PollForm';
import { EntityPickerForm } from '@/domains/boards/components/entity/EntityPickerForm';
import type { PostPollDraft } from '@/domains/boards/types/poll';

type LocalPopoverPosition = {
  top: number;
  left: number;
  width: number;
};

type LinkState = {
  currentUrl: string;
  selectedText: string;
  isActive: boolean;
};

type EditorToolbarPopoversProps = {
  linkPopoverSource: 'selection' | 'toolbar' | null;

  showLinkModal: boolean;
  showYoutubeModal: boolean;
  showSocialModal: boolean;
  showMatchModal: boolean;
  showTableModal: boolean;
  showPollModal: boolean;
  showTeamModal: boolean;
  showPlayerModal: boolean;

  toolbarLinkPopoverPosition: LocalPopoverPosition | null;
  toolbarYoutubePopoverPosition: LocalPopoverPosition | null;
  toolbarSocialPopoverPosition: LocalPopoverPosition | null;
  toolbarMatchPopoverPosition: LocalPopoverPosition | null;
  toolbarTablePopoverPosition: LocalPopoverPosition | null;
  toolbarPollPopoverPosition: LocalPopoverPosition | null;
  toolbarTeamPopoverPosition: LocalPopoverPosition | null;
  toolbarPlayerPopoverPosition: LocalPopoverPosition | null;

  linkState: LinkState;
  pollDraft: PostPollDraft | null;

  closeLinkPopover: () => void;
  closeYoutubePopover: () => void;
  closeSocialPopover: () => void;
  closeMatchPopover: () => void;
  closeTablePopover: () => void;
  closePollPopover: () => void;
  closeTeamPopover: () => void;
  closePlayerPopover: () => void;

  handleAddLink: ComponentProps<typeof LinkForm>['onLinkAdd'];
  handleRemoveLink: ComponentProps<typeof LinkForm>['onLinkRemove'];
  handleAddYoutube: ComponentProps<typeof YoutubeForm>['onYoutubeAdd'];
  handleAddSocialEmbed: ComponentProps<typeof SocialEmbedForm>['onSocialEmbedAdd'];
  handleAddMatch: ComponentProps<typeof MatchResultForm>['onMatchAdd'];
  handleAddTable: ComponentProps<typeof TablePickerForm>['onTableAdd'];
  handleSavePollDraft: ComponentProps<typeof PollForm>['onSave'];
  handleSelectTeam: ComponentProps<typeof EntityPickerForm>['onSelectTeam'];
  handleSelectPlayer: ComponentProps<typeof EntityPickerForm>['onSelectPlayer'];
};

export function EditorToolbarPopovers({
  linkPopoverSource,
  showLinkModal,
  showYoutubeModal,
  showSocialModal,
  showMatchModal,
  showTableModal,
  showPollModal,
  showTeamModal,
  showPlayerModal,
  toolbarLinkPopoverPosition,
  toolbarYoutubePopoverPosition,
  toolbarSocialPopoverPosition,
  toolbarMatchPopoverPosition,
  toolbarTablePopoverPosition,
  toolbarPollPopoverPosition,
  toolbarTeamPopoverPosition,
  toolbarPlayerPopoverPosition,
  linkState,
  pollDraft,
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
}: EditorToolbarPopoversProps) {
  return (
    <>
      {showLinkModal && linkPopoverSource === 'toolbar' && (
        <div
          className="absolute z-[10000]"
          style={{
            top: toolbarLinkPopoverPosition?.top ?? 0,
            left: toolbarLinkPopoverPosition?.left ?? 12,
            width: toolbarLinkPopoverPosition?.width,
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

      {showYoutubeModal && (
        <div
          className="absolute z-[10000]"
          style={{
            top: toolbarYoutubePopoverPosition?.top ?? 0,
            left: toolbarYoutubePopoverPosition?.left ?? 12,
            width: toolbarYoutubePopoverPosition?.width,
          }}
        >
          <YoutubeForm
            onCancel={closeYoutubePopover}
            onYoutubeAdd={handleAddYoutube}
            isOpen={showYoutubeModal}
          />
        </div>
      )}

      {showSocialModal && (
        <div
          className="absolute z-[10000]"
          style={{
            top: toolbarSocialPopoverPosition?.top ?? 0,
            left: toolbarSocialPopoverPosition?.left ?? 12,
            width: toolbarSocialPopoverPosition?.width,
          }}
        >
          <SocialEmbedForm
            isOpen={showSocialModal}
            onCancel={closeSocialPopover}
            onSocialEmbedAdd={handleAddSocialEmbed}
          />
        </div>
      )}

      {showMatchModal && (
        <div
          className="absolute z-[10000]"
          style={{
            top: toolbarMatchPopoverPosition?.top ?? 0,
            left: toolbarMatchPopoverPosition?.left ?? 12,
            width: toolbarMatchPopoverPosition?.width,
          }}
        >
          <MatchResultForm
            isOpen={showMatchModal}
            onCancel={closeMatchPopover}
            onMatchAdd={handleAddMatch}
          />
        </div>
      )}

      {showTableModal && (
        <div
          className="absolute z-[10000]"
          style={{
            top: toolbarTablePopoverPosition?.top ?? 0,
            left: toolbarTablePopoverPosition?.left ?? 12,
            width: toolbarTablePopoverPosition?.width,
          }}
        >
          <TablePickerForm
            isOpen={showTableModal}
            onCancel={closeTablePopover}
            onTableAdd={handleAddTable}
          />
        </div>
      )}

      {showPollModal && (
        <div
          className="absolute z-[10000]"
          style={{
            top: toolbarPollPopoverPosition?.top ?? 0,
            left: toolbarPollPopoverPosition?.left ?? 12,
            width: toolbarPollPopoverPosition?.width,
          }}
        >
          <PollForm
            isOpen={showPollModal}
            initialPoll={pollDraft}
            onCancel={closePollPopover}
            onSave={handleSavePollDraft}
          />
        </div>
      )}

      {showTeamModal && (
        <div
          className="absolute z-[10000]"
          style={{
            top: toolbarTeamPopoverPosition?.top ?? 0,
            left: toolbarTeamPopoverPosition?.left ?? 12,
            width: toolbarTeamPopoverPosition?.width,
          }}
        >
          <EntityPickerForm
            isOpen={showTeamModal}
            mode="team"
            onClose={closeTeamPopover}
            onSelectTeam={handleSelectTeam}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>
      )}

      {showPlayerModal && (
        <div
          className="absolute z-[10000]"
          style={{
            top: toolbarPlayerPopoverPosition?.top ?? 0,
            left: toolbarPlayerPopoverPosition?.left ?? 12,
            width: toolbarPlayerPopoverPosition?.width,
          }}
        >
          <EntityPickerForm
            isOpen={showPlayerModal}
            mode="player"
            onClose={closePlayerPopover}
            onSelectTeam={handleSelectTeam}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>
      )}
    </>
  );
}
