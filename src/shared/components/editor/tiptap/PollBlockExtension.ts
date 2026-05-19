import { mergeAttributes, Node } from '@tiptap/core';

export type PollBlockAttrs = {
  question: string;
  options: string[];
};

function parseOptions(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((option): option is string => typeof option === 'string') : [];
  } catch {
    return [];
  }
}

export const PollBlockExtension = Node.create({
  name: 'pollBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      question: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-question') || '',
        renderHTML: (attributes) => ({
          'data-question': attributes.question || '',
        }),
      },
      options: {
        default: [],
        parseHTML: (element) => parseOptions(element.getAttribute('data-options')),
        renderHTML: (attributes) => ({
          'data-options': JSON.stringify(Array.isArray(attributes.options) ? attributes.options : []),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="poll-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const options = Array.isArray(node.attrs.options) ? node.attrs.options : [];
    const optionNodes = options.map((option: string) => [
      'div',
      { class: 'editor-poll-block-option' },
      option,
    ]);

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'poll-block',
        class: 'editor-poll-block',
        contenteditable: 'false',
      }),
      ['div', { class: 'editor-poll-block-label' }, '투표'],
      ['div', { class: 'editor-poll-block-question' }, node.attrs.question || '투표 질문'],
      ['div', { class: 'editor-poll-block-options' }, ...optionNodes],
    ];
  },
});
