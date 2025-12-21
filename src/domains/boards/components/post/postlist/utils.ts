/**
 * PostList 유틸리티 함수
 */

import { ContentTypeCheck, Post } from './types';
import { DEFAULT_MAX_HEIGHT } from './constants';

/**
 * 게시글 콘텐츠에 특정 요소가 포함되어 있는지 확인
 *
 * @param content - 게시글 콘텐츠 (TipTap JSON 또는 HTML 문자열)
 * @returns 이미지/비디오/유튜브/링크 포함 여부
 */
export function checkContentType(content: string | undefined): ContentTypeCheck {
  if (!content) {
    return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
  }

  try {
    let contentToCheck = content;
    let hasSpecialContent = false;

    const isJSON = content.startsWith('{') || content.startsWith('[');

    // JSON 형태의 콘텐츠인지 확인하고 파싱
    if (isJSON) {
      try {
        const parsedContent = JSON.parse(content);

        // TipTap 형식인지 확인
        if (parsedContent && typeof parsedContent === 'object') {
          if (parsedContent.type === 'doc' && Array.isArray(parsedContent.content)) {
            // TipTap 문서 형식 - 재귀적으로 모든 노드 검사
            const extractTextFromTipTap = (nodes: unknown[]): string => {
              let text = '';
              for (const node of nodes) {
                if (typeof node === 'object' && node !== null) {
                  const nodeObj = node as Record<string, unknown>;

                  if (nodeObj.type === 'text' && typeof nodeObj.text === 'string') {
                    text += nodeObj.text + ' ';
                  } else if (
                    nodeObj.type === 'image' &&
                    typeof nodeObj.attrs === 'object' &&
                    nodeObj.attrs !== null &&
                    typeof (nodeObj.attrs as Record<string, unknown>).src === 'string'
                  ) {
                    const attrs = nodeObj.attrs as Record<string, unknown>;
                    text += `<img src="${attrs.src}"> `;
                    hasSpecialContent = true;
                  } else if (nodeObj.type === 'matchCard') {
                    // 매치카드 감지
                    text += ' [매치카드] ';
                    hasSpecialContent = true;
                  } else if (Array.isArray(nodeObj.content)) {
                    text += extractTextFromTipTap(nodeObj.content);
                  }

                  // 링크 마크 확인
                  if (Array.isArray(nodeObj.marks)) {
                    for (const mark of nodeObj.marks) {
                      if (typeof mark === 'object' && mark !== null) {
                        const markObj = mark as Record<string, unknown>;
                        if (
                          markObj.type === 'link' &&
                          typeof markObj.attrs === 'object' &&
                          markObj.attrs !== null &&
                          typeof (markObj.attrs as Record<string, unknown>).href === 'string'
                        ) {
                          const attrs = markObj.attrs as Record<string, unknown>;
                          text += ` ${attrs.href} `;
                        }
                      }
                    }
                  }
                }
              }
              return text;
            };

            contentToCheck = extractTextFromTipTap(parsedContent.content);
          } else {
            // 다른 JSON 형식 - 문자열로 변환
            contentToCheck = JSON.stringify(parsedContent);
          }
        }
      } catch {
        // JSON 파싱 실패 시 원본 문자열 사용
        contentToCheck = content;
      }
    }

    // 소셜 임베드 및 특수 콘텐츠 확인
    const hasSocialEmbed =
      contentToCheck.includes('twitter.com') ||
      contentToCheck.includes('instagram.com') ||
      contentToCheck.includes('youtube.com/embed');

    const hasMatchCard =
      contentToCheck.includes('data-type="match-card"') ||
      contentToCheck.includes('[매치카드]') ||
      contentToCheck.includes('match-card');

    // 이미지 확인 (다양한 형식)
    const hasImage =
      contentToCheck.includes('<img') ||
      contentToCheck.includes('![') ||
      contentToCheck.includes('image') ||
      /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i.test(contentToCheck) ||
      hasSpecialContent;

    // 비디오 확인
    const hasVideo =
      contentToCheck.includes('<video') ||
      contentToCheck.includes('mp4') ||
      contentToCheck.includes('webm') ||
      contentToCheck.includes('mov') ||
      /\.(mp4|webm|mov|avi|mkv|flv|wmv)/i.test(contentToCheck);

    // YouTube 확인 (더 정확한 패턴)
    const hasYoutube =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)/i.test(
        contentToCheck
      ) ||
      contentToCheck.includes('youtube') ||
      hasSocialEmbed;

    // 링크 확인 (http/https 링크)
    const hasLink =
      /https?:\/\/[^\s<>"]+/i.test(contentToCheck) ||
      contentToCheck.includes('href=') ||
      hasSocialEmbed ||
      hasMatchCard;

    return { hasImage, hasVideo, hasYoutube, hasLink };
  } catch {
    return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
  }
}

