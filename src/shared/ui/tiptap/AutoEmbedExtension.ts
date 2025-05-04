import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { detectPlatform } from './SocialEmbed';

// URL 정규식
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

export const AutoEmbedExtension = Extension.create({
  name: 'autoEmbed',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('autoEmbed'),
        props: {
          // 키 이벤트 감지 (Space 키를 눌렀을 때 링크 변환)
          handleKeyDown: (view, event) => {
            // 스페이스나 엔터 키를 눌렀을 때만 처리
            if (event.key !== ' ' && event.key !== 'Enter') {
              return false;
            }

            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

            // 현재 단락의 텍스트 가져오기
            const currentParagraph = $from.parent.textContent;

            // URL 검색
            const matches = [...currentParagraph.matchAll(URL_REGEX)];
            
            if (!matches.length) {
              return false;
            }

            // 마지막 URL 가져오기
            const lastMatch = matches[matches.length - 1];
            const url = lastMatch[0];

            // 플랫폼 감지
            const platform = detectPlatform(url);
            
            if (!platform) {
              return false;
            }

            // 트랜잭션 시작
            const tr = state.tr;
            
            // 단락 전체의 위치 찾기
            const start = $from.start();
            const matchStart = start + lastMatch.index!;
            const matchEnd = matchStart + url.length;
            
            // URL 부분 삭제
            tr.delete(matchStart, matchEnd);
            
            // 소셜 임베드 노드 삽입
            tr.insert(
              matchStart,
              this.editor.schema.nodes.socialEmbed.create({
                platform,
                url,
              })
            );

            // 트랜잭션 적용
            view.dispatch(tr);
            
            return true;
          },
        },
      }),
      
      // 붙여넣기 이벤트 처리를 위한 플러그인
      new Plugin({
        key: new PluginKey('autoPasteEmbed'),
        props: {
          handlePaste: (view, event) => {
            const { state } = view;
            const text = event.clipboardData?.getData('text/plain');
            
            if (!text) {
              return false;
            }
            
            // URL 검사
            const matches = text.match(URL_REGEX);
            
            if (!matches || matches.length === 0) {
              return false;
            }
            
            const url = matches[0];
            const platform = detectPlatform(url);
            
            if (!platform) {
              return false;
            }
            
            // 트랜잭션 생성
            const tr = state.tr;
            
            // 현재 커서 위치에 소셜 임베드 노드 삽입
            tr.replaceSelectionWith(
              this.editor.schema.nodes.socialEmbed.create({
                platform,
                url,
              })
            );
            
            // 트랜잭션 적용
            view.dispatch(tr);
            
            return true;
          },
        },
      }),
    ];
  },
}); 