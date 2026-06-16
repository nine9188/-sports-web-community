import type { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import type { PostPollDraft } from '@/domains/boards/types/poll';

export type PollBlockMatch = {
  pos: number;
  nodeSize: number;
  draft: PostPollDraft;
};

export function findPollBlock(editor: Editor): PollBlockMatch | null {
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

export function isPollBlockSelected(editor: Editor) {
  const { selection } = editor.state;
  return selection instanceof NodeSelection && selection.node.type.name === 'pollBlock';
}

export function isEntityCardSelected(editor: Editor) {
  const { selection } = editor.state;
  return selection instanceof NodeSelection
    && (
      selection.node.type.name === 'entityCardGroup'
      || selection.node.type.name === 'teamCard'
      || selection.node.type.name === 'playerCard'
    );
}

export function findCurrentTableEnd(editor: Editor) {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'table') {
      return $from.after(depth);
    }
  }

  return null;
}