/**
 * 게시글 콘텐츠에서 첫 번째 이미지 URL 추출
 *
 * @param content - 게시글 콘텐츠 (TipTap JSON 또는 HTML 문자열)
 * @returns 첫 번째 이미지 URL 또는 null
 */
export function extractFirstImageUrl(content?: string): string | null {
  if (!content) return null;

  try {
    // TipTap JSON 형식 확인
    if (content.trim().startsWith('{')) {
      try {
        const obj = JSON.parse(content);
        if (obj?.type === 'doc' && Array.isArray(obj.content)) {
          for (const node of obj.content) {
            if (node?.type === 'image' && node?.attrs?.src) {
              return node.attrs.src as string;
            }
            if (node?.type === 'paragraph' && Array.isArray(node.content)) {
              for (const sub of node.content) {
                if (sub?.type === 'image' && sub?.attrs?.src) {
                  return sub.attrs.src as string;
                }
              }
            }
          }
        }
        if (obj?.imageUrl) return obj.imageUrl as string;
        if (obj?.image_url) return obj.image_url as string;
      } catch {
        // JSON 파싱 실패 시 계속 진행
      }
    }

    // HTML img 태그에서 추출
    const imgTag = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imgTag?.[1]) return imgTag[1];

    // Markdown 이미지 형식에서 추출
    const mdImg = content.match(/!\[[^\]]*\]\(([^)]+)\)/i);
    if (mdImg?.[1]) return mdImg[1];

    // 일반 이미지 URL 패턴에서 추출
    const url = content.match(/(https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|gif|webp))/i);
    if (url?.[1]) return url[1];
  } catch (error) {
    console.error('Failed to extract image URL:', error);
  }

  return null;
}

/**
 * maxHeight 문자열을 픽셀 값으로 변환
 *
 * @param maxHeight - CSS 높이 문자열 (예: "500px", "80vh")
 * @returns 픽셀 값 (number)
 */
export function calculateHeight(maxHeight?: string): number {
  if (!maxHeight) return DEFAULT_MAX_HEIGHT;

  try {
    // "500px" → 500
    if (maxHeight.endsWith('px')) {
      return parseInt(maxHeight, 10);
    }

    // "80vh" → window.innerHeight * 0.8
    if (maxHeight.endsWith('vh')) {
      if (typeof window !== 'undefined') {
        const percentage = parseInt(maxHeight, 10) / 100;
        return window.innerHeight * percentage;
      }
      return DEFAULT_MAX_HEIGHT;
    }

    // "sm:500px" → "500px" 추출 후 변환
    if (maxHeight.startsWith('sm:')) {
      const cleanedHeight = maxHeight.replace('sm:', '');
      return calculateHeight(cleanedHeight);
    }

    // 숫자만 있는 경우
    const numericValue = parseInt(maxHeight, 10);
    if (!isNaN(numericValue)) {
      return numericValue;
    }
  } catch (error) {
    console.error('Failed to calculate height:', error);
  }

  return DEFAULT_MAX_HEIGHT;
}

/**
 * 게시글이 삭제되었는지 확인
 */
export function isDeletedPost(post: Post): boolean {
  return post.is_deleted === true;
}

/**
 * 게시글이 숨김 처리되었는지 확인
 */
export function isHiddenPost(post: Post): boolean {
  return post.is_hidden === true;
}

/**
 * 게시글 제목 텍스트 반환 (삭제/숨김 처리 포함)
 */
export function getPostTitleText(post: Post): string {
  if (isDeletedPost(post)) return '[삭제된 게시글]';
  if (isHiddenPost(post)) return '[숨김 처리된 게시글]';
  return String(post?.title || '제목 없음');
}

/**
 * 게시글 제목 CSS 클래스 반환 (삭제/숨김 스타일)
 */
export function getPostTitleClassName(post: Post, isCurrentPost: boolean): string {
  const baseClass = 'text-xs';
  const fontClass = isCurrentPost ? 'font-medium' : '';
  const colorClass = 'text-gray-900 dark:text-[#F0F0F0]';
  const stateClass = isDeletedPost(post)
    ? 'text-red-500 dark:text-red-400'
    : isHiddenPost(post)
    ? 'text-gray-500 dark:text-gray-400'
    : '';

  return `${baseClass} ${fontClass} ${colorClass} ${stateClass}`.trim();
}
