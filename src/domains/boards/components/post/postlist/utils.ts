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
  const defaultResult: ContentTypeCheck = {
    hasImage: false,
    hasVideo: false,
    hasYoutube: false,
    hasLink: false,
    hasMatchCard: false,
    hasTeamCard: false,
    hasPlayerCard: false,
    hasTwitter: false,
    hasInstagram: false,
    hasFacebook: false,
    hasTiktok: false,
    hasLinkedin: false,
  };

  if (!content) {
    return defaultResult;
  }

  try {
    let contentToCheck = content;
    let hasRealImage = false;  // 실제 이미지 (매치카드 제외)
    let foundMatchCard = false; // 매치카드 발견 여부
    let foundTeamCard = false;  // 팀카드 발견 여부
    let foundPlayerCard = false; // 선수카드 발견 여부
    let foundVideo = false;     // 비디오 발견 여부
    let foundYoutube = false;   // 유튜브 발견 여부
    let foundTwitter = false;   // 트위터 발견 여부
    let foundInstagram = false; // 인스타그램 발견 여부
    let foundFacebook = false;  // 페이스북 발견 여부
    let foundTiktok = false;    // 틱톡 발견 여부
    let foundLinkedin = false;  // 링크드인 발견 여부

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
                    hasRealImage = true;  // 실제 이미지 발견
                  } else if (nodeObj.type === 'video') {
                    // 비디오 노드 감지
                    text += ' [비디오] ';
                    foundVideo = true;
                  } else if (nodeObj.type === 'youtube') {
                    // 유튜브 노드 감지
                    text += ' [유튜브] ';
                    foundYoutube = true;
                  } else if (nodeObj.type === 'socialEmbed' && nodeObj.attrs) {
                    // 소셜 임베드 노드 감지
                    const attrs = nodeObj.attrs as Record<string, unknown>;
                    const platform = attrs.platform as string;
                    switch (platform) {
                      case 'youtube':
                        text += ' [유튜브] ';
                        foundYoutube = true;
                        break;
                      case 'twitter':
                        text += ' [트위터] ';
                        foundTwitter = true;
                        break;
                      case 'instagram':
                        text += ' [인스타그램] ';
                        foundInstagram = true;
                        break;
                      case 'facebook':
                        text += ' [페이스북] ';
                        foundFacebook = true;
                        break;
                      case 'tiktok':
                        text += ' [틱톡] ';
                        foundTiktok = true;
                        break;
                      case 'linkedin':
                        text += ' [링크드인] ';
                        foundLinkedin = true;
                        break;
                      default:
                        text += ` [${platform}] `;
                    }
                  } else if (nodeObj.type === 'matchCard') {
                    // 매치카드 감지 (이미지와 분리)
                    text += ' [매치카드] ';
                    foundMatchCard = true;
                  } else if (nodeObj.type === 'teamCard') {
                    // 팀카드 감지
                    text += ' [팀카드] ';
                    foundTeamCard = true;
                  } else if (nodeObj.type === 'playerCard') {
                    // 선수카드 감지
                    text += ' [선수카드] ';
                    foundPlayerCard = true;
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

    // 매치카드 확인 (HTML 형식에서도 감지)
    const hasMatchCard =
      foundMatchCard ||
      contentToCheck.includes('data-type="match-card"') ||
      contentToCheck.includes('[매치카드]') ||
      contentToCheck.includes('match-card');

    // 팀카드 확인 (HTML 형식에서도 감지)
    const hasTeamCard =
      foundTeamCard ||
      contentToCheck.includes('data-type="team-card"') ||
      contentToCheck.includes('[팀카드]') ||
      contentToCheck.includes('team-card');

    // 선수카드 확인 (HTML 형식에서도 감지)
    const hasPlayerCard =
      foundPlayerCard ||
      contentToCheck.includes('data-type="player-card"') ||
      contentToCheck.includes('[선수카드]') ||
      contentToCheck.includes('player-card');

    // 이미지 확인 (매치카드 내부 이미지 제외)
    let hasImage = hasRealImage;

    if (!hasImage && !hasMatchCard) {
      // 매치카드가 없을 때만 HTML/URL 패턴 검사
      hasImage =
        contentToCheck.includes('<img') ||
        contentToCheck.includes('![') ||
        /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i.test(contentToCheck);
    } else if (!hasImage && hasMatchCard) {
      // 매치카드가 있을 때는 매치카드 외부의 이미지만 검사
      const contentWithoutMatchCard = contentToCheck
        .replace(/<div[^>]*data-type="match-card"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*match-card[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

      hasImage =
        contentWithoutMatchCard.includes('<img') ||
        contentWithoutMatchCard.includes('![') ||
        /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i.test(contentWithoutMatchCard);
    }

    // 비디오 확인 (TipTap video 노드 또는 HTML video 태그)
    const hasVideo =
      foundVideo ||
      contentToCheck.includes('<video') ||
      contentToCheck.includes('[비디오]') ||
      /\.(mp4|webm|mov|avi|mkv|flv|wmv)/i.test(contentToCheck);

    // YouTube 확인
    const hasYoutube =
      foundYoutube ||
      contentToCheck.includes('[유튜브]') ||
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)/i.test(contentToCheck);

    // 트위터 확인
    const hasTwitter =
      foundTwitter ||
      contentToCheck.includes('[트위터]') ||
      /(?:twitter\.com|x\.com)\/[^/]+\/status\/\d+/i.test(contentToCheck);

    // 인스타그램 확인
    const hasInstagram =
      foundInstagram ||
      contentToCheck.includes('[인스타그램]') ||
      /instagram\.com\/(?:p|reel|tv)\/[a-zA-Z0-9_-]+/i.test(contentToCheck);

    // 페이스북 확인
    const hasFacebook =
      foundFacebook ||
      contentToCheck.includes('[페이스북]') ||
      /facebook\.com\/(?:[\w.-]+\/)?(?:posts|videos|photo|permalink|pfbid)/i.test(contentToCheck);

    // 틱톡 확인
    const hasTiktok =
      foundTiktok ||
      contentToCheck.includes('[틱톡]') ||
      /tiktok\.com\/@[\w.-]+\/video\/\d+/i.test(contentToCheck);

    // 링크드인 확인
    const hasLinkedin =
      foundLinkedin ||
      contentToCheck.includes('[링크드인]') ||
      /linkedin\.com\/(?:feed\/update|posts)\/[\w-]+/i.test(contentToCheck);

    // 링크 확인 (http/https 링크, 이미지/비디오/소셜 URL 제외)
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
    const videoExtensions = /\.(mp4|webm|mov|avi|mkv|flv|wmv)(\?.*)?$/i;
    const socialDomains = /(youtube\.com|youtu\.be|twitter\.com|x\.com|instagram\.com|facebook\.com|tiktok\.com|linkedin\.com)/i;

    // URL 추출 후 미디어/소셜 URL 제외
    const urlMatches = contentToCheck.match(/https?:\/\/[^\s<>"]+/gi) || [];
    const hasNonMediaLink = urlMatches.some(url =>
      !imageExtensions.test(url) &&
      !videoExtensions.test(url) &&
      !socialDomains.test(url)
    );

    const hasLink =
      hasNonMediaLink ||
      (contentToCheck.includes('href=') && !socialDomains.test(contentToCheck)) ||
      hasMatchCard;

    return {
      hasImage,
      hasVideo,
      hasYoutube,
      hasLink,
      hasMatchCard,
      hasTeamCard,
      hasPlayerCard,
      hasTwitter,
      hasInstagram,
      hasFacebook,
      hasTiktok,
      hasLinkedin,
    };
  } catch {
    return defaultResult;
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
          // 재귀적으로 실제 image 노드만 찾기 (matchCard 제외)
          const findImageUrl = (nodes: unknown[]): string | null => {
            for (const node of nodes) {
              if (typeof node !== 'object' || node === null) continue;
              const nodeObj = node as Record<string, unknown>;

              // matchCard 노드는 건너뜀
              if (nodeObj.type === 'matchCard') continue;

              // image 노드 발견
              if (nodeObj.type === 'image') {
                const attrs = nodeObj.attrs as Record<string, unknown> | undefined;
                if (attrs?.src && typeof attrs.src === 'string') {
                  return attrs.src;
                }
              }

              // 중첩된 content 탐색
              if (Array.isArray(nodeObj.content)) {
                const found = findImageUrl(nodeObj.content);
                if (found) return found;
              }
            }
            return null;
          };

          const imageUrl = findImageUrl(obj.content);
          if (imageUrl) return imageUrl;

          // TipTap JSON이지만 image 노드가 없으면 null 반환
          // (매치카드만 있는 경우 여기서 종료)
          return null;
        }
        // RSS 등 다른 JSON 형식
        if (obj?.imageUrl) return obj.imageUrl as string;
        if (obj?.image_url) return obj.image_url as string;

        // JSON이지만 알 수 없는 형식이면 null 반환
        return null;
      } catch {
        // JSON 파싱 실패 시 HTML로 처리
      }
    }

    // 매치카드 포함 여부 확인
    const hasMatchCard = content.includes('match-card') || content.includes('data-type="match-card"');

    // 매치카드가 있으면 매치카드 외부의 이미지만 추출
    if (hasMatchCard) {
      // 매치카드 시작 전의 콘텐츠에서만 이미지 찾기
      const beforeMatchCard = content.split(/class="[^"]*match-card/i)[0] || '';

      const imgTag = beforeMatchCard.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/i);
      if (imgTag?.[1]) return imgTag[1];

      // 매치카드만 있고 다른 이미지 없으면 null
      return null;
    }

    // 매치카드 없는 일반 콘텐츠
    // HTML img 태그에서 추출 (http로 시작하는 URL만)
    const imgTag = content.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/i);
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
