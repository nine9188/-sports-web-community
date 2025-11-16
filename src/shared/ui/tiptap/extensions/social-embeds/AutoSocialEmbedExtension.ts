import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { detectPlatform } from './utils/detectPlatform';

export interface AutoSocialEmbedOptions {
  /**
   * 자동 임베드 활성화 여부
   */
  enabled: boolean;
}

export const AutoSocialEmbedExtension = Extension.create<AutoSocialEmbedOptions>({
  name: 'autoSocialEmbed',

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: new PluginKey('autoSocialEmbed'),
        props: {
          handlePaste: (view, event) => {
            if (!extension.options.enabled) {
              return false;
            }

            const text = event.clipboardData?.getData('text/plain');

            if (!text || !text.trim()) {
              return false;
            }

            // URL인지 확인 (간단한 체크)
            const urlPattern = /^https?:\/\//i;
            if (!urlPattern.test(text.trim())) {
              return false;
            }

            const url = text.trim();
            const platform = detectPlatform(url);

            if (!platform) {
              return false;
            }

            // 소셜 임베드 노드 삽입
            const { state, dispatch } = view;
            const { tr } = state;

            const node = state.schema.nodes.socialEmbed?.create({
              platform,
              url,
            });

            if (!node) {
              return false;
            }

            // 현재 선택 위치에 노드 삽입
            tr.replaceSelectionWith(node);
            dispatch(tr);

            // 기본 붙여넣기 동작 방지
            return true;
          },
        },
      }),
    ];
  },
});
