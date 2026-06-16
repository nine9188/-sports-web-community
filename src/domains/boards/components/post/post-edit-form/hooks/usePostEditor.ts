import { useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import type { Content, AnyExtension } from '@tiptap/core';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { PostPollDraft } from '@/domains/boards/types/poll';
import { extractAutoTagsFromContent } from '@/domains/boards/utils/post/extractAutoTagsFromContent';
import { extractRelatedCtasFromContent, type RelatedPostCta } from '@/domains/boards/utils/post/extractRelatedCtasFromContent';

type PollBlockMatch = {
  pos: number;
  nodeSize: number;
  draft: PostPollDraft;
};

function findPollBlockInEditorJson(editor: ReturnType<typeof useEditor>): PollBlockMatch | null {
  if (!editor) return null;

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

type UsePostEditorParams = {
  loadedExtensions: AnyExtension[];
  extensionsLoaded: boolean;
  parsedInitialContent: Content | string;
  initialContentAppliedRef: MutableRefObject<boolean>;
  pollDraftRef: MutableRefObject<PostPollDraft | null>;
  setContent: Dispatch<SetStateAction<string>>;
  setAutoTags: Dispatch<SetStateAction<string[]>>;
  setRelatedConnections: Dispatch<SetStateAction<RelatedPostCta[]>>;
  setPollDraft: Dispatch<SetStateAction<PostPollDraft | null>>;
};

export function usePostEditor({
  loadedExtensions,
  extensionsLoaded,
  parsedInitialContent,
  initialContentAppliedRef,
  pollDraftRef,
  setContent,
  setAutoTags,
  setRelatedConnections,
  setPollDraft,
}: UsePostEditorParams) {
  const editor = useEditor({
    extensions: loadedExtensions,
    content: extensionsLoaded ? parsedInitialContent as Content : '',
    onUpdate: ({ editor }) => {
      const editorJson = editor.getJSON();
      const jsonContent = JSON.stringify(editorJson);
      setContent(jsonContent);
      setAutoTags(extractAutoTagsFromContent(editorJson));
      setRelatedConnections(extractRelatedCtasFromContent(editorJson));

      const pollBlock = findPollBlockInEditorJson(editor);
      const currentPoll = pollDraftRef.current;

      if (!pollBlock && currentPoll) {
        setPollDraft(null);
      } else if (pollBlock) {
        const nextPoll = pollBlock.draft;
        const changed = !currentPoll
          || currentPoll.question !== nextPoll.question
          || currentPoll.options.length !== nextPoll.options.length
          || currentPoll.options.some((option, index) => option !== nextPoll.options[index]);

        if (changed) {
          setPollDraft(nextPoll);
        }
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose dark:prose-invert focus:outline-none max-w-none w-full min-h-[460px] p-4 text-gray-900 dark:text-[#F0F0F0] text-base',
      },
    },
    immediatelyRender: false,
  }, [extensionsLoaded, loadedExtensions, parsedInitialContent]);

  useEffect(() => {
    if (!editor || !extensionsLoaded || !parsedInitialContent || initialContentAppliedRef.current) return;

    if (!editor.isEmpty) {
      initialContentAppliedRef.current = true;
      return;
    }

    editor.commands.setContent(parsedInitialContent as Content, true);
    const editorJson = editor.getJSON();
    const jsonContent = JSON.stringify(editorJson);
    setContent(jsonContent);
    setAutoTags(extractAutoTagsFromContent(editorJson));
    setRelatedConnections(extractRelatedCtasFromContent(editorJson));
    initialContentAppliedRef.current = true;
  }, [
    editor,
    extensionsLoaded,
    initialContentAppliedRef,
    parsedInitialContent,
    setAutoTags,
    setContent,
    setRelatedConnections,
  ]);

  return editor;
}
